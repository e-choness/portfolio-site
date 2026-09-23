---
layout: project
title: "PDF Sanitizer"
description: "An offline Windows desktop app that strips scripts, attachments, outbound links and metadata from PDF files, verifying every result before replacing the original. Built with Rust, Tauri and Svelte."
image: "assets/images/projects/pdf-sanitizer.jpg"
technologies:
  - Rust
  - Tauri
  - Svelte
  - JavaScript
categories:
  - Rust
  - Desktop
  - Security
live_url: "https://e-choness.github.io/pdf-sanitizer/"
github_url: "https://github.com/e-choness/pdf-sanitizer"
featured: true
order: 4
---
## Project Overview

PDF Sanitizer is a desktop application that removes potentially dangerous or privacy-leaking content from PDF files — JavaScript, auto-run actions, embedded attachments, outbound links and metadata — and replaces each file with a clean copy. Originals are moved to a backup folder, and every sanitized file is re-parsed and verified before the original is touched.

It ships as a single Windows executable with no installer, no account and no network access: everything runs locally.

## Features

- **Active Content Removal**: Strips JavaScript, `OpenAction`/`AA` triggers, launch, submit-form and media actions, and XFA forms — wherever they appear in the document.
- **Hidden Payload Removal**: Deletes embedded files and file-attachment annotations.
- **Metadata Scrubbing**: Removes author, dates, producer software and XMP metadata streams.
- **Link Stripping**: Optionally removes links to external URLs and remote files while keeping internal navigation.
- **Verified Output**: Checks page count, content streams and leftover scripts on every result; if a check fails, the original is left untouched.
- **Safe File Handling**: Originals are moved to a backup folder and the clean file takes their place, with automatic rollback if the swap fails.
- **Batch Processing**: Process up to 8 files in parallel with per-file progress, stop and retry.
- **File Size Optimization**: Optional TrueType font subsetting and JPEG image recompression.
- **Encrypted PDF Support**: Opens files protected only by an owner (permissions) password, including AES-encrypted ones.
- **Light & Dark Theme**: Follows the system theme.

## Tech Stack

### Frontend

- **Framework**: [Svelte 5](https://svelte.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Testing**: [Vitest](https://vitest.dev/)
- **Native Dialogs**: [Tauri Dialog Plugin](https://v2.tauri.app/plugin/dialog/)

### Backend

- **Desktop Shell**: [Tauri 2](https://tauri.app/)
- **Language**: [Rust](https://www.rust-lang.org/)
- **Async Runtime**: [Tokio](https://tokio.rs/) with semaphore-based concurrency and cancellation tokens
- **PDF Engine**: [lopdf](https://github.com/J-F-Liu/lopdf) in a standalone `pdfsan-core` crate, with custom font subsetting and image recompression

### Tooling

- **Cross-compilation**: [cargo-xwin](https://github.com/rust-cross/cargo-xwin) builds the Windows `.exe` from Linux, in Docker and GitHub Actions
- **CI/CD**: GitHub Actions for tests, releases with changelog-driven notes, and a [VitePress](https://vitepress.dev/) documentation site on GitHub Pages
