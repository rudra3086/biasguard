# Deploying BiasGuard — Frontend on Vercel, Backend on Render

This guide walks you step-by-step to deploy the Next.js frontend to Vercel and the FastAPI backend to Render (Docker or Python runtime). It also documents small repository edits made to prepare the project.

## What I changed in the repository
- `backend/main.py` — now reads `PORT` and optional `RELOAD` env vars when started. ([backend/main.py](backend/main.py))
- `backend/Dockerfile` — start command now honors `${PORT}` so Render/Docker can set the port. ([backend/Dockerfile](backend/Dockerfile))
- `.env.local` — removed an embedded Gemini API key and replaced it with a placeholder. Do not keep secrets in the repo. ([.env.local](.env.local))

---

## Important: rotate leaked key now
You had a Gemini API key committed to `.env.local`. Do **not** rely on removing the file from the repository as the only step — rotate the key in Google Cloud/AI Console immediately.

Quick removal from current commit (keeps history intact):

```bash
git rm --cached .env.local
git commit -m "Remove local env file containing secrets"
git push origin YOUR_BRANCH
```

If you want to fully purge the secret from git history, use a history-rewrite tool such as the BFG or `git filter-repo`. This rewrites history and will require a force push. Ask me if you want exact commands and help with that.

---

## Backend (Render) — Step by step

1. Sign in to https://render.com and click **New** → **Web Service**.
2. Connect your GitHub account and choose the `biasguard` repository and the branch you pushed (for example `main` or `Rudra`).
3. Set the fields in the form as follows:
   - **Name:** `biasguard-backend` (or any name you prefer)
   - **Root Directory:** `backend`
   - **Environment / Language:** choose **Docker** (recommended because repository contains `backend/Dockerfile`).
   - **Branch:** your branch (e.g., `main`)
   - **Auto-Deploy:** enable (optional)
4. If you chose **Docker**, Render will use the `backend/Dockerfile` and the container command will honor `${PORT}`. If you chose **Python** instead, set:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add Environment Variables (Render → Environment):
   - `GEMINI_API_KEY` = `your_gemini_api_key_here` (backend-only secret)
   - `CORS_ORIGINS` = `https://<your-frontend>.vercel.app,http://localhost:3000` (replace `<your-frontend>` after Vercel deploy)
   - `UPLOAD_DIR` = `uploads`
   - `CLEANUP_UPLOADS_AFTER_HOURS` = `24` (optional)
   - (Optional) `RELOAD` = `false` (if you want to disable uvicorn reload in Render)
6. Health check path: `/health`.
7. Create the service and wait for Render to build and deploy. When finished, copy the service URL (for example `https://biasguard-backend.onrender.com`).

Quick smoke-test (after you have the backend URL):

```bash
curl https://<your-backend>.onrender.com/health
```

Expected output: JSON with `status: healthy`.

---

## Frontend (Vercel) — Step by step

1. Go to https://vercel.com and click **New Project** → Import Git Repository → choose `biasguard`.
2. Framework Preset: **Next.js** (should be auto-detected). Root Directory: leave blank (project root).
3. In the Vercel project settings add the following Environment Variables (Production & Preview):
   - `BACKEND_URL` = `https://<your-backend>.onrender.com`
   - `NEXT_PUBLIC_BACKEND_URL` = `https://<your-backend>.onrender.com`
   - `NEXT_PUBLIC_API_URL` = `https://<your-backend>.onrender.com/api`

   Note: `GEMINI_API_KEY` should be set only in the backend (Render). Do not put it in frontend environment variables.

4. Click **Deploy**. Vercel will build and publish the frontend. Once complete your site will be available at a `*.vercel.app` URL.

Smoke test the frontend → backend flow:

```bash
# Backend health via frontend proxy
curl https://<your-frontend>.vercel.app/api/analyze -I

# Direct backend health
curl https://<your-backend>.onrender.com/health
```

---

## Local development (optional)

Backend locally:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Frontend locally:

```bash
cd ..
npm install
npm run dev
```

Set `.env.local` locally with `GEMINI_API_KEY` for development only — do not commit.

---

## Post-deploy verification checklist
- Backend responds at `/health`.
- File uploads (`/api/upload`) succeed and return a `file_id`.
- Analysis (`/api/analyze`) returns expected JSON for your dataset.
- Explain (`/api/explain`) works and the backend uses the `GEMINI_API_KEY` (if provided) or falls back to the template explainer.

---

If you want, I can:
- Walk you through the Render UI and set the exact values interactively.
- Prepare a `render.yaml` to manage the Render service as code.
- Help purge the secret from git history (BFG/git-filter-repo) and rotate the API key.

Tell me which of the above you'd like me to do next and I'll continue.
