# OpenCode Sync Guide

## Overview

This guide covers how to use `opencode-sync` to synchronize your OpenCode configuration across multiple computers using Git-based session synchronization.

---

## Package Info

**Package:** `@chumikov/opencode-sync`  
**Version:** 1.2.7  
**Registry:** npm  
**GitHub:** github.com/tctinh/opencode-sync (synced from)  
**Alternative Name:** `coding-agent-sync` (same package, different alias)

---

## Installation

### On Each Computer

```bash
npm install -g @chumikov/opencode-sync
```

Or if using the older alias:
```bash
npm install -g coding-agent-sync
```

---

## Initial Setup

### 1. Prepare GitHub Token

1. Go to [GitHub Settings → Personal Access Tokens](https://github.com/settings/tokens)
2. Generate new token (classic)
3. Required scope: **`gist`** (for private Gist storage)
4. Copy the token

### 2. Initialize Sync

```bash
opencode-sync init
```

You'll be prompted for:
- GitHub token
- Encryption passphrase (choose a strong, memorable phrase)
- Sync preferences

---

## Daily Workflow

### Morning (At Office/Computer)

```bash
# Pull latest configuration from cloud
opencode-sync pull

# Start working...
```

### Evening (Before Leaving)

```bash
# If you made changes you want to sync
opencode-sync push

# Or sync all with status check
opencode-sync status
opencode-sync push --all
```

---

## Commands Reference

| Command | Description |
|---------|-------------|
| `opencode-sync init` | Initialize or reinitialize sync with GitHub |
| `opencode-sync push` | Push current config to cloud (Gist) |
| `opencode-sync pull` | Pull latest config from cloud |
| `opencode-sync status` | Show what changed since last sync |
| `opencode-sync --help` | Show help and all options |

### Options

| Flag | Description |
|------|-------------|
| `--all` | Sync all configurations |
| `--opencode` | Only sync OpenCode config |
| `--claude` | Only sync Claude Code config |
| `--verbose` | Show detailed output |

---

## What Gets Synced

### OpenCode (`~/.config/opencode/`)

| Item | Synced |
|------|--------|
| `opencode.json` | ✅ Main config |
| `agent/` | ✅ Custom agents |
| `command/` | ✅ Custom commands |
| `AGENTS.md` | ✅ Global instructions |
| `*.json` (plugin configs) | ✅ |
| `skills/` | ✅ All skills |
| `.hive/` | ✅ Session contexts |

---

## Cross-Device Setup

### On Computer 1 (Primary)

```bash
# Install and init
npm install -g @chumikov/opencode-sync
opencode-sync init

# Make configuration changes...

# Push to cloud
opencode-sync push
```

### On Computer 2 (Secondary)

```bash
# Install
npm install -g @chumikov/opencode-sync

# Init - will find existing Gist
opencode-sync init

# Pull configuration
opencode-sync pull
```

---

## Encryption & Security

- **AES encryption** - Data is encrypted before upload
- **Private GitHub Gists** - Only you can access your sync storage
- **Passphrase required** - Same passphrase must be used on all devices
- **Zero plaintext** - Even if someone gets your Gist, they cannot read it without your passphrase

---

## Troubleshooting

### "Not configured"
Run: `opencode-sync init`

### "Decryption failed"
Ensure you're using the **same passphrase** on all devices

### "Invalid token"
- Create a new GitHub token with `gist` scope
- Delete token and re-init: `opencode-sync init --force`

### "Gist not found"
The Gist may have been deleted. Run `opencode-sync init --force` to create a new one.

---

## Migration from opencodesync

If you previously used `opencodesync`, it still works as an alias:

```bash
opencodesync push   # same as opencode-sync push
opencodesync pull   # same as opencode-sync pull
opencodesync init   # same as opencode-sync init
```

---

## Local Configuration Structure

Your synced config is located at:

```
~/.config/opencode/
├── opencode.json              # Main configuration
├── agent_hive.json            # Hive agent config
├── oh-my-opencode-slim.json   # Agent presets
├── opencode-historian.json    # Memory config
├── AGENTS.md                  # Agent guidelines
├── CLAUDE.md → AGENTS.md      # Symlink for Claude Code compat
├── skills/                    # 105 skills
├── skills.csv                 # Skill registry
├── agents/                    # Custom agents
├── commands/                  # Custom commands
├── agent-hive/                # Agent Hive development
├── .hive/                     # Hive project data
├── .git/                      # Git repo for configs
├── .mnemonics/                # Memory system
├── .serena/                   # Code intelligence
├── .agents/                   # Skills lock file
├── bin/                       # OpenCode binary
└── node_modules/              # Dependencies
```

---

## Tips

1. **Always pull before starting work** on a new session
2. **Push after significant changes** (new skills, config changes)
3. **Use a strong passphrase** - it protects all your synced data
4. **Keep passphrase stored safely** - you need it on every device

---

## Links

- [npm package](https://www.npmjs.com/package/@chumikov/opencode-sync)
- [GitHub repository](https://github.com/tctinh/opencode-sync)
- [GitHub Gist storage](https://gist.github.com/)
