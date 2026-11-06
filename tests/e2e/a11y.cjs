// Accessibility: axe's WCAG A/AA rules on the account pages, plus keyboard checks.
const fs = require("node:fs");
const { db, launch } = require("./lib.cjs");
const base = process.env.BASE;
const CE = "e2e.a11y.consultant@example-test.in", ME = "e2e.a11y.company@example-test.in";
const axeSource = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
let fails = 0;
const ok = (cond, msg) => { console.log(cond ? "PASS" : "FAIL", msg); if (!cond) fails++; };

async function cleanup() {
  await db.from("axon_arbor_accounts").delete().like("email", "e2e.a11y.%@example-test.in");
  await db.from("axon_arbor_rate_limits").delete().like("key", "%example-test.in%");
}

async function audit(p, label) {
  await p.waitForTimeout(1000);
  await p.evaluate(axeSource);
  const { violations } = await p.evaluate(() => window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }));
  ok(violations.length === 0, `axe: ${label}`);
  for (const v of violations) {
    console.log(`   ${v.impact}: ${v.id}: ${v.help}`);
    for (const n of v.nodes.slice(0, 3)) console.log(`     ${n.target.join(" ")} ${n.any[0]?.message ?? ""}`.slice(0, 200));
  }
}

/** Tabs through the page, returning what gained focus and whether it could be seen. */
async function tabThrough(p, presses) {
  const seen = [];
  for (let i = 0; i < presses; i++) {
    await p.keyboard.press("Tab");
    seen.push(await p.evaluate(() => {
      const e = document.activeElement, s = getComputedStyle(e);
      if (e === document.body) return { name: "(end of page)", outlined: true }; // focus has left the page
      // Form fields show focus with a thicker, black underline
      const underlined = parseFloat(s.borderBottomWidth) >= 2 && s.borderBottomColor === "rgb(0, 0, 0)";
      return { name: e.name || e.textContent?.trim().slice(0, 30) || e.tagName, outlined: s.outlineStyle !== "none" || s.boxShadow !== "none" || underlined };
    }));
  }
  return seen;
}

(async () => {
  await cleanup();
  const b = await launch();
  const ctx = () => b.newContext({ viewport: { width: 1280, height: 800 } }).then((c) => c.newPage());
  const p = await ctx();

  for (const path of ["/sign-in", "/forgot-password", "/set-password?token=x", "/confirm-email?token=x", "/join/consultant", "/join/company", "/join/company/thanks", "/privacy", "/terms"]) {
    await p.goto(base + path);
    await audit(p, path);
  }

  // Errors must reach screen readers
  await p.goto(base + "/join/company");
  await p.waitForTimeout(1000);
  await p.click("button[type=submit]");
  await p.waitForSelector("form [role=alert]");
  await audit(p, "/join/company with errors");
  const email = p.locator("#f-email");
  ok((await email.getAttribute("aria-invalid")) === "true", "a field with an error is marked invalid");
  const described = await email.getAttribute("aria-describedby");
  ok(Boolean(described) && (await p.locator(`[id="${described.split(" ")[0]}"]`).count()) === 1, "a field's error is linked to it");

  // Keyboard only: sign up
  const k = await ctx();
  await k.goto(base + "/join/consultant");
  await k.waitForTimeout(1000);
  await k.keyboard.press("Tab");
  ok((await k.evaluate(() => document.activeElement.textContent)).includes("Skip"), "first Tab reaches the skip link");
  await k.keyboard.press("Enter");
  await k.waitForTimeout(200);
  const stops = await tabThrough(k, 45);
  const names = stops.map((s) => s.name);
  ok(["full_name", "email", "password", "terms"].every((n) => names.includes(n)), "keyboard reaches every sign-up field");
  ok(!names.includes("website_url"), "keyboard skips the hidden bot trap");
  const hidden = stops.filter((s) => !s.outlined).map((s) => s.name);
  ok(hidden.length === 0, `focus can always be seen${hidden.length ? `: ${hidden.slice(0, 6).join(", ")}` : ""}`);

  await k.goto(base + "/join/consultant");
  await k.waitForTimeout(1000);
  await k.focus("#f-full_name");
  await k.keyboard.type("Keyboard Tester (test)");
  await k.keyboard.press("Tab");
  await k.keyboard.type(CE);
  await k.keyboard.press("Tab");
  await k.keyboard.type("testpass123");
  await k.focus("input[name=terms]");
  await k.keyboard.press("Space");
  await k.keyboard.press("Enter");
  await k.waitForURL("**/account", { timeout: 15000 });
  ok(true, "a consultant can sign up with the keyboard alone");
  await audit(k, "/account (consultant)");

  const co = await ctx();
  await co.goto(base + "/join/company");
  await co.waitForTimeout(1000);
  await co.fill("#f-company_name", "Keyboard Hotels (test)");
  await co.fill("#f-contact_name", "Rahul Mehta");
  await co.fill("#f-email", ME);
  await co.fill("#f-password", "testpass123");
  await co.check("input[name=terms]");
  await co.click("button[type=submit]");
  await co.waitForURL("**/join/company/thanks");

  const a = await ctx();
  await a.goto(base + "/admin/login");
  await a.waitForTimeout(800);
  await audit(a, "/admin/login");
  await a.fill("input[name=username]", process.env.ADMIN_USERNAME);
  await a.fill("input[name=password]", process.env.ADMIN_PASSWORD);
  await a.click("button[type=submit]");
  await a.waitForURL(base + "/admin");
  await a.goto(base + "/admin/consultants");
  await audit(a, "/admin/consultants");
  await a.goto(base + "/admin/companies");
  await a.waitForTimeout(800);
  const row = a.locator("button[aria-expanded]:has-text('Keyboard Hotels (test)')");
  await row.focus();
  await a.keyboard.press("Enter");
  await a.waitForSelector("button:has-text('Approve company')");
  ok((await row.getAttribute("aria-expanded")) === "true", "an admin row opens with the keyboard");
  await audit(a, "/admin/companies with a row open");
  await a.focus("button:has-text('Approve company')");
  await a.keyboard.press("Enter");
  await a.waitForSelector("dialog[open]");
  await audit(a, "approve dialog");
  ok(await a.evaluate(() => document.querySelector("dialog[open]").contains(document.activeElement)), "focus moves into the dialog");
  await a.keyboard.press("Escape");
  await a.waitForTimeout(300);
  ok((await a.locator("dialog[open]").count()) === 0, "Esc closes the dialog");

  await a.goto(base + "/admin/companies");
  await a.waitForTimeout(800);
  await a.click("button[aria-expanded]:has-text('Keyboard Hotels (test)')");
  await a.click("button:has-text('Approve company')");
  await a.click("dialog[open] button:has-text('Approve')");
  await a.waitForSelector("text=Saved");
  const c = await ctx();
  await c.goto(base + "/sign-in");
  await c.waitForTimeout(1000);
  await c.fill("#f-email", ME);
  await c.fill("#f-password", "testpass123");
  await c.click("button[type=submit]");
  await c.waitForURL("**/account");
  await audit(c, "/account (company)");

  await b.close();
  await cleanup();
  console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
  process.exit(fails ? 1 : 0);
})().catch(async (e) => {
  console.error("CRASHED:", e.message);
  await cleanup();
  process.exit(1);
});
