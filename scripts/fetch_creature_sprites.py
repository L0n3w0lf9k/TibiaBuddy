"""Retrieve the published classic monster sprites without changing their pixels.

The source paths are the image links used by Primibia's 7.72 monster pages.
Only validated PNGs are written. Missing assets deliberately keep the UI fallback.
"""

from __future__ import annotations

import hashlib
import io
import json
import re
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "assets" / "creatures"
GAME = ROOT / "src" / "data" / "game.ts"
OUT.mkdir(parents=True, exist_ok=True)
source = GAME.read_text()
match = re.search(r"const rawCreatures:[^\n]+=\s*", source)
if match is None:
    raise RuntimeError("Could not find the reference creature records")
creatures, _ = json.JSONDecoder().raw_decode(source[match.end():])
retrieved_at = datetime.now(timezone.utc).isoformat(timespec="seconds")


def download(creature: dict) -> dict:
    slug = creature["id"]
    if not re.fullmatch(r"[a-z0-9-]+", slug):
        raise ValueError("Invalid asset slug")
    page = "https://primibia.com/wiki/monsters/" + slug
    url = "https://primibia.com/wiki-sprites/monsters/" + slug + ".png"
    request = urllib.request.Request(
        url, headers={"User-Agent": "Mozilla/5.0", "Referer": page}
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        raw = response.read(1024 * 1024)
        mime = response.headers.get("Content-Type", "").split(";", 1)[0]
    if mime != "image/png" or not raw.startswith(b"\x89PNG\r\n\x1a\n"):
        raise ValueError("Response was not a PNG image")
    with Image.open(io.BytesIO(raw)) as im:
        im.load()
        width, height = im.size
        if width < 1 or height < 1 or width > 512 or height > 512:
            raise ValueError("Unexpected sprite dimensions")
        if im.getbbox() is None:
            raise ValueError("Empty sprite image")
        mode = im.mode
        has_alpha = "A" in im.getbands() or "transparency" in im.info
    path = OUT / (slug + ".png")
    temporary = path.with_suffix(".png.part")
    temporary.write_bytes(raw)
    temporary.replace(path)
    return {
        "id": slug,
        "name": creature["name"],
        "path": "/assets/creatures/" + slug + ".png",
        "sourceUrl": url,
        "sourcePage": page,
        "width": width,
        "height": height,
        "mode": mode,
        "transparent": has_alpha,
        "bytes": len(raw),
        "sha256": hashlib.sha256(raw).hexdigest(),
        "retrievedAt": retrieved_at,
        "review": "provider-identified-classic-7.72",
    }


records: list[dict] = []
failures: list[dict] = []
with ThreadPoolExecutor(max_workers=5) as pool:
    futures = {pool.submit(download, creature): creature for creature in creatures}
    for future in as_completed(futures):
        creature = futures[future]
        try:
            records.append(future.result())
        except Exception as exc:
            failures.append({"id": creature["id"], "error": str(exc)})

records.sort(key=lambda record: record["id"])
manifest = {
    "schemaVersion": 1,
    "provider": "Primibia",
    "providerUrl": "https://primibia.com/",
    "referenceVersion": "7.72",
    "versionAssessment": (
        "The provider describes original sprites and a 7.72 baseline. "
        "Individual images are not certified byte-identical to a 7.7 client."
    ),
    "attribution": "Tibia game graphics © CipSoft GmbH. Classic sprite images sourced from Primibia.",
    "rights": "Original game artwork; no open-source artwork licence is asserted.",
    "pixelProcessing": "None. Original published PNG bytes are preserved.",
    "retrievedAt": retrieved_at,
    "count": len(records),
    "assets": records,
    "missing": failures,
}
(OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
ids = json.dumps([record["id"] for record in records], indent=2)
resolver = """/** Actual classic sprites, fetched from the image links in Primibia's 7.72 reference.
 * Pixel bytes, dimensions, source URLs and hashes: public/assets/creatures/manifest.json.
 * Tibia game graphics © CipSoft GmbH; image source: Primibia.
 */
const availableCreatureSprites = new Set<string>(%s);

export function creatureSprite(nameOrId: string): string | undefined {
 const id = nameOrId.trim().toLowerCase().replace(/[\\s_]+/g, '-');
 return availableCreatureSprites.has(id) ? (import.meta.env?.BASE_URL || '/') + 'assets/creatures/' + id + '.png' : undefined;
}

export const creatureSpriteCount = availableCreatureSprites.size;
export const creatureSpriteManifest = (import.meta.env?.BASE_URL || '/') + 'assets/creatures/manifest.json';
""" % ids
(ROOT / "src" / "data" / "creatureSprites.ts").write_text(resolver)
print(json.dumps({"downloaded": len(records), "expected": len(creatures), "bytes": sum(r["bytes"] for r in records), "failures": failures}))
