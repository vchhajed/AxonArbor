// Shared setup for the browser tests.
const path = require("node:path");
const { chromium } = require("playwright-core");
const { createClient } = require("@supabase/supabase-js");

try {
  process.loadEnvFile(path.resolve(__dirname, "../../.env.local"));
} catch {}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://geajhjiceaocsljqffkh.supabase.co";
if (!process.env.SUPABASE_SECRET_KEY) throw new Error("SUPABASE_SECRET_KEY is missing from .env.local");

exports.chromium = chromium;
exports.db = createClient(url, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
exports.launch = () => chromium.launch({ channel: "chrome" });
