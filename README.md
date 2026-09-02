# EchoOS — Jekyll Portfolio

*An OS-metaphor portfolio: the home page is a desktop "operating system" built from
vanilla ES modules on top of Jekyll + GitHub Pages.*

<div align="center">

<a href="https://e-choness.github.io/portfolio-site/">
  <img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=700&size=22&pause=1000&color=7A4FB8&center=true&vCenter=true&width=480&lines=EchoOS+%E2%80%94+Desktop+OS+Portfolio;Jekyll+%2B+Vanilla+ES+Modules;Arcade%2C+Terminal%2C+Spotlight%2C+More" alt="EchoOS" />
</a>

<br/>

[![GitHub Pages](https://github.com/e-choness/portfolio-site/actions/workflows/pages.yml/badge.svg)](https://github.com/e-choness/portfolio-site/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
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
the page. Blog posts and project pages are server-rendered by Jekyll and linked from
within the OS. All content comes from the same YAML files in `_data/`.

## Features

| Feature | Description |
|---|---|
| Desktop shell | Draggable, resizable windows; z-ordering; animated wallpaper |
| Spotlight | ⌘K command palette — search apps, projects, posts |
| Terminal | `echo-sh` with `open`, `theme`, `clear`, `help` and more |
| Arcade | 6 canvas games (Blockfall, Snake, Breakout, Invaders, and more); hi-scores persist |
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
│   ├── profile.yml          #   name, bio, stats, social links
│   ├── experience.yml       #   work timeline
│   ├── projects.yml         #   project gallery
│   ├── skills.yml           #   skill groups
│   ├── education.yml        #   degrees
│   └── blog.yml             #   blog settings / categories
├── _includes/               # Classic-route partials (hero, about, ...)
├── _layouts/                # os.html (EchoOS shell), default.html (classic route)
├── _plugins/                # Ruby build hooks (apps_titles.rb, echoos_filters.rb, post_json.rb)
├── _posts/                  # Blog posts (Markdown, mermaid/markmap supported)
├── _projects/               # Individual project pages
├── _sass/                   # Sass sources
│   ├── abstracts/           #   tokens, variables, mixins
│   ├── base/                #   base, typography, animations, utilities
│   ├── os/                  #   shell, window, dock, spotlight, terminal, arcade, apps
│   ├── components/ layout/ pages/
│   └── main.scss            #   entry (@use chain)
├── assets/
│   ├── js/echoos/           # OS modules (see Module map)
│   ├── data/content.json    # Liquid page: site data emitted as JSON for the OS
│   └── manifest.webmanifest # PWA manifest
├── index.html               # EchoOS route (layout: os)
├── blog/ projects/          # Server-rendered pages
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

All modules live in `assets/js/echoos/` (19 ES modules + `games.js`, a verbatim-port
game library shipped separately).

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

## Customizing Content

All content lives in `_data/`. Edit the YAML and rebuild — EchoOS and all server-rendered pages pick it up.

- **Profile** — `_data/profile.yml` (name, bio, stats, social links, resume URL).
- **Experience** — `_data/experience.yml` (roles, companies, durations, bullets).
- **Projects** — `_data/projects.yml` (title, description, tech chips, links, image).
- **Skills** — `_data/skills.yml` (groups of skills with levels).
- **Education** — `_data/education.yml` (degree, school, duration, notes).
- **Blog** — `_data/blog.yml` (categories, colors) + `_posts/`.

### Writing a blog post

Create `_posts/YYYY-MM-DD-post-title.md`:

```markdown
---
layout: post
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

The post index (`/blog/`) is server-rendered; inside EchoOS every post opens in the
Blog app's reader pane (per-post JSON under `assets/data/posts/`, generated by
`_plugins/post_json.rb`).

## Deployment

`main` deploys to GitHub Pages through `.github/workflows/pages.yml`
(actions/checkout → ruby/setup-ruby → configure-pages → build → upload → deploy). The
workflow also sanity-checks the build artifacts (`content.json`, `classic/index.html`)
before deploying.

## License

MIT — see [LICENSE](LICENSE).
