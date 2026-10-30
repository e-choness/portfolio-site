---
title: "The Order of E.L.F."
description: "A cosy Christmas stealth immersive sim for the browser. Slide down the chimney, sneak past parents, pets and one very suspicious robot vacuum, and find out whether a child's wish list goes to Santa or Krampus. A remake of a Unity jam game, built with three.js and TypeScript."
image: "assets/images/projects/the-order-of-elf.jpg"
banner: "assets/images/projects/the-order-of-elf.webp"
technologies:
  - three.js
  - TypeScript
  - Vite
  - WebGL 2
  - Web Audio
categories:
  - Game Development
  - Web
live_url: "https://echoness.itch.io/the-order-of-elf-remake"
live_label: "itch.io"
store_url: "https://e-choness.github.io/the-order-of-elf/"
store_label: "GitHub Pages"
github_url: "https://github.com/e-choness/the-order-of-elf"
featured: false
order: 4
---
## **What is The Order of E.L.F.**

Every Christmas Eve, wish lists get smudged. As an agent of the Order of E.L.F. (Elves Lurking Festively) you slide down the chimney, sneak past parents, pets and one very suspicious robot vacuum, and gather evidence of what the child really wants. Then you decide whether their list goes to **Santa** or **Krampus**.

The game began as a Unity stealth adventure made in a week by ABK Jam Team 7. This remake rebuilds it for the browser as a small but complete immersive sim, where every house is a sandbox of systems you can play however you like.

## **Gameplay Experience**

![Gameplay: sneaking through the Johnson house on Christmas Eve](../assets/images/projects/the-order-of-elf-gameplay.gif)

Light is real: the fire, the fairy lights, a grandfather's torch and the moonbeams through the windows decide how visible you are. Sound is real too: floorboards creak, tiles clatter, carpets muffle, and a glass bauble shattered in the kitchen pulls the whole family out of the living room.

- **4 missions:** Elf Academy (tutorial), The Johnson House, Frostbrook Cabin and Whitmore Manor, each with its own child, household and twist.
- **Light-and-shadow stealth:** a live light gem samples every lamp, the fire, torch beams and moonlight. Switch a lamp off and watch someone switch it back on.
- **Elf magic:** Shimmer into invisibility, Morph into a nutcracker, borrow a snow globe's eyes with Second Sight, toss a Jingle Lure, or put someone to sleep with Christmas Cheer.
- **An immersive-sim toolkit:** hide in wardrobes, under beds, behind curtains, among the presents or in a cardboard box; throw things, climb furniture, befriend the dog and eat Santa's cookies.
- **Deduction:** wishes, deeds and rumours, with decoys that only careful reading exposes. Pick the right gift and the right ledger to earn a promotion.

## **A Household That Thinks**

Everyone in the house runs on their own Christmas Eve routine: wrapping presents, midnight snacks, phone calls, gossip about the kids. A glimpse or a small noise makes them suspicious, a clear sighting starts a chase, and a lost trail turns into a search until they give up ("Must be the eggnog…"). They fix the lamp you switched off and the ornament you broke. The pets have their own rules: a cat who gossips, a dog who smells through magic, and a robot vacuum with antlers.

## **Technical Foundation**

- **Rendering:** three.js with pmndrs postprocessing (N8AO ambient occlusion, mip bloom, SMAA, AgX tone mapping) and a custom grading pass.
- **World:** a procedural house builder for walls, openings, trim and roofs, dressed with Kenney CC0 props and canvas textures.
- **AI:** grid A* with string-pulling, perception by sight, hearing and smell, and routines and conversations for every household.
- **Audio:** Web Audio with HRTF sound effects and live-synthesised public-domain carols that swell when you're spotted.
- **Pipeline:** strict TypeScript and Vite, with a level validator built into the game. Every push to `main` ships to itch.io with butler and to GitHub Pages; tagging a version publishes a GitHub Release. The media kit is rendered from the live game.
- **Accessibility:** subtitles in three sizes, reduced motion, FOV and sensitivity settings, and a vision-cone toggle.

## **Credits**

- **Remake:** Echo Yin.
- **Original game:** ABK Jam Team 7: Shawn Wells, Mondae Atughonu, Echo (Beili) Yin, Jonathan Librizzi, Milton Clark, Sara Zorns, Molly Carroll, Lu Xu and Andre B ([play the original](https://solarlunareclipse.itch.io/order-of-elf)).
- **Assets:** 3D models, particles, sound effects and jingles by [Kenney](https://kenney.nl) (CC0); public-domain carol melodies; fonts under the SIL Open Font License.
- **Licence:** code under MIT.
