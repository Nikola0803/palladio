# Hermes -- Always-On Personal AI Agent

VPS: srv1977265.hstgr.cloud (2.24.197.91)
Ubuntu 26.04 LTS | 1 vCPU | 4 GB RAM | 50 GB disk
Billing renews: 2026-11-27 (auto-renew ON)

---

## Architecture

```
You (Telegram)
     |
     v
Telegram Bot  <----->  Hermes Daemon (systemd, hermes user)
                              |
                    +---------+---------+
                    |                   |
              Router (config)     Dashboard API
                    |             (FastAPI, port 8080)
         +----------+----------+
         |          |          |
      DeepSeek   Claude    Gemini Flash
     (default)  (complex)  (free fallback)
```

**Routing rules:**
- Short, conversational (< 150 tokens, no trigger word) -> DeepSeek V3 (~$0.00/msg)
- `/code`, `/analyze`, `/plan`, `/think` prefix -> Claude
- Any LLM failure -> Gemini Flash 2.0 fallback (free tier)

---

## Required Credentials

Gather these before running deploy/setup.sh:

| Secret | Where to get it | env var |
|--------|-----------------|---------|
| Telegram bot token | @BotFather on Telegram | `TELEGRAM_BOT_TOKEN` |
| Telegram owner user ID | @userinfobot on Telegram | `TELEGRAM_OWNER_ID` |
| Anthropic API key | console.anthropic.com | `ANTHROPIC_API_KEY` |
| DeepSeek API key | platform.deepseek.com | `DEEPSEEK_API_KEY` |
| Gemini API key | aistudio.google.com | `GEMINI_API_KEY` |

**Monthly spend cap:** Set `ANTHROPIC_SPEND_CAP_USD=20` -- Hermes checks cumulative spend against this before each Claude call.

---

## VPS State (from audit, 2026-11-19)

- RAM in use: ~900-990 MB (something is running -- check with SSH)
- Disk used: ~9.5 GB (slowly growing)
- SSH keys on VPS: `codex-peptidebot-temporary` (remove after adding your key)
- Firewall: NONE configured -- set up ufw after deploy
- Known gap: root password login may still be enabled

---

## Phase 1: Harden VPS

Run `deploy/hardening.sh` as root. Steps:
1. Add your personal SSH public key to `/root/.authorized_keys`
2. Disable password SSH login (`PasswordAuthentication no`)
3. Create `hermes` system user (no login shell, no password)
4. Install ufw, allow only SSH (22) inbound
5. Remove `codex-peptidebot-temporary` key
6. Set up unattended-upgrades for security patches

## Phase 2: Install Hermes

Run `deploy/setup.sh` as root. Steps:
1. Install Python 3.11, pip, venv
2. Create `/opt/hermes/` owned by `hermes` user
3. Clone this repo (or rsync) to `/opt/hermes/`
4. Create venv, install requirements.txt
5. Copy `config.example.yaml` -> `/etc/hermes/config.yaml`, fill in secrets
6. Install `deploy/hermes.service` to systemd
7. `systemctl enable --now hermes`

## Phase 3: Configure & Test

1. Send a Telegram message to your bot -> should reply within 5s
2. Check `journalctl -u hermes -f` for errors
3. Open dashboard: `ssh -L 8080:127.0.0.1:8080 root@2.24.197.91` then browse to http://localhost:8080

---

## Open Decisions

- [ ] Does the existing ~900MB RAM usage belong to a CRM/job site? (determines isolation needs)
- [ ] Dashboard: expose publicly (nginx + auth) or SSH-tunnel only?
- [ ] Telegram webhook vs polling? (webhook needs public HTTPS endpoint)
- [ ] Monthly Claude budget: $20 OK?
- [ ] Add any other integrations in Phase 3? (calendar, email, etc.)

---

## Codex Integration

The `codex-dispatch` skill can dispatch deploy/hardening tasks directly to your machine via the Codex MCP server. To enable:
1. Install Codex CLI: `npm install -g @openai/codex` (or via homebrew)
2. Run Codex in MCP server mode and add it to your Claude Code MCP config
3. Claude can then SSH into the VPS, run setup.sh, and confirm each step

Until then: SSH yourself and paste output back, or run `deploy/setup.sh` manually.
