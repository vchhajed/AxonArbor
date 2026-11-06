const fs = require("fs");
const { db, launch } = require("./lib.cjs");
const base = process.env.BASE, off = process.env.BASE_OFF, log = process.env.MOCK_EMAIL_LOG;
const CE = "e2e.reset@example-test.in", ME = "e2e.pending@example-test.in", NO = "e2e.nobody@example-test.in";
let fails = 0;
const ok = (cond, msg) => { console.log(cond ? "PASS" : "FAIL", msg); if (!cond) fails++; };
const emails = () => (fs.existsSync(log) ? fs.readFileSync(log, "utf8").trim().split("\n").filter(Boolean).flatMap((l) => JSON.parse(l)) : []);
const sent = (to, subject) => emails().filter((e) => e.to.includes(to) && e.subject.includes(subject));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const linkIn = (mail, path) => mail.text.match(new RegExp(`https?://\\S+${path}\\?token=\\S+`))?.[0];
const LOCAL = ["::1", "127.0.0.1", "::ffff:127.0.0.1", "unknown"];

async function cleanup() {
  await db.from("axon_arbor_accounts").delete().like("email", "e2e.%@example-test.in");
  await db.from("axon_arbor_rate_limits").delete().like("key", "%example-test.in%");
  await db.from("axon_arbor_rate_limits").delete().in("key", LOCAL.flatMap((ip) => [`signup-ip:${ip}`, `reset-ip:${ip}`, `signin-ip:${ip}`]));
}

async function forgot(p, email, b = base) {
  await p.goto(b + "/forgot-password");
  await p.waitForLoadState("load"); await wait(1200);
  await p.fill("#f-email", email);
  await p.click("button[type=submit]");
  await p.waitForSelector("form [role=status], form [role=alert]");
  return p.textContent("form [role=status], form [role=alert]");
}

async function signIn(p, email, password) {
  await p.goto(base + "/sign-in");
  await p.waitForLoadState("load"); await wait(1200);
  await p.fill("#f-email", email);
  await p.fill("#f-password", password);
  await p.click("button[type=submit]");
  await Promise.race([p.waitForURL("**/account"), p.waitForSelector("form [role=alert]")]);
  return p.url().includes("/account");
}

