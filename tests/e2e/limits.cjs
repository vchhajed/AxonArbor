const { db, launch } = require("./lib.cjs");
const base = process.env.BASE;
const CE = "e2e.limit@example-test.in";
let fails = 0;
const ok = (cond, msg) => { console.log(cond ? "PASS" : "FAIL", msg); if (!cond) fails++; };

async function cleanup() {
  await db.from("axon_arbor_accounts").delete().like("email", "e2e.%@example-test.in");
  await db.from("axon_arbor_rate_limits").delete().like("key", "%example-test.in%");
  await db.from("axon_arbor_rate_limits").delete().in("key", ["signin-ip:unknown", "signup-ip:unknown", "admin-login-ip:unknown"]);
  await db.from("axon_arbor_rate_limits").delete().in("key", ["signin-ip:::1", "signup-ip:::1", "admin-login-ip:::1", "signin-ip:127.0.0.1", "signup-ip:127.0.0.1", "admin-login-ip:127.0.0.1"]);
}

async function tryLogin(p, email, password) {
  await p.goto(base + "/sign-in");
  await p.fill("#f-email", email);
  await p.fill("#f-password", password);
  await p.click("form button[type=submit]");
  await p.waitForSelector("form [role=alert]", { timeout: 15000 });
  return (await p.locator("form [role=alert]").allTextContents()).join(" ");
}

(async () => {
  await cleanup();
  const b = await launch();
  const p = await b.newPage();

  await p.goto(base + "/join/consultant");
  await p.fill("#f-full_name", "Limit Tester (test)");
  await p.fill("#f-email", CE);
  await p.fill("#f-password", "testpass123");
  await p.check("input[name=terms]");
  await p.click("button[type=submit]");
  await p.waitForURL("**/account");
  const { count } = await db.from("axon_arbor_rate_limits").select("id", { count: "exact", head: true }).like("key", "signup-ip:%");
  ok(count >= 1, "sign-up is counted");

  const l = await (await b.newContext()).newPage();
  let last = "";
  for (let i = 1; i <= 8; i++) last = await tryLogin(l, CE, "wrongpassword1");
  ok(last.includes("don’t match"), "eighth wrong password gets the normal error");
  last = await tryLogin(l, CE, "wrongpassword1");
  ok(last.includes("Too many attempts"), "ninth attempt is blocked");
  last = await tryLogin(l, CE, "testpass123");
  ok(last.includes("Too many attempts"), "even the right password is blocked during the lockout");

  await db.from("axon_arbor_rate_limits").delete().like("key", "%example-test.in%");
  await l.goto(base + "/sign-in");
  await l.fill("#f-email", CE);
  await l.fill("#f-password", "testpass123");
  await l.click("form button[type=submit]");
  await l.waitForURL("**/account");
  ok(true, "login works again once the lockout clears");

  const a = await (await b.newContext()).newPage();
  let msg = "";
  for (let i = 1; i <= 11; i++) {
    await a.goto(base + "/admin/login");
    await a.fill("input[name=username]", "not-the-admin");
    await a.fill("input[name=password]", "wrong");
    await a.click("button[type=submit]");
    await a.waitForTimeout(1500);
    msg = await a.locator("body").innerText();
  }
  ok(msg.includes("Too many attempts"), "admin login is blocked after 10 failures");

  await b.close();
  await cleanup();
  console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
  process.exit(fails ? 1 : 0);
})().catch(async (e) => {
  console.error("CRASHED:", e.message);
  await cleanup();
  process.exit(1);
});
