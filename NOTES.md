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

## Pending (added by later steps)

- _stats discrepancy_ (see §6.2): prototype shows `8+ / 38 / 66`, `_config.yml` `author:` block says
  `5 / 25 / 15`. Plan: use `_data/profile.yml` as the source and confirm with owner.
