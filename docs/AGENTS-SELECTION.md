# Agent Selection Guide

When to use each agent system in OpenCode, covering **Hive-Master**, **oh-my-opencode-slim** agents, and built-in **Plan/Build**.

---

## Quick Decision Tree

```
What are you doing?
│
├─ Multi-agent orchestration with Plan → Approve → Execute?
│   └─ → Hive-Master
│
├─ Need multiple models to debate/comparison?
│   └─ → @council
│
├─ Delegating work across specialists (research + implementation)?
│   └─ → @orchestrator (oh-my-opencode-slim)
│
├─ Need deep architecture/trade-off analysis?
│   └─ → @oracle
│
├─ Fast single-file changes, no planning?
│   └─ → @fixer
│
├─ Web/documentation search?
│   └─ → @librarian
│
├─ UI/UX work with browser automation?
│   └─ → @designer
│
├─ Read-only codebase exploration?
│   └─ → @explorer
│
├─ Quick analysis without file changes?
│   └─ → @plan (built-in)
│
└─ Straightforward implementation, no complex orchestration?
    └─ → @build (built-in)
```

---

## Agent Systems Overview

### 1. Hive-Master (`opencode-hive` plugin)

**Type:** Full multi-agent orchestration system with Plan → Approve → Execute workflow

**Philosophy:** Phase-aware orchestration with checkpoint approval gates. Designed for complex features where the human shapes direction and agents build.

**Mode:** `unified` (default) — all Hive agents consolidated into one session
**Mode:** `dedicated` — separate Architect + Swarm agents in dedicated sessions

**Agents available:**
| Agent | Role | Mode |
|-------|------|------|
| `hive-master` | Unified orchestrator (plans + orchestrates) | `unified` |
| `architect-planner` | Plans features, writes detailed specs | `dedicated` |
| `swarm-orchestrator` | Delegates and coordinates execution | `dedicated` |
| `scout-researcher` | Codebase + external docs research | both |
| `forager-worker` | Executes task implementations | both |
| `hive-helper` | Runtime operational assistant | both |
| `hygienic-reviewer` | Code quality + plan review | both |

**Custom subagents:** Supported via `agent_hive.json` with base inheritance

**Default for nvim:** `hive-master` (after `default_mode = 'hive-master'` in opencode.nvim config)

**Config file:** `~/.config/opencode/agent_hive.json`

**When to choose Hive-Master:**
- Complex features requiring multi-step plans
- When you want explicit human approval checkpoints before execution
- Multi-file architectural changes across a codebase
- When you want structured feature development with `plan.md` + `tasks.json`
- When you need code review gates before merging
- Team environments where a human architects and agents build

**When NOT to choose Hive-Master:**
- Quick, single-task changes (use `@fixer` or `@build`)
- Simple read-only queries (use `@explorer` or `@librarian`)
- You need multiple model perspectives on one decision (use `@council`)

**Invocation:**
```bash
# In OpenCode TUI: select "Hive-Master" tab
# In nvim: default_mode = 'hive-master' (already configured)
# Via CLI:
opencode --agent hive-master
```

---

### 2. oh-my-opencode-slim (alvinunreal fork)

**Type:** Team of specialized agents under an Orchestrator with automatic delegation

**Philosophy:** Route each part of the job to the agent best suited for it, balancing quality, speed, and cost. The Orchestrator decides when to delegate to specialists.

**Agents available:**
| Agent | Role | Delegation |
|-------|------|-----------|
| `@orchestrator` | Master delegator + strategic coordinator | All specialists |
| `@council` | Multi-LLM consensus (runs 3+ models in parallel) | None (manual) |
| `@oracle` | Architecture/trade-off advisor | None (advisory) |
| `@librarian` | External docs + web research | None (leaf) |
| `@explorer` | Codebase reconnaissance | None (leaf) |
| `@designer` | UI/UX implementation | Can spawn explorer |
| `@fixer` | Fast scoped implementation | None (leaf) |
| `@observer` | Visual file analysis (images/PDFs) | None (leaf, disabled by default) |

