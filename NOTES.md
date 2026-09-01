# EchoOS rewrite — implementation notes

Tracking non-obvious decisions, resolved versions, discrepancies, and deferred items
per IMPLEMENTATION-PLAN.md rules.

## Step 1 — Toolchain pins

- Resolved Jekyll version: **4.4.1** (Gemfile `~> 4.4`)
- Resolved sass-embedded version: **1.103.1**
- jekyll-sass-converter resolved to **3.1.0** (pulled in as a Jekyll dependency; no longer listed as a plugin)
- jekyll-paginate removed from Gemfile. Build still emits the expected deprecation warning
  because `_config.yml` still has `paginate: / paginate_path:` — those keys are removed in Step 6/8
  and the pager markup in `blog/index.html` is replaced then too. Until then `/blog/` renders with an
  empty post list; this is an intentional intermediate state on this branch.
- `Dockerfile` bumped to `ruby:3.4-slim` early (Step 1 needs Docker verification, so the base image
  had to support the new lockfile). `docker compose build` green, `bundle exec jekyll build` exits 0.

## Step 2 — GitHub Actions deploy

- `pages.yml` rewritten per plan §3: `actions/checkout@v5`, `ruby/setup-ruby@v1` with
  `ruby-version-file: .ruby-version`, `configure-pages@v5`, `upload-pages-artifact@v4`,
  `deploy-pages@v4`, plus the HTML sanity check. No other Pages workflows exist, so nothing to delete.
- Workflow YAML validated (`ruby -e 'require "yaml"'` parses OK), and the build job commands
  (production env, `--baseurl`, `--trace`) pass in Docker.
- The workflow's sanity check (`content.json`, `classic/index.html`) requires artifacts from
  Steps 5 and 7. The remote `workflow_dispatch` run is therefore deferred until the branch is
  feature-complete; dispatching now would fail the sanity check by design.

## Step 4 — App registry

- `_data/apps.yml` created exactly per plan §5 (10 apps, dock order = file order, `anchor:
  bottom-right` only on guide). Counts not hardcoded: `{{ posts_count }}` / `{{ exp_count }}`
  placeholders resolved at build time.
- **Deviation (mechanism, not content):** Jekyll does not render Liquid inside `.yml` data files —
  the probe showed `{{ site.posts.size }}` left verbatim. Added `_plugins/apps_titles.rb`
  (a `:post_read` hook) that substitutes `site.posts.docs.size` (→ 11) and
  `site.data.experience` (→ 6). Verified: `about — profile` … `guide — tour`, `blog — 11 posts`,
  `experience — 6 roles`.
- Note: `_plugins/` is not in `_config.yml` `exclude`, so Jekyll auto-loads it.

## Step 5 — OS shell (vanilla ES modules)

- 19 ES modules under `assets/js/echoos/`; all pass `node --check`. Syntax-check command (Jekyll
  container has no node — use a one-off node container; git-bash mangles `/srv` so force
  `MSYS_NO_PATHCONV=1` and a Windows-style source path):
  `MSYS_NO_PATHCONV=1 docker run --rm -v "D:/Projects/portfolio-site:/srv" -w /srv node:22-alpine sh -c 'for f in assets/js/echoos/**/*.js assets/js/echoos/*.js; do node --check "$f"; done && echo ALL_SYNTAX_OK'`
- **Deviation (schema, additive):** content.json gets an `"apps"` key from `{{ site.data.apps | jsonify }}`
  (§6.2 fixed schema lists profile/experience/projects/skills/education/posts only). The window manager
  needs dock/app geometry + titles at runtime and there is no YAML parser in JS, so the registry is
  emitted as JSON. Counts interpolated by the Step 4 `apps_titles.rb` hook. Verified: 10 apps,
  `about — profile` … `guide — tour`, `blog — 11 posts`.
