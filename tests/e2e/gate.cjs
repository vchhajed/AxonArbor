const { db, launch } = require("./lib.cjs");
const base = process.env.BASE;
const ME = "e2e.manager@example-test.in", RE = "e2e.second@example-test.in", AC = "e2e.added@example-test.in", AO = "e2e.addedco@example-test.in";
let fails = 0;
const ok = (cond, msg) => { console.log(cond ? "PASS" : "FAIL", msg); if (!cond) fails++; };
const path = (p) => new URL(p.url()).pathname;
const cleanup = () => db.from("axon_arbor_accounts").delete().like("email", "e2e.%@example-test.in");

async function register(p, email, name) {
  await p.goto(base + "/join/company");
  await p.fill("#f-company_name", name);
  await p.fill("#f-contact_name", "Rahul Mehta");
  await p.fill("#f-email", email);
  await p.fill("#f-password", "testpass123");
  await p.check("input[name=terms]");
  await p.click("button[type=submit]");
  await p.waitForURL("**/join/company/thanks");
}
async function signIn(p, email, password) {
  await p.goto(base + "/sign-in");
  await p.fill("#f-email", email);
  await p.fill("#f-password", password);
  await p.click("form button[type=submit]");
}
async function decide(a, name, button, confirm) {
  await a.goto(base + "/admin/companies");
  await a.click(`button[aria-expanded]:has-text('${name}')`);
  await a.click(`button:has-text('${button}')`);
  await a.click(`dialog[open] button:has-text('${confirm}')`);
  await a.waitForSelector("text=Saved");
}
async function add(a, page, fields) {
  await a.goto(base + page);
  await a.click("button:has-text('Add c')");
  for (const [k, v] of Object.entries(fields)) await a.fill(`dialog[open] input[name=${k}]`, v);
  await a.click("dialog[open] button:text-is('Add')");
}

(async () => {
  await cleanup();
  const b = await launch();
  const ctx = () => b.newContext({ viewport: { width: 1280, height: 800 } }).then((c) => c.newPage());
  const co = await ctx(), a = await ctx(), n = await ctx();

  await register(co, ME, "Gate Hotels (test)");
  ok(path(co) === "/join/company/thanks", "company lands on the thank-you page, not logged in");
  await co.goto(base + "/account");
  await co.waitForURL("**/sign-in", { timeout: 15000 }).catch(() => {});
  ok(path(co) === "/sign-in", "pending company has no account access");
  await signIn(co, ME, "testpass123");
  await co.waitForSelector("text=still waiting for approval");
  ok(true, "pending company cannot log in");

  await a.goto(base + "/admin/login");
  await a.fill("input[name=username]", process.env.ADMIN_USERNAME);
  await a.fill("input[name=password]", process.env.ADMIN_PASSWORD);
  await a.click("button[type=submit]");
  await a.waitForURL(base + "/admin");

  await decide(a, "Gate Hotels (test)", "Approve company", "Approve");
  await signIn(co, ME, "testpass123");
  await co.waitForURL("**/account");
  await co.waitForSelector("text=Your company is approved");
  ok(true, "approved company can log in");

  await register(n, RE, "Second Co (test)");
  await decide(a, "Second Co (test)", "Reject", "Reject");
  await signIn(n, RE, "testpass123");
  await n.waitForSelector("text=wasn’t approved");
  ok(true, "rejected company cannot log in");

  // consultant still logs in straight away
  const c = await ctx();
  await c.goto(base + "/join/consultant");
  await c.fill("#f-full_name", "Normal Consultant (test)");
  await c.fill("#f-email", "e2e.consultant@example-test.in");
  await c.fill("#f-password", "testpass123");
  await c.check("input[name=terms]");
  await c.click("button[type=submit]");
  await c.waitForURL("**/account");
  await c.waitForSelector("text=Not submitted");
  ok(true, "consultant sign-up still logs straight in");

  // add by hand
  await add(a, "/admin/consultants", { add_name: "Added Consultant (test)", add_email: AC });
  await a.waitForSelector("dialog[open] p.font-mono");
  const pw = (await a.locator("dialog[open] p.font-mono").textContent()).trim();
  await a.click("dialog[open] button:has-text('Done')");
  ok(pw.length > 8, "admin adds a consultant and gets a temporary password");
  const f = await ctx();
  await signIn(f, AC, pw);
  await f.waitForURL("**/account");
  await f.waitForSelector("text=Not submitted");
  ok(true, "added consultant logs in with a draft profile");

  await add(a, "/admin/consultants", { add_name: "Dup", add_email: AC });
  await a.waitForSelector("text=already exists");
  ok(true, "adding a duplicate email is refused");

  await add(a, "/admin/companies", { add_company_name: "Gmail Co", add_name: "X", add_email: "x@gmail.com" });
  await a.waitForSelector("text=Companies need a company email");
  ok(true, "adding a company with Gmail is refused");

  await add(a, "/admin/companies", { add_company_name: "Added Co (test)", add_name: "Asha Rao", add_email: AO });
  await a.waitForSelector("dialog[open] p.font-mono");
  const pw2 = (await a.locator("dialog[open] p.font-mono").textContent()).trim();
  const g = await ctx();
  await signIn(g, AO, pw2);
  await g.waitForURL("**/account");
  await g.waitForSelector("text=Your company is approved");
  ok(true, "added company is approved and can log in");

  await b.close();
  await cleanup();
  console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
  process.exit(fails ? 1 : 0);
})().catch(async (e) => {
  console.error("CRASHED:", e.message);
  await cleanup();
  process.exit(1);
});
