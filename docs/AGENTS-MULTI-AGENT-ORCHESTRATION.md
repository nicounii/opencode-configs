# Multi-Agent Orchestration: Configuring Hive Agents in AGENTS.md

## Research Summary from NotebookLM

---

## Overview

The **Hive** framework enables multi-agent orchestration through **AGENTS.md** files that serve as **deterministic contracts** — not soft prompts. Agent instructions enforce "Iron Laws" via tools, ensuring consistency across model families (Claude, GPT, Gemini).

---

## Agent Roles & Communication

### The Three Core Agents

| Agent | Tier | Role | Key Constraint |
|-------|------|------|---------------|
| **hive:hive** (Orchestrator) | Opus | Plans, dispatches workers, merges | **Never edits code directly** |
| **hive:forager** (Worker) | Sonnet | Executes single task in isolated worktree | **Cannot spawn sub-workers** |
| **hive:hygienic** (Reviewer) | Opus | Falsification-first review | **No modifications — read-only** |

### Communication Flow

```
User → Orchestrator (hive:hive)
         ↓ Discovery + Plan
       plan.md created
         ↓ User Approval
       Tasks dispatched via Agent tool
         ↓ Workers run in isolated Git worktrees
       hive_worktree_commit called
         ↓ Review (optional)
       hygienic:hygienic
         ↓ Merge after verification
       Batch complete
```

### Key Principles

1. **Context Persists** — `.hive/features/` stores durable memory
2. **Plan → Approve → Execute** — No code before human approval
3. **Human Shapes, Agent Builds** — Human owns what/why, agent owns how
4. **Batched Parallelism** — Independent tasks in parallel, batches sequential
5. **Tests Define Done** — Suite passes = batch done
6. **Iron Laws + Hard Gates** — Constraints enforced by tools, not prompts
7. **Cross-Model Prompts** — Works across model families

---

## Configuring Agents via AGENTS.md

### Structure

```yaml
---
name: agent-name
description: What the agent does
model: opus|sonnet|other
tools: Read, Write, Bash, mcp__hive__*
---

# Agent behavior sections
<rules>
## Iron Laws
1. Never violate constraint X
2. Always call exit tool when done
</rules>

<phase name="phase-name">
### Phase instructions
</phase>
```

### Example: Forager Iron Laws

```markdown
<rules>
## Iron Laws
1. Stay in scope — only do what spec asks
2. Call hive_worktree_commit when done — ONLY exit path
3. If terminal=true, STOP
4. Never spawn sub-agents
5. Never modify files outside your worktree
</rules>
```

---

## Tool Permissions

### Orchestrator Tools (hive:hive)
| Tool | Purpose |
|------|---------|
| `hive_feature_create` | Start new feature |
| `hive_plan_write` | Write plan.md |
| `hive_plan_approve` | Approve after human confirms |
| `hive_tasks_sync` | Generate task DAG |
| `hive_status` | Check current state |
| `hive_merge` | Merge completed task branch |
| `hive_feature_complete` | Mark feature done |

### Worker Tools (hive:forager)
| Tool | Purpose |
|------|---------|
| `hive_worktree_commit` | **Only exit path** |
| `Read/Write/Edit` | File operations |
| `Bash` | Run tests/build |
| `Glob/Grep` | Search codebase |

### Reviewer Tools (hive:hygienic)
| Tool | Purpose |
|------|---------|
| `Read` | Load plan/spec/reports |
| `Bash` | Run verification commands |
| `Glob/Grep` | Find modified files |

---

## Model Assignments

Models are assigned in `agent_hive.json`:

```json
{
  "agents": {
    "hive-master": {
      "model": "CLIProxyAPI/minimax-m2.7",
      "autoLoadSkills": ["brainstorming", "writing-plans"]
    },
    "forager-worker": {
      "model": "CLIProxyAPI/step-3.5-flash"
    },
    "hygienic-reviewer": {
      "model": "CLIProxyAPI/step-3.5-flash"
    }
  }
}
```

### Alternative: oh-my-openagent.json

Maps agents to specific providers/variants:

| Agent | Model | Variant |
|-------|-------|---------|
| sisyphus | `nvidia/moonshotai/kimi-k2.5` | — |
| prometheus | `github-copilot/gpt-5.4` | high |
| hephaestus | `github-copilot/gpt-5.4` | medium |
| atlas | `github-copilot/claude-sonnet-4.6` | — |

---

## MCP Tool Access

Pre-configured MCPs per agent:

| MCP | Purpose | Assigned To |
|-----|---------|-------------|
| `websearch` | Real-time web search (Exa AI) | sisyphus, librarian, prometheus |
| `context7` | Official library docs | librarian |
| `grep_app` | GitHub code search | oracle |

---

## Customization Workflow

### 1. Scaffold Structure
```bash
hive.initNest
```
Creates: `.hive/`, `.github/agents/`, `.github/prompts/`, skills

### 2. Configure Models
Edit `agent_hive.json` for your model tier preferences

### 3. Define Iron Laws
Add rules enforced by tools, not memory

### 4. Set Tool Permissions
Limit each agent's tool access

### 5. Test the Flow
```bash
/hive "feature name"
```

---

## Agent Connections Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        USER                                  │
└─────────────────────┬───────────────────────────────────────┘
                      │ "/hive feature"
                      ↓
┌─────────────────────────────────────────────────────────────┐
│              ORCHESTRATOR (hive:hive)                        │
│  • Discovery + Plan → plan.md                              │
│  • Dispatch workers via Agent tool                          │
│  • Merge results after verification                         │
│  Tools: hive_plan_write, hive_tasks_sync, hive_merge        │
└───────┬─────────────────────────────┬───────────────────────┘
        │ Agent() spawn                │
        ↓                             ↓
┌───────────────────────┐   ┌───────────────────────┐
│   FORAGER (task 1)     │   │   FORAGER (task 2)     │
│  • Isolated worktree   │   │  • Isolated worktree   │
│  • Implement spec      │   │  • Implement spec       │
│  • Verify + commit      │   │  • Verify + commit      │
└───────────────────────┘   └───────────────────────┘
        │                             │
        └─────────────┬───────────────┘
                      ↓
              hive_worktree_commit
                      ↓
┌─────────────────────────────────────────────────────────────┐
│                HYGIENIC (hive:hygienic)                      │
│  • Falsification-first review                               │
│  • Run tests BEFORE verdict                                 │
│  • Report findings                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Sources

- [Agent Hive README](https://github.com/tctinh/agent-hive)
- [oh-my-openagent Configuration](https://github.com/5kahoisaac/opencode-configs)
- [OpenCode Configuration Master Notebook](https://notebooklm.google.com/notebook/d0a58fc6-322b-4f50-ac46-3fd344482903)