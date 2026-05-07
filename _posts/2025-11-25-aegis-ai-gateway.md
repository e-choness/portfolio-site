---
layout: post
title: "Building Aegis An Enterprise AI Gateway"
date: 2025-11-25 12:00:00 -0000
category: ai
tags: [ai, python, llm, enterprise, infrastructure, security, compliance, pipeda]
author: "Echo Yin"
image: "assets/images/projects/aegis.jpg"
excerpt: "How to build an enterprise-grade AI gateway: a provider-agnostic LLM routing layer with deterministic compliance, PII protection, and intelligent cost optimization."
---

When I started working on [Aegis](https://github.com/e-choness/aegis), I wasn't trying to build yet another AI platform. I was trying to solve a real problem: how do you bring AI into an enterprise without turning your organization into a compliance nightmare? Companies were already using LLMs for everything from code reviews to customer support, but they were doing it haphazardly—different teams using different providers, no visibility into costs, and worst of all, no guarantee that sensitive data wasn't leaking to third-party APIs.

I wanted to create something that felt like a natural extension of existing infrastructure, not a disruptive new layer. The result is Aegis, a provider-agnostic AI gateway that sits between your applications and LLM providers, handling governance, compliance, and optimization automatically.

## The Core Problem: Fragmented AI Adoption

Before Aegis, AI integration looked like this: every team would pick their favorite LLM provider, hardcode API keys into their applications, and hope for the best. This created several problems that I knew I had to address.

First, there was no centralized control. If Anthropic changed their API, you'd have to update code across dozens of services. Second, costs were spiraling out of control—teams would use expensive Opus models for simple tasks like summarizing commit messages. Third, and most critically, there was no way to prevent sensitive data from leaving your network. A developer might accidentally include a customer's credit card number in a prompt, and it would go straight to a cloud API.

I decided early on that Aegis needed to be the single point of control for all AI traffic in an organization. But I also wanted it to be invisible to developers—something that just worked without requiring major changes to existing workflows.

## Provider Agnosticism: The Foundation

The first design decision I made was to make Aegis completely provider-agnostic. Instead of building around a single LLM provider, I created an abstraction layer that could work with any provider—Anthropic, Azure OpenAI, Ollama, or even future ones.

I implemented this through a `LLMProvider` abstract base class and a `ProviderFactory` that instantiates the right provider based on a string name. This meant that switching providers or adding new ones required only configuration changes, not code changes.

```python
class LLMProvider(ABC):
    @abstractmethod
    async def complete(self, prompt: str, model_id: str, max_tokens: int) -> str:
        pass
    
    @abstractmethod
    async def health_check(self) -> bool:
        pass
```

The tradeoff here was complexity—I had to implement and maintain multiple provider integrations. But the benefit was enormous: organizations could start with whatever provider they had access to, and migrate seamlessly later. It also made testing easier, since I could mock providers or use local Ollama for development.

## Data Classification: The <1ms Decision

One of the most critical components is the data classifier. Every request goes through this before anything else happens. I chose regex-based classification because it had to be fast—sub-millisecond fast—and deterministic. No machine learning models in the hot path.

The classifier looks for patterns that indicate data sensitivity:

- **RESTRICTED**: Canadian SIN numbers, credit cards, account numbers
- **CONFIDENTIAL**: API keys, bearer tokens, internal email addresses
- **INTERNAL**: Default for unclassified data
- **PUBLIC**: Explicitly marked public content

I implemented this as a compiled regex engine that runs in about 0.2ms on average. The tradeoff was that it might miss some edge cases that a more sophisticated classifier would catch, but the speed and predictability were worth it. False negatives are acceptable here because the system defaults to more restrictive routing.

## PIPEDA Compliance: The Hard Invariant

The most important design constraint was Canadian privacy law compliance. RESTRICTED data must never leave the local network. I didn't want this to be a configuration option—I wanted it to be a code invariant that couldn't be accidentally disabled.

I enforced this at four independent layers:

1. **Routing logic**: The `ModelRouter.route()` method immediately returns local Ollama for any RESTRICTED classification
2. **Runtime monitoring**: A Prometheus counter tracks violations and alerts if it ever goes above zero
3. **Database auditing**: A view queries for violations and must always return zero rows
4. **Automated testing**: CI fails if the invariant is broken

The tradeoff was that RESTRICTED data is always processed locally, which might be slower than cloud providers. But compliance wasn't negotiable—better to be slower and compliant than fast and in violation of privacy laws.

## PII Protection: Mask Before Send

Even for data that can go to cloud providers, I wanted to protect personally identifiable information. I integrated Microsoft Presidio for entity recognition, but added custom patterns for Canadian SIN numbers.

The flow is: detect PII → replace with typed placeholders → send to LLM → scan response for hallucinations → restore original entities.

```python
# Example: "John Doe's SIN is 123-456-789" 
# becomes: "PERSON_0's SIN is CA_SIN_0"
```

The challenge was handling hallucinations—LLMs sometimes invent PII in their responses. I added a post-processing step that scans all responses and alerts if new PII appears.

The tradeoff was latency—PII masking adds about 1ms to each request. But the security benefit was worth it, especially since the system can be configured to block requests with detected PII.

## Smart Routing: Cost Optimization Through Intelligence

One of the biggest wins was intelligent model routing. Instead of letting developers choose models, I created a router that selects the right model based on task type, data classification, and budget constraints.

The router uses a simple mapping:

- Simple tasks (commit summaries, routing): Haiku (fast and cheap)
- Medium complexity (code reviews, RAG): Sonnet (balanced)
- Complex reasoning (security audits): Opus (maximum capability)

It also does budget-aware degradation—if a team's budget drops below $1, Opus requests automatically downgrade to Sonnet.

I considered using ML for routing, but decided against it because I wanted deterministic behavior and easy debugging. The current rules-based approach is transparent and testable.

The tradeoff was that the routing might not be as nuanced as an ML model could be, but it was predictable and required no training data.

## Async Job Model: Scalability Through Decoupling

I chose an asynchronous job model for inference requests. Clients submit a request, get a job ID immediately, then poll for completion. This was crucial for handling variable LLM latencies and preventing timeouts.

The async model also enabled better resource utilization—I could queue requests and process them as providers became available.

The downside was added complexity for clients, who now had to implement polling logic. I mitigated this by providing SDKs with built-in polling helpers.

## RAG Pipeline: Classification-Aware Retrieval

For retrieval-augmented generation, I built a pipeline that respects data classifications. Documents are chunked, embedded, and stored in pgvector with classification metadata.

The key insight was routing embeddings based on data sensitivity:

- RESTRICTED/CONFIDENTIAL: Always use local Ollama embeddings (768 dimensions)
- INTERNAL/PUBLIC: Can use cloud embeddings if available

Retrieval queries can only access chunks at their classification level or lower. A PUBLIC query can't see INTERNAL chunks.

I chose pgvector over more specialized vector databases because it integrated well with the existing PostgreSQL/TimescaleDB setup. The tradeoff was that it might not scale as well as dedicated vector databases, but for enterprise use cases, it was sufficient.

## Observability: Metrics First

From the beginning, I designed observability into the system rather than adding it later. Every component emits Prometheus metrics, and I pre-built Grafana dashboards.

Key metrics include request counts by team/provider/model, costs, latencies, and the critical compliance counter.

I also implemented comprehensive audit logging to TimescaleDB, partitioned by time for efficient querying.

The tradeoff was development overhead—adding metrics to every code path. But the debugging benefits were immense, especially in production.

## Circuit Breakers and Health Checks

Provider failures are inevitable, so I implemented circuit breakers that automatically fail over to healthy providers. After three consecutive failures, a provider is marked unhealthy for 60 seconds.

The fallback chain is: Anthropic → Azure OpenAI → Ollama (always available as final fallback).

This made the system resilient but added complexity in testing all failure scenarios.

## Budget Enforcement: Pre-Flight Checks

To prevent cost overruns, I added per-team monthly budget caps with pre-flight cost estimation. Requests that would exceed the budget are rejected before any LLM processing occurs.

The system tracks spend in real-time and provides visibility through Prometheus gauges.

The challenge was accurate cost estimation, since actual costs depend on token counts. I solved this with conservative estimates and post-processing reconciliation.

## Docker-Native Development

I made the entire development environment Docker-based—no host Python or Node installations required. This was crucial for consistency across development machines and CI/CD.

The tradeoff was slower builds and more complex debugging, but the reproducibility benefits outweighed these costs.

## The Scaling Path

One of the design principles was to make scaling infrastructure-only, not requiring code changes. The system can scale from a single Docker Compose setup to Kubernetes replicas by just adding more containers.

For GPU acceleration, I designed the router to support vLLM as a tier 2 provider, which can be enabled by uncommenting configuration.

## Tradeoffs and Lessons Learned

Building Aegis taught me that enterprise software requires balancing technical excellence with operational constraints. The biggest tradeoff was speed vs. security, every protection layer added latency, but compliance requirements made them non-negotiable.

I also learned that deterministic systems are easier to operate than probabilistic ones. While ML could have made some components smarter, the debugging and compliance benefits of rules-based logic were worth the tradeoffs.

The async job model was controversial internally—some wanted synchronous APIs—but it enabled the scalability and reliability that enterprise customers demanded.

## Looking Forward

Aegis has proven that you can build enterprise-grade AI infrastructure without sacrificing developer experience. The provider-agnostic design means it can evolve with the AI landscape, and the strong compliance foundations give organizations confidence to adopt AI more broadly.

The next challenges will be around multi-modal inputs, more sophisticated routing algorithms, and integration with existing enterprise identity systems. But the core architecture—governance through abstraction, compliance through invariants, and optimization through intelligence will remain the same.
