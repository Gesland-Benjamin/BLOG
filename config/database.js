import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../.env"),
  override: true
});

const DB_NAME = process.env.DB_NAME;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const rawDbHost = process.env.DB_HOST;
const normalizedDbHost = (rawDbHost || "localhost").trim();
const DB_HOST =
  process.env.NODE_ENV === "production" && (normalizedDbHost === "localhost" || normalizedDbHost === "::1")
    ? "127.0.0.1"
    : normalizedDbHost;
const DB_DIALECT = process.env.DB_DIALECT || "mysql";

if (!DB_NAME || !DB_USER || !DB_PASSWORD || !DB_HOST) {
  console.error("❌ Variables d’environnement DB manquantes !");
  process.exit(1);
}

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  dialect: DB_DIALECT,
  dialectOptions: {
    family: 4
  },

  logging: false, // 🔥 IMPORTANT (évite pollution logs en prod)

  define: {
    freezeTableName: true,

    // 🔥 BASE SNAKE_CASE STRICT
    underscored: true,

    timestamps: true,

    // 🔥 IMPORTANT: force cohérence totale Sequelize ↔ DB
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: false
  }
});

export default sequelize;
export { sequelize };

export async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log("✅ Connexion à la base réussie !");
  } catch (error) {
    console.error("❌ Impossible de se connecter à la base :", error.message);
  }
}