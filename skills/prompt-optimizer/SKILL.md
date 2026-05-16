---
name: prompt-optimizer
description: Transform raw user prompts into optimized prompts using RTF, Chain of Thought, RISEN, RODES, and other frameworks. Use when user provides a raw prompt/idea/request that needs structuring, when asked to "optimize prompt", "improve prompt", "better prompt", or "format prompt", or when working with prompt engineering.
---

# Prompt Optimizer

Transform raw user prompts into optimized, production-ready prompts using established prompting frameworks.

## When to Use This Skill

This skill activates when:
- User provides a raw prompt/idea/request that needs structuring
- User asks to "optimize prompt", "improve prompt", "better prompt", or "format prompt"
- Working with prompt engineering concepts
- User describes what they want to accomplish without a structured approach

## Workflow

### Step 1: Analyze Intent

Analyze the provided raw prompt to understand:
- **Task type**: coding, writing, analysis, design, learning, planning, decision-making, creative
- **Complexity**: simple (one-step), moderate (multi-step), complex (requires reasoning/design)
- **Clarity**: clear intention vs. ambiguous/vague
- **Domain**: technical, business, creative, academic, personal

### Step 2: Select Framework

Based on task characteristics, select the optimal framework:

| Task Type | Framework | Rationale |
|----------|-----------|----------|
| Role-based tasks | **RTF** | Clear role definition + task + output format |
| Step-by-step reasoning | **Chain of Thought** | Encourages explicit reasoning |
| Complex projects | **RISEN** or **RODES** | Structure for multi-phase work |
| Summarization | **Chain of Density** | Iterative refinement |
| Communication | **RACE** | Audience-aware messaging |
| Investigation | **RISE** | Systematic analytical approach |
| Problem-solving | **STAR** | Context-rich framing |
| Documentation | **SOAP** | Structured information capture |
| Goal-setting | **CLEAR** | Measurable objectives |

### Step 3: Generate Optimized Prompt

Apply the selected framework to transform the raw prompt.

**Format Output:**
```markdown
---
```

**Structure the optimized prompt with:**
1. **Role**: Expert identity if applicable
2. **Task**: Specific action to accomplish
3. **Details**: Context, requirements, constraints
4. **Approach**: Step-by-step instructions if complex
5. **Examples**: Concrete illustrations
6. **Output Format**: Clear specification of expected output

### Step 4: Quality Checks

Verify:
- [ ] Prompt is self-contained
- [ ] Task is specific and measurable
- [ ] Output format is clear
- [ ] No ambiguous language
- [ ] Appropriate detail level for complexity

### Output

Present the optimized prompt in a clean markdown code block without meta-commentary about framework selection.

## Trigger Examples

| User Input | Trigger |
|-----------|----------|
| "help me code Python" | Raw task needs structure |
| "create prompt for: product recommendation" | Explicit optimize request |
| "I want to scrape a website" | Intent analysis needed |
| "make a better prompt for X" | Improve existing prompt |

## Anti-Patterns

**DO NOT:**
- Add meta-commentary about framework selection in output
- Explain what frameworks you're using
- Include internal reasoning in final output
- Add gratitude or performative language

**DO:**
- Present the optimized prompt directly
- Use code blocks for the final prompt
- Keep output focused and actionable
- Match framework to task type automatically