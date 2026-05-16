# OpenSpace + OpenCode Integration Research

**Date:** 2026-05-10  
**Author:** agent-hive (Orchestrator)  
**Tags:** openspace, opencode, hkuds, integration, self-evolution, skills

---

## Executive Summary

This document covers the complete integration of **OpenSpace** (HKUDS self-evolving skill engine) with **OpenCode**, including configuration verification, skill management, and self-improvement mechanisms.

---

## What is OpenSpace?

OpenSpace is a **self-evolving skill engine** developed by HKUDS (Hong Kong University Data Science Lab) that:

- ✅ **Auto-FIX** — Repairs broken skills automatically
- ✅ **Auto-IMPROVE** — Captures winning workflows as new skills
- ✅ **Auto-LEARN** — Evolves from every task execution
- ✅ **Quality Monitoring** — Tracks performance metrics

### Three Evolution Modes

| Mode | Description |
|------|-------------|
| **FIX** | Repair broken/outdated instructions in-place |
| **DERIVED** | Create enhanced versions from parent skills |
| **CAPTURED** | Extract novel patterns from successful executions |

---

## Integration Setup

### OpenCode MCP Configuration

```json
{
  "openspace": {
    "command": ["/home/mathew/.local/bin/openspace-mcp"],
    "type": "local",
    "enabled": true,
    "toolTimeout": 1200,
    "environment": {
      "OPENSPACE_HOST_SKILL_DIRS": "/home/mathew/.config/opencode/skills",
      "OPENSPACE_WORKSPACE": "/home/mathew/.config/OpenSpace",
      "OPENSPACE_MODEL": "cli-proxy/minimax-m2.7",
      "OPENSPACE_LLM_API_KEY": "97cbd90655c240e683670322b40e55b6...",
      "OPENSPACE_LLM_API_BASE": "http://127.0.0.1:8317/v1",
      "OPENSPACE_API_KEY": "sk-LzZsSyr2_8_auM6jHMHNKxMCOHAo0hC67Q7_kwh1diM"
    }
  }
}
```

### Required Skills (Host Skills)

Two skills must be installed:

| Skill | Purpose | Location |
|-------|---------|----------|
| **delegate-task** | Execute tasks via OpenSpace | `/home/mathew/.config/opencode/skills/delegate-task` |
| **skill-discovery** | Search local + cloud skills | `/home/mathew/.config/opencode/skills/skill-discovery` |

---

## Folder Verification

### `/home/mathew/.config/OpenSpace` ✅

| Path | Contents | Status |
|------|----------|--------|
| `.env` | LLM + API keys | ✅ Configured |
| `.openspace/` | SQLite DB (8MB) | ✅ Active |
| `openspace/skills/` | 23 evolved skills | ✅ Present |
| `logs/` | Execution logs | ✅ Present |

**Environment configured:**
- `OPENSPACE_MODEL=cli-proxy/minimax-m2.7`
- `OPENSPACE_LLM_API_BASE=http://127.0.0.1:8317/v1`
- `OPENSPACE_API_KEY` (cloud community)

### `/home/mathew/.config/opencode` ✅

| Path | Contents | Status |
|------|----------|--------|
| `opencode.json` | MCP config | ✅ Has openspace |
| `skills/delegate-task/` | Host skill | ✅ Present |
| `skills/skill-discovery/` | Host skill | ✅ Present |
| `docs/` | Documentation | ✅ Created |

---

## Self-Improvement Mechanism

### How It Works

1. **Task Execution** → OpenSpace executes via `execute_task`
2. **Post-Execution Analysis** → Analyzes recordings
3. **Evolution Trigger** → FIX/DERIVED/CAPTURED suggested
4. **Skill Update** → New version stored in SQLite + disk

### Evolution Triggers

| Trigger | When |
|---------|------|
| **Post-Execution** | After every task completes |
| **Tool Degradation** | Success rate drops |
| **Metric Monitor** | Periodic health check |

### Verifying Self-Evolution

```bash
# Check for evolved skills
ls /home/mathew/.config/OpenSpace/openspace/skills/

# Check SQLite database
sqlite3 /home/mathew/.config/OpenSpace/.openspace/openspace.db "SELECT name FROM skills LIMIT 10;"
```

---

## Usage in OpenCode

### Delegate a Task

```
Use the delegate-task skill to execute complex tasks.
OpenSpace will:
1. Search for relevant skills
2. Execute with grounding agent
3. Auto-evolve if needed
4. Report evolved_skills in response
```

### Example

```python
openspace_execute_task(
    task="Build a Python script that analyzes CSV data",
    workspace_dir="/home/mathew/.config/OpenSpace"
)
```

---

## Token Efficiency

According to benchmarks:
- **4.2x cost improvement** 
- **46% token reduction**
- Skills evolve → less reasoning on repeat tasks

---

## Cloud Community (Optional)

Register at **https://open-space.cloud** for:
- Cloud skill search
- Skill upload/share
- Cross-agent pattern sharing

---

## Verification Commands

```bash
# Test OpenSpace is responding
openspace_execute_task(task="Hello, check if working")

# List available skills
openspace_search_skills(query="python", source="local")

# Check skill database
ls /home/mathew/.config/OpenSpace/.openspace/openspace.db
```

---

## Issues & Troubleshooting

| Issue | Solution |
|-------|----------|
| MCP not connecting | Restart OpenCode |
| No skills evolving | Check `OPENSPACE_WORKSPACE` path |
| API errors | Verify `OPENSPACE_API_KEY` in .env |

---

## Additional Resources

- GitHub: https://github.com/HKUDS/openSpace
- Cloud: https://open-space.cloud
- Config Guide: `openspace/config/README.md`

---

*Document created via deep research using long-research skill + web_search_exa*
*Updated: 2026-05-10*