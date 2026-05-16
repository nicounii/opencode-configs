# NotebookLM Research Integration - Token Efficiency Analysis

**Date:** 2026-05-10  
**Author:** agent-hive (Orchestrator)  
**Tags:** notebooklm, research, tokens, optimization, exa, comparison

## Executive Summary

Testing confirms that using NotebookLM's research feature instead of direct web search tools like Exa's `web_search_exa` can save **~75% in token costs** for research-heavy workflows. The key insight: NotebookLM offloads source processing to Google's LLM infrastructure while returning only synthesized, concise results to your AI agent.

---

## The Architecture

```
YOUR AI AGENT QUOTA (FREE_TIER)
├── web_search_exa: ALL content → you pay for every token
└── NotebookLM Research:
    ├── research_start → minimal command (~50 tokens)
    ├── research_status → polling (~100 tokens total)
    ├── notebook_query → question (~50 tokens)
    └── Response → AI synthesis (~400 tokens)
    
    SOURCE PROCESSING HAPPENS ON GOOGLE'S INFRASTRUCTURE (free to you)
```

---

## Test Results

### Query: "quantum computing breakthroughs 2025 2026"

| Tool | Tokens to Your Quota | Processing Location |
|------|-------------------|-------------------|
| Exa web_search_exa | ~2,500+ | Your quota |
| NotebookLM Workflow | ~650 | Google (free) |

**Token Savings: ~75%**

---

## Workflow Implementation

### The Token-Efficient Pattern

```python
# 1. Start research (minimal tokens)
notebook_id = notebooklm_research_start(
    mode="fast",  # or "deep" for thorough
    query="your research question",
    title="Research Project Name"
)

# 2. Poll until complete (auto-handled by MCP)
notebooklm_research_status(
    notebook_id=notebook_id,
    poll_interval=15,
    max_wait=120
)

# 3. Importsources (optional, if you want persistent access)
notebooklm_research_import(notebook_id=notebook_id)

# 4. Query the synthesis (small question, detailed answer)
answer = notebooklm_notebook_query(
    notebook_id=notebook_id,
    query="What are the key findings? Summarize in X sentences."
)
```

---

## When to Use Which

### Use NotebookLM When:
- You need synthesized insights, not raw data
- Research topic has multiple sources/sides
- Token budget is constrained
- You want citations with the answer

### Use Exa/web_search_exa When:
- You need raw content for your own processing
- You need granular control over source selection
- You want to process content differently than NotebookLM's synthesis
- Building a custom knowledge base

---

## Cost Comparison Matrix

| Aspect | Exa web_search_exa | NotebookLM Research |
|-------|-------------------|-------------------|
| **Search retrieval** | Your quota | Minimal |
| **Source processing** | Your quota | Google (free) |
| **Synthesis** | You do it | Included |
| **Citations** | Manual | Automatic |
| **Upkeep** | API credits | Cookie refresh (~2-4 weeks) |

---

## Recommendations

1. **Default to NotebookLM** for research queries where synthesis is acceptable
2. **Use Exa** when you need raw content or custom processing
3. **Consider hybrid**: Start with NotebookLM for overview, use Exa for deep dives on specific sources

---

## Known Issue: MCP Not Connecting

**Symptom:** NotebookLM MCP shows `Not connected` even when binary runs

**Cause:** 
- Config path changed (`~/.opencode` → `~/.config/opencode`)
- Profile was invalid (`hephaestus` → `default`)
- MCP server needs restart after config changes

**Fix:**
1. Change `NLM_PROFILE` to valid profile in `opencode.json`
2. Restart OpenCode completely (close + reopen)
3. MCP will spawn with correct profile

---

## Authentication

- **Valid profile:** `default` (matheussantos.nico@gmail.com)
- **Cookie refresh:** ~2-4 weeks (auto-refresh on failure)

---

## Automation Opportunities

### Skills That Can Help

Based on search, these skills are relevant for NotebookLM workflow automation:

| Skill | Purpose | Integration Potential |
|-------|---------|---------------------|
| **delegate-task** | OpenSpace orchestration | Can delegate research tasks to OpenSpace workers |
| **agent-browser** | Browser automation | Could automate NotebookLM web UI interactions |
| **ai-regression-testing** | Testing patterns | Create test suites for research outputs |

### Workflow Patterns

#### 1. Research Pipeline Pattern
```
User asks research question
    ↓
delegate-task (if complex) OR notebooklm_research_start (if simple)
    ↓
notebooklm_research_status (poll)
    ↓
notebooklm_notebook_query (for synthesis)
    ↓
Return answer to user
```

#### 2. Parallel Research Pattern
When you have multiple research questions across domains:
```
notebooklm_research_start(query="domain 1", title="Research 1")
notebooklm_research_start(query="domain 2", title="Research 2")
notebooklm_research_start(query="domain 3", title="Research 3")
# Poll all in parallel
# Query each notebook
# Synthesize findings
```

#### 3. Research + Deep Dive Pattern
```
# 1. Quick overview with NotebookLM
notebooklm_research_start(mode="fast", query="overview topic")

# 2. Follow up with specific deep dive
notebooklm_notebook_query(query="details on [specific aspect]")

# 3. If needed, use Exa for raw content
web_search_exa(query="specific source name")
```

### Rate Limit Management

- **Free tier:** ~50 queries/day
- **Strategy:** Batch research queries before hitting limits
- **Monitoring:** Track notebook creation vs direct queries

### Token Budget Rules

1. **research_start** = ~50 tokens (cheap)
2. **research_status + polling** = ~100 tokens
3. **notebook_query** = Question + Answer (~50 + ~400)
4. **Total per research cycle:** ~650 tokens (vs 2,500+ with Exa)

---

*This document is part of the agent-hive knowledge base for AI agent orchestration patterns.*