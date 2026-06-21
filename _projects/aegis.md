---
layout: project
title: "Aegis AI Gateway"
description: "A plugin-first AI gateway framework. A small kernel plus seven contracts puts a governed, observable, provider-agnostic pipeline between your apps and any LLM. Built with FastAPI, LangGraph, and Docker."
image: "assets/images/projects/aegis.jpg"
technologies:
  - Python
  - FastAPI
  - LangGraph
  - Docker
  - PostgreSQL
categories:
  - Python
  - AI/ML
  - Framework
  - Fullstack
live_url: "https://huggingface.co/spaces/echoness/aegis-server"
github_url: "https://github.com/e-choness/aegis"
featured: true
order: 2
---
## Project Overview

**Aegis is the governed gateway where every safeguard is a plugin.** It sits between your applications and any LLM provider and turns fragmented, ungoverned model calls into a single auditable pipeline — guardrails, PII masking, routing, budgets, and tool governance — without locking you into any one vendor or any one policy.

The v2 rewrite is built on one structural bet: the kernel knows *nothing* about what the pipeline does. It discovers plugins, validates typed config, resolves secrets, and compiles the request lifecycle into a LangGraph state machine. Everything with an opinion — providers, guardrails, RAG stores, secret backends, telemetry, authenticators — implements one of seven published contracts. Aegis's own governance features ship as optional policy packs built on those same public contracts, which is the permanent proof the plugin API is complete.

[Detailed documentation](https://e-choness.github.io/aegis/)

## Features

- **Plugin-first kernel**: Seven contracts (providers, guardrails, RAG, secrets, telemetry, pipeline nodes, authenticators) discovered via Python entry points — extend the gateway without touching core.
- **Pipeline as a graph**: Request lifecycle is a LangGraph `StateGraph`, so compliance rules are auditable edges, not buried `if` statements.
- **Configurable guardrails**: Four-verdict model (allow / block / sanitize / require_approval) behind one contract; LLM Guard ships as the default adapter, anything else plugs in.
- **Provider hot-swapping**: LiteLLM-backed default provider plus a generic OpenAI-compatible type; switch models per request, per route, or from the CLI.
- **Governed tool & RAG traffic**: MCP tool calls and retrieved documents pass the same guard chain — the traffic most gateways ignore.
- **Human-in-the-loop**: Any guard can pause a run; runs checkpoint, survive restarts, and resume from API or CLI.
- **Drop-in compatibility**: An OpenAI-compatible endpoint means existing SDKs, CLIs, and chat UIs adopt Aegis by changing one base URL.
- **Optional policy packs**: Data classification, residency (fail-closed routing), per-team budgets, and Presidio-based PII masking — install only what you need.
- **Observability**: OpenTelemetry core with Prometheus/Grafana and tracing exporters as opt-in plugins.

## Tech Stack

### Framework Core

- **Language**: Python 3.12, fully typed
- **Pipeline**: LangGraph 1.x state machine over a typed `RunState`
- **Plugins**: `importlib.metadata` entry points + pluggy hooks
- **Config**: pydantic v2 + pydantic-settings, `secret://` references

### Serving & Identity

- **API**: FastAPI — native `/v1/runs` plus OpenAI-compatible `/v1/chat/completions`
- **Streaming**: SSE with compile-time guardrail capability negotiation
- **Identity**: Virtual API keys resolving to a `Principal` (level L2; principal-aware, not multi-tenant)

### Integrations

- **Providers**: LiteLLM (~100 providers) + OpenAI-compatible generic
- **Guardrails**: LLM Guard adapter (default), Presidio PII pack
- **Tools**: Model Context Protocol — Aegis consumes MCP tools and exposes itself as an MCP server
- **RAG**: own thin Protocols with a LangChain store adapter; Chroma (dev), pgvector (prod)

### Infrastructure

- **Persistence**: PostgreSQL (SQLite for dev), SQLAlchemy 2 + Alembic
- **Checkpointing**: LangGraph savers (SQLite / Postgres) for durable, resumable runs
- **Containerization**: Docker Compose, observability as an opt-in profile
- **SDKs**: first-party Python + TypeScript; published OpenAPI spec for generated clients
