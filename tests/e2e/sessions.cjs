// Sign-in state: the header, guest-only pages, and admin and account sessions being exclusive.
const { db, launch } = require("./lib.cjs");
const base = process.env.BASE;
const CE = "e2e.session.consultant@example-test.in";
const PASSWORD = "testpass123";
let fails = 0;
const ok = (cond, msg) => { console.log(cond ? "PASS" : "FAIL", msg); if (!cond) fails++; };
const path = (p) => new URL(p.url()).pathname;
const settle = (p, glob) => p.waitForURL(glob, { timeout: 15000 }).catch(() => {});
const cleanup = () => db.from("axon_arbor_accounts").delete().like("email", "e2e.session.%@example-test.in");

async function signIn(p, email, password) {
  await p.goto(base + "/sign-in");
  await p.fill("#f-email", email);
  await p.fill("#f-password", password);
  await p.click("form button[type=submit]");
  await p.waitForURL("**/account");
}
async function adminLogin(p) {
  await p.goto(base + "/admin/login");
  await p.fill("input[name=username]", process.env.ADMIN_USERNAME);
  await p.fill("input[name=password]", process.env.ADMIN_PASSWORD);
  await p.click("button[type=submit]");
  await p.waitForURL(base + "/admin");
}
/** True when /admin opens the dashboard rather than sending the visitor to the login page. */
async function adminOpen(p) {
  await p.goto(base + "/admin");
  await settle(p, "**/admin/login");
  return path(p) === "/admin";
}
/** True when /account opens rather than sending the visitor to /sign-in. */
async function accountOpen(p) {
  await p.goto(base + "/account");
  await settle(p, "**/sign-in");
  return path(p) === "/account";
}
const headerLink = (p, name) => p.locator("header").getByRole("link", { name, exact: true });
const headerButton = (p, name) => p.locator("header").getByRole("button", { name, exact: true });
/** Signs out with the Sign out button at the bottom of /account. */
async function accountSignOut(p) {
  await p.goto(base + "/account");
  await p.getByRole("main").getByRole("button", { name: "Sign out", exact: true }).click();
  await p.waitForURL("**/sign-in");
}

(async () => {
  await cleanup();
  const b = await launch();
  const ctx = () => b.newContext({ viewport: { width: 1280, height: 800 } }).then((c) => c.newPage());
  const u = await ctx(), x = await ctx();

  // signed out: the header offers Sign in
  await u.goto(base + "/");
  ok((await headerLink(u, "Sign in").count()) === 1 && (await headerLink(u, "My account").count()) === 0, "signed out, the header shows Sign in");

  // sign up as a consultant (signed in straight away)
  await u.goto(base + "/join/consultant");
  await u.fill("#f-full_name", "TEST Session Consultant");
  await u.fill("#f-email", CE);
  await u.fill("#f-password", PASSWORD);
  await u.check("input[name=terms]");
  await u.click("button[type=submit]");
  await u.waitForURL("**/account");

  // signed in: My account instead of Sign in on every public page; no Sign out in the header; the waitlist button stays
  for (const page of ["/", "/about", "/account"]) {
    await u.goto(base + page);
    await headerLink(u, "My account").waitFor({ timeout: 15000 }).catch(() => {});
    ok(
      (await headerLink(u, "My account").count()) === 1 &&
        (await headerLink(u, "Sign in").count()) === 0 &&
        (await headerButton(u, "Sign out").count()) === 0 &&
        (await headerLink(u, "Join the waitlist").count()) === 1,
      `signed in, the header shows My account (no Sign out) on ${page}`,
    );
  }
  await headerLink(u, "My account").click();
  await u.waitForURL("**/account");
  ok(true, "My account opens /account");

  // phone: the same in the menu
  await u.setViewportSize({ width: 390, height: 844 });
  await u.goto(base + "/");
  await headerLink(u, "My account").waitFor({ timeout: 15000 }).catch(() => {}); // the signed-in header has streamed in
  await u.getByRole("button", { name: "Open menu" }).click();
  const mobile = u.getByRole("navigation", { name: "Mobile" });
  await mobile.getByRole("link", { name: "My account" }).waitFor({ timeout: 15000 }).catch(() => {});
  ok(
    (await mobile.getByRole("link", { name: "My account" }).count()) === 1 &&
      (await mobile.getByRole("link", { name: "Sign in" }).count()) === 0 &&
      (await mobile.getByRole("button", { name: "Sign out" }).count()) === 0,
    "phone menu shows My account instead of Sign in",
  );
  await u.setViewportSize({ width: 1280, height: 800 });

  // guest-only pages send a signed-in person to their account
  for (const page of ["/sign-in", "/join/company", "/join/consultant"]) {
    await u.goto(base + page);
    await settle(u, "**/account");
    ok(path(u) === "/account", `${page} redirects to /account when signed in`);
  }

  // Sign out: one amber button at the bottom right of /account, below the Password section
  await u.goto(base + "/account");
  const signOut = u.getByRole("main").getByRole("button", { name: "Sign out", exact: true });
  const [box, password] = await Promise.all([signOut.boundingBox(), u.getByRole("heading", { name: "Password" }).boundingBox()]);
  ok((await signOut.count()) === 1 && box && password && box.y > password.y && box.x > 1280 / 2, "account page has one Sign out, at the bottom right");
  ok((await signOut.evaluate((e) => getComputedStyle(e).backgroundColor)) === "rgb(255, 193, 7)", "Sign out uses the amber theme colour");
  await accountSignOut(u);
  ok((await headerLink(u, "Sign in").count()) === 1 && (await headerLink(u, "My account").count()) === 0, "Sign out signs out and the header shows Sign in again");
  ok(!(await accountOpen(u)), "after Sign out, /account needs signing in");
  await u.goto(base + "/sign-in");
  ok(path(u) === "/sign-in" && (await u.locator("#f-email").count()) === 1, "signed out, /sign-in shows the form");

  // signing in as a consultant ends the admin session
  await adminLogin(x);
  ok(await adminOpen(x), "admin is signed in");
  await signIn(x, CE, PASSWORD);
  ok(!(await adminOpen(x)), "signing in as a consultant ends the admin session");
  ok(await accountOpen(x), "the consultant session is active");

  // signing in as admin ends the consultant session
  await adminLogin(x);
  ok(await adminOpen(x), "admin signed in again");
  ok(!(await accountOpen(x)), "signing in as admin ends the consultant session");
  await x.goto(base + "/");
  ok((await headerLink(x, "Sign in").count()) === 1, "the public header shows Sign in for the admin");

  // signing out of one session leaves the other alone (both cookies present, as in a browser from before this change)
  const adminCookie = (await x.context().cookies()).find((c) => c.name === "aa_admin");
  await signIn(u, CE, PASSWORD);
  const accountCookie = (await u.context().cookies()).find((c) => c.name === "aa_account");
  const both = await ctx();
  await both.context().addCookies([adminCookie, accountCookie]);
  ok((await adminOpen(both)) && (await accountOpen(both)), "setup: both sessions active in one browser");
  await accountSignOut(both);
  ok(await adminOpen(both), "account Sign out keeps the admin session");
  await both.context().addCookies([accountCookie]);
  await both.goto(base + "/admin");
  await both.locator("form button:has-text('Sign out')").first().click();
  await both.waitForURL("**/admin/login");
  ok(await accountOpen(both), "admin Sign out keeps the account session");

  await b.close();
  await cleanup();
  console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
  process.exit(fails ? 1 : 0);
})().catch(async (e) => {
  console.error("CRASHED:", e.message);
  await cleanup();
  process.exit(1);
});
