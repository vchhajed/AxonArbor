// Runs the browser tests against a local production build. See README.md.
const { execSync, spawn } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { db } = require("./lib.cjs");

const SUITES = ["gate", "services", "harden", "limits", "review", "reset", "emails", "a11y"];
const PORT = 3123;
const PORT_EMAILS_OFF = 3124;
const root = path.resolve(__dirname, "../..");
const only = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const suites = only.length ? only : SUITES;
const logs = fs.mkdtempSync(path.join(os.tmpdir(), "axon-arbor-e2e-"));
const mailLog = path.join(logs, "mail.log");

// A fake key, and a mock on top of it: these tests can never send a real email.
const env = { ...process.env, RESEND_API_KEY: "test-not-real", ACCOUNT_EMAILS: "on", MOCK_EMAIL_LOG: mailLog };

function start(port, extra) {
  const out = fs.openSync(path.join(logs, `server-${port}.log`), "w");
  return spawn("npx", ["next", "start", "-p", String(port)], { cwd: root, env: { ...env, ...extra }, stdio: ["ignore", out, out], shell: true });
}

function stop(server) {
  if (process.platform === "win32") {
    try {
      execSync(`taskkill /F /T /PID ${server.pid}`, { stdio: "ignore" });
    } catch {}
  } else server.kill();
}

async function ready(port) {
  for (let i = 0; i < 60; i++) {
    if (await fetch(`http://localhost:${port}`).then(() => true, () => false)) return;
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`The server on port ${port} didn't start. See ${logs}`);
}

/** Limits are per IP, and every suite shares this machine's IP. */
async function clearLocalLimits() {
  const ips = ["::1", "127.0.0.1", "::ffff:127.0.0.1", "unknown"];
  const kinds = ["signup", "reset", "signin", "admin-login", "contact"];
  await db.from("axon_arbor_rate_limits").delete().in("key", ips.flatMap((ip) => kinds.map((k) => `${k}-ip:${ip}`)));
}

function runSuite(name) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(__dirname, `${name}.cjs`)], {
      env: { ...env, BASE: `http://localhost:${PORT}`, BASE_OFF: `http://localhost:${PORT_EMAILS_OFF}`, IMPORT_FILE: path.join(__dirname, "fixtures", "import-test.xlsx") },
      stdio: "inherit",
    });
    child.on("close", (code) => resolve(code === 0));
  });
}

(async () => {
  if (!process.argv.includes("--no-build")) {
    console.log("Building…");
    execSync("npx next build", { cwd: root, env, stdio: ["ignore", "ignore", "inherit"] });
  }
  const mock = path.join(__dirname, "mock-resend.cjs").replaceAll("\\", "/"); // NODE_OPTIONS treats \ as an escape
  const servers = [start(PORT, { NODE_OPTIONS: `--require "${mock}"` }), start(PORT_EMAILS_OFF, { ACCOUNT_EMAILS: "off" })];
  const failed = [];
  try {
    await Promise.all([ready(PORT), ready(PORT_EMAILS_OFF)]);
    for (const name of suites) {
      console.log(`\n=== ${name}`);
      fs.rmSync(mailLog, { force: true }); // each suite only sees its own emails
      await clearLocalLimits();
      if (!(await runSuite(name))) failed.push(name);
    }
    await clearLocalLimits();
  } finally {
    servers.forEach(stop);
  }
  console.log(failed.length ? `\nFAILED: ${failed.join(", ")} (server logs in ${logs})` : `\nAll ${suites.length} suites passed`);
  process.exit(failed.length ? 1 : 0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
