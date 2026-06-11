/**
 * Vercel Serverless Function — step-2b: debug + import test
 */
let mainApp = null;
let importErr = null;

try {
  const mod = await import("../artifacts/api-server/dist/app.mjs");
  mainApp = mod.default;
} catch (err) {
  importErr = { message: err.message, code: err.code };
}

export default function handler(req, res) {
  // Debug route — shows runtime env vars
  if (req.url?.startsWith("/api/_debug_env")) {
    const raw = process.env.DATABASE_URL ?? "(undefined)";
    const firstCharCode = raw.charCodeAt(0);
    // show first 80 chars un-redacted so we can see if BOM/encoding is right
    return res.json({
      DATABASE_URL_prefix: raw.slice(0, 80),
      DATABASE_URL_len: raw.length,
      firstCharCode,                // 65279=BOM, 112='p'
      firstCharHex: firstCharCode.toString(16),
      hasBOM: firstCharCode === 0xFEFF,
      SUPABASE_URL: process.env.SUPABASE_URL ?? "(undefined)",
      NODE_ENV: process.env.NODE_ENV,
      importErr,
    });
  }
  if (importErr) {
    return res.status(500).json({ importFailed: true, ...importErr });
  }
  return mainApp(req, res);
}
