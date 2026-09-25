---
title: "NeighborIQ"
description: "Rental-property analysis for small investors in Canadian cities: fair value from comparable listings, cash flow under Canadian mortgage rules, and neighbourhood open data. Built with FastAPI, PostGIS, Celery and Vue 3."
image: "assets/images/projects/neighbor-iq.jpg"
technologies:
  - FastAPI
  - Vue 3
  - PostgreSQL
  - PostGIS
  - Celery
categories:
  - Fullstack
  - GIS
  - Data
live_pending: true
docs_url: "https://e-choness.github.io/NeighborIQ/"
github_url: "https://github.com/e-choness/NeighborIQ"
featured: true
order: 4
---
## Project Overview

**NeighborIQ helps a small investor screen a rental property in a Canadian city.** For any listing, or any property found elsewhere, it answers three questions:

| | Question | How |
|---|---|---|
| 1 | **Is the price fair?** | Asking price against the median $/sq ft of the nearest comparable listings, with the comps on a map and a confidence level |
| 2 | **Will it cash-flow?** | Monthly cash flow under Canadian rules (semi-annual compounding, CMHC insurance, land transfer tax), with every assumption editable |
| 3 | **What is the neighbourhood like?** | Census income and tenure, transit frequency, crime, new supply and assessed values from public open data, each with its source and date |

The app runs on clearly labelled **synthetic demo listings** out of the box, so no data licence is needed. Real listings need a licensed feed (such as CREA's DDF® through a brokerage); NeighborIQ does not scrape MLS® or REALTOR.ca. Neighbourhood data, rates and transit come from public open data loaded with one command.

[Detailed documentation](https://e-choness.github.io/NeighborIQ/) · [Try the cash-flow calculator](https://e-choness.github.io/NeighborIQ/guide/calculator) · [API reference](https://e-choness.github.io/NeighborIQ/reference/api)

## Features

- **Comparable-listing fair value**: median $/sq ft of the nearest comps, shown on the map with a confidence level.
- **Canadian cash flow**: semi-annual mortgage compounding, CMHC insurance and land transfer tax, with every input editable and saved per property.
- **Analyze any address**: the same analysis for a property found elsewhere, pre-filled from the assessment roll.
- **Neighbourhood open data**: loaders for boundaries, assessment rolls, census, GTFS transit, crime, permits and rates across six cities plus national sources.
- **3D yield map**: gross rental yield across a city on H3 hexagons, rendered with MapLibre GL and Protomaps PMTiles.
- **Portfolio**: saved properties with their own assumptions for ongoing monitoring.
- **Backtested price model**: optional XGBoost valuation with a published error band, off by default.

## Architecture

One FastAPI service handles everything request/response; two Celery workers carry the batch work that actually needs to scale. The reasoning is recorded in [ADR 0001](https://github.com/e-choness/NeighborIQ/blob/main/docs/adr/0001-one-api-two-workers.md).

- **api**: FastAPI over PostgreSQL + PostGIS, enqueueing jobs on Valkey.
- **ingestion-worker**: open data, OpenStreetMap and licensed partner feeds.
- **insights-worker**: yields, the valuation model and neighbourhood summaries.

## Tech Stack

- **API**: Python 3.14, FastAPI, SQLAlchemy 2, Pydantic 2, RS256 JWT in HttpOnly cookies, Argon2id passwords
- **Data**: PostgreSQL 18 + PostGIS 3.6, Alembic migrations
- **Jobs**: Celery with Valkey (Redis-compatible) as broker; Scrapy for licensed partner feeds
- **Frontend**: Vue 3.5, Vite 8, Tailwind CSS v4, Reka UI, Pinia Colada, MapLibre GL + Protomaps PMTiles, H3
- **Docs**: VitePress, published to GitHub Pages
- **Ops**: Docker Compose, Caddy with automatic HTTPS, Ruff, pytest, vue-tsc, pip-audit + npm audit, Dependabot, SHA-pinned GitHub Actions

## License

Source-available under the Functional Source License 1.1 (FSL-1.1-ALv2): free to run, modify and self-host for anything except a competing product or hosted service, and each release becomes Apache 2.0 two years after it ships.
