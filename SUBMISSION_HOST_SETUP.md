# Shared KIS/QA submission flow

`submit_all` is the only component deployed to IIS. Each of the five users runs a local Salamanders frontend and backend, with one distinct `submit_all` API key on that user's backend. No API key or DRES session is placed in browser configuration.

## Configure each Salamanders machine

After deploying `C:\Users\LENOVO\Downloads\submit_all` and provisioning the five keys as described in its README, edit `app/submission_runtime.env` on each machine:

```dotenv
HOST_SUBMISSIONS_URL=https://your-submit-all-host.example
HOST_SUBMISSIONS_API_KEY=the-key-issued-for-this-user
DRES_ENDPOINT=http://your-dres-host:port
DRES_SESSION_ID=the-current-dres-session
DRES_EVALUATION_ID=the-current-evaluation
```

Use a different `HOST_SUBMISSIONS_API_KEY` for each person. Keep this file private; it is in `.gitignore`. Restart the Salamanders Python backend after changing it. The frontend `js/conf.json` still points `serviceUrl` at the local Salamanders backend (usually `http://127.0.0.1:8080`), not directly at the shared host. The host URL should be HTTPS for a reliable secure WebSocket connection through IIS.

If the frontend runs on a different local origin than `http://127.0.0.1:8000` or `http://localhost:8000`, add it to `SUBMISSIONS_ALLOWED_ORIGINS` in the same env file, separated by commas. The IIS host must allow that frontend origin in its `AllowedOrigins` setting and support WebSocket traffic to `/hubs/submissions`.

## Workflow

1. Upload the query ZIP in Salamanders' Query ZIP settings. KIS and QA query files retain the `*-kis.txt` / `*-qa.txt` format.
2. Press Submit on a KIS/QA frame, choose the query (and type an answer for QA). Salamanders saves it on `submit_all` using its local backend's API key. This step never calls DRES.
3. All five Salamanders browsers see the host queue through SignalR, with a 15-second refresh fallback. The queue shows source user, image when available, answer, and status.
4. Press **Submit to DRES** on a pending/failed item and confirm. Salamanders first claims the item on `submit_all`; only the claim winner sends the frozen DRES payload. It then reports the outcome to the host. `unknown` means DRES may have received the request, so inspect DRES before an admin resolves/retries it.

The prior `/custom-submission-proxy` route is not registered. Direct browser-side DRES submission for KIS/QA is disabled. AVS behavior is unchanged.

## Checks

From the Salamanders root:

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s test -p test_host_submissions.py -v
node --check app/frontend/js/customSubmission.js
node --check app/frontend/js/hostQueue.js
```

Do not perform a live DRES submission just to test connectivity; the final click actually submits a contest answer.
