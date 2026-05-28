import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envBeforeDotenv = {
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  DB_HOST: process.env.DB_HOST,
  NODE_ENV: process.env.NODE_ENV
};

dotenv.config({
  path: path.resolve(__dirname, "../.env"),
  override: true
});

const DB_NAME = process.env.DB_NAME;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const rawDbHost = (process.env.DB_HOST || "localhost").trim();
const DB_HOST = rawDbHost === "127.0.0.1" || rawDbHost === "::1" ? "localhost" : rawDbHost;
const DB_DIALECT = process.env.DB_DIALECT || "mysql";

const maskValue = (value) => {
  if (!value) return "<unset>";
  if (value.length <= 4) return "****";
  return `${value.slice(0, 2)}***${value.slice(-2)}`;
};

const envPath = path.resolve(__dirname, "../.env");
const envProductionPath = path.resolve(__dirname, "../.env.production");


const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  dialect: DB_DIALECT,

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