**When to choose oh-my-opencode-slim Orchestrator:**
- You want automatic delegation to specialists without manual `@agent` calls
- You have a general coding task and want the orchestrator to figure out which specialist to use
- You want tmux multiplexing to watch agents work in parallel panes
- Daily coding workflow where one agent handles the full job with specialist support

**When to choose specific subagents directly:**
- `@oracle` — When you're at a critical architecture decision point and want deep analysis
- `@council` — When you want multiple models to debate and you manually call it (`@council compare these two approaches`)
- `@librarian` — When you need fresh docs or web search results
- `@designer` — When doing UI/UX work with browser automation
- `@fixer` — When you have a clear, bounded change and don't need planning
- `@explorer` — When you need to understand an unfamiliar codebase
- `@observer` — When you need to analyze screenshots, images, or PDFs

**When NOT to choose oh-my-opencode-slim:**
- You want structured planning with approval gates (use Hive-Master)
- You want explicit human checkpoints in the workflow (use Hive-Master)
- Quick single changes (use `@fixer` or `@build`)
- You don't want automatic delegation — you prefer to call agents manually

**Invocation:**
```bash
# In OpenCode TUI: select "Orchestrator" tab
# Via @mention in any session:
@orchestrator implement feature X
@council compare approach A vs B
@oracle is this refactor the right call?
@fixer add tests for this function
```

**Config file:** `~/.config/opencode/oh-my-opencode-slim.json`

---

### 3. Built-in Agents (OpenCode Core)

**Type:** Single-model agents hardcoded in OpenCode binary

**Agents:**
| Agent | Role |
|-------|------|
| `@plan` | Analysis + planning without file changes |
| `@build` | Code generation and implementation (default) |

**When to choose Plan:**
- Quick exploratory analysis
- When you want to understand something without modifying files
- Simple one-shot questions

**When to choose Build:**
- Straightforward implementation you know exactly how to do
- When you don't need architecture advice or multi-specialist coordination
- When Hive-Master or Orchestrator overhead is unnecessary

**When NOT to choose Plan/Build:**
- Complex multi-step features (use Hive-Master for structured planning)
- Delegation to specialists (use Orchestrator for automatic delegation)
- Architecture decisions (use `@oracle`)
- Multiple model perspectives (use `@council`)

**Invocation:**
```bash
# In OpenCode TUI: tabs "Plan" and "Build"
# In opencode.nvim: default_mode = 'build' or 'plan'
# Via mode switch in nvim: <M-m> (switch_mode)
```

---

## Side-by-Side Comparison

| Criteria | Hive-Master | oh-my-opencode-slim | Plan/Build |
|---------|-------------|---------------------|------------|
| **Workflow** | Plan → Approve → Execute | Orchestrate → Delegate → Execute | Direct execute |
| **Human checkpoints** | ✅ Yes (approval gates) | ❌ No | ❌ No |
| **Automatic delegation** | Partial (through Hive tools) | ✅ Yes (Orchestrator decides) | ❌ No |
| **Multi-model consensus** | ❌ No | ✅ Yes (`@council`) | ❌ No |
| **Planning structure** | `plan.md` + `tasks.json` | Implicit (Orchestrator decides) | Implicit |
| **Code review** | `@hygienic-reviewer` before merge | Manual `@oracle` review | Manual |
| **Complexity fit** | Complex features | Medium tasks | Simple tasks |
| **Custom subagents** | Via `agent_hive.json` | Via `oh-my-opencode-slim.json` | ❌ No |
| **Tmux multiplexing** | ❌ No | ✅ Yes | ❌ No |
| **Learning curve** | Higher (structured workflow) | Medium | Low |

---

## Decision Scenarios

### Scenario 1: "I need to add a new feature to my app"

**Best choice:** Hive-Master
- Write a plan, get approval, let agents execute
- Structured workflow prevents scope creep
- Review before execution catches issues early

### Scenario 2: "I have a complex refactor and want to compare two approaches"

