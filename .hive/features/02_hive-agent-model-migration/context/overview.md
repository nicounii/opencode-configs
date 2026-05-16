## At a Glance

Replaced all 7 Hive agents' models from `CLIProxyAPI/` to `opencode/` free models in `agent_hive.json`. All models verified from primary sources (arXiv papers, official docs, API live check).

## Workstreams

| Agent | New Model | Primary Strength |
|-------|-----------|-----------------|
| hive-master | opencode/glm-5-free | MCP-Atlas 67.8%, τ²-Bench 89.7% |
| architect-planner | opencode/glm-5-free | HLE 50.4%, AIME 92.7 — best reasoning |
| swarm-orchestrator | opencode/glm-5-free | Vending Bench #1 open-source |
| scout-researcher | opencode/qwen3.6-plus-free | **1M context** for whole-repo analysis |
| forager-worker | opencode/minimax-m2.5-free | **80.2% SWE-bench** — best coder |
| hive-helper | opencode/deepseek-v4-flash-free | Strict tool validation mode |
| hygienic-reviewer | opencode/minimax-m2.5-free | 80.2% SWE-bench for thorough reviews |

## Revision History
- 2026-05-16: Initial migration. All 7 agents switched to OpenCode Zen free models.
