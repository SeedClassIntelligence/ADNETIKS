# ADNETIKS — 1-Click Cloud & Self-Hosted Deployment Guide

ADNETIKS is packaged as a single, self-contained application (React Studio UI + API Server + Multi-Page Headless Chrome Website Scanner + 24/7 Scheduling Cron + Persistent Disk Vault).

You can run it **in the Hosted Cloud** (recommended for most businesses & SaaS customers) OR **Independently on a Private Server / Local Machine**.

---

## Option A: Hosted Cloud — 1-Click Deploy (Recommended)

Best for 24/7 automated publishing, zero customer setup, and recurring SaaS hosting.

### Deploy on Render (1 Click)
1. Go to [Render Blueprints](https://dashboard.render.com/blueprints) and connect your `ADNETIKS` GitHub repository.
2. Render automatically detects [`render.yaml`](./render.yaml) (Docker + Chromium + 10 GB persistent disk at `/app/.adnetiks-data`).
3. Paste one AI API key (such as `GEMINI_API_KEY` or `OPENAI_API_KEY`) when prompted and click **Apply**.
4. Your live app URL (with SSL/HTTPS) is ready in ~3 minutes.

### Deploy on Railway (1 Click)
1. Go to [Railway New Project](https://railway.app/new) → **Deploy from GitHub Repo** → select `ADNETIKS`.
2. Railway automatically detects [`railway.json`](./railway.json) and [`Dockerfile`](./Dockerfile).
3. Attach a Persistent Volume mounted at `/app/.adnetiks-data` and add your preferred AI key (`GEMINI_API_KEY`, `OPENAI_API_KEY`, or `ANTHROPIC_API_KEY`).

---

## Option B: Independent / Self-Hosted — 1 Command with Docker

Best for agencies or enterprise clients who want 100% data ownership on their own server or laptop.

```bash
# 1. Clone the repository
git clone https://github.com/SeedClassIntelligence/ADNETIKS.git
cd ADNETIKS

# 2. (Optional) Add your AI key
cp .env.example .env

# 3. Launch everything (App + Headless Chrome Scanner + Persistent Storage)
docker compose up -d
```

Open **http://localhost:3000** and click **1-Click Launch** in the top bar!

### Want 100% Free Local AI (No Cloud API Keys)?
Launch ADNETIKS together with Ollama in one command:

```bash
docker compose --profile local-ai up -d
docker exec -it adnetiks-ollama ollama pull llama3.1
```

Then open **AI & Connectors** inside ADNETIKS, choose **OpenAI-Compatible / Local**, and point it to `http://ollama:11434`.

---

## Option C: Direct Node.js Production Run (No Docker)

```bash
npm install
npm run build
npm start
```

Verify the server is healthy at `http://localhost:3000/api/health`.
