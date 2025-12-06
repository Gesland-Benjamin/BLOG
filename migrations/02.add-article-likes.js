import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const tableName = "article";

async function run() {
  const queryInterface = sequelize.getQueryInterface();
  try {
    const columns = await queryInterface.describeTable(tableName);
    const hasLikes = Boolean(columns.likes);

    if (!hasLikes) {
      console.log("🚧 Ajout de la colonne likes sur", tableName);
      await queryInterface.addColumn(tableName, "likes", {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      });
      console.log("✅ Colonne likes ajoutée");
    } else {
      console.log("ℹ️ La colonne likes existe déjà, rien à faire");
    }
  } catch (error) {
    console.error("❌ Erreur lors de l'ajout de la colonne likes:", error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

run();
