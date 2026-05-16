# Free AI Models Research Documentation

> **Research Date:** May 2026  
> **Source:** free-llm.com, OpenCode Docs, NVIDIA NIM, OpenRouter, CLIProxyAPI, Antigravity

---

## Executive Summary

This document provides a comprehensive analysis of free AI models available through **OpenCode**, **NVIDIA**, **OpenRouter**, and **Antigravity** providers. The primary goal is to help users make informed decisions about free AI usage, particularly comparing **CLIProxyAPI** vs **Antigravity** for accessing free models, with special focus on the **nv-embed-v1** embedding model from NVIDIA.

### Key Findings

| Provider | Free Models | Best For | Limitations |
|----------|-------------|----------|-------------|
| **OpenCode Zen** | 3 curated models | Getting started, no API key needed | Limited model selection |
| **GitHub Copilot** | 11 models | Existing Copilot subscribers | Requires Copilot subscription |
| **OpenRouter** | 20+ models | Model diversity, unified API | Rate limits (20 req/min, 200/day) |
| **NVIDIA NIM** | 47+ models | Embeddings, code, reasoning | Non-commercial only |
| **Antigravity** | 5+ models | Claude + Gemini via OAuth | ToS risk, account ban possible |
| **CLIProxyAPI** | Multiple backends | Unified proxy for multiple services | No embeddings support |

---

## 1. OpenCode Provider

### 1.1 OpenCode Zen (Built-in Free Models)

OpenCode provides **Zen** - a curated list of models tested and verified by the OpenCode team with **no API key required**.

#### Available Models

| Model ID | Name | Context | Max Output | Best Use Case |
|----------|------|---------|------------|---------------|
| `opencode/gpt-5.1-codex` | Codex (Zen Default) | 200K | 100K | General coding, complex tasks |
| `opencode/gpt-5-codex-fast` | Codex Fast | 200K | 100K | Fast responses, simple tasks |
| `opencode/gpt-5-codex-reasoning` | Codex Reasoning | 200K | 100K | Advanced reasoning |

#### Authentication

```bash
opencode auth login --provider zen
```

#### Configuration

```json
{
  "model": "opencode/gpt-5.1-codex"
}
```

### 1.2 GitHub Copilot (Free with Subscription)

OpenCode automatically detects GitHub Copilot credentials and provides **11 free models** for Copilot subscribers.

#### Available Models

| Model ID | Name | Context | Max Output | Reasoning |
|----------|------|---------|------------|-----------|
| `copilot.gpt-4o` | GPT-4o | 128K | 16K | ✗ |
| `copilot.gpt-4o-mini` | GPT-4o Mini | 128K | 4K | ✗ |
| `copilot.gpt-4.1` | GPT-4.1 | 128K | 16K | ✓ |
| `copilot.claude-3.5-sonnet` | Claude 3.5 Sonnet | 90K | 8K | ✗ |
| `copilot.claude-3.7-sonnet` | Claude 3.7 Sonnet | 200K | 16K | ✗ |
| `copilot.claude-sonnet-4` | Claude Sonnet 4 | 128K | 16K | ✗ |
| `copilot.o1` | OpenAI o1 | 200K | 100K | ✓ |
| `copilot.o3-mini` | OpenAI o3-mini | 200K | 100K | ✓ |
| `copilot.o4-mini` | OpenAI o4-mini | 128K | 16K | ✓ |
| `copilot.gemini-2.0-flash` | Gemini 2.0 Flash | 1M | 8K | ✗ |
| `copilot.gemini-2.5-pro` | Gemini 2.5 Pro | 128K | 64K | ✗ |

#### Auto-Detection

OpenCode automatically detects Copilot credentials from:
- GitHub CLI configuration (`~/.config/github-copilot/hosts.json`)
- Environment variable: `GITHUB_TOKEN`

#### Configuration

```json
{
  "agents": {
    "coder": { "model": "copilot.gpt-4.1" },
    "task": { "model": "copilot.gpt-4o-mini" },
    "title": { "model": "copilot.gpt-4o-mini" }
  }
}
```

**Cost:** Included in GitHub Copilot subscription

---

## 2. NVIDIA Provider

### 2.1 NVIDIA NIM (Free Endpoint)

NVIDIA provides **47+ models** with free API endpoints through NVIDIA NIM (Neural Inference Microservices).

#### Free Models by Category

##### Text Embedding Models

| Model | Context | Dimensions | Use Case | License |
|-------|---------|------------|----------|---------|
| **nv-embed-v1** | 32K | 4096 | General retrieval, reranking, classification | Non-Commercial |
| nv-embedqa-e5-v5 | 512 | 1024 | QA retrieval | Free |
| llama-3.2-nemoretriever-300m-embed-v1 | 8K | 1024 | Lightweight retrieval | Free |
| nv-embedcode-7b-v1 | 4K | 4096 | Code retrieval | Free |

