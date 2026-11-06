// Loaded into the test server only: records emails instead of sending them.
const fs = require("fs");
const log = process.env.MOCK_EMAIL_LOG;
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init) => {
  if (String(url).startsWith("https://api.resend.com/")) {
    fs.appendFileSync(log, init.body + "\n");
    return new Response(JSON.stringify({ id: "mock" }), { status: 200 });
  }
  return realFetch(url, init);
};
