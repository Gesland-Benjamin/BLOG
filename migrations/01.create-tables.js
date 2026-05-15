import { sequelize } from "../config/database.js";
import { initAssociations } from "../models/index.js";

console.log("🚧 Creation des tables");
initAssociations();
await sequelize.sync({ force: true });

const queryInterface = sequelize.getQueryInterface();

const usersColumns = await queryInterface.describeTable("users");
if (usersColumns.createdAt && !usersColumns.created_at) {
	await queryInterface.renameColumn("users", "createdAt", "created_at");
}
if (usersColumns.updatedAt && !usersColumns.updated_at) {
	await queryInterface.renameColumn("users", "updatedAt", "updated_at");
}

const categoriesColumns = await queryInterface.describeTable("categories");
if (categoriesColumns.createdAt && !categoriesColumns.created_at) {
	await queryInterface.renameColumn("categories", "createdAt", "created_at");
}
if (categoriesColumns.updatedAt && !categoriesColumns.updated_at) {
	await queryInterface.renameColumn("categories", "updatedAt", "updated_at");
}

const articlesColumns = await queryInterface.describeTable("articles");
if (articlesColumns.userId && !articlesColumns.user_id) {
	await sequelize.query('ALTER TABLE `articles` DROP FOREIGN KEY `articles_ibfk_1`');
	await sequelize.query('ALTER TABLE `articles` DROP FOREIGN KEY `articles_ibfk_2`');
	await queryInterface.renameColumn("articles", "userId", "user_id");
	await queryInterface.renameColumn("articles", "categorieId", "categorie_id");
	await sequelize.query('ALTER TABLE `articles` ADD CONSTRAINT `articles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE');
	await sequelize.query('ALTER TABLE `articles` ADD CONSTRAINT `articles_ibfk_2` FOREIGN KEY (`categorie_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE');
}

console.log("✅ Tables créées avec succès");

await sequelize.close();

