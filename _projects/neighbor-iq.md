---
layout: project
title: "NeighborIQ"
description: "AI-powered real estate intelligence platform for neighborhood insights, ML price predictions, and automated data ingestion. Built with FastAPI, Vue 3, and Docker."
image: "assets/images/projects/neighbor-iq.jpg"
technologies:
  - FastAPI
  - Vue 3
  - PostgreSQL
  - Elasticsearch
categories:
  - Fullstack
  - AI/ML
  - GIS
live_url: "https://github.com/e-choness/NeighborIQ"
github_url: "https://github.com/e-choness/NeighborIQ"
featured: true
order: 2
---

## Project Overview

[NeighborIQ](https://github.com/e-choness/NeighborIQ) is an AI-powered intelligence platform that transforms raw real estate data into actionable neighborhood insights. It acts as a unified microservices ecosystem for the Canadian residential market, combining automated data ingestion with machine learning to provide price predictions and investment analytics. Built for extensibility and performance, it leverages a distributed architecture to deliver enterprise-grade market transparency without high operational overhead.

## Features

* **Unified Property Gateway:** Single API entry point for multi-dimensional property search and management.
* **ML Price Predictions:** [XGBoost-powered](https://github.com/e-choness/NeighborIQ#at-a-glance) inference engines for property valuation and rental yield forecasting.
* **Automated Data Pipeline:** [Scrapy-based](https://github.com/e-choness/NeighborIQ#at-a-glance) ingestion framework for real-time Canadian market listing updates.
* **Geo-Spatial Search:** [Elasticsearch](https://github.com/e-choness/NeighborIQ#service-port-map) integration for high-performance location-based and full-text property discovery.
* **Enterprise Authentication:** [RS256 JWT](https://github.com/e-choness/NeighborIQ#architecture-highlights) tokens with refresh rotation and JWKS-aware gateway security.
* **Intelligent Caching:** Multi-layer [Redis](https://github.com/e-choness/NeighborIQ#intelligent-caching) strategy for search results, sessions, and asynchronous task results.
* **Async Task Processing:** Celery-driven background workers for heavy lifting in ML and web scraping.
* **Portfolio Management:** User-specific watchlists and saved property tracking for investment monitoring.

## Tech Stack

### Backend & AI

* **Framework:** [FastAPI](https://github.com/e-choness/NeighborIQ#technology-stack) (Async-first)
* **Language:** Python 3.11
* **ML Engine:** XGBoost & scikit-learn
* **Database:** PostgreSQL 15 + PostGIS
* **Search & Cache:** Elasticsearch 8.11 & Redis 7

### Frontend

* **Framework:** [Vue 3](https://github.com/e-choness/NeighborIQ#technology-stack) + TypeScript
* **Styling:** Tailwind CSS
* **State & Maps:** Pinia & OpenLayers

### Infrastructure

* **Containerization:** [Docker & Docker Compose](https://github.com/e-choness/NeighborIQ#quick-start)
* **Reverse Proxy:** Nginx
* **CI/CD:** GitHub Actions with Trivy security scanning