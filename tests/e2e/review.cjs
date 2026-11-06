const fs = require("fs");
const { db, launch } = require("./lib.cjs");
const base = process.env.BASE, log = process.env.MOCK_EMAIL_LOG;
const S = require("node:path").join(__dirname, "fixtures") + "/";
let fails = 0;
const ok = (cond, msg) => { console.log(cond ? "PASS" : "FAIL", msg); if (!cond) fails++; };
const emails = () => (fs.existsSync(log) ? fs.readFileSync(log, "utf8").trim().split("\n").filter(Boolean).flatMap((l) => JSON.parse(l)) : []);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function cleanup() {
  for (let i = 0; i < 4; i++) await db.from("axon_arbor_accounts").delete().like("email", "e2e.%@example-test.in");
  await db.from("axon_arbor_submissions").delete().like("email", "e2e.%@example-test.in");
  await db.from("axon_arbor_rate_limits").delete().neq("id", 0);
}
const status = async (email) => {
  const { data: a } = await db.from("axon_arbor_accounts").select("id").eq("email", email).single();
  const { data } = await db.from("axon_arbor_consultant_profiles").select("profile_status").eq("account_id", a.id).single();
  return data.profile_status;
};
const setProfile = async (email, values) => {
  const { data: a } = await db.from("axon_arbor_accounts").select("id").eq("email", email).single();
  await db.from("axon_arbor_consultant_profiles").update(values).eq("account_id", a.id);
};

