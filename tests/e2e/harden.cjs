const { db, launch } = require("./lib.cjs");
const base = process.env.BASE;
const CE = "e2e.consultant@example-test.in", ME = "e2e.manager@example-test.in";
let fails = 0;
const ok = (cond, msg) => { console.log(cond ? "PASS" : "FAIL", msg); if (!cond) fails++; };
const status = (p) => p.textContent("p.font-serif.text-2xl").then((t) => t.trim());
const path = (p) => new URL(p.url()).pathname;

async function cleanup() {
  const { data } = await db.from("axon_arbor_accounts").select("id").like("email", "e2e.%@example-test.in");
  for (const a of data ?? []) {
    const folder = `consultants/${a.id}`;
    const { data: files } = await db.storage.from("axon-arbor-media").list(folder);
    if (files?.length) await db.storage.from("axon-arbor-media").remove(files.map((f) => `${folder}/${f.name}`));
  }
  await db.from("axon_arbor_accounts").delete().like("email", "e2e.%@example-test.in");
  await db.from("axon_arbor_rate_limits").delete().like("key", "%example-test.in%");
}

(async () => {
  await cleanup();
  const b = await launch();
  const ctx = () => b.newContext({ viewport: { width: 1280, height: 800 } }).then((c) => c.newPage());
  const co = await ctx(), c = await ctx(), c2 = await ctx(), a = await ctx(), d = await ctx();
  c.on("dialog", (x) => x.accept());

  // company validation
  await co.goto(base + "/join/company");
  await co.fill("#f-company_name", "Example Hotels (test)");
  await co.fill("#f-contact_name", "Rahul Mehta");
  await co.fill("#f-email", "rahul@gmail.com");
  await co.fill("#f-password", "testpass123");
  await co.check("input[name=terms]");
  await co.fill("#f-website", "javascript:alert(1)");
  await co.fill("#f-phone", "call me");
  await co.click("button[type=submit]");
  await co.waitForSelector("#f-email-error");
  ok((await co.locator("#f-website-error").count()) === 1, "bad website rejected");
  ok((await co.locator("#f-phone-error").count()) === 1, "bad phone rejected");
  ok((await co.inputValue("#f-password")) === "testpass123", "password kept after error");
  await co.fill("#f-email", ME);
  await co.fill("#f-website", "examplehotels.in");
  await co.fill("#f-phone", "+91 11 4000 1234");
  await co.click("button[type=submit]");
  await co.waitForURL("**/join/company/thanks");
  const { data: comp } = await db.from("axon_arbor_company_profiles").select("website").eq("email_domain", "example-test.in").single();
  ok(comp.website === "https://examplehotels.in/", `website normalised: ${comp.website}`);

  // consultant
  await c.goto(base + "/join/consultant");
  await c.fill("#f-full_name", "Priya Sharma (test)");
  await c.fill("#f-email", CE);
  await c.fill("#f-password", "testpass123");
  await c.check("input[name=terms]");
  await c.click("button[type=submit]");
  await c.waitForURL("**/account");
  ok((await status(c)) === "Not submitted", "consultant signed up");

  // duplicate email
  await d.goto(base + "/join/consultant");
  await d.fill("#f-full_name", "Dup");
  await d.fill("#f-email", CE);
  await d.fill("#f-password", "testpass123");
  await d.check("input[name=terms]");
  await d.click("button[type=submit]");
  await d.waitForSelector("text=already exists");
  ok(true, "duplicate email refused");

  // tampered photo and non-LinkedIn link
  await c.fill("#f-phone", "+91 98765 43210");
  await c.selectOption("#f-city", "Mumbai");
  await c.fill("#f-years_experience", "12");
  await c.selectOption("#f-expertise_1", "Executive Coaching");
  await c.fill("#f-industries", "Hospitality");
  await c.selectOption("#f-delivery_mode", { index: 1 });
  await c.fill("#f-languages", "English");
  await c.fill("#f-bio", "Coach.");
  await c.check("input[name=consent]");
  await c.fill("#f-linkedin_url", "https://evil.example.com/x");
  await c.click("button[value=submit]");
  await c.waitForSelector("#f-linkedin_url-error");
  ok(true, "non-LinkedIn link rejected");
  await c.fill("#f-linkedin_url", "linkedin.com/in/priya");
  await c.evaluate(() => {
    const input = document.querySelector("input[name=photo_url]");
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, "https://evil.example.com/pixel.png");
  });
  await c.click("button[value=submit]");
  await c.waitForSelector("text=reviewing your profile");
  const { data: prof } = await db.from("axon_arbor_consultant_profiles").select("photo_url, linkedin_url").eq("full_name", "Priya Sharma (test)").single();
  ok(prof.photo_url === null, `outside photo address ignored: ${prof.photo_url}`);
  ok(prof.linkedin_url === "https://linkedin.com/in/priya", `LinkedIn normalised: ${prof.linkedin_url}`);

  // second device, then password change
  await c2.goto(base + "/sign-in");
  await c2.fill("#f-email", CE);
  await c2.fill("#f-password", "testpass123");
  await c2.click("button[type=submit]");
  await c2.waitForURL("**/account");
  await c.fill("#f-current_password", "testpass123");
  await c.fill("#f-new_password", "newpass4567");
  await c.click("button:has-text('Change password')");
  await c.waitForSelector("text=signed out on any other devices");
  await c.reload();
  await c.waitForSelector("text=Signed in as");
  ok(path(c) === "/account", "this device stays signed in after password change");
  await c2.goto(base + "/account");
  await c2.waitForURL("**/sign-in", { timeout: 15000 }).catch(() => {});
  ok(path(c2) === "/sign-in", "other device signed out after password change");

  // admin
  await a.goto(base + "/admin/login");
  await a.fill("input[name=username]", process.env.ADMIN_USERNAME);
  await a.fill("input[name=password]", process.env.ADMIN_PASSWORD);
  await a.click("button[type=submit]");
  await a.waitForURL(base + "/admin");
  await a.goto(base + "/admin/companies");
  await a.click("button:has-text('Example Hotels (test)')");
  await a.click("button:has-text('Approve company')");
  await a.click("dialog[open] button:has-text('Approve')");
  await a.waitForSelector("text=Saved");
  await co.goto(base + "/sign-in");
  await co.fill("#f-email", ME);
  await co.fill("#f-password", "testpass123");
  await co.click("form button[type=submit]");
  await co.waitForURL("**/account");
  await co.waitForSelector("p.font-serif.text-2xl");
  ok((await status(co)) === "Approved", "company approved");

  await a.click("[role=tab]:has-text('All')");
  const [dl] = await Promise.all([a.waitForEvent("download"), a.click("button:has-text('Download CSV')")]);
  const csv = require("fs").readFileSync(await dl.path(), "utf8");
  ok(csv.includes("company_name") && csv.includes("Example Hotels (test)"), "companies CSV downloads");

  // admin reset signs the company out
  const row = a.locator("button[aria-expanded]:has-text('Example Hotels (test)')");
  if ((await row.getAttribute("aria-expanded")) !== "true") await row.click();
  await a.waitForSelector("button:has-text('Reset password')");
  await a.click("button:has-text('Reset password')");
  await a.click("dialog[open] button:has-text('Reset password')");
  await a.waitForSelector("dialog[open] p.font-mono");
  await a.click("dialog[open] button:has-text('Done')");
  await co.goto(base + "/account");
  await co.waitForURL("**/sign-in", { timeout: 15000 }).catch(() => {});
  ok(path(co) === "/sign-in", "admin password reset signs the company out");

  // delete consultant
  await a.goto(base + "/admin/consultants");
  await a.click("[role=tab]:has-text('All')");
  await a.click("button[aria-expanded]:has-text('Priya Sharma (test)')");
  await a.click("button:has-text('Delete account')");
  await a.click("dialog[open] button:has-text('Delete permanently')");
  await a.waitForSelector("text=Saved");
  const { data: gone } = await db.from("axon_arbor_accounts").select("id").eq("email", CE);
  ok(gone.length === 0, "admin delete erases the account");
  await c.goto(base + "/account");
  await c.waitForURL("**/sign-in", { timeout: 15000 }).catch(() => {});
  ok(path(c) === "/sign-in", "deleted account is signed out");

  await b.close();
  await cleanup();
  console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
  process.exit(fails ? 1 : 0);
})().catch(async (e) => {
  console.error("CRASHED:", e.message);
  await cleanup();
  process.exit(1);
});
