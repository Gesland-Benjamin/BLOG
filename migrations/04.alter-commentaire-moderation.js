import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const tableName = "commentaire";

async function run() {
  const qi = sequelize.getQueryInterface();
  try {
    const desc = await qi.describeTable(tableName);

    if (!desc.nom) {
      console.log("🚧 Ajout colonne nom");
      await qi.addColumn(tableName, "nom", { type: DataTypes.STRING(150), allowNull: true });
    }

    if (!desc.statut) {
      console.log("🚧 Ajout colonne statut");
      await qi.addColumn(tableName, "statut", {
        type: DataTypes.ENUM("pending", "approved", "rejected"),
        allowNull: false,
        defaultValue: "pending"
      });
    }

    if (!desc.is_spam) {
      console.log("🚧 Ajout colonne is_spam");
      await qi.addColumn(tableName, "is_spam", {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
    }

    if (desc.user_id && desc.user_id.allowNull === false) {
      console.log("🚧 Rendre user_id nullable (commentaires visiteurs)");
      await qi.changeColumn(tableName, "user_id", {
        type: DataTypes.INTEGER,
        allowNull: true
      });
    }

    console.log("✅ Migration commentaire terminée");
  } catch (error) {
    console.error("❌ Erreur migration commentaire:", error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

run();
