---
title: "Aegis AI Gateway"
description: "A self-hosted AI gateway that shows its work. Guardrails, human approvals, and a tamper-evident audit trail between your apps and any LLM, behind an OpenAI-compatible endpoint and configured in one YAML file. Built with FastAPI, LangGraph, and Docker."
image: "assets/images/projects/aegis.jpg"
banner: "assets/images/projects/aegis.svg"
technologies:
  - Python
  - FastAPI
  - LangGraph
  - Docker
  - PostgreSQL
categories:
  - AI/ML
  - Framework
  - Fullstack
live_url: "https://huggingface.co/spaces/echoness/aegis-server"
docs_url: "https://e-choness.github.io/aegis/"
github_url: "https://github.com/e-choness/aegis"
featured: true
order: 2
---
## Project Overview

**Aegis is a self-hosted AI gateway that shows its work.** It sits between your applications and any LLM provider and tells you exactly why a request was blocked, masked, or paused. It also keeps a hash-chained record of every one of those decisions. That kind of structured audit is a paid-tier feature on most gateways. In Aegis it's on by default from the moment the server starts.

![terminal-demo](../assets/images/projects/aegis-terminal-demo.svg)

It's one install: `pip install aegis-gateway`, then `aegis init` and `aegis serve`. Point any OpenAI client at it and the `model` field picks an Aegis route. Routes, providers, guardrails, tools, and approval rules all live in one `aegis.yaml`, so no code changes are needed.

The kernel knows *nothing* about what the pipeline does. It discovers plugins, validates typed config, and compiles the request lifecycle into a LangGraph state machine. Everything with an opinion implements a public contract, including Aegis's own policy packs. That is the proof that the plugin API is complete.

**Try it in your browser.** The [live demo](https://huggingface.co/spaces/echoness/aegis-server) runs the real guardrails against a mock model, with one tab per scenario: privacy, content policy, prompt attacks, residency and approval, agent tools, budgets, and audit. Each result shows every step's timing, the labels and masked values, and the YAML and `curl` behind the route. The Audit tab explains runs, verifies the hash chain, and downloads the evidence.

## Features

- **Four verdicts, nothing else**: Every guardrail returns `allow`, `sanitize`, `block`, or `require_approval`. Every verdict is recorded, including `allow`.
- **Human-in-the-loop**: A guard can pause a run for a named reviewer. The run is checkpointed and resumes from the CLI, REST, or the `/approvals` page.
- **Evidence ledger**: A hash-chained record of route inventory and run evidence. `aegis audit export` / `verify` proves the history is intact offline, without trusting the server. Masked PII never reaches the ledger.
- **`aegis explain`**: A per-run verdict trail that shows which guard fired, why, who signed off, and whether the provider was ever called.
- **Compliance reporting**: `aegis report summary` and `GET /v1/audit/report` roll up route inventory, run stats, and chain length. The reports follow OSFI E-23 model-risk expectations, and each route has an owner, a risk rating, and a review interval.
- **Policy packs**: PII masking (Presidio, including street addresses and postal codes), residency (fail-closed routing), classification, label policy, budgets, and a model-based content pack (GLiNER2) that labels requests and masks what no pattern can describe. They are pip-installable, so you only install what you need.
- **Governed agent tools**: A route declares in YAML which tools the model may call, each allowed, paused for approval, or denied, with built-in exfiltration and injection guards on tool calls.
- **Measured, not claimed**: A labelled probe set scores every detector's precision, recall, and latency, and CI fails when a score drops below the baseline. Secret recall went from 22% to 100% with no false alarms.
- **Drop-in compatibility**: `/v1/chat/completions` with SSE streaming, plus a native `/v1/runs` API with approvers and background runs.
- **Plugin-first**: A guardrail is a class with a `scan()` method. `aegis plugin new` scaffolds one with contract tests that already pass.
- **Honest status**: Aegis is at 2.0.0a5 (alpha, AGPL-3.0). The docs keep a table of what's wired into `aegis serve` and what's only available as a Python API so far.

## Tech Stack

### Framework Core

- **Language**: Python 3.12, fully typed (ruff + pyright), uv workspace of pip-installable packages versioned from git tags
- **Pipeline**: LangGraph 1.x state machine over a typed `RunState`, with `ingress` / `egress` guard stages and per-route overrides
- **Plugins**: `importlib.metadata` entry points on public contracts, with no built-in special cases
- **Config**: pydantic v2 + pydantic-settings, `secret://` references, and a SHA-256 config digest stamped on every run

### Serving & Identity

- **API**: FastAPI with OpenAI-compatible `/v1/chat/completions`, native `/v1/runs`, and `/v1/audit`
- **Streaming**: SSE with guardrail capability negotiation (true streaming vs buffered)
- **Identity**: `aeg-…` virtual API keys that resolve to a `Principal`

### Integrations

- **Providers**: LiteLLM-backed (Anthropic and others), OpenAI-compatible generic, and a `fake` provider for zero-credential demos
- **Guardrails**: Presidio PII, GLiNER2 content model, residency, classification, label policy, and budget packs
- **Tools**: Model Context Protocol, where Aegis consumes MCP tools and exposes itself as an MCP server
- **RAG**: thin retrieval Protocols with a LangChain store adapter, Chroma (dev) and pgvector (prod)

### Infrastructure

- **Evidence**: SQLite hash-chained ledger with canonical-JSON `sha256` records
- **Checkpointing**: LangGraph savers (SQLite / Postgres) for durable, resumable approvals
- **Observability**: OpenTelemetry tracing, `/metrics`, per-step timings, and a background model warm-up reported by `/v1/health`
- **Containerization**: Docker Compose, deployed as a Hugging Face Space for the live demo
- **Tooling**: `aegis` CLI, Python SDK, a published OpenAPI spec for clients in any language, contract test kits, and a guard-eval suite in CI
