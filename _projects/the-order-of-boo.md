---
title: "The Order of B.O.O."
description: "A cosy-spooky Halloween stealth immersive sim for the browser. Drift down the chimney as a small, very polite bedsheet ghost, slip past cats that see spirits and lawn skeletons that shriek, and decide whether a child earns a Treat or a Trick. Built with three.js and TypeScript."
image: "assets/images/projects/the-order-of-boo.jpg"
banner: "assets/images/projects/the-order-of-boo.webp"
technologies:
  - three.js
  - TypeScript
  - Vite
  - WebGL 2
  - Web Audio
categories:
  - Game Development
  - Web
live_url: "https://echoness.itch.io/the-order-of-boo"
live_label: "itch.io"
store_url: "https://e-choness.github.io/the-order-of-boo/"
store_label: "GitHub Pages"
github_url: "https://github.com/e-choness/the-order-of-boo"
featured: false
order: 5
---
## **What is The Order of B.O.O.**

Every Halloween, children whisper a secret Midnight Wish to the dark, and the wish gets muddled by sugar, siblings and misspelled letters. The Order of B.O.O. (Boos Observing Ominously), a secret society of small, very polite bedsheet ghosts, drifts down chimneys to find out the truth. Sneak past parents in costume, cats who can *see* spirits, dogs who can *smell* them and motion-sensor skeletons who **shriek**, then decide whether the child goes in Old Jack o' the Lantern's **Treat** ledger or the Bogeyman's **Trick** book.

It is the Halloween sibling of [The Order of E.L.F.](#/proj/the-order-of-elf), built on the same stealth systems with new spells, creatures and houses.

## **Gameplay Experience**

![Gameplay: sneaking through the Hollowell house on Halloween night](../assets/images/projects/the-order-of-boo-gameplay.gif)

Every house is a living system. Families carve pumpkins, binge monster movies and answer the door to trick-or-treaters. Snuff a candle to make a shadow and someone wanders over to relight it; drop a potion and the shatter brings the whole household. Nobody gets hurt: the worst outcome is that the family now believes in ghosts.

- **4 hauntings:** Ghost School, The Hollowell House, Thornbury Farmhouse and Ravensworth Manor, each with its own child, costumed family and twist.
- **Six spells:** Fade into invisibility, Possess a jack-o'-lantern, see through a skull's eyes with Spirit Sight, lure people with a knocking will-o'-wisp, Snuff a candle from across the room, or send someone to dreamland with Slumber Mist.
- **Creatures with rules:** cats see spirits, so Fade won't fool them; dogs smell ghosts; animatronic lawn skeletons only see movement, and shriek for the humans when they do.
- **Deduction:** diaries, receipts, phone screens and sleep-talk, with decoys like the date on a certificate or a letter with suspiciously perfect spelling.
- **Your plan, your style:** ghost it perfectly, mist the whole family to sleep or befriend the cat and let her gossip for you. Medals reward each play style.

## **Spooky in the Browser**

A harvest moon over drifting clouds, falling leaves, ground fog, bats, guttering candlelight and portraits whose eyes follow you. The music is Chopin, Grieg and Bach, performed live by a Web Audio engine that speeds up when you're spotted, with synthesised shrieks and knocks.

## **Technical Foundation**

- **Rendering:** three.js with pmndrs postprocessing (N8AO ambient occlusion, mip bloom, SMAA, AgX tone mapping) and a custom grading pass for fright, mist and spell states.
- **World:** a procedural house builder with Kenney CC0 props and procedural Halloween props: pumpkins, gravestones, cauldrons, scarecrows and cobwebs.
- **Sky and effects:** a shader sky with the harvest moon, clouds and spirit ribbons, GPU leaf fall, noise ground fog, bats and particle wisps.
- **AI:** grid A* with string-pulling, perception by sight, hearing, smell, spirit sight and motion, and routines and conversations for every household.
- **Pipeline:** Node 26, Vite 8 and strict TypeScript 7, with a level validator built into the game. Every push to `main` ships to GitHub Pages and to itch.io with butler; tagging a version publishes a GitHub Release. The media kit is rendered from the live game with Playwright.

## **Credits**

- **Design and code:** Echo Yin.
- **Assets:** 3D models, particles, sound effects and jingles by [Kenney](https://kenney.nl) (CC0); Halloween props, sky and effects generated in code; music by Chopin, Grieg and Bach (public domain), arranged live; fonts under the SIL Open Font License.
- **Licence:** code and original content under PolyForm Noncommercial 1.0.0.
