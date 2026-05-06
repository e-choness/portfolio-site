---
layout: project
title: "Aegis AI Gateway"
description: "Enterprise AI governance platform providing provider-agnostic LLM routing, data classification, and budget enforcement. Built with FastAPI, TypeScript, and Docker."
image: "assets/images/projects/aegis.jpg"
technologies:
  - Python
  - FastAPI
  - Docker
  - PostgreSQL
categories:
  - Python
  - node.js
  - Fullstack
  - AI/ML
live_url: "https://github.com/e-choness/aegis"
github_url: "https://github.com/e-choness/aegis"
featured: true
order: 1
---
## Project Overview

Aegis is a centralized control plane that transforms fragmented LLM integrations into a governed, secure service layer. It acts as a single gateway for AI traffic across Anthropic, Azure OpenAI, and Ollama with built‑in data classification, PII masking, and budget enforcement. Provider‑agnostic and Docker‑native, it delivers enterprise governance without GPU requirements.

## Features

- **Unified AI Gateway**: Single API routing across Anthropic, Azure OpenAI, and Ollama
- **Data Classification**: Sub‑2ms regex‑based sensitivity detection
- **PIPEDA Compliance**: Hard‑coded invariant ensures restricted data never reaches cloud providers
- **PII Masking**: Presidio‑based scanning with placeholder restoration
- **Smart Cost Routing**: Task‑aware model selection reduces spend up to 88%
- **Budget Enforcement**: Per‑team caps with automatic model downgrade
- **Async Jobs**: Non‑blocking inference with polling endpoints
- **RAG Pipeline**: Classification‑aware pgvector retrieval
- **Observability**: Prometheus metrics, Grafana dashboards, circuit breakers

## Tech Stack

### Gateway

- **Framework**: FastAPI
- **Language**: Python 3.12
- **Database**: TimescaleDB (PostgreSQL)
- **Vector DB**: pgvector
- **Monitoring**: Prometheus + Grafana

### SDKs

- **Python**: aegis-sdk with async context manager
- **TypeScript**: @aegis/ai-platform-client with polling support

### Infrastructure

- **Containerization**: Docker Compose (CPU‑only)
- **Configuration**: YAML‑based model registry
- **Security**: PIPEDA‑compliant data classification baked into routing
