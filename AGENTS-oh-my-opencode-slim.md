# oh-my-opencode-slim - Agent Pantheon

Lightweight agent orchestration plugin for OpenCode - a slimmed-down fork focused on core agent orchestration with low token consumption.

## Active Preset

**opencode-go** (configured in `~/.config/opencode/oh-my-opencode-slim.json`)

## The Pantheon (7 Agents)

### 01. Orchestrator — The Embodiment of Order

- **Role:** Master delegator and strategic coordinator
- **Model:** `opencode-go/glm-5.1` (variant: max)
- **Skills:** All (`*`), MCPs: all except context7
- **Purpose:** Main entry point. Determines optimal path to any goal, balances speed/quality/cost, delegates to specialists.
- **Usage:** `@orchestrator <task>` or just describe your goal and it auto-delegates.

### 02. Oracle — The Guardian of Paths

- **Role:** Strategic advisor and debugger of last resort
- **Model:** `opencode-go/deepseek-v4-pro` (variant: max)
- **Skills:** simplify
- **Purpose:** Architecture decisions, hard debugging, trade-offs, code review.
- **Usage:** `@oracle review this architecture` or `@oracle debug this issue`

### 03. Council — The Chorus of Minds

- **Role:** Multi-LLM consensus and synthesis
- **Model:** `opencode-go/deepseek-v4-pro` (variant: high)
- **Purpose:** Sends questions to multiple models in parallel, synthesizes into single verdict.
- **Usage:** `@council compare these two architectures`
- **Note:** Manual invocation only (not auto-delegated to control costs)

### 04. Explorer — The Eternal Wanderer

- **Role:** Codebase reconnaissance
- **Model:** `opencode-go/minimax-m2.7`
- **Purpose:** Scouting, pattern discovery, file searches across codebase.
- **Usage:** `@explorer find all files related to auth` or auto-invoked by Orchestrator

### 05. Librarian — The Weaver of Knowledge

- **Role:** External knowledge retrieval
- **Model:** `opencode-go/minimax-m2.7`
- **MCPs:** websearch, context7, grep_app
- **Purpose:** Documentation lookup, web research, code examples from GitHub.
- **Usage:** `@librarian how does JWT work in Express` or auto-invoked

### 06. Designer — The Guardian of Aesthetics

- **Role:** UI/UX implementation and visual excellence
- **Model:** `opencode-go/kimi-k2.6` (variant: medium)
- **Skills:** agent-browser
- **Purpose:** Frontend implementation, UI polish, visual quality.
- **Usage:** `@designer build this landing page` or auto-invoked for UI tasks

### 07. Fixer — The Last Builder

- **Role:** Fast implementation specialist
- **Model:** `opencode-go/deepseek-v4-flash` (variant: high)
- **Purpose:** Scoped implementation, tests, straightforward code changes.
- **Usage:** `@fixer add tests for UserService` or auto-invoked by Orchestrator

### 08. Observer (Optional) — The Silent Witness

- **Role:** Read-only visual analysis
- **Model:** `opencode-go/kimi-k2.6` (not configured by default)
- **Purpose:** Interprets images, screenshots, PDFs when main model lacks multimodal support.
- **Enable:** Set `"disabled_agents": []` and add observer model in config.

## Key Features

- **Auto-Delegation:** Orchestrator automatically routes tasks to appropriate specialists
- **Manual Invocation:** Call any agent directly via `@agentName <task>`
- **Preset Switching:** Switch between OpenAI and OpenCode Go presets at runtime
- **Skills:** simplify, agent-browser, codemap
- **MCPs:** websearch, context7, grep_app (available to Librarian)

## Configuration

Config file: `~/.config/opencode/oh-my-opencode-slim.json`

- `$schema`: https://unpkg.com/oh-my-opencode-slim@latest/oh-my-opencode-slim.schema.json
- `preset`: Currently set to "opencode-go" (uses OpenCode Go models)
- `presets.opencode-go`: Model mappings for all agents

## Verification

After starting OpenCode, verify agents respond:

```
ping all agents
```

## Docs

- Full guide: https://github.com/alvinunreal/oh-my-opencode-slim
- Config reference: https://github.com/alvinunreal/oh-my-opencode-slim/blob/master/docs/configuration.md
- Author's preset: https://github.com/alvinunreal/oh-my-opencode-slim/blob/master/docs/authors-preset.md