(async () => {
  await cleanup();
  const hasColumn = !(await db.from("axon_arbor_company_profiles").select("email_confirmed_at").limit(1)).error;
  console.log("email_confirmed_at column present:", hasColumn);
  const b = await launch();
  const page = () => b.newContext({ viewport: { width: 1280, height: 800 } }).then((c) => c.newPage());
  const c = await page(), co = await page(), a = await page(), x = await page();

  await x.goto(base + "/sign-in");
  await x.click("a:has-text('Forgotten your password?')");
  await x.waitForURL("**/forgot-password");
  ok(true, "sign-in page links to reset page");

  await c.goto(base + "/join/consultant");
  await c.waitForLoadState("load"); await wait(1200);
  await c.fill("#f-full_name", "Reset Tester (test)");
  await c.fill("#f-email", CE);
  await c.fill("#f-password", "oldpassword123");
  await c.check("input[name=terms]");
  await c.click("button[type=submit]");
  await c.waitForURL("**/account");

  await co.goto(base + "/join/company");
  await co.waitForLoadState("load"); await wait(1200);
  await co.fill("#f-company_name", "Pending Hotels (test)");
  await co.fill("#f-contact_name", "Rahul Mehta");
  await co.fill("#f-email", ME);
  await co.fill("#f-password", "oldpassword123");
  await co.check("input[name=terms]");
  await co.click("button[type=submit]");
  await co.waitForURL("**/join/company/thanks");
  ok((await co.textContent("main")).includes("confirm your email"), "thank-you page asks company to confirm when emails are on");

  // Reset replies must not reveal who has an account
  const known = await forgot(x, CE), unknown = await forgot(x, NO), pendingMsg = await forgot(x, ME);
  console.log("replies:", JSON.stringify([known, unknown, pendingMsg]));
  ok(known === unknown && known === pendingMsg && known.includes("If that address"), "same reply for real, unknown and pending addresses");
  await wait(2500);
  ok(sent(CE, "Reset your").length === 1, "real account receives one reset email");
  ok(sent(NO, "Reset your").length === 0, "unknown address receives nothing");
  ok(sent(ME, "Reset your").length === 0, "unapproved company receives no reset email");
  ok((await forgot(x, "not-an-email")).includes("valid email"), "bad address refused");

  const link = linkIn(sent(CE, "Reset your")[0], "/set-password");
  ok(Boolean(link), "reset email contains a link");
  const payload = JSON.parse(Buffer.from(new URL(link).searchParams.get("token").split(".")[0], "base64url").toString());
  ok(Math.abs(payload.exp - Date.now() / 1000 - 3600) < 60, "reset link lasts one hour");

  // Tampered link
  const t = await page();
  await t.goto(link.slice(0, -4) + "AAAA");
  await t.waitForLoadState("load"); await wait(1200);
  await t.fill("#f-new_password", "newpassword456");
  await t.click("button[type=submit]");
  await t.waitForSelector("form [role=alert]");
  ok((await t.textContent("form [role=alert]")).includes("expired"), "tampered link refused");

  // Lock the account, then recover through the link
  const l = await page();
  for (let i = 0; i < 8; i++) await signIn(l, CE, "wrongpassword" + i);
  ok(!(await signIn(l, CE, "oldpassword123")) && (await l.textContent("form [role=alert]")).includes("Too many"), "account locked after 8 wrong passwords");

  const r = await page();
  await r.goto(link);
  await r.waitForLoadState("load"); await wait(1200);
  await r.fill("#f-new_password", "newpassword456");
  await r.click("button[type=submit]");
  await r.waitForURL("**/account");
  ok(true, "reset link sets a new password and signs in");
  await c.goto(base + "/account");
  const left = await c.waitForURL("**/sign-in", { timeout: 8000 }).then(() => true, () => false);
  ok(left, "old sessions signed out after reset");
  const n = await page();
  ok(!(await signIn(n, CE, "oldpassword123")), "old password no longer works");
  ok(await signIn(n, CE, "newpassword456"), "new password works, and the lockout is cleared");

  const u = await page();
  await u.goto(link);
  await u.waitForLoadState("load"); await wait(1200);
  await u.fill("#f-new_password", "anotherpass789");
  await u.click("button[type=submit]");
  await u.waitForSelector("form [role=alert]");
  ok((await u.textContent("form [role=alert]")).includes("expired"), "reset link works only once");

  await forgot(x, CE); await forgot(x, CE);
  ok((await forgot(x, CE)).includes("Too many"), "4th reset in an hour blocked");

  // Company confirmation
  const mail = sent(ME, "received your registration")[0];
  const confirm = mail && linkIn(mail, "/confirm-email");
  ok(Boolean(confirm), "request-received email contains a confirm link");
  const id = (await db.from("axon_arbor_accounts").select("id").eq("email", ME).single()).data.id;
  const g = await page();
  await g.goto(confirm);
  await g.waitForLoadState("load"); await wait(1200);
  if (hasColumn) {
    const before = await db.from("axon_arbor_company_profiles").select("email_confirmed_at").eq("account_id", id).single();
    ok(!before.data.email_confirmed_at, "opening the link alone confirms nothing");
  }
  const bad = await page();
  await bad.goto(confirm.slice(0, -4) + "AAAA");
  await bad.waitForLoadState("load"); await wait(1200);
  await bad.click("button[type=submit]");
  await bad.waitForSelector("form [role=alert]");
  ok((await bad.textContent("form [role=alert]")).includes("expired"), "tampered confirm link refused");
  const resetAsConfirm = await page();
  await resetAsConfirm.goto(base + "/confirm-email?token=" + new URL(link).searchParams.get("token"));
  await resetAsConfirm.waitForLoadState("load"); await wait(1200);
  await resetAsConfirm.click("button[type=submit]");
  await resetAsConfirm.waitForSelector("form [role=alert]");
  ok((await resetAsConfirm.textContent("form [role=alert]")).includes("expired"), "a reset token can't be used as a confirm token");

  await g.click("button[type=submit]");
  await g.waitForSelector("form [role=status], form [role=alert]");
  const reply = await g.textContent("form [role=status], form [role=alert]");
  if (hasColumn) {
    ok(reply.includes("confirmed"), "button confirms the address");
    const after = await db.from("axon_arbor_company_profiles").select("email_confirmed_at").eq("account_id", id).single();
    ok(Boolean(after.data.email_confirmed_at), "confirmation saved");
  } else {
    ok(reply.includes("something went wrong"), "before the SQL runs, a friendly error shows");
  }

  await a.goto(base + "/admin/login");
  await a.fill("input[name=username]", process.env.ADMIN_USERNAME);
  await a.fill("input[name=password]", process.env.ADMIN_PASSWORD);
  await a.click("button[type=submit]");
  await a.waitForURL(base + "/admin");
  await a.goto(base + "/admin/companies");
  await a.click("button[aria-expanded]:has-text('Pending Hotels (test)')");
  const text = await a.textContent("main");
  ok(text.includes("Email confirmed") && text.includes(hasColumn ? "2026" : "Not yet"), "admin sees the confirmation status");
  await a.click("button:has-text('Approve company')");
  const dialog = await a.textContent("dialog[open]");
  ok(dialog.includes("haven’t confirmed") === !hasColumn, "approve dialog warns only when unconfirmed");
  await a.click("dialog[open] button:has-text('Approve')");
  await a.waitForSelector("text=Saved");
  ok(true, "company can still be approved");

  // Phones
  const ph = await b.newContext({ viewport: { width: 360, height: 740 } }).then((p) => p.newPage());
  for (const path of ["/forgot-password", "/confirm-email?token=x", "/sign-in"]) {
    await ph.goto(base + path);
    await ph.waitForLoadState("load"); await wait(1200);
    const wide = await ph.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    ok(wide <= 0, `no sideways scroll on a phone: ${path}`);
  }

  if (off) {
    const o = await page();
    ok((await forgot(o, CE, off)).includes("isn’t available yet"), "with emails off, the page says so instead of promising an email");
  }

  await b.close();
  await cleanup();
  console.log(fails ? `${fails} FAILED` : "ALL PASSED");
  process.exit(fails ? 1 : 0);
})().catch(async (e) => { console.error(e); await cleanup(); process.exit(1); });
