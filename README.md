# EchoOS — Jekyll Portfolio

*An OS-metaphor portfolio: the home page is a desktop "operating system" built from
vanilla ES modules on top of Jekyll + GitHub Pages.*

<div align="center">

<a href="https://e-choness.github.io/portfolio-site/">
  <img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=700&size=22&pause=1000&color=7A4FB8&center=true&vCenter=true&width=480&lines=EchoOS+%E2%80%94+Desktop+OS+Portfolio;Jekyll+%2B+Vanilla+ES+Modules;Arcade%2C+Terminal%2C+Spotlight%2C+More" alt="EchoOS" />
</a>

<br/>

[![GitHub Pages](https://github.com/e-choness/portfolio-site/actions/workflows/pages.yml/badge.svg)](https://github.com/e-choness/portfolio-site/actions)
[![License: CC BY-NC-ND 4.0](https://img.shields.io/badge/License-CC_BY--NC--ND_4.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc-nd/4.0/)
[![Jekyll](https://img.shields.io/badge/Jekyll-4.4.1-CC342D?logo=jekyll&logoColor=white)](https://jekyllrb.com/)
[![Last Commit](https://img.shields.io/github/last-commit/e-choness/portfolio-site)](https://github.com/e-choness/portfolio-site/commits/main)
[![Repo Size](https://img.shields.io/github/repo-size/e-choness/portfolio-site)](https://github.com/e-choness/portfolio-site)
[![GitHub Stars](https://img.shields.io/github/stars/e-choness/portfolio-site?style=social)](https://github.com/e-choness/portfolio-site/stargazers)

**[View Live Demo](https://e-choness.github.io/portfolio-site/)** &nbsp;•&nbsp; **[Report Bug](https://github.com/e-choness/portfolio-site/issues)**

</div>

---

## Overview

EchoOS is a desktop shell — wallpaper, dock, windows, spotlight (⌘K / Ctrl+K), a
terminal, a theme toggle, and a first-run guided tour. All content is rendered
client-side from `assets/data/content.json`, so navigating the site never reloads
the page. Blog posts and projects open inside their windows (Blog, Projects); their old
standalone URLs are small redirect stubs that forward into the OS and keep shared links,
search snippets and link previews working. All content comes from `_data/`,
`_posts/` and `_projects/`.

## Features

| Feature | Description |
|---|---|
| Desktop shell | Draggable, resizable windows; z-ordering; animated wallpaper |
| Spotlight | ⌘K command palette — search apps, projects, posts |
| Terminal | `echo-sh` with `open`, `theme`, `clear`, `help` and more |
| Arcade | 11 canvas games (Blockfall, Snake, Invaders, a raycast Labyrinth, a pixel-shaded Orrery, all nine stages of Cat Mario, a Bejeweled-style Gemfall, and more); hi-scores persist |
| Blog reader | Mermaid diagrams + syntax-highlighted code blocks inside the OS window |
| Theme | Light / dark with persisted accent color; animated portrait ring in About |
| PWA | `manifest.webmanifest` — installable on desktop and mobile |

## Stack

| Layer | Choice |
|---|---|
| Static site | Jekyll 4.4.1 |
| Stylesheets | Dart Sass (`sass-embedded` 1.103.1) via `jekyll-sass-converter` 3.1.0 |
| OS shell | Vanilla ES modules (no framework, no bundler) |
| Diagrams in posts | mermaid@11 and markmap (loaded on demand) |
| Hosting | GitHub Pages via Actions (`pages.yml`) |
| Local dev | Docker Compose, or bare `bundle exec jekyll serve` |

## Project Structure

```text
├── _config.yml              # Jekyll config (baseurl /portfolio-site)
├── _config_dev.yml          # Dev override: baseurl "" for localhost
├── _data/                   # Content source of truth (YAML)
│   ├── apps.yml             #   EchoOS app registry (dock order, window geometry)
│   ├── arcade.yml           #   Arcade registry (card, pad, exhibit plaque per game)
│   ├── solar.yml            #   Orrery: every body the solar-system map draws
│   ├── profile.yml          #   who the site is about: name, bio, stats, social links
│   ├── experience.yml       #   work timeline
│   ├── skills.yml           #   skill groups
│   └── education.yml        #   degrees
├── _layouts/                # os.html (the EchoOS shell), redirect.html (post/project URL stubs)
├── _plugins/                # build hooks: profile_config, apps_titles, echoos_filters, post_json, project_json
├── _posts/                  # Blog posts (Markdown, mermaid/markmap supported)
├── _projects/               # Projects (front matter + Markdown write-up)
├── _sass/                   # Sass sources
│   ├── abstracts/           #   tokens, variables
│   ├── base/                #   base, typography (used by rendered posts)
│   └── os/                  #   shell, window, dock, spotlight, terminal, arcade, apps, glass, print
├── assets/
│   ├── js/echoos/           # OS modules (see Module map)
│   ├── js/games.js          # Arcade runner (lazy-loads the games)
│   ├── js/games/            #   one ES module per game + common.js helpers
│   │   └── catmario/engine.js #   Syobon Action's rules, translated from the C++ port
│   ├── data/content.json    # Liquid page: site data emitted as JSON for the OS
│   ├── data/solar.json      #   ditto for _data/solar.yml, fetched by the Orrery
│   └── manifest.webmanifest # PWA manifest
├── index.html               # EchoOS (layout: os)
├── 404.html                 # EchoOS again, opening the "Not found" window
├── feed.xml                 # RSS feed of the posts
├── Gemfile / Dockerfile / docker-compose.yml
└── .github/workflows/pages.yml
```

## Local Development

Both workflows build the identical site; pick whichever you prefer.

### Docker (recommended)

```bash
docker compose up
# → http://localhost:4000  (live reload on)
```

### Bare Jekyll

```bash
bundle install
bundle exec jekyll serve --config _config.yml,_config_dev.yml
# → http://localhost:4000
```

The `_config_dev.yml` override clears `baseurl`, so asset URLs are root-relative
locally; the shipped site is built with the `/portfolio-site/` baseurl.

### Building / validating

```bash
bundle exec jekyll build --trace   # production build, zero-warning expected
```

### Custom plugins

This site uses three custom Ruby plugins (`_plugins/apps_titles.rb`, `echoos_filters.rb`, `post_json.rb`) for build-time content generation. These prevent use of GitHub Pages' gem-based builder; the site can only be built via the Actions workflow (`.github/workflows/pages.yml`). Do not change Pages settings to branch-deploy mode.

## EchoOS module map

All modules live in `assets/js/echoos/` (19 ES modules). The arcade ships separately:
`assets/js/games.js` is the runner, each game is an ES module under `assets/js/games/`
that the runner imports on demand, and `_data/arcade.yml` is the registry that names
and describes them — see *Adding a game*.

| Module | Responsibility |
|---|---|
| `boot.js` | Entry point: boot animation, fetch `content.json`, wire everything |
| `wm.js` | Window manager: open/close/focus/drag/resize windows, z-order |
| `shell.js` | Desktop chrome: menu bar, dock, theme + sound toggles |
| `wallpaper.js` | Animated canvas wallpaper (respects reduced motion) |
| `spotlight.js` | ⌘K command palette over apps, projects, posts |
| `terminal.js` | `echo-sh`: help, open, theme, clear, ... |
| `notifications.js` | Toast notifications |
| `sound.js` | UI sound effects |
| `store.js` | Persisted state (theme, accent, visited, guideDone) |
| `guide.js` | 8-step first-run guided tour with spotlight ring |
| `apps/*.js` | One renderer per app — see *Adding an app* |

`_sass/os/` holds the matching styles (`.os-dock`, `.os-win`, `.os-spotlight`, ...),
and `_data/apps.yml` is the single registry both the dock markup and the window
manager read.

## Adding an app

1. **Register the app** in `_data/apps.yml` (dock order = file order; do not renumber
   existing entries):

   ```yaml
   - id: myapp
     label: My App
     glyph: "µ"
     title: "myapp"
     x: 160
     y: 80
     w: 640
     h: 480
     desktop_icon: true
   ```

2. **Write the renderer** `assets/js/echoos/apps/myapp.js` exporting
   `renderMyApp(bodyEl, ctx)` — `ctx` carries `content` (parsed `content.json`), `root`,
   `store`, and the window manager. Look at `apps/about.js` for the simplest template.

3. **Wire it up** in `assets/js/echoos/boot.js`: add an import and a
   `myapp: renderMyApp,` entry in the `renderers` map passed to `createWM`.

4. **Style it** in `_sass/os/_apps.scss` (or a dedicated partial) using the existing
   design tokens (`--ink`, `--muted`, `--accent`, `--surface2`, `--line`, `--r-ctl`, ...).

The dock icon, window title, desktop icon, and Spotlight entry all come from
`apps.yml` automatically.

## Adding a game

1. **Write the module** `assets/js/games/<id>.js`. It default-exports a factory that
   receives the runner env and returns the game's handlers:

   ```js
   import { R, clear } from './common.js';

   export default function mygame(env){
     const {ctx,W,H,T,beep,addScore,gameOver,isOver}=env;
     return {
       key(k,down){ /* optional */ },
       pointer(x,y,type){ /* optional — 'down', 'move', or 'up' to end a drag */ },
       tick(dt){ clear(ctx,W,H,T); /* update + draw one frame */ }
     };
   }
   ```

   `T` is the live theme (`bg`, `ink`, `muted`, `accent`, `soft`, `line`, `overlay`)
   read from the CSS custom properties, so a game must never hard-code a colour. The
   canvas is 620×400. No art or audio files — everything is drawn and synthesised.

2. **Add one entry to `_data/arcade.yml`** — the arcade registry, in card order. It
   carries everything else about the game, and nothing lives anywhere but here:

   ```yaml
   - id: mygame            # must match assets/js/games/<id>.js
     name: "My Game"
     tag: "genre"
     glyph: "◆"            # shown on the grid card
     hint: "arrows to move"
     pad: [{ key: "ArrowLeft", label: "←" }]   # touch buttons; omit if pointer-only
                           # (add hold: true to keep the key down while pressed)
     data: mydata          # optional: _data/mydata.yml, reaching the game as env.data
     credit: Someone · 1979
     origin: >-
       Two or three sentences for the exhibit plaque.
     fact: >-
       The one detail worth knowing.
     sources:
       - label: Wikipedia
         url: https://en.wikipedia.org/wiki/...
   ```

That is the whole job. The grid card, the HUD, the touch pad, the exhibit plaque and
the `echo-sh` launcher (plus the `games:` line in `help`) are all driven off that
entry — `games.js` only ever learns an id. The module itself is fetched the first
time the game is played, warmed on card hover and on an idle callback once the Arcade
opens, so adding a game costs the rest of the site nothing.

If a game carries a lot of content — the Orrery's thirteen worlds, for instance —
put it in `_data/<name>.yml`, add a one-line `assets/data/<name>.json` Liquid page to
emit it (copy `solar.json`), and name it with `data:` in the registry. It is fetched
in parallel with the module and handed to the factory as `env.data`, so the figures
stay editable as YAML instead of being buried in JavaScript.

## Customizing Content

Edit and rebuild; EchoOS, the resume and the SEO/social tags all pick it up.

- **Profile** — `_data/profile.yml` is the single source for name, title, bio, stats and social links; `_plugins/profile_config.rb` feeds it to the SEO tags, feed and page titles.
- **Experience** — `_data/experience.yml` (roles, companies, durations, bullets).
- **Projects** — one file per project in `_projects/` (title, description, technologies, categories, `live_url` / `live_label`, `github_url`, `website_url`, image or video, `featured`, `order`).
- **Skills** — `_data/skills.yml` (groups of skills with years used).
- **Education** — `_data/education.yml` (degree, school, duration, notes).
- **Blog** — `_posts/`; a post's `category` becomes its category in the Blog window.

After changing profile, experience, education, skills or featured projects, regenerate
`assets/resume.pdf` from the Experience → Resume tab (steps in the Round 8.1 notes).

### Writing a blog post

Create `_posts/YYYY-MM-DD-post-title.md`:

```markdown
---
title: "Your Post Title"
date: 2026-01-15 10:00:00 -0000
category: javascript
tags: [javascript, react]
author: "Your Name"
image: "https://example.com/image.jpg"
excerpt: "Brief description"
---

Content in Markdown. Fenced ```mermaid``` and markmap blocks render inline in the OS reader.
```

Every post opens in the Blog window's reader (per-post JSON under `assets/data/posts/`,
generated by `_plugins/post_json.rb`). Link to another post with
`{% post_url 2025-07-10-chapter-1-1-docker-basics %}`: inside the OS the link opens that
post in the same window.

## Deployment

`main` deploys to GitHub Pages through `.github/workflows/pages.yml`
(actions/checkout → ruby/setup-ruby → configure-pages → build → upload → deploy). The
workflow also sanity-checks the build artifacts (`index.html`, `content.json`, `404.html`)
before deploying.

## License

[CC BY-NC-ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/) — see [LICENSE](LICENSE).
Share with attribution; no commercial use; no modified versions.

- The resume, profile photos and personal information are **all rights reserved**.
- Third-party libraries, logos and brand icons keep their owners' terms.
- Revisions before this change were released under MIT and remain available under those terms.
