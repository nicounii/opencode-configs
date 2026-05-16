# Hive Agent Model Migration to OpenCode Zen Free Models

## Discovery

### Original Request
- "Research free OpenCode Zen models for Hive agent roles, and recommend agent→model mapping"

### Interview Summary
- Goal: Replace CLIProxyAPI-backed models with OpenCode Zen free models for all 7 Hive agents
- All 6 models (`glm-5-free`, `deepseek-v4-flash-free`, `qwen3.6-plus-free`, `nemotron-3-super-free`, `minimax-m2.5-free`, `big-pickle`) are verified and available
- `opencode/` provider is already enabled with just a blacklist — no additional config needed
- OPENCODE_API_KEY presumed available via environment
- Big Pickle = GLM 4.6 rebadged — not unique, skip for agent roles

### Research Findings
- `agent_hive.json` at `/home/mathew/.config/opencode/agent_hive.json` — single file, 103 lines, 7 agents
- All agents currently use `CLIProxyAPI/<model>` format
- Strongest model for **coding implementation**: `minimax-m2.5-free` (80.2% SWE-bench)
- Strongest model for **orchestration**: `glm-5-free` (MCP-Atlas 67.8%, τ²-Bench 89.7%)
- Strongest for **research/scouting**: `qwen3.6-plus-free` (1M context, 78.8% SWE-bench)
- Strongest for **tool validation**: `deepseek-v4-flash-free` (strict mode, 79.0% SWE-bench)
- `nemotron-3-super-free` has good long-context retrieval (1M RULER 91.75%) but weaker coding (60%)

---