##### Code Models

| Model | Context | Parameters | Use Case |
|-------|---------|------------|----------|
| nemotron-coder-8b | 8K | 8B | Code generation |
| deepseek-ai/DeepSeek-Coder-V2 | 16K | 16B | Code completion |

##### Reasoning Models

| Model | Context | Parameters | Use Case |
|-------|---------|------------|----------|
| nemotron-3-super-120b-a12b | 128K | 120B | Advanced reasoning |
| nemotron-3-nano-8b | 128K | 8B | Fast reasoning |

### 2.2 nv-embed-v1 - Detailed Analysis

The **nv-embed-v1** is NVIDIA's flagship embedding model with **state-of-the-art performance**.

#### Model Specifications

| Property | Value |
|----------|-------|
| Architecture | Mistral-7B-v0.1 with Latent-Attention |
| Parameters | 7.1B |
| Embedding Dimension | 4096 |
| Max Input Tokens | 32,768 |
| MTEB Score | 69.32 (record-high) |
| Retrieval Score | 59.36 on 15 tasks |

#### Capabilities

- **Retrieval:** Best-in-class on 15 retrieval tasks
- **Ranking:** Excellent reranking performance
- **Classification:** Strong classification capabilities
- **Clustering:** Good clustering performance
- **Semantic Similarity:** High-quality semantic text similarity

#### API Usage

```bash
curl -X "POST" \
  "https://integrate.api.nvidia.com/v1/embeddings" \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
    "input": ["What is the population of Pittsburgh?"],
    "model": "nvidia/nv-embed-v1",
    "input_type": "query",
    "modality": "text"
  }'
```

#### Important Notes

