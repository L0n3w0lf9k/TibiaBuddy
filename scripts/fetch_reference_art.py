"""Fetch original public Tibia artwork without recolouring or resizing it.

The wiki API supplies the observed image URLs. Spell artwork is deliberately
modern and does not supply gameplay values to the classic reference catalogue.
"""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from hashlib import sha256
from io import BytesIO
from pathlib import Path
import json
import urllib.parse
import urllib.request

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
WIKI = "https://www.tibiawiki.com.br"
ALIASES = {
    "Antidote": "Cure Poison", "Explosive Arrow": "Conjure Explosive Arrow",
    "Food": "Food (Spell)", "Force Strike": "Death Strike",
    "Poison Storm": "Wrath of Nature", "Poisoned Arrow": "Conjure Poisoned Arrow",
    "Power Bolt": "Conjure Power Bolt", "Ultimate Explosion": "Hell's Core",
}
ARCHIVED_ILLUSTRATIONS = {"wild-growth", "undead-legion"}
BACKPACKS = [
    ("brown", "Backpack"), ("blue", "Blue Backpack"),
    ("purple", "Purple Backpack"), ("red", "Red Backpack"),
    ("grey", "Grey Backpack"), ("orange", "Orange Backpack"),
    ("golden", "Golden Backpack"), ("green", "Green Backpack"),
    ("yellow", "Yellow Backpack"), ("camouflage", "Camouflage Backpack"),
    ("holding", "Backpack of Holding"),
]


def fetch(url):
    request = urllib.request.Request(url, headers={
        "User-Agent": "TibiaBuddy/1.0 (personal companion image reference)",
        "Referer": WIKI + "/",
    })
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read(), response.headers.get_content_type()


def main():
    # The curated catalogue keeps rawSpells as a JSON array. Read that literal
    # directly so this downloader does not depend on a discarded research file.
    catalogue = (ROOT / "src/data/game.ts").read_text()
    declaration = catalogue.partition("const rawSpells:")[2]
    if not declaration:
        raise ValueError("Could not locate the rawSpells catalogue")
    records, _ = json.JSONDecoder().raw_decode(declaration.partition("=")[2].lstrip())
    spells = [record for record in records if record["type"] == "instant"]
    targets = [{"id": s["id"], "name": s["name"], "artworkName": ALIASES.get(s["name"], s["name"]), "kind": "spells"} for s in spells]
    targets += [{"id": slug, "name": name, "artworkName": name, "kind": "backpacks"} for slug, name in BACKPACKS]
    titles = ["Arquivo:" + t["artworkName"] + ".gif" for t in targets]
    metadata = {}
    for start in range(0, len(titles), 50):
        query = urllib.parse.urlencode({"action": "query", "titles": "|".join(titles[start:start + 50]), "prop": "imageinfo", "iiprop": "url|size|timestamp", "format": "json"})
        payload, _ = fetch(WIKI + "/api.php?" + query)
        for page in json.loads(payload).get("query", {}).get("pages", {}).values():
            if page.get("imageinfo"):
                metadata[page["title"]] = page["imageinfo"][0]

    def acquire(target):
        info = metadata.get("Arquivo:" + target["artworkName"] + ".gif")
        if not info:
            raise ValueError("No source image metadata: " + target["name"])
        payload, mime = fetch(info["url"])
        if mime != "image/gif" or payload[:6] not in (b"GIF87a", b"GIF89a"):
            raise ValueError("Not an actual GIF: " + info["url"])
        with Image.open(BytesIO(payload)) as picture:
            picture.load()
            if not (1 <= picture.width <= 128 and 1 <= picture.height <= 128):
                raise ValueError("Unexpected image size: " + target["name"])
            dimensions = {"width": picture.width, "height": picture.height, "frames": getattr(picture, "n_frames", 1)}
        folder = ROOT / "public/assets" / target["kind"]
        folder.mkdir(parents=True, exist_ok=True)
        (folder / (target["id"] + ".gif")).write_bytes(payload)
        return {**target, **dimensions, "artworkKind": "archived-spell-illustration" if target["id"] in ARCHIVED_ILLUSTRATIONS else "modern-spell-icon" if target["kind"] == "spells" else "backpack-sprite", "path": "/assets/" + target["kind"] + "/" + target["id"] + ".gif", "sourceUrl": info["url"], "sourcePage": info["descriptionurl"], "sourceImageUpdatedAt": info["timestamp"], "bytes": len(payload), "sha256": sha256(payload).hexdigest(), "retrievedAt": datetime.now(timezone.utc).isoformat(), "mapping": "Exact name" if target["artworkName"] == target["name"] else "Modern renamed/successor spell artwork; visual association only"}

    with ThreadPoolExecutor(max_workers=5) as pool:
        assets = list(pool.map(acquire, targets))
    for kind in ("spells", "backpacks"):
        records = [a for a in assets if a["kind"] == kind]
        manifest = {"provider": "Tibia Wiki Brasil", "providerUrl": WIKI, "attribution": "Tibia game graphics © CipSoft GmbH. Images sourced from Tibia Wiki Brasil.", "licenseNote": "No open-source licence for Tibia artwork is asserted.", "assessment": "Original public artwork bytes preserved. Modern spell icons are visual references only; Wild Growth and Undead Legion retain archived spell illustrations because matching modern instant icons were unavailable. No modern spell rules are imported." if kind == "spells" else "Standard coloured backpack artwork from the public image catalogue. Colours are personal storage labels; artwork does not establish server availability or NPC stock.", "assets": records}
        (ROOT / "public/assets" / kind / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    icons = {a["id"]: {"artworkName": a["artworkName"], "sourcePage": a["sourcePage"], "renamed": a["artworkName"] != a["name"], "artworkKind": a["artworkKind"]} for a in assets if a["kind"] == "spells"}
    (ROOT / "src/data/spellIcons.ts").write_text("/** Modern Tibia artwork only; this file contains no gameplay rules. */\nexport const spellIconInfo: Record<string, { artworkName: string; sourcePage: string; renamed: boolean; artworkKind: 'modern-spell-icon' | 'archived-spell-illustration' }> = " + json.dumps(icons, indent=2) + ";\nexport const spellIconManifest = (import.meta.env?.BASE_URL || '/') + 'assets/spells/manifest.json';\nexport function instantSpellIcon(id: string): string | undefined { return spellIconInfo[id] ? (import.meta.env?.BASE_URL || '/') + 'assets/spells/' + id + '.gif' : undefined; }\n")
    print(json.dumps({"spells": len(spells), "backpacks": len(BACKPACKS), "bytes": sum(a["bytes"] for a in assets)}))


if __name__ == "__main__":
    main()
