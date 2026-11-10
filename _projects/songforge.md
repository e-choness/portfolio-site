---
title: "SongForge"
description: "A self-hosted AI music studio that runs on your own graphics card. Describe a song in one line or bring your own lyrics, and get a finished track with vocals, cover art and a music video. Built with Python, PyTorch, FastAPI and React."
image: "assets/images/projects/songforge.jpg"
banner: "assets/images/projects/songforge.svg"
technologies:
  - Python
  - PyTorch
  - FastAPI
  - React
  - TypeScript
  - PostgreSQL
  - Docker
categories:
  - AI/ML
  - Fullstack
  - GPU
featured: false
order: 2
---
## **What is SongForge**

Type "a sad French song" or "a heroic adventure theme with bold fanfares", and SongForge writes the lyrics, picks the style, sings it and paints the cover art. It is an AI music studio that runs entirely on your own graphics card: no cloud, no accounts, and nothing leaves your machine.

<iframe src="https://www.youtube-nocookie.com/embed/YCeNSiUwEx0" title="SongForge trailer" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

The trailer is a walkthrough of the running app. SongForge sings its own narration, and the four preview songs were made in it.

## **Making Music**

- **From a description:** a one-line idea becomes lyrics, a style, a tempo and a key, then a full song sung in the language you asked for.
- **From your own lyrics:** set the style, title, voice, length, tempo and key yourself, or switch to an instrumental.
- **Film scores:** a dedicated instrumental model for lifelike orchestras, pianos and soundtracks, up to 6 minutes 20 seconds long.
- **Named styles:** ask for "Chopin style" or "like Hans Zimmer" and SongForge spells out the genre, feel and instruments, following the style without copying any recording.
- **Your instruments, kept:** "only piano", "pure acoustic guitar" or "no drums" holds at every step, so the arrangement stays the way you asked.

## **After the Song**

- **Edit:** extend a song from any point, remake it in a new style or rewrite one section.
- **Split:** pull the vocals out, or separate a track into drums, bass, guitar, piano, vocals and the rest.
- **Sounds:** short sound effects from a text prompt, and seamless loops locked to a tempo.
- **Library:** search, filter by style, like and batch-download everything you have made as MP3, WAV or FLAC.

## **Cover Art and Music Videos**

When a song finishes, SongForge listens to it and writes a short description of how it actually sounds, then paints a widescreen cover from that description. The cover can drift with a slow 3D depth effect, and one of eight sound waves moves with the music on top of it. One click exports the result as a 1080p music video.

## **Running It**

SongForge runs in Docker on one PC with an NVIDIA graphics card (8 GB of video memory or more) and only answers on that machine. Each model downloads the first time a feature needs it, and a full song with vocals takes about a minute on an RTX 4080.

## **Credits**

- **Models:** YuE2, Stable Audio 3, ACE-Step 1.5, FLUX.2 [klein], Depth Anything V2, Demucs and TangoFlux, each under its own licence. Some are for non-commercial use only, so SongForge is a personal studio, not a public service.
- **Licence:** the source is private; all rights reserved.
