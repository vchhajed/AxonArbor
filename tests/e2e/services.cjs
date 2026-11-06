const { db, launch } = require("./lib.cjs");
const base = process.env.BASE;
const CE = "e2e.consultant@example-test.in", ME = "e2e.manager@example-test.in";
let fails = 0;
const ok = (cond, msg) => { console.log(cond ? "PASS" : "FAIL", msg); if (!cond) fails++; };
const cleanup = () => db.from("axon_arbor_accounts").delete().like("email", "e2e.%@example-test.in");

(async () => {
  await cleanup();
  const b = await launch();
  const ctx = () => b.newContext({ viewport: { width: 1280, height: 800 } }).then((c) => c.newPage());
  const c = await ctx(), co = await ctx(), a = await ctx();

  await c.goto(base + "/join/consultant");
  await c.fill("#f-full_name", "Service Tester (test)");
  await c.fill("#f-email", CE);
  await c.fill("#f-password", "testpass123");
  await c.check("input[name=terms]");
  await c.click("button[type=submit]");
  await c.waitForURL("**/account");
  await c.locator("label:has-text('Executive Coaching') input[type=checkbox]").check();
  await c.locator("label:has-text('Gen AI') input[type=checkbox]").check();
  await c.click("button[value=save]");
  await c.waitForSelector("text=Draft saved");
  ok(await c.locator("label:has-text('Gen AI') input[type=checkbox]").isChecked(), "services stay ticked after saving");
  await c.reload();
  await c.waitForSelector("text=Signed in as");
  ok(await c.locator("label:has-text('Executive Coaching') input[type=checkbox]").isChecked(), "services saved after a reload");
  const { data: p } = await db.from("axon_arbor_consultant_profiles").select("services_of_interest").eq("full_name", "Service Tester (test)").single();
  ok(p.services_of_interest.length === 2, `database has: ${p.services_of_interest.join(", ")}`);

  await co.goto(base + "/join/company");
  await co.fill("#f-company_name", "Manager Hotels (test)");
  await co.fill("#f-contact_name", "Rahul Mehta");
  await co.fill("#f-email", ME);
  await co.fill("#f-password", "testpass123");
  await co.check("input[name=terms]");
  await co.click("button[type=submit]");
  await co.waitForURL("**/join/company/thanks");

  await a.goto(base + "/admin/login");
  await a.fill("input[name=username]", process.env.ADMIN_USERNAME);
  await a.fill("input[name=password]", process.env.ADMIN_PASSWORD);
  await a.click("button[type=submit]");
  await a.waitForURL(base + "/admin");

  await a.goto(base + "/admin/consultants");
  await a.click("[role=tab]:has-text('All')");
  await a.click("button[aria-expanded]:has-text('Service Tester (test)')");
  await a.waitForSelector("text=Services of interest");
  ok((await a.locator("dd:has-text('Gen AI')").count()) >= 1, "admin sees the services");

  await a.goto(base + "/admin/companies");
  await a.click("button[aria-expanded]:has-text('Manager Hotels (test)')");
  await a.click("button:has-text('Approve company')");
  await a.click("dialog[open] button:has-text('Approve')");
  await a.waitForSelector("text=Saved");
  await a.goto(base + "/admin/companies");
  await a.click("[role=tab]:has-text('Approved')");
  await a.click("button[aria-expanded]:has-text('Manager Hotels (test)')");
  await a.click("button:has-text('Assign account manager')");
  await a.fill("dialog[open] textarea", "Anita Desai");
  await a.click("dialog[open] button:text-is('Save')");
  await a.waitForSelector("dd:has-text('Anita Desai')");
  ok(true, "admin assigns an account manager");

  await co.goto(base + "/sign-in");
  await co.fill("#f-email", ME);
  await co.fill("#f-password", "testpass123");
  await co.click("form button[type=submit]");
  await co.waitForURL("**/account");
  await co.waitForSelector("text=Your account manager is Anita Desai");
  ok(true, "company sees its account manager");

  await a.click("button:has-text('Change account manager')");
  await a.fill("dialog[open] textarea", "");
  await a.click("dialog[open] button:text-is('Save')");
  await a.waitForSelector("dd:has-text('Not assigned')");
  ok(true, "account manager can be cleared");

  await b.close();
  await cleanup();
  console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
  process.exit(fails ? 1 : 0);
})().catch(async (e) => {
  console.error("CRASHED:", e.message);
  await cleanup();
  process.exit(1);
});