- **License:** Non-Commercial Use Only
- **API Key Required:** Get from [build.nvidia.com](https://build.nvidia.com/nvidia/nv-embed-v1)
- **Input Type:** Requires `input_type` parameter (`query` or `passage`)
- **Embedding Types:** Supports float, int8, uint8, binary, ubinary

### 2.3 NVIDIA Integration with OpenCode

To use NVIDIA models in OpenCode, add a custom provider:

```json
{
  "provider": {
    "nvidia": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "NVIDIA NIM",
      "options": {
        "baseURL": "https://integrate.api.nvidia.com/v1",
        "apiKey": "{env:NVIDIA_API_KEY}"
      },
      "models": {
        "nv-embed-v1": {
          "name": "NV-Embed v1",
          "limit": { "context": 32768, "output": 4096 }
        }
      }
    }
  }
}
```

---

## 3. OpenRouter Provider

### 3.1 Free Models on OpenRouter

OpenRouter offers **20+ free models** with no credit card required. Free models are identified by the `:free` suffix.

#### Top Free Models

| Model | Context | Capabilities | Price |
|-------|---------|--------------|-------|
| **openrouter/free** | 200K | Auto-selects best free model | $0 |
| deepseek/deepseek-r1 | 163K | Advanced reasoning (CoT) | $0 |
| meta-llama/llama-3.2-3b-instruct | 128K | General chat | $0 |
| google/gemma-3-27b-it | 131K | Instruction following | $0 |
| google/gemma-3-12b-it | 131K | Balanced quality/speed | $0 |
| google/gemma-3-4b-it | 131K | Fast responses | $0 |
| qwen/qwen2.5-72b-instruct | 131K | Multilingual | $0 |
| nvidia/nemotron-3-super-120b-a12b | 262K | Advanced reasoning | $0 |
| nvidia/nemotron-nano-9b-v2 | 128K | Fast reasoning | $0 |

#### Free Models Router

The **openrouter/free** router automatically selects the best available free model based on your request requirements:

```json
{
  "model": "openrouter/free"
}
```

Features:
- Auto-filters for required capabilities (images, tool calling, etc.)
- Random selection from available free models
- Smart routing based on request features

### 3.2 Rate Limits

| Status | Rate Limit |
|--------|------------|
| New users (no credits) | 20 req/min, 200 req/day |
| With $10+ credits | 1,000 req/day |

### 3.3 OpenRouter Integration with OpenCode

```json
{
  "provider": {
    "openrouter": {
      "options": {
        "apiKey": "{env:OPENROUTER_API_KEY}"
      }
    }
  },
  "model": "deepseek/deepseek-r1:free"
}
```

---

## 4. Antigravity Provider

### 4.1 What is Antigravity?

**Antigravity** is Google's AI IDE that provides access to Claude and Gemini models via OAuth authentication. The **opencode-antigravity-auth** plugin enables OpenCode to authenticate against Antigravity.

### 4.2 Available Models

#### Antigravity Quota (Default)

| Model | Variants | Context | Output | Best Use |
|-------|----------|---------|--------|----------|
| antigravity-gemini-3-pro | low, high | 1M | 64K | General tasks |
| antigravity-gemini-3.1-pro | low, high | 1M | 64K | Advanced tasks |
| antigravity-gemini-3-flash | minimal, low, medium, high | 1M | 64K | Fast tasks |
| antigravity-claude-sonnet-4-6 | - | 200K | 64K | Balanced coding |
| antigravity-claude-opus-4-6-thinking | low, max | 200K | 64K | Complex reasoning |

#### Gemini CLI Quota (cli_first: true)

| Model | Context | Output |
|-------|---------|--------|
| gemini-2.5-flash | 1M | 64K |
| gemini-2.5-pro | 1M | 64K |
| gemini-3-flash-preview | 1M | 64K |
| gemini-3-pro-preview | 1M | 64K |
| gemini-3.1-pro-preview | 1M | 64K |

### 4.3 Key Features

- **Multi-account support** - Add multiple Google accounts for higher combined quota
- **Dual quota system** - Access both Antigravity and Gemini CLI quotas
- **Thinking models** - Extended thinking for Claude and Gemini with configurable budgets
- **Google Search grounding** - Enable web search for Gemini models
- **Auto-recovery** - Handles session errors automatically

### 4.4 Installation

```json
{
  "plugin": ["opencode-antigravity-auth@latest"]
}
```

Then run:
```bash
opencode auth login
```

### 4.5 ⚠️ Important Warnings

> **Terms of Service Risk:** Using this plugin (and any proxy for Antigravity) violates Google's Terms of Service. Users have reported accounts being **banned** or **shadow-banned**.

> **By using this plugin, you acknowledge:**
> - This is an unofficial tool not endorsed by Google
> - Your account may be suspended or permanently banned
> - You assume all risks associated with using this plugin

---

## 5. CLIProxyAPI vs Antigravity Comparison

### 5.1 Overview

| Feature | CLIProxyAPI | Antigravity |
|---------|-------------|-------------|
| **Type** | Self-hosted proxy | OpenCode plugin |
| **Models** | Gemini CLI, Codex, Claude, Antigravity | Antigravity, Gemini CLI |
| **Authentication** | OAuth (multiple providers) | OAuth (Google) |
| **Multi-account** | Yes (via config) | Yes (built-in) |
| **Embeddings** | ❌ Not supported | ❌ Not supported |
| **Setup Complexity** | Higher (self-hosted) | Lower (plugin) |

### 5.2 CLIProxyAPI Capabilities

**Supported Backends:**
- Gemini CLI
- Antigravity
- ChatGPT Codex
- Claude Code
- OpenAI-compatible (OpenRouter, etc.)

**API Endpoints:**
- `/v1/chat/completions` ✅
- `/v1/completions` ✅
- `/v1/messages` ✅
- `/v1beta/models` ✅
- `/v1/embeddings` ❌ **Not supported**

### 5.3 nv-embed-v1 Compatibility

#### CLIProxyAPI
- **Status:** ❌ **Does NOT support nv-embed-v1**
- **Reason:** CLIProxyAPI focuses on LLM chat/completion endpoints, not embeddings
- **Issue:** The `/v1/embeddings` endpoint returns 404
- **Alternative:** Use NVIDIA NIM directly with API key

#### Antigravity
- **Status:** ❌ **Does NOT support nv-embed-v1**
- **Reason:** Antigravity provides Claude and Gemini models only, not embedding models
- **Alternative:** Use NVIDIA NIM directly with API key

### 5.4 Recommendation for nv-embed-v1

Since **neither CLIProxyAPI nor Antigravity supports nv-embed-v1**, you have two options:

#### Option A: Keep CLIProxyAPI + Direct NVIDIA Connection

```json
{
  "provider": {
    "nvidia": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "NVIDIA NIM",
      "options": {
        "baseURL": "https://integrate.api.nvidia.com/v1",
        "apiKey": "{env:NVIDIA_API_KEY}"
      },
      "models": {
        "nv-embed-v1": {
          "name": "NV-Embed v1",
          "limit": { "context": 32768, "output": 4096 }
        }
      }
    }
  }
}
```

**Pros:**
- Keep CLIProxyAPI for LLM access
- Direct NVIDIA connection for embeddings
- No ToS risk

**Cons:**
- Two separate configurations
- NVIDIA API key required

#### Option B: Migrate to LiteLLM

LiteLLM provides unified access to multiple providers including:
- OpenAI, Anthropic, Google
- Azure, AWS Bedrock
- NVIDIA NIM (including nv-embed-v1)
- 100+ other providers

```bash
pip install litellm
```

```python
from litellm import embedding

response = embedding(
    model="nvidia/nv-embed-v1",
    input=["your text here"]
)
```

**Pros:**
- Unified API for all providers
- Supports nv-embed-v1
- Better abstraction layer

**Cons:**
- Additional dependency
- Learning curve

---

## 6. Model Selection by Use Case

### 6.1 Coding Tasks

| Priority | Model | Provider | Context | Cost |
|----------|-------|----------|---------|------|
| 1st | Claude Opus 4.6 Thinking | Antigravity | 200K | Free (ToS risk) |
| 2nd | Claude Sonnet 4.6 | Antigravity | 200K | Free (ToS risk) |
| 3rd | GPT-4.1 | GitHub Copilot | 128K | Subscription |
| 4th | DeepSeek R1 | OpenRouter | 163K | Free |
| 5th | Llama 3.3 70B | Groq | 128K | Free |

### 6.2 Orchestrating/Planning Tasks

| Priority | Model | Provider | Context | Cost |
|----------|-------|----------|---------|------|
| 1st | Gemini 2.5 Pro | Antigravity | 1M | Free (ToS risk) |
| 2nd | GPT-4.1 | GitHub Copilot | 128K | Subscription |
| 3rd | Gemini 2.0 Flash | OpenCode Zen | 1M | Free |
| 4th | Nemotron 3 Super | OpenRouter | 262K | Free |

### 6.3 Search/Research Tasks

| Priority | Model | Provider | Context | Cost |
|----------|-------|----------|---------|------|
| 1st | Gemini 2.0 Flash | OpenCode Zen | 1M | Free |
| 2nd | Gemma 3 27B | OpenRouter | 131K | Free |
| 3rd | Qwen 2.5 72B | Hyperbolic | 128K | Free |
| 4th | DeepSeek V3 | OpenRouter | 64K | Free |

### 6.4 Documentation Tasks

| Priority | Model | Provider | Context | Cost |
|----------|-------|----------|---------|------|
| 1st | Gemini 3 Flash | Antigravity | 1M | Free (ToS risk) |
| 2nd | Claude Haiku 4 | GitHub Copilot | 200K | Subscription |
| 3rd | GPT-4o Mini | GitHub Copilot | 128K | Subscription |
| 4th | Gemma 3 4B | OpenRouter | 131K | Free |

### 6.5 Embedding Tasks

| Priority | Model | Provider | Dimensions | Cost |
|----------|-------|----------|------------|------|
| 1st | **nv-embed-v1** | NVIDIA NIM | 4096 | Free* |
| 2nd | nomic-embed-text | Ollama | 768 | Free |
| 3rd | bge-m3 | HuggingFace | 1024 | Free |

*Non-commercial use only

---

## 7. Rate Limits Summary

| Provider | Free Tier Limits |
|----------|-----------------|
| OpenCode Zen | Unlimited (curated) |
| GitHub Copilot | Included in subscription |
| OpenRouter | 20 req/min, 200/day (new users) |
| NVIDIA NIM | Rate limited by NVIDIA |
| Antigravity | Google account quotas |
| Groq | 200 requests/min, 6K/day |

---

## 8. Recommendations

### For Maximum Free Usage

1. **Start with OpenCode Zen** - No setup required
2. **Add GitHub Copilot** - If you have a subscription
3. **Use OpenRouter free models** - For model diversity
4. **Consider Antigravity** - If you accept ToS risks

### For nv-embed-v1 Access

**Keep CLIProxyAPI + add direct NVIDIA connection:**

```json
{
  "provider": {
    "nvidia": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "NVIDIA NIM",
      "options": {
        "baseURL": "https://integrate.api.nvidia.com/v1",
        "apiKey": "{env:NVIDIA_API_KEY}"
      },
      "models": {
        "nv-embed-v1": {
          "name": "NV-Embed v1",
          "limit": { "context": 32768, "output": 4096 }
        }
      }
    }
  }
}
```

**Do NOT migrate to LiteLLM** unless you need:
- More than 10+ providers
- Unified cost tracking
- Advanced retry logic

The direct NVIDIA connection is simpler and meets your needs.

---

## 9. Appendix: Source References

- [free-llm.com](https://free-llm.com/) - Free LLM directory (45+ providers, 200+ models)
- [OpenCode Documentation](https://dev.opencode.ai/docs/) - OpenCode config and models
- [NVIDIA NIM](https://build.nvidia.com/) - NVIDIA free endpoints
- [OpenRouter](https://openrouter.ai/collections/free-models) - Free models list
- [CLIProxyAPI](https://github.com/router-for-me/CLIProxyAPI) - Proxy documentation
- [Antigravity Auth](https://github.com/NoeFabris/opencode-antigravity-auth) - Plugin documentation

---

*Document generated from community research. Rate limits and model availability may change. Always verify with official sources.*