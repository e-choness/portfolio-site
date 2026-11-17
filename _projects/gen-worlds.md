---
title: "Gen Worlds"
description: "A space mission design game for 1 to 4 players in the browser. Plan a mission from the science goal to the spacecraft and the launch under nine live budgets, then fly it in 3D over real terrain and see every trade-off play out. Built with three.js, WebGPU, Preact and TypeScript."
image: "assets/images/projects/gen-worlds.jpg"
banner: "assets/images/projects/gen-worlds.svg"
technologies:
  - TypeScript
  - three.js
  - WebGPU
  - Preact
  - Vite
  - Firebase
  - Docker
categories:
  - Game Development
  - Web
  - GPU
live_url: "https://gen-worlds.surf"
live_label: "gen-worlds.surf"
github_url: "https://github.com/e-choness/gen-worlds-web"
featured: false
order: 3
---
## **What is Gen Worlds**

Spaceflight is the art of living inside budgets. In Gen Worlds a kilogram added to the rover becomes more propellant and a bigger rocket, and a battery skimped on freezes the vehicle in a lunar night whose length comes from the real Moon. One to four players design a space mission, from the science goal to the spacecraft, the rocket and the route, then fly it and watch every choice play out.

It is free and runs in any modern browser with nothing to install. The 3D views use WebGPU, and the whole game also plays without it.

<iframe src="https://www.youtube-nocookie.com/embed/zGKbXVWIvjQ" title="Gen Worlds trailer" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

The trailer is recorded from the running game one frame at a time. Its narration is a song, "Design It, Fly It", sung in [SongForge](#/proj/songforge), which also made the rocket and landing-thruster sounds.

## **Designing a Mission**

1. **Briefing:** the science objectives, the budget cap and the resources that usually decide the mission.
2. **Hangar:** choose a part for every system: frame, power, battery, propulsion, attitude control, computer, radio, thermal control, mobility, landing system and instruments. Nine budgets (mass, propellant, launch, power, night or eclipse, data, cost, schedule and risk) update live, each with a sentence that says why it is healthy or not, and the vehicle is built in 3D as you choose.
3. **Trajectory:** the rocket, the route and the dates. A sunlight and Earth-visibility calendar for the lunar pole, a porkchop plot for Mars, an altitude trade for Earth orbit.
4. **Go/No-Go:** each role answers for its part of the mission, and a forecast flies the design 200 times to show how often it works and what usually goes wrong.
5. **Flight:** the mission plays out day by day, and after launch your own vehicle flies it on a 3D stage. On the Moon and on Mars you can fly the last kilometres of the landing yourself over the real terrain, with the propellant your design left you.
6. **Debrief:** every outcome is traced back to the decision behind it, with a link to the screen where you can change it. Change one thing, fly again and compare.

## **Missions and Worlds**

- **Earth observation small satellite:** mass, power, data and cost; orbit altitude against image detail, ground contact, drag and the debris rule.
- **Lunar south pole ice prospector:** polar lighting, the lunar night, working in permanent shadow and direct-to-Earth links.
- **Jezero crater sample survey on Mars:** launch windows, entry speed, dust, a night every sol, relay links and light time.
- **Any world in the galaxy:** the galaxy is procedural, and every solid planet and moon in it is a mission. Its gravity sets the propellant, its distance from its star the power, its day the battery, and its air decides between a heat shield and engines. The rover that works on Mars may not survive there.

The catalog holds 68 spacecraft parts, 8 launch vehicles and 14 kinds of random event, across three difficulty levels: Cadet, Engineer and Flight Director. A short explainer sits on every step, and a glossary is one click away.

## **Playing Together**

- **Around one screen:** two to four players take the roles of Flight Director, Spacecraft Engineer, Science Lead, and Comms and Operations. Each role owns part of the design, votes in the Go/No-Go poll and acknowledges its own events in flight; fast answers earn a coordination bonus.
- **On separate devices:** the same game through a room code.
- **Against each other:** the simulation is deterministic, so a link to a flight hands anyone the same design and the same luck. A daily mission gives everyone one seed, and every leaderboard entry is re-flown in your browser before it is shown.

## **Technical Foundation**

- **One mission model:** a design is plain data. `evaluateDesign` turns it into budgets with explanations and `simulateMission(design, seed, inputs)` turns it into a result. The forecast, the flight, the debrief and the leaderboard check all call the same functions, so they cannot disagree.
- **Real physics, simplified honestly:** JPL Keplerian elements for the planets, an Izzo Lambert solver for transfers, the rocket equation, inverse-square solar power and link budgets, a Meeus lunar ephemeris with libration for polar lighting, sun-synchronous orbit geometry, eclipse and drag.
- **Measured worlds:** three.js with the WebGPU renderer places the real solar system at ephemeris positions. The Moon is built from LRO LOLA elevation and LROC colour, Mars from MGS MOLA elevation and Viking colour, and the Earth from Blue Marble colour and ETOPO relief.
- **Data, not code:** parts, launch vehicles, bodies, scenarios and events live in JSON, each file with its sources and units.
- **Layered core:** imports point downward only. The astronomy, universe and mission layers are pure TypeScript and run in workers.
- **Online play:** Firebase anonymous sign-in and Firestore power the rooms and the global leaderboard, with security rules as the access control. The game plays fully offline without them.
- **Pipeline:** everything runs in Docker. Every push to `main` type-checks, lints and tests, then ships to GitHub Pages and writes the README's live badges. The media kit, the demo video and the trailer are captured from the running game.

## **Credits**

- **Game:** Echo Yin.
- **Data:** NASA JPL ephemerides and NSSDCA fact sheets, LRO LOLA and LROC (NASA SVS), Viking and MGS MOLA (USGS), Blue Marble (NASA GIBS) and NOAA ETOPO 2022, all public domain.
- **Textures and libraries:** Poly Haven terrain textures (CC0); three.js, ez-tree, three-pinata and the webgpu-galaxy density model (MIT).
- **Music and sound:** made for the game in SongForge.
- **Licence:** code and media under Apache-2.0; NASA and other third-party imagery keeps its own terms.
