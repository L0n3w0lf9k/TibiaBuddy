# Tibia Buddy

A browser companion for classic Tibia: stock and orders, hunt XP tracking, food and magic-level planning, combat estimates, creature and spell references, merchant prices, and a map viewer.

## Architecture and data

The production service is one static website. A Node build compiles the React/TypeScript application with Vite; a small Caddy container then serves the resulting HTML, JavaScript, CSS, reference data, and locally packaged sprites. Node is not part of the runtime image.

| Data | Location | How it changes |
| --- | --- | --- |
| Creature, spell, item, food, and merchant reference information | Application bundle built from `src/data/` and domain modules | Update the source, review its evidence, and deploy a new build |
| Game sprites and other public assets | `public/`, copied into the deployed static files | Replace/add assets and deploy a new build |
| Character profiles, stock, orders, hunts, goals, personal guide links, and settings | The visitor's browser IndexedDB, using Dexie | Saved locally as the visitor uses the site |
| Exported user backup | A JSON file downloaded by the visitor | Export/restore through the app's Settings page |

There is no application database service, account service, user-data API, upload endpoint, or attached volume. The web server serves files and a healthcheck; it does not receive or persist the app's character records, inventory, orders, or hunt history. Normal hosting request logs may still contain ordinary HTTP request information. The external map and source links use their respective third-party services when opened.

IndexedDB belongs to a particular browser profile and website origin. It does not sync between devices or between a Railway hostname and a custom domain. Export a backup before changing the site's address or clearing browser data, then restore it at the new address. A normal deployment at the same origin retains existing browser data. Private browsing and browser storage eviction can remove local records, so downloaded backups are the recovery mechanism.

Anything placed in `src/` or `public/` can become public in the compiled website. Keep personal exports, credentials, and private workbook records out of those directories and out of the GitHub repository. `.dockerignore` excludes common backup and local development files from the build context.

## Physical skill planner

Training → Physical skills estimates a weapon goal and a separate shielding goal together for all four classic vocations. Axe, sword, club, fist and distance use their own saved profile skills. Enter each attained skill, percentage still remaining and target, then choose one or two incoming creatures in the shielding card. Both goals run concurrently. Server Settings holds the separate experience, physical skill, magic progress and regeneration multipliers; the planner uses the saved physical skill rate directly. Older backups without it use 1×.

The visible estimate assumes a fixed two-second cycle and uninterrupted qualifying training. Shielding requires an equipped shield and counts at most two eligible incoming melee checks per cycle. Additional creatures do not increase the outgoing weapon attack rate. Periodic outgoing HP damage must keep the shared learning allowance active; one attempted attack every cycle does not by itself guarantee continuous advancement. Distance is explicitly a perfect-landed-shot lower bound.

Requirements come from the labeled public 7.72 reconstruction linked in the calculator. Cumulative geometric thresholds are evaluated with exact rational factors and rounded down, remaining progress is rounded up, and time is rounded to whole cycles across the entire goal. This avoids independently rounding each level's duration and preserves excess progress between levels. Promotion does not change the physical skill curve in this model. These are conditional estimates, not independent certification of every original 7.7 mechanic or a promise of a specific server's results.

## Character, spell and food settings

The character dialog keeps its draft while switching experience modes. Save, the close button, Escape and a genuine backdrop click save valid edits; Cancel discards them. Invalid fields keep the dialog open. Saves merge only edited fields so an unchanged dialog cannot overwrite newer XP or skills saved in another tab. Old journals and backups gain separate axe, sword and club values from their former melee value, preserving the other records.

Rune creation mana, charges and soul, plus spell learning prices and vocation availability, can be edited in the spellbook, Edron tower or rune planner. These are browser-local overrides keyed by server and spell. Rune production uses the same effective values, including an explicit zero soul cost. UH's application preset is 420 mana; the source notes retain the reconstruction's differing 400-mana value. Restoring reference defaults clears only that spell's overrides on the selected server.

