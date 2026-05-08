import Categorie from "../models/Categorie.model.js";

/* =========================
   VALIDATION MIDDLEWARE
   (ADMIN + API SAFE VERSION)
========================= */
export const validateRequest = (schema, options = {}) => {
  return async (req, res, next) => {
    try {
      const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        const errors = error.details.map(d => d.message);

        console.log("❌ VALIDATION ERROR:", errors);

        // =========================
        // API MODE (JSON)
        // =========================
        if (
          req.xhr ||
          req.headers.accept?.includes("application/json") ||
          options.api === true
        ) {
          return res.status(400).json({
            success: false,
            errors
          });
        }

        // =========================
        // ADMIN MODE (VIEW RENDER)
        // =========================
        let categories = [];

        try {
          categories = await Categorie.findAll({
            order: [["name", "ASC"]]
          });
        } catch (e) {
          console.error("❌ Error loading categories:", e);
        }

        return res.status(400).render("new-article", {
          errors,
          formData: req.body,
          categories,
          isEditing: false,
          article: {}
        });
      }

      req.body = value;
      next();
    } catch (err) {
      console.error("❌ validateRequest crash:", err);
      return res.status(500).send("Erreur validation serveur");
    }
  };
};

/* =========================
   FLASH ERRORS (OPTIONNEL UI)
========================= */
export const getFlashErrors = (req, res, next) => {
  res.locals.errors = req.session?.errors || [];
  res.locals.formData = req.session?.formData || {};

  if (req.session) {
    delete req.session.errors;
    delete req.session.formData;
  }

  next();
};