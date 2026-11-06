# Browser tests

These drive a real browser through sign-up, approvals, passwords, limits, emails and Excel import.

```
npm run test:e2e                     # build, then run everything (about 5 minutes)
npm run test:e2e -- reset            # one suite
npm run test:e2e -- reset --no-build # reuse the last build
```

You need Google Chrome and a `.env.local` with the admin login and Supabase secret key.

- **They use the real database.** They only create accounts ending `@example-test.in`, and delete them when they finish. If a run is stopped halfway, the next run clears them.
- **They never send real emails.** The runner uses a fake Resend key and records emails to a temporary file.
- **Don't run two at once.** They share ports 3123 and 3124, and the same test accounts.

| Suite | Covers |
| --- | --- |
| `gate` | Company approval before login, adding accounts by hand |
| `services` | Services of interest and account managers |
| `harden` | Sessions, password changes, form validation |
| `limits` | Login and sign-up limits |
| `review` | Excel unhappy paths (including 300 rows), consent, pausing, CSV safety |
| `reset` | Forgotten password and company email confirmation |
| `emails` | Every account email, set-password links, Excel import |
| `a11y` | WCAG A/AA rules on the account and admin pages, and keyboard use |

`reset` adjusts to whether `20261105120000_axon_arbor_company_email_confirmed.sql` has been run: it prints which, and only checks that a confirmation saves once it has.