## Non-Goals
- NOT changing opencode.json provider config (already enabled)
- NOT adding new agents or removing agents
- NOT modifying skills, disableSkills, or disableMcps arrays
- NOT changing the $schema or agentMode fields
- NOT migrating big-pickle into primary roles (it's GLM 4.6 rebadged, not unique)
- NOT testing OPENCODE_API_KEY setup (assumed working)

---

## Design Summary

Update `/home/mathew/.config/opencode/agent_hive.json` to replace 7 agents' model and fallback entries from `CLIProxyAPI/<model>` to `opencode/<free-model>`. Each agent gets the model best suited to its role based on verified benchmark data. This is a single-file, multi-edit configuration change — all edits are in one file.

---

## Tasks

### 1. Update hive-master → opencode/glm-5-free

**Depends on**: none

**Files:**
- Modify: `/home/mathew/.config/opencode/agent_hive.json:6-21`

**What to do**:
- Change primary model from `CLIProxyAPI/gemini-3.1-pro-high` to `opencode/glm-5-free`
- Update fallback_models to use opencode free models:
  - Primary: `opencode/glm-5-free`
  - Fallback 1: `opencode/deepseek-v4-flash-free`
  - Fallback 2: `opencode/minimax-m2.5-free`
  - Fallback 3: `opencode/qwen3.6-plus-free`

**Must NOT do**:
- Change autoLoadSkills (keep as-is)
- Change variant (keep as-is)

**References**:
- Research: GLM-5 has MCP-Atlas 67.8% — best for tool orchestration
- GLM-5 has τ²-Bench 89.7% — best for long-horizon agent tasks

**Verify**:
- [ ] `python3 -m json.tool /home/mathew/.config/opencode/agent_hive.json > /dev/null` → exit 0

---

### 2. Update architect-planner → opencode/glm-5-free

**Depends on**: none

**Files:**
- Modify: `/home/mathew/.config/opencode/agent_hive.json:22-35`

**What to do**:
- Change primary model from `CLIProxyAPI/claude-sonnet-4-6` to `opencode/glm-5-free`
- Update fallback_models:
  - Primary: `opencode/glm-5-free`
  - Fallback 1: `opencode/deepseek-v4-flash-free`
  - Fallback 2: `opencode/minimax-m2.5-free`
  - Fallback 3: `opencode/nemotron-3-super-free`

**Must NOT do**:
- Change autoLoadSkills or variant

**Reasoning**: GLM-5 best open-model intelligence (AA Index 50, HLE 50.4%, AIME 92.7)

**Verify**:
- [ ] `python3 -m json.tool /home/mathew/.config/opencode/agent_hive.json > /dev/null` → exit 0

---

### 3. Update swarm-orchestrator → opencode/glm-5-free

**Depends on**: none

**Files:**
- Modify: `/home/mathew/.config/opencode/agent_hive.json:36-50`

**What to do**:
- Change primary model from `CLIProxyAPI/gemini-3-flash` to `opencode/glm-5-free`
- Update fallback_models:
  - Primary: `opencode/glm-5-free`
  - Fallback 1: `opencode/minimax-m2.5-free`
  - Fallback 2: `opencode/deepseek-v4-flash-free`
  - Fallback 3: `opencode/nemotron-3-super-free`

**Must NOT do**:
- Change autoLoadSkills or variant

**Verify**:
- [ ] `python3 -m json.tool /home/mathew/.config/opencode/agent_hive.json > /dev/null` → exit 0

---

### 4. Update scout-researcher → opencode/qwen3.6-plus-free

**Depends on**: none

**Files:**
- Modify: `/home/mathew/.config/opencode/agent_hive.json:51-63`

**What to do**:
- Change primary model from `CLIProxyAPI/gpt-oss-120b-medium` to `opencode/qwen3.6-plus-free`
- Update fallback_models:
  - Primary: `opencode/qwen3.6-plus-free`
  - Fallback 1: `opencode/deepseek-v4-flash-free`
  - Fallback 2: `opencode/nemotron-3-super-free`
  - Fallback 3: `opencode/minimax-m2.5-free`

**Must NOT do**:
- Change autoLoadSkills or variant

**Reasoning**: Qwen 3.6 Plus has 1M context — can ingest entire codebases in one pass

**Verify**:
- [ ] `python3 -m json.tool /home/mathew/.config/opencode/agent_hive.json > /dev/null` → exit 0

---

### 5. Update forager-worker → opencode/minimax-m2.5-free

**Depends on**: none

**Files:**
- Modify: `/home/mathew/.config/opencode/agent_hive.json:64-77`

**What to do**:
- Change primary model from `CLIProxyAPI/step-3.5-flash` to `opencode/minimax-m2.5-free`
- Update fallback_models:
  - Primary: `opencode/minimax-m2.5-free`
  - Fallback 1: `opencode/deepseek-v4-flash-free`
  - Fallback 2: `opencode/qwen3.6-plus-free`
  - Fallback 3: `opencode/glm-5-free`

**Must NOT do**:
- Change autoLoadSkills or variant

**Reasoning**: MiniMax M2.5 has 80.2% SWE-bench — highest open-weight coding score available

**Verify**:
- [ ] `python3 -m json.tool /home/mathew/.config/opencode/agent_hive.json > /dev/null` → exit 0

---

### 6. Update hive-helper → opencode/deepseek-v4-flash-free

**Depends on**: none

**Files:**
- Modify: `/home/mathew/.config/opencode/agent_hive.json:78-85`

**What to do**:
- Change primary model from `CLIProxyAPI/minimax-m2.7` to `opencode/deepseek-v4-flash-free`
- Update fallback_models:
  - Primary: `opencode/deepseek-v4-flash-free`
  - Fallback 1: `opencode/minimax-m2.5-free`
  - Fallback 2: `opencode/qwen3.6-plus-free`
  - Fallback 3: `opencode/nemotron-3-super-free`

**Must NOT do**:
- Change variant (none exists currently — don't add one)

**Reasoning**: DeepSeek V4 Flash has strict mode for server-side tool-call schema validation

**Verify**:
- [ ] `python3 -m json.tool /home/mathew/.config/opencode/agent_hive.json > /dev/null` → exit 0

---

### 7. Update hygienic-reviewer → opencode/minimax-m2.5-free

**Depends on**: none

**Files:**
- Modify: `/home/mathew/.config/opencode/agent_hive.json:86-99`

**What to do**:
- Change primary model from `CLIProxyAPI/claude-sonnet-4-6` to `opencode/minimax-m2.5-free`
- Update fallback_models:
  - Primary: `opencode/minimax-m2.5-free`
  - Fallback 1: `opencode/deepseek-v4-flash-free`
  - Fallback 2: `opencode/glm-5-free`
  - Fallback 3: `opencode/qwen3.6-plus-free`

**Must NOT do**:
- Change autoLoadSkills or variant

**Reasoning**: MiniMax M2.5's 80.2% SWE-bench means it can thoroughly review diff outputs

**Verify**:
- [ ] `python3 -m json.tool /home/mathew/.config/opencode/agent_hive.json > /dev/null` → exit 0

---

### 8. Final verification

**Depends on**: 1, 2, 3, 4, 5, 6, 7

**Files:**
- Verify: `/home/mathew/.config/opencode/agent_hive.json`

**What to do**:
- Verify JSON validity one final time
- Verify no stale CLIProxyAPI references remain in models
- Verify all 7 agents have `opencode/` prefixed models

**Verify**:
- [ ] `python3 -m json.tool /home/mathew/.config/opencode/agent_hive.json > /dev/null` → exit 0 (valid JSON)
- [ ] `grep -c "CLIProxyAPI/" /home/mathew/.config/opencode/agent_hive.json` → 0 (no stale references)
- [ ] `grep -c '"opencode/' /home/mathew/.config/opencode/agent_hive.json` → 7 (all agents migrated)