(async () => {
  await cleanup();
  const b = await launch();
  const ctx = () => b.newContext({ viewport: { width: 1280, height: 800 }, acceptDownloads: true }).then((c) => c.newPage());
  const a = await ctx();
  await a.goto(base + "/admin/login");
  await a.fill("input[name=username]", process.env.ADMIN_USERNAME);
  await a.fill("input[name=password]", process.env.ADMIN_PASSWORD);
  await a.click("button[type=submit]");
  await a.waitForURL(base + "/admin");

  const importFile = async (name) => {
    await a.goto(base + "/admin/consultants");
    await a.waitForTimeout(1500);
    await a.setInputFiles("input[aria-label='Excel template']", S + name);
    await a.waitForTimeout(1500);
    return a.locator("section[aria-label='Import consultants']");
  };

  // --- Excel unhappy paths
  let panel = await importFile("x-fake.xlsx");
  ok((await panel.innerText()).includes("Couldn’t read that file"), "a fake .xlsx gets a clear error");
  panel = await importFile("x-wrong-sheet.xlsx");
  ok((await panel.innerText()).includes("doesn’t look like the consultant template"), "a different spreadsheet is refused");
  panel = await importFile("x-blank.xlsx");
  ok((await panel.innerText()).includes("no consultants in this file"), "the blank template is refused");
  panel = await importFile("x-old-template.xlsx");
  ok((await panel.innerText()).includes("1 consultant found"), "an old template without services still reads");
  await a.click("button:has-text('Import now')");
  await a.waitForSelector("text=imported,");
  const { count: oldOk } = await db.from("axon_arbor_accounts").select("id", { count: "exact", head: true }).eq("email", "e2e.old@example-test.in");
  ok(oldOk === 1, "old template imports");
  panel = await importFile("x-dups.xlsx");
  await a.click("button:has-text('Import now')");
  await a.waitForSelector("text=imported,");
  const dups = await panel.innerText();
  ok(/2\s+imported,\s+2\s+skipped/.test(dups), "duplicates and no-consent rows are skipped");
  ok(dups.includes("Row 5") && dups.includes("Already has an account"), "duplicate inside the file reported with its row");
  ok(dups.includes("Row 6") && dups.includes("Consent isn’t marked Yes"), "missing consent reported");
  const { data: comma } = await db.from("axon_arbor_consultant_profiles").select("services_of_interest").eq("full_name", "Comma Service (test)").single();
  ok(comma?.services_of_interest.includes("Diversity, Equity & Inclusion"), "service containing a comma imports");

  const started = Date.now();
  panel = await importFile("x-full300.xlsx");
  ok((await panel.innerText()).includes("300 consultants found"), "reads all 300 rows");
  await a.click("button:has-text('Import now')");
  await a.waitForSelector("text=imported,", { timeout: 300000 });
  ok(/300\s+imported,\s+0\s+skipped/.test(await panel.innerText()), `300 rows imported in ${Math.round((Date.now() - started) / 1000)}s`);
  await a.reload();
  await a.click("[role=tab]:has-text('All')");
  await a.waitForSelector("text=Bulk 299 (test)", { timeout: 20000 });
  ok(true, "admin list loads with 300+ consultants");

  // --- formulas in the CSV
  const x = await ctx();
  await x.goto(base + "/join/consultant");
  await x.fill("#f-full_name", '=HYPERLINK("https://evil.tld","Open")');
  await x.fill("#f-email", "e2e.formula@example-test.in");
  await x.fill("#f-password", "testpass123");
  await x.check("input[name=terms]");
  await x.click("button[type=submit]");
  await x.waitForURL("**/account");
  await a.reload();
  await a.click("[role=tab]:has-text('All')");
  await a.waitForSelector("text=Bulk 1 (test)");
  const [dl] = await Promise.all([a.waitForEvent("download"), a.click("button:has-text('Download CSV')")]);
  const csv = fs.readFileSync(await dl.path(), "utf8");
  ok(csv.includes(`"'=HYPERLINK`), "formula is neutralised in the CSV");

  // --- pending profile can't be made live by declining removal; removal goes straight through
  await setProfile("e2e.formula@example-test.in", { profile_status: "pending", consent: true });
  await x.reload();
  x.on("dialog", (d) => d.accept());
  await x.click("button:has-text('Request removal')");
  await x.waitForSelector("text=Your profile has been removed");
  ok((await status("e2e.formula@example-test.in")) === "removed", "removing a pending profile is immediate");

  // --- no consent, no live profile
  await setProfile("e2e.formula@example-test.in", { profile_status: "pending", consent: false, full_name: "No Consent Yet (test)" });
  await a.goto(base + "/admin/consultants");
  await a.click("button[aria-expanded]:has-text('No Consent Yet (test)')");
  await a.click("button:has-text('Approve profile')");
  await a.click("dialog[open] button:has-text('Approve')");
  await a.waitForSelector("dialog[open] [role=alert]");
  ok((await a.locator("dialog[open] [role=alert]").innerText()).includes("no consent"), "profile without consent can't go live; error shows in the dialog");
  ok((await status("e2e.formula@example-test.in")) === "pending", "status unchanged");

  // --- live edits must stay complete
  await setProfile("e2e.formula@example-test.in", { profile_status: "live", consent: true });
  await x.goto(base + "/account");
  await x.click("button[value=save]");
  await x.waitForSelector("#f-phone-error");
  ok((await status("e2e.formula@example-test.in")) === "live", "incomplete edit to a live profile is refused");

  // --- pause can't approve
  const co = await ctx();
  await co.goto(base + "/join/company");
  await co.fill("#f-company_name", "Pause Hotels (test)");
  await co.fill("#f-contact_name", "Rahul Mehta");
  await co.fill("#f-email", "e2e.pause@example-test.in");
  await co.fill("#f-password", "testpass123");
  await co.check("input[name=terms]");
  await co.click("button[type=submit]");
  await co.waitForURL("**/join/company/thanks");
  await a.goto(base + "/admin/companies");
  await a.click("button[aria-expanded]:has-text('Pause Hotels (test)')");
  ok((await a.locator("button:has-text('Pause account')").count()) === 0, "pending company has no Pause button");

  // --- automatic reply is limited and carries no links
  const before = emails().filter((e) => e.subject.includes("received your message")).length;
  for (let i = 0; i < 4; i++) {
    await a.request.post(base + "/api/contact", { data: { name: "https://spam.tld click", organisation: "Spam Org", email: "e2e.victim@example-test.in", message: "Testing the automatic reply limit please." } });
    await wait(700);
  }
  await wait(1500);
  const replies = emails().filter((e) => e.subject.includes("received your message")).slice(before);
  ok(replies.length === 2, `automatic replies limited: ${replies.length} of 4`);
  ok(replies[0] && !replies[0].text.includes("spam.tld") && replies[0].text.startsWith("Hi there"), "reply doesn’t repeat the sender’s text");

  await b.close();
  await cleanup();
  console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
  process.exit(fails ? 1 : 0);
})().catch(async (e) => {
  console.error("CRASHED:", e.message);
  await cleanup();
  process.exit(1);
});
