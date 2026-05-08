import sequelize from "./database.js";

(async () => {
  try {
    await sequelize.authenticate();
    console.log("Connexion réussie ✅");
  } catch (err) {
    console.error("Erreur de connexion ❌", err);
  }
})();