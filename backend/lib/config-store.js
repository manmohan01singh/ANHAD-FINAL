/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CONFIG STORE — durable storage for the remote campaign configuration
 *
 * One interface, two backends, chosen at boot from the environment:
 *
 *   Cloudflare KV (via its REST API)  — when CF_ACCOUNT_ID + CF_KV_NAMESPACE_ID
 *                                       + CF_API_TOKEN are all set.
 *   JSON file on local disk           — otherwise.
 *
 * Why KV over the REST API rather than a Worker: the repo's worker/ scaffold has
 * never been deployed and is broken by construction (worker/src/index.js:433
 * calls handleRadioLive(request) but the function reads env.CACHE, so env is
 * undefined and the route 500s unconditionally; wrangler.toml declares no
 * kv_namespaces at all). Talking to KV directly makes Cloudflare a
 * credentials-only step instead of a deploy-a-Worker step, and lets the whole
 * admin path work today on the file backend.
 *
 * Why this matters at all: the campaign config used to be a hardcoded const, so
 * an admin toggle had nowhere to live. Render's filesystem is ephemeral, so the
 * file backend is explicitly a development/bridge mode and says so loudly at
 * boot. (The same latent bug already affects Sadhsangat admin channels, which
 * persist to backend/data/ and vanish on restart.)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const path = require('path');
const fs = require('fs').promises;

const KV_KEY = 'anhad:campaign-config';
const FILE_PATH = process.env.CONFIG_STORE_FILE ||
  path.join(__dirname, '..', 'data', 'campaign-config.json');

const CF = {
  accountId: process.env.CF_ACCOUNT_ID || '',
  namespaceId: process.env.CF_KV_NAMESPACE_ID || '',
  apiToken: process.env.CF_API_TOKEN || ''
};

const usingKv = !!(CF.accountId && CF.namespaceId && CF.apiToken);

/**
 * Shape check. A store can hold anything, but the clients validate on
 * `Array.isArray(data.campaigns)` (frontend/lib/remote-config.js) and would
 * silently fall back to their own built-in defaults on anything else. Reject
 * malformed data here so a bad write can never become a bad read.
 */
function isValidConfig(cfg) {
  if (!cfg || typeof cfg !== 'object') return false;
  if (!Array.isArray(cfg.campaigns)) return false;
  if (cfg.featureFlags && typeof cfg.featureFlags !== 'object') return false;
  return cfg.campaigns.every(c =>
    c && typeof c === 'object' &&
    typeof c.id === 'string' && c.id.length > 0 &&
    (c.platforms === undefined || Array.isArray(c.platforms)) &&
    (c.priority === undefined || typeof c.priority === 'number')
  );
}

// ─── Cloudflare KV backend ────────────────────────────────────────────────
const kvBase = () =>
  `https://api.cloudflare.com/client/v4/accounts/${CF.accountId}/storage/kv/namespaces/${CF.namespaceId}/values/${encodeURIComponent(KV_KEY)}`;

async function kvRead() {
  const resp = await fetch(kvBase(), {
    headers: { Authorization: `Bearer ${CF.apiToken}` }
  });
  if (resp.status === 404) return null;           // key not written yet
  if (!resp.ok) throw new Error(`KV read HTTP ${resp.status}`);
  return JSON.parse(await resp.text());
}

async function kvWrite(config) {
  // KV's write endpoint is multipart/form-data with a `value` field.
  const form = new FormData();
  form.append('value', JSON.stringify(config));
  form.append('metadata', JSON.stringify({ updatedAt: config.updatedAt }));
  const resp = await fetch(kvBase(), {
    method: 'PUT',
    headers: { Authorization: `Bearer ${CF.apiToken}` },
    body: form
  });
  if (!resp.ok) throw new Error(`KV write HTTP ${resp.status}: ${await resp.text()}`);
}

// ─── File backend ─────────────────────────────────────────────────────────
async function fileRead() {
  try {
    return JSON.parse(await fs.readFile(FILE_PATH, 'utf8'));
  } catch (e) {
    if (e.code === 'ENOENT') return null;
    throw e;
  }
}

async function fileWrite(config) {
  await fs.mkdir(path.dirname(FILE_PATH), { recursive: true });
  // Write-then-rename so a crash mid-write cannot leave a truncated file that
  // would fail validation on the next read.
  const tmp = FILE_PATH + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(config, null, 2), 'utf8');
  await fs.rename(tmp, FILE_PATH);
}

// ─── Public interface ─────────────────────────────────────────────────────

/**
 * Returns the stored config, or null when nothing valid is stored yet so the
 * caller can fall back to its seed. Never throws: a store outage must degrade
 * to the built-in defaults, not take the config endpoint down with it.
 */
async function read() {
  try {
    const raw = usingKv ? await kvRead() : await fileRead();
    if (raw === null) return null;
    if (!isValidConfig(raw)) {
      console.warn('[ConfigStore] Stored config failed validation — ignoring it and using defaults');
      return null;
    }
    return raw;
  } catch (e) {
    console.warn('[ConfigStore] Read failed, falling back to defaults:', e.message);
    return null;
  }
}

/**
 * Persists a config. Stamps updatedAt and bumps the patch version so clients
 * (which diff the payload) reliably see a change. Throws on failure — a write
 * is an explicit admin action and must not silently no-op.
 */
async function write(config) {
  if (!isValidConfig(config)) {
    const err = new Error('Config failed validation');
    err.statusCode = 400;
    throw err;
  }
  const stamped = {
    ...config,
    updatedAt: new Date().toISOString(),
    version: bumpVersion(config.version)
  };
  if (usingKv) await kvWrite(stamped);
  else await fileWrite(stamped);
  return stamped;
}

function bumpVersion(v) {
  const parts = String(v || '1.0.0').split('.').map(n => parseInt(n, 10));
  if (parts.length !== 3 || parts.some(isNaN)) return '1.0.1';
  parts[2] += 1;
  return parts.join('.');
}

function describe() {
  return usingKv
    ? { backend: 'cloudflare-kv', durable: true, key: KV_KEY }
    : { backend: 'file', durable: false, path: FILE_PATH };
}

function logBackend() {
  if (usingKv) {
    console.log('[ConfigStore] Cloudflare KV backend active — campaign config is durable.');
  } else {
    console.warn(
      '[ConfigStore] FILE backend active (' + FILE_PATH + ').\n' +
      '              Campaign changes will NOT survive a restart on an ephemeral\n' +
      '              filesystem such as Render. Set CF_ACCOUNT_ID, CF_KV_NAMESPACE_ID\n' +
      '              and CF_API_TOKEN to switch to durable Cloudflare KV storage.'
    );
  }
}

module.exports = { read, write, describe, logBackend, isValidConfig, KV_KEY };
