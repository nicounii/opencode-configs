## Research Summary

All 6 free OpenCode Zen models verified from primary sources:

1. **glm-5-free** → GLM-5 (744B/40B MoE, 200K ctx, 77.8% SWE-bench, MCP-Atlas 67.8%)
2. **deepseek-v4-flash-free** → DeepSeek V4 Flash (284B/13B, 200K ctx, 79.0% SWE-bench)
3. **qwen3.6-plus-free** → Qwen 3.6 Plus (~35B/3B, 1M ctx, 78.8% SWE-bench, 61.6% Terminal-Bench)
4. **nemotron-3-super-free** → Nemotron 3 Super (120B/12B, 1M ctx, 60% SWE-bench, 1M RULER 91.75%)
5. **minimax-m2.5-free** → MiniMax M2.5 (230B/10B, 192K ctx, 80.2% SWE-bench — highest!)
6. **big-pickle** → Big Pickle = GLM 4.6 rebadged (200K ctx, free)

Current agent_hive.json uses CLIProxyAPI models. Migration: CLIProxyAPI/ → opencode/

### Proposed Mapping

| Agent | Current (CLIProxyAPI) | Proposed (opencode) | Rationale |
|-------|----------------------|-------------------|-----------|
| hive-master | gemini-3.1-pro-high | glm-5-free | MCP-Atlas 67.8%, τ²-Bench 89.7%, built for agent orchestration |
| architect-planner | claude-sonnet-4-6 | glm-5-free | Best open-model reasoning (HLE 50.4%, AIME 92.7) |
| swarm-orchestrator | gemini-3-flash | glm-5-free | Vending Bench #1 open-source, τ²-Bench 89.7% |
| scout-researcher | gpt-oss-120b-medium | qwen3.6-plus-free | 1M context for whole-repo analysis |
| forager-worker | step-3.5-flash | minimax-m2.5-free | 80.2% SWE-bench — best coder, fastest, cheapest |
| hive-helper | minimax-m2.7 | deepseek-v4-flash-free | Strict tool validation mode, fast |
| hygienic-reviewer | claude-sonnet-4-6 | minimax-m2.5-free | 80.2% SWE-bench = thorough code review |

### Keep fallbacks as opencode equivalents
- Fallbacks should use the next-best opencode model from the constellation
