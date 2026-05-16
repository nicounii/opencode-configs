# LangFuse + OpenCode Integration Research

## Discovery

**User's Request:**
- Research LangFuse and how it integrates with HKUDS/OpenSpace
- Create a deep tutorial
- Create an interactive dashboard for token and LLMs opencode tool_call tracking
- Track free models usage quota from free-llm.com

**Answers from user:**
- Goal: Full integration (code + dashboard)
- Metrics: Tool calls + latency + free models usage quota
- Data flow: Need research on best approach
- Start: Now (while user sleeps)

## Research Tasks

### 1. LangFuse Research
- What is LangFuse and its features
- How does it track LLM usage, tokens, costs
- Integration options with Node.js/TypeScript apps
- SDK availability and API

### 2. OpenCode/HKUDS Architecture Research
- How does OpenCode make LLM calls
- Where are tool calls executed
- How to intercept and log them
- Existing logging mechanisms

### 3. free-llm.com Research
- What is free-llm.com
- How to track free model quotas
- API availability for usage tracking

### 4. Dashboard Design
- Similar pattern to my-daily-monitor showcase
- Track: tool calls, latency, token usage, model breakdown

## Non-Goals
- Not building production integration (just research + tutorial + demo dashboard)
- Not connecting to real LangFuse instance (demo/placeholder)

## Output
1. Research findings document
2. Deep tutorial (how-to guide)
3. Dashboard code (Vite + TypeScript, similar to showcase)