**Best choice:** `@council` (oh-my-opencode-slim)
- Run both approaches through different models
- Get a synthesized recommendation with trade-off analysis
- Example: `@council should I use microservices or modular monolith for this?`

### Scenario 3: "Quick bug fix in one file"

**Best choice:** `@fixer` or `@build`
- No planning overhead needed
- Fast, scoped execution
- Example: `@fixer fix the null check in user.ts line 42`

### Scenario 4: "I need to understand an unfamiliar codebase"

**Best choice:** `@explorer` (oh-my-opencode-slim)
- Read-only codebase reconnaissance
- Fast and efficient for discovery tasks
- Example: `@explorer how does the auth system work here?`

### Scenario 5: "I want to refactor but unsure which path is best"

**Best choice:** `@oracle` (oh-my-opencode-slim)
- Strategic advisor for architectural decisions
- Illuminates paths, you choose
- Example: `@oracle should I extract this as a service or keep it in-process?`

### Scenario 6: "I need the latest docs for a library API"

**Best choice:** `@librarian` (oh-my-opencode-slim)
- External knowledge retrieval with web search
- Gets fresh docs, not stale context
- Example: `@librarian what are the best practices for React Query v5?`

### Scenario 7: "I need to implement a UI component with browser testing"

**Best choice:** `@designer` (oh-my-opencode-slim)
- UI/UX focused with `agent-browser` skill
- Handles visual work + browser automation
- Example: `@designer implement the login form with validation`

### Scenario 8: "I just want to ask a question without changing anything"

**Best choice:** `@plan` (built-in)
- Read-only analysis
- No implementation overhead
- Example: `@plan how would I add dark mode to this app?`

### Scenario 9: "I need to analyze a screenshot/PDF someone sent me"

**Best choice:** `@observer` (oh-my-opencode-slim, must enable)
- Visual file analysis without loading raw bytes into context
- Enable in config: `"disabled_agents": []` with vision model

### Scenario 10: "I want my agent to automatically pick the right specialist"

**Best choice:** `@orchestrator` (oh-my-opencode-slim)
- Orchestrator decides which specialist to delegate to
- You give a goal, it handles routing
- Example: `@orchestrator implement user authentication with OAuth`

---

## Mixing Systems

You can use multiple systems — there's no lock-in:

- **Daily coding:** Start with `@orchestrator` for routine work
- **Complex feature:** Switch to `Hive-Master` for structured planning
- **Architecture question:** Call `@oracle` directly from any session
- **Decision stuck:** Call `@council` for multi-model debate
- **Quick fix:** Call `@fixer` directly

**In nvim (opencode.nvim):**
- `<M-m>` cycles through modes: `build`, `plan`, `orchestrator`, `council`, `hive-master`
- Or call agents directly via `@agentName` mention

**In TUI:**
- Tab list shows all registered agents from all plugins
- Select the appropriate tab for your task

---

## Configuration Files

| File | Purpose |
|------|---------|
| `~/.config/opencode/agent_hive.json` | Hive agent models, skills, auto-load |
| `~/.config/opencode/oh-my-opencode-slim.json` | oh-my-opencode-slim models, presets, council config |
| `~/.config/opencode/opencode.json` | `plugin[]` list (which plugins loaded), `agent{}` for disable |
| `~/.config/nvim/lua/plugins/opencode.lua` | opencode.nvim `default_mode` setting |

---

## TL;DR Cheatsheet

| Task | Best Agent |
|------|-----------|
| Complex feature with approval gates | `Hive-Master` |
| Auto-delegating coding workflow | `@orchestrator` |
| Multi-model debate/synthesis | `@council` |
| Architecture/trade-off advice | `@oracle` |
| External docs + web search | `@librarian` |
| UI/UX + browser work | `@designer` |
| Fast bounded implementation | `@fixer` or `@build` |
| Codebase exploration | `@explorer` |
| Visual file analysis | `@observer` |
| Quick analysis, no changes | `@plan` |
| I know exactly what to do | `@build` |
