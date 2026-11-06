const fs = require("fs");
const { db, launch } = require("./lib.cjs");
const base = process.env.BASE, log = process.env.MOCK_EMAIL_LOG, xlsx = process.env.IMPORT_FILE;
const CE = "e2e.consultant@example-test.in", ME = "e2e.manager@example-test.in", AD = "e2e.added@example-test.in", EN = "e2e.enquiry@example-test.in";
let fails = 0;
const ok = (cond, msg) => { console.log(cond ? "PASS" : "FAIL", msg); if (!cond) fails++; };
const emails = () => (fs.existsSync(log) ? fs.readFileSync(log, "utf8").trim().split("\n").filter(Boolean).flatMap((l) => JSON.parse(l)) : []);
const sent = (to, subject) => emails().filter((e) => e.to.includes(to) && e.subject.includes(subject));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function cleanup() {
  await db.from("axon_arbor_accounts").delete().like("email", "e2e.%@example-test.in");
  await db.from("axon_arbor_submissions").delete().like("email", "e2e.%@example-test.in");
  await db.from("axon_arbor_rate_limits").delete().like("key", "%example-test.in%");
}

(async () => {
  await cleanup();
  const b = await launch();
  const ctx = () => b.newContext({ viewport: { width: 1280, height: 800 } }).then((c) => c.newPage());
  const c = await ctx(), co = await ctx(), a = await ctx();

  await c.goto(base + "/join/consultant");
  await c.fill("#f-full_name", "Mail Tester (test)");
  await c.fill("#f-email", CE);
  await c.fill("#f-password", "testpass123");
  await c.check("input[name=terms]");
  await c.click("button[type=submit]");
  await c.waitForURL("**/account");

  await co.goto(base + "/join/company");
  await co.fill("#f-company_name", "Mail Hotels (test)");
  await co.fill("#f-contact_name", "Rahul Mehta");
  await co.fill("#f-email", ME);
  await co.fill("#f-password", "testpass123");
  await co.check("input[name=terms]");
  await co.click("button[type=submit]");
  await co.waitForURL("**/join/company/thanks");

  const res = await c.request.post(base + "/api/contact", {
    data: { name: "Asha Rao", organisation: "Test Org", email: EN, message: "Testing the acknowledgement email please." },
  });
  ok(res.ok(), `contact form accepted (${res.status()})`);

  await a.goto(base + "/admin/login");
  await a.fill("input[name=username]", process.env.ADMIN_USERNAME);
  await a.fill("input[name=password]", process.env.ADMIN_PASSWORD);
  await a.click("button[type=submit]");
  await a.waitForURL(base + "/admin");

  // Approve with the account manager in the same step
  await a.goto(base + "/admin/companies");
  await a.click("button[aria-expanded]:has-text('Mail Hotels (test)')");
  await a.click("button:has-text('Approve company')");
  await a.fill("dialog[open] textarea", "Anita Desai");
  await a.click("dialog[open] button:has-text('Approve')");
  await a.waitForSelector("text=Saved");
  const { data: comp } = await db.from("axon_arbor_company_profiles").select("account_manager").eq("email_domain", "example-test.in").single();
  ok(comp.account_manager === "Anita Desai", "account manager set during approval");

  // Add by hand
  await a.goto(base + "/admin/consultants");
  await a.click("button:has-text('Add consultant')");
  await a.fill("dialog[open] input[name=add_name]", "Added Person (test)");
  await a.fill("dialog[open] input[name=add_email]", AD);
  await a.click("dialog[open] button:text-is('Add')");
  await a.waitForSelector("dialog[open] p.font-mono");
  await a.click("dialog[open] button:has-text('Done')");

  await wait(2500);
  ok(sent(CE, "Welcome").length === 1, "consultant gets Welcome");
  ok(sent(ME, "received your registration").length === 1, "company gets Request received");
  ok(sent(EN, "received your message").length === 1, "enquirer gets Request received");
  ok(emails().some((e) => e.subject.startsWith("New enquiry")), "team alert still sent");
  const companyWelcome = sent(ME, "Welcome")[0];
  ok(companyWelcome?.text.includes("Anita Desai") && companyWelcome?.text.includes("/sign-in"), "approved company gets Welcome with manager and sign-in link");
  const invite = sent(AD, "Welcome")[0];
  ok(invite?.text.includes("/set-password?token="), "added consultant gets a set-password link");

  // Set-password link works once
  const link = invite.text.match(/https?:\S+set-password\S+/)[0];
  const n = await ctx();
  await n.goto(link);
  await n.fill("#f-new_password", "short");
  await n.click("form button[type=submit]");
  await n.waitForSelector("form [role=alert]");
  ok((await n.inputValue("#f-new_password")) === "short", "weak password rejected, field kept");
  await n.fill("#f-new_password", "chosenpass123");
  await n.click("form button[type=submit]");
  await n.waitForURL("**/account");
  ok(true, "set-password link signs the person in");
  const n2 = await ctx();
  await n2.goto(link);
  await n2.fill("#f-new_password", "anotherpass123");
  await n2.click("form button[type=submit]");
  await n2.waitForSelector("text=expired or has already been used");
  ok(true, "link can't be reused");

  // Excel import
  await a.goto(base + "/admin/consultants");
  await a.waitForTimeout(2000); // let the page finish loading before choosing a file
  await a.setInputFiles("input[aria-label='Excel template']", xlsx);
  await a.waitForSelector("text=consultants found");
  const found = await a.locator("section[aria-label='Import consultants']").innerText();
  ok(found.includes("5 consultants found"), "reads 5 rows and skips the template example");
  await a.click("button:has-text('Import now')");
  await a.waitForSelector("text=imported,", { timeout: 60000 });
  const out = await a.locator("section[aria-label='Import consultants']").innerText();
  ok(/2\s+imported,\s+3\s+skipped/.test(out), "2 imported, 3 skipped");
  ok(out.includes("Atlantis") && out.includes("Email isn’t valid") && out.includes("Already has an account"), "each skipped row says why");
  const { data: p } = await db.from("axon_arbor_consultant_profiles").select("full_name, profile_status, expertise, services_of_interest, consent, city").eq("full_name", "Import Good (test)").single();
  ok(p.profile_status === "draft" && p.city === "Mumbai" && p.expertise[0] === "Corporate Finance" && p.services_of_interest.length === 2 && p.consent === true, "imported profile is a draft with its details");
  await wait(2000);
  ok(sent("e2e.import1@example-test.in", "Welcome").length === 1, "imported consultant gets an invite");
  const [dl] = await Promise.all([a.waitForEvent("download"), a.click("button:has-text('Download invite links')")]);
  ok(fs.readFileSync(await dl.path(), "utf8").includes("set-password?token="), "invite links download");

  await b.close();
  await cleanup();
  console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
  process.exit(fails ? 1 : 0);
})().catch(async (e) => {
  console.error("CRASHED:", e.message);
  await cleanup();
  process.exit(1);
});
