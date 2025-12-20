export default function langMiddleware(req, res, next) {
  const supported = new Set(["fr", "en"]);
  let lang = req.cookies?.lang;

  if (req.query && typeof req.query.lang === "string") {
    const q = req.query.lang.toLowerCase();
    if (supported.has(q)) {
      lang = q;
      res.cookie("lang", lang, { httpOnly: false, sameSite: "lax", maxAge: 365*24*60*60*1000 });
    }
  }

  if (!supported.has(lang)) {
    lang = "fr"; // défaut
  }

  res.locals.lang = lang;
  next();
}
