---
title: "Relic Revival Run"
description: "A rhythm runner about restoring cultural heritage. Play as one of twelve animal conservators, run from Mexico to Mali, and match the right conservation tool to each kind of damage to bring masterpieces back to life. A remake built with Phaser 3 and TypeScript for the web and Windows."
image: "assets/images/projects/relic-revival-run.jpg"
banner: "assets/images/projects/relic-revival-run.webp"
technologies:
  - Phaser 3
  - TypeScript
  - Vite
  - Electron
  - Docker
categories:
  - Game Development
  - Web
live_url: "https://echoness.itch.io/relic-revival-run-remake"
live_label: "itch.io"
store_url: "https://hopinto.fun/g/7068ee90-c375-4f47-9619-396449e53933/details"
store_label: "hopinto.fun"
github_url: "https://github.com/e-choness/relic-revival-run"
featured: false
order: 11
---
## **What is Relic Revival Run**

Every object in Relic Revival Run carries the memory of the people who made it, and every one of them is in trouble: grime on a Maya stela, salts in Portuguese azulejos, insects in a Paracas textile, bronze disease on a Chola bronze. You play an animal art restorer running through twelve cultures, choosing the right treatment before you reach each spot. A poultice draws out salts, an anoxic bag treats insects, a solvent gel lifts an old repair. Reveal hidden damage with the UV lamp and photograph it before you treat it.

The game is a **remake** of Studio Jojo's 2023 entry for the [Mini Game Work Jam](https://itch.io/jam/mini-game-work-jam-2023), a jam that advocates against the illicit traffic of cultural property. The remake keeps the original's concept and design and is a new web-based build, with almost none of the original assets.

## **Gameplay Experience**

![Gameplay: the lynx restorer runs along the Portuguese coast, switching tools and treating damage on the beat](../assets/images/projects/relic-revival-run-gameplay.gif)

Damage arrives on the beat of each culture's own soundtrack, and each culture after Mexico adds a twist: missing tiles in Portugal, a dark tomb lit only by your lamp in Egypt, thin mountain air in Peru, a Harmattan sandstorm in Mali. Every run ends with a final careful restoration of the artifact itself; restore 60%, 80% or 95% while preserving its condition to earn one, two or three stars.

- **12 cultures, rising difficulty:** Mexico, Portugal, China, Egypt, Greece, Peru, Japan, India, Iran, Nigeria, Cambodia and Mali, each with its own artifact and damage drawn from real conservation problems.
- **Tools that match real practice:** 20 kinds of damage, 8 treatment tools, a UV lamp and a camera.
- **A game that teaches its rules:** a field guide before every run, a tool-bar legend, tool hints and feedback on every mistake.
- **A field-journal HUD:** small paper slips at the screen edges, including a taped polaroid of the artifact that clears as you restore it, leave the art visible.
- **An illustrated museum:** restored artifacts go on show with the conservation notes you've learned, and finishing all twelve unlocks the ending.

## **A Soundtrack for Each Culture**

Every culture plays in its own tradition's meter, rhythm cycle and ensemble roles: a Mexican son in 6/8 against 3/4, Egyptian maqsum, Greek syrtos, huayno, teental with a tihai, Nigerian call and response over the standard bell, Khmer pinpeat, the Mande kora's kumbengo. Each arrangement is written as data (meter, themes, harmony, bass, counter-voices and drum cycles, with the energy level at which each part joins) and turned into timed events played on CC0 samples. The music is reactive: the tune is always complete, and accompaniment, counter-voices and drums join as your combo grows, while low condition adds tension.

## **Technical Foundation**

- **Engine:** Phaser 3 with TypeScript, bundled by Vite; Electron wraps the same build into Windows portable and installer releases.
- **Pipeline:** everything runs in Docker. Pushing a version tag tests, builds and uploads the HTML5 build to itch.io with butler.
- **Testing:** unit tests, balance regression tests that check every culture's pacing and survival at 80% accuracy, and a Playwright smoke test covering touch controls, menus, focus loss, final care, results and the ending.
- **Media kit:** generated from the game itself. One script redraws the banners, logos, store art and character renders, and captures fresh screenshots and gameplay video.
- **Accessibility:** keyboard and mouse, touch and gamepad, remappable keys, menus you can navigate without a mouse, chill mode and reduced-motion support.

## **Credits**

- **Remake:** Echo Yin.
- **Original game:** Studio Jojo ([play the 2023 original](https://paoowo.itch.io/relic-revival-run)).
- **Licence:** code under PolyForm Noncommercial 1.0.0; art and audio under CC BY-NC 4.0.