Food comparisons cover planned nourishment hours, a magic-level goal's natural mana recovery, or a rune batch's recovery. The modal compares 23 foods, shows the ten lightest total loads initially, rounds quantities up and includes total weight, coverage and surplus. A food selection changes only that plan's food. Prices remain user-entered rather than assumed.

Light, dark and device-following themes are available in Settings; the header button switches light/dark directly. The preference is part of the journal backup. A small local preference cache applies the theme before the app opens.

## Combat results

The combat calculator is one results page with 84 melee weapons, bare hands, 10 classic distance projectiles and all 21 supported Legacy spell/rune calculations, alphabetized within each group. All weapon rows show raw minimum and maximum damage. Melee uses the matching axe, sword or club skill; bare hands use fist fighting with reconstructed human base attack 7. Ordinary weapon ranges and projectile accuracy follow a pinned public 7.72 reconstruction. The linked Legacy calculator is branded 7.4, so its retained spell/rune formulas have a separate source label.

The weapon model applies integer attack-mode adjustments, then the source's two-roll random factor. Its raw minimum is zero and it adds no modern character-level damage bonus. Projectile accuracy uses base distance skill and tile distance, with separate launcher and thrown-weapon checks. It describes the projectile check before mitigation, not the chance to remove HP. The literal reconstructed inclusive comparisons produce 91% and 76% caps; the UI identifies this source-dependent result and does not silently substitute conventional 90% and 75% descriptions.