- **Post slug:** `post.data.slug` renders `nil` in Liquid (DocumentDrop has no `data` method — Ruby
  plugins like `post_json.rb` use `post.data["slug"]` and are fine; Liquid cannot). `post.slug` is
  deprecated in Jekyll 4.4. Derive instead: `{{ post.url | split: "/" | last | jsonify }}` →
  `/blog/2026/07/14/PII-masking/` yields `PII-masking` (Ruby `split` drops trailing empty strings, so
  no `pop` needed — a `pop` there removes the title and returns the day). Verified: all 11 slugs
  match the `post_json.rb` filenames (e.g. `PII-masking.json`).
- **Stats `8+`:** `_data/profile.yml` holds 8/38/66; the `+` suffix on "Years Experience" is
  presentation-only, applied by `apps/about.js` to the first stat. Data stays 8.
- **ztop interpretation:** `let ztop = 1; win.z = ++ztop` — about opens on boot with z=2; "ztop starts
  at 2" (§6.4) is satisfied.
- **Guide auto-open:** first-time visitors (`!guideDone`) get the guide window auto-opened on boot,
  layered over the about window (this is the "guided tour" of §6.4's on-boot behavior).
- **Blog reader diagrams:** `apps/blog.js` replicates `_includes/scripts.html` for the OS route —
  `pre code.language-mermaid` → `pre.mermaid` + dynamic `import()` of mermaid@11 (jsdelivr) +
  `mermaid.run()`; markmap via injected `markmap-autoloader@0.16` script. Fetches per-post JSON
  (`url('/assets/data/posts/<slug>.json')`); on fetch failure falls back to `window.open(post.url)`.
- **Arcade theme:** games.js reads 9 props — `bg, ink, muted, accent, accentSoft, soft, surface,
  line, overlay, beep` — while §6.7 lists 7. `buildTheme()` in `apps/arcade.js` reads the live
  computed custom properties each game start (theme changes restart the current game via a store
  subscription).
- **Overlay resolution:** `overlay = color-mix(in oklab, var(--bg) 72%, transparent)` is resolved to
  a real rgba by probing the browser (color-mix unsupported → flat `rgba(--bg, .72)` fallback).
- **Validation gotcha:** `docker compose run --rm jekyll build` fails with `exec: build: not found`
  because compose overrides the Dockerfile `CMD` with just `build`. Use the full command:
  `MSYS_NO_PATHCONV=1 docker compose run --rm jekyll bundle exec jekyll build`.
- Verified: build exits 0; content.json parses (10 apps / 11 posts / 6 projects / 6 experience /
  5 skills groups / 3 education); every post slug resolves to its per-post JSON.

## Pending (added by later steps)

- _stats discrepancy_ (see §6.2): prototype shows `8+ / 38 / 66`, `_config.yml` `author:` block says
  `5 / 25 / 15`. Plan: use `_data/profile.yml` as the source and confirm with owner.

## Step 3 — Design tokens

- `_scss/abstracts/_tokens.scss` created exactly per plan §4 (light `:root` + `[data-echo-theme="dark"]`).
- `_scss/base/_animations.scss`: appended the four OS keyframes (`bootload`, `blink`, `winin`, `toastin`)
  copied verbatim from the prototype, plus `prefers-reduced-motion` overrides (winin/toastin → none,
  boot shortened to `.2s`). Wallpaper motion is canvas-driven; `wallpaper.js` must honor the same
  media query (see §6.8). The AOS-era keyframes were left in place — they serve the classic route;
  Step 8's deletion list doesn't touch them.
- **Class-name contract** for the OS route (used by the reduced-motion block; Step 6 components must
  use these exact names): `.os-window` (winin .22s), `.os-toast` (toastin .2s), `.os-boot-fill`
  (bootload 1.15s), `.os-blink` (blink 1.1s).
- Fonts `<link>` (Archivo + IBM Plex Mono) is specified in plan §4 but belongs in the `os` layout
  head — applied in Step 6 with the layout.
- Theme toggle (`data-echo-theme`, `echoos-theme`), accent override (`echoos-accent`) are runtime
  behaviors for `shell.js` (Step 5), not CSS.
- Verified: `bundle exec jekyll build` exits 0; all four keyframes present in `_site/assets/css/style.css`.
