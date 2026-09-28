---
title: "EcoManage"
description: "Energy management for real buildings. Solar, batteries, EV chargers and heat pumps on one live 3D view, bills from the site's own tariff, and changes that only reach a device once someone approves them. Built with TypeScript, React, three.js, MQTT, and MongoDB."
image: "assets/images/projects/eco-manage.jpg"
banner: "assets/images/projects/eco-manage.svg"
technologies:
  - TypeScript
  - React
  - three.js
  - Node.js
  - MQTT
  - MongoDB
  - Redis
  - Docker
categories:
  - Fullstack
docs_url: "https://e-choness.github.io/eco-manage/"
github_url: "https://github.com/e-choness/eco-manage"
featured: true
order: 3
---
## Project Overview

**EcoManage is energy management for real buildings**: a school, an office, a small business. It watches one site through a small gateway on the site's network that reads the solar inverters, the battery, the EV chargers, the heat pump and the grid meter every few
seconds. The result is one live view of where the energy goes, bills computed from the site's own tariff, and changes that only reach a device once someone approves them.

![walkthrough](../assets/images/projects/eco-manage-walkthrough.webp)

Version 2.0 is a rebuild around real devices. The original single-app dashboard became a set of services: a gateway talks MQTT over TLS to a broker, ingest turns readings into telemetry and 15-minute intervals, a rules engine raises alerts and proposes recommendati
ons, and a worker computes bills, forecasts and reports. The web app shows it all live on a 3D model of the site.

Nothing is automatic by default. Rules look at the live data, the forecast and the tariff every 15 minutes and propose a change. An approved recommendation becomes a **command** that the gateway carries out for a limited time and then undoes, and the gateway enforc
es each device's safety limits itself, whatever it is sent. Every result is measured the next day.

**Try it locally.** `docker compose up -d` plus one seed command starts the whole stack with a simulated school (86 kWp of solar, a 200 kWh battery, four EV chargers and a heat pump) feeding it straight away.

## Features

- **Live site**: Power moving between solar, the battery, the grid, EV chargers, the heat pump and the building every 5 seconds, on a 3D model of the site, with demand against the cap, the bill so far, and today's prices. A 2D flow diagram replaces the scene on dev
ices without WebGL.
- **Bills**: Time-of-use and demand tariffs with versions over time, the month so far and where it's heading, savings from solar and the battery, PDF statements, and the utility's bill compared with the estimate.
- **Recommendations**: Battery peak shaving, EV off-peak charging, EV limits near the demand cap, heat-pump pre-conditioning, storm reserve and export caps. Each comes with its inputs, safety checks and expected saving, and waits in the Inbox for approval.
- **Plain-language explanations**: Any recommendation explained by a language model. Owners bring their own key for any OpenAI-compatible provider or Anthropic, with a monthly token budget. Only the numbers are sent, never names.
- **Alerts**: Silent devices, low solar, a battery below reserve, demand near the cap, and failed commands. Emails with escalation, remote fixes from the device profile, and alerts that close themselves when the problem clears.
- **History and reports**: Any range by hour, day or month, CSV exports, 48-hour solar and load forecasts from the weather, and scheduled PDF, CSV or Excel reports by email.
- **Site model**: Generated from the building's footprint or its OpenStreetMap outline, storeys and roof rows, or uploaded as glTF, OBJ, FBX or IFC and converted in a sandbox. Each device is placed on the model.
- **Edge gateway**: A Raspberry Pi agent for Modbus TCP/RTU devices and OCPP 1.6J chargers, with a 7-day offline buffer and safety limits on every command, claimed by the QR code on its label.
- **Roles and audit**: Owner, manager and installer roles with expiry and invitations, provisioning from the command line or a directory/CRM plan, and an audit log of every change.
- **Accessibility**: Keyboard use throughout, screen-reader labels, a data table beside every chart, and light and dark themes.

## Tech Stack

### Web App

- **Framework**: React 19, Vite 8, and TypeScript 6
- **3D**: three.js scene of the site with animated power flows
- **UI**: Tailwind CSS 4 and Radix UI primitives, with TanStack Query for server state
- **Live data**: REST plus a server-sent event stream from the API

### Services

- **Runtime**: Node.js 26 in a pnpm monorepo of apps and shared packages
- **API**: Express with Mongoose, zod validation, JWT auth, and rate limiting
- **Messaging**: MQTT over TLS (Eclipse Mosquitto) between gateways, the simulator and the services
- **Ingest & rules**: MQTT to telemetry, latest values and 15-minute intervals; alerts, recommendations and command dispatch
- **Worker**: BullMQ jobs for bills, savings, forecasts, reports, exports and email

### Edge & Devices

- **Gateway**: Raspberry Pi agent speaking Modbus TCP/RTU and OCPP 1.6J, with device profiles for register maps, write limits and fixes
- **Simulator**: a simulated gateway with weather, loads and faults for trying everything without hardware
- **Model converter**: sandboxed glTF pipeline (glTF Transform, Draco, meshoptimizer)

### Infrastructure

- **Data**: MongoDB 8 and Redis 8
- **Containerization**: Docker Compose for every service, production images for amd64 and arm64, and a one-command se Cloudflare Tunnel
- **Testing**: typecheck, lint, knip and unit tests in CI, plus Playwright smoke and accessibility tests against the running stack
- **Documentation**: VitePress site on GitHub Pages with a user guide, deployment, developer and reference sections