Burst Arrow is separate: the classic reconstructed explosion uses `0…floor(60 × (2 × level + 3 × magic level) / 100)`, independent of distance skill and attack mode. The pinned [TVP script](https://github.com/joseluis2g/TVP-primeiro/blob/05b92a5bf0fba85e4a5d6f000ec736eef3be6ce6/gameserver/data/scripts/weapons/burst_arrow.lua) supplies base damage 30 and variation 30, and the old engine supplies the level/magic multiplier. [CipSoft's June 2007 announcement](https://www.tibia.com/news/?id=528&subtopic=newsarchive) documents the later move to distance-scaled Burst damage. Its projectile check is not a probability for splash damage: the inspected engine also explodes the arrow after a miss. The old `exevo con flam` reference produces Burst Arrow; a separate modern elemental Fire Arrow is not added to the classic catalog.

These are raw reconstruction estimates. Armor, immunities, PvP reductions, obstacle geometry, poison over time and server customizations can change actual results. Damage distributions and unsupported actions are not invented. Pinned sources and implementation notes are linked in the calculator and `src/domain/classicCombat.ts`.

## Hunt checkpoints and online guides

While a hunt is active, its checkpoint history replaces the completed journal. Each row records total XP, active hunt time, wall-clock recording time, gain since the preceding record and that interval's XP/hour. The first checkpoint uses the hunt's starting XP; pauses are excluded. Previously recorded rates remain fixed while the timer runs. Completed-hunt details retain the same history and append the final interval. XP losses are recorded, and zero-duration intervals display no rate.

Online Guides includes version-labelled videos, written guides and vocation references. Search, vocation/format filters and favourites cover both curated entries and personal links. Visitors can add, edit and remove their own HTTP(S) links with an Undo action. Links are shared across their local characters and included in JSON backups; older backups migrate to an empty personal collection. Videos open on YouTube rather than loading third-party embeds. The initial set distinguishes 7.7 recordings, 7.72 reconstructions and earlier 7.4 guide context.

## Local development

Use Node 24 and npm. The lockfile records the dependency graph.

```sh
npm ci
npm run dev
```

Before deploying:

```sh
npm test
npm run build
```

`npm run preview` can inspect the Vite build locally. Production uses the Caddy configuration in this repository.

## Production container

The Dockerfile pins both official base images by release and manifest digest, installs dependencies with `npm ci`, and copies only `dist/` into the runtime stage. Caddy runs as numeric user `10001`, with its admin API, automatic certificate management, and configuration persistence disabled. Railway supplies HTTPS at its public edge.

Build and run locally with Docker:

```sh
docker build -t tibia-buddy .
docker run --rm -p 8080:8080 -e PORT=8080 tibia-buddy
```

Open `http://localhost:8080` and check `http://localhost:8080/healthz`. The latter returns HTTP 200 with `ok`. A direct client route such as `/library` serves the application, while missing files such as `/assets/missing.png` return 404. The server accepts GET and HEAD requests; there is no write API. Browser caching uses revalidation so changes to unversioned sprites and reference files are picked up on a new visit.

`PORT` controls Caddy's listener and defaults to `8080`. `STATIC_ROOT` defaults to `/srv` and normally should be left unset. It exists only to allow the same Caddyfile to be checked against a local `dist/` directory.

When updating a base image, update its version tag and corresponding digest together, then rebuild and run the application checks. A pinned digest does not pick up upstream security updates automatically.

## Deploy on Railway from GitHub

Connect a GitHub repository containing this application to a single Railway web service. The directory with this `Dockerfile` must be the service's root directory. Railway automatically detects a root Dockerfile; no custom build command or start command is needed.

Use these service settings:

| Setting | Value |
| --- | --- |
| Source | The application's GitHub repository and intended deployment branch |
| Root directory | Repository root, or the app directory if using a monorepo |
| Builder | Dockerfile, detected automatically |
| Build command override | Leave unset |
| Start command override | Leave unset; use the image's Caddy command |
| Service variable | `PORT=8080` |
| Public domain target port | `8080` |
| Healthcheck path | `/healthz` |
| Healthcheck timeout | `60` seconds |
| Persistent volumes / database services | None |

Generate a Railway public domain or attach a custom domain once the service is running. Railway routes HTTPS to Caddy's HTTP listener. Keep the chosen public origin stable so visitors retain access to their existing IndexedDB records. GitHub deployments rebuild the packaged reference data and sprites along with the application.

There is intentionally no `railway.json` or `railway.toml`: Railway's current documentation deprecates that configuration mechanism for new services. The Dockerfile defines the image and startup behavior; the small service settings above are configured in Railway.

After a deployment, check `/healthz`, load the website, open a creature with a sprite, and save/reload a small test record. Confirm that a local JSON export can be restored. No database migration, seed job, storage bucket, or server-side backup task is required.

### Official hosting references

- [Railway Dockerfile builds](https://docs.railway.com/builds/dockerfiles)
- [Railway healthchecks](https://docs.railway.com/deployments/healthchecks)
- [Railway SPA routing](https://docs.railway.com/guides/spa-routing-configuration)
- [Railway configuration deprecation notice](https://docs.railway.com/config-as-code)
- [Caddy environment variables and defaults](https://caddyserver.com/docs/caddyfile/concepts#environment-variables)
- [Caddy single-page application configuration](https://caddyserver.com/docs/caddyfile/patterns#single-page-apps-spas)
- [Official Node image definitions](https://github.com/docker-library/official-images/blob/master/library/node)
- [Official Caddy image definitions](https://github.com/docker-library/official-images/blob/master/library/caddy)

## Reference data and graphics

The app distinguishes historical evidence, reconstructed server data, and calculator estimates. Inspect the in-app source details before treating a server-specific value as an exact Tibia 7.7 rule. Merchant prices start from the Fibula reference and can be adjusted for the visitor's server.

Tibia game graphics are © CipSoft GmbH. Classic sprite references are sourced from [Primibia's 7.72 wiki](https://primibia.com/wiki); this identifies the source's claimed version rather than independently authenticating every image as a 7.7 asset. Tibia Buddy is an independent companion and is not affiliated with CipSoft or Primibia. The game graphics do not inherit a license from the application's code or its UI icon library.

Colored backpack sprites and modern instant-spell artwork are sourced from [Tibia Wiki Brasil](https://www.tibiawiki.com.br/). They supply visuals only; modern gameplay values are not imported. Retired-spell illustrations and successor-icon mappings are identified in the artwork metadata. The files in `public/assets/*/manifest.json` retain provenance, retrieval details, dimensions and hashes. Game artwork remains © CipSoft GmbH.
