# Campaign config storage — Cloudflare KV setup

The campaign engine (`backend/lib/config-store.js`) reads and writes through one
interface with two backends, selected automatically at boot from environment
variables. **No Cloudflare Worker deployment is involved** — this talks to
Cloudflare's KV REST API directly.

| Backend | When active | Durable? |
|---|---|---|
| **File** (`backend/data/campaign-config.json`) | Default — no Cloudflare env vars set | No. Wiped on every restart on an ephemeral filesystem such as Render. |
| **Cloudflare KV** | `CF_ACCOUNT_ID` + `CF_KV_NAMESPACE_ID` + `CF_API_TOKEN` all set | Yes. |

The server logs which one is active on every boot (`configStore.logBackend()`,
called from `backend/server.js` right after `initSadhsangatDb()`). The admin
screen (`/Admin/`) also shows this as a banner, with a warning when running on
the file backend.

**Cloudflare is entirely optional.** Everything — reading, the admin toggle,
publish, preview — works today on the file backend. Configuring KV only makes
the result of those actions survive a restart.

## 1. Create the KV namespace

1. Log in to the [Cloudflare dashboard](https://dash.cloudflare.com).
2. Go to **Workers & Pages → KV**.
3. Click **Create a namespace**. Name it something like `anhad-campaign-config`.
4. Copy the **Namespace ID** shown after creation — this is `CF_KV_NAMESPACE_ID`.

No key needs to be pre-created; `config-store.js` writes to a single fixed key
(`anhad:campaign-config`) the first time an admin publishes.

## 2. Create an API token

1. Go to **My Profile → API Tokens → Create Token**.
2. Use **Create Custom Token**.
3. Permissions: **Account → Workers KV Storage → Edit**.
4. Account Resources: scope it to the one account that owns the namespace above
   (not "All accounts").
5. Create the token and copy it immediately — Cloudflare shows it only once.
   This value is `CF_API_TOKEN`.

Treat it as a secret with write access to this KV namespace only — it cannot
reach anything else in the Cloudflare account if scoped as above.

## 3. Find the account ID

Dashboard → any domain or the Workers & Pages overview page — the **Account
ID** is shown in the right-hand sidebar. This is `CF_ACCOUNT_ID`.

## 4. Set the three variables on Render

In the Render service's **Environment** tab, add:

```
CF_ACCOUNT_ID=<from step 3>
CF_KV_NAMESPACE_ID=<from step 1>
CF_API_TOKEN=<from step 2>
```

Redeploy (or let Render's auto-deploy pick up the env change). On the next
boot, the log line changes from:

```
[ConfigStore] FILE backend active (...). Campaign changes will NOT survive a restart...
```

to:

```
[ConfigStore] Cloudflare KV backend active — campaign config is durable.
```

The `/Admin/` screen's storage banner switches from the warning state to
confirming durable storage, the next time an operator opens it.

## Local development

Do **not** set these three variables locally. Local development is meant to use
the file backend — it requires no external account, no network dependency, and
behaves identically for every admin-screen interaction. Cloudflare KV is a
production-durability concern, not a local-dev requirement.

## Secrets handling

- Never commit `CF_API_TOKEN`, `CF_ACCOUNT_ID`, or `CF_KV_NAMESPACE_ID` to the
  repository. `backend/.env` is gitignored; only `backend/.env.example`
  (blank placeholders) is tracked.
- `config-store.js` never logs the token. `admin.js` (the frontend admin
  screen) never logs `ADMIN_API_TOKEN` either — confirmed by an automated
  check in this repo's verification pass (the token string does not appear in
  server stdout/stderr across a full boot-write-restart cycle).
- Rotate `CF_API_TOKEN` by creating a new one in the dashboard, updating the
  Render env var, and revoking the old token — no code change needed.

## If the KV credentials are wrong

Checked directly against `config-store.js` with invalid `CF_*` values (a real
account/namespace was not available to test the working KV path against — see
the project's production-readiness report for that limitation, called out
explicitly rather than assumed):

- `read()` catches the failed request and returns `null`, which
  `GET /api/config/campaigns` treats the same as "nothing stored yet" and
  serves `DEFAULT_CAMPAIGNS` — the public endpoint never breaks.
- `write()` throws, so a broken publish from `/Admin/` surfaces as a visible
  error to the operator instead of silently no-op'ing.

## Verifying the switch

1. **Without KV** (default): boot the server with no `CF_*` vars set. Confirm
   `GET /api/config/campaigns` responds normally, and that publishing from
   `/Admin/` works — this is the Render fallback and it must always work on its
   own, with or without Cloudflare configured.
2. **With KV**: set all three vars, boot, confirm the log line above. Publish a
   change from `/Admin/`, then restart the process. `GET /api/config/campaigns`
   must return the published value, not the default — this is the property the
   file backend cannot provide.
3. **Redeploy**: on Render specifically, a redeploy replaces the container
   filesystem entirely. Only the KV backend survives this; the file backend by
   design does not, and the admin screen's warning banner says so.
