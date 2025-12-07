export async function up(queryInterface, Sequelize) {
  try {
    await queryInterface.addColumn('USER', 'reset_token', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('USER', 'reset_token_expiry', {
      type: Sequelize.DATE,
      allowNull: true
    });

    console.log('Migration: Colonnes reset_token et reset_token_expiry ajoutées');
  } catch (error) {
    console.error('Erreur lors de la migration:', error);
    throw error;
  }
}

export async function down(queryInterface, Sequelize) {
  try {
    await queryInterface.removeColumn('USER', 'reset_token');
    await queryInterface.removeColumn('USER', 'reset_token_expiry');
    console.log('Migration rollback: Colonnes supprimées');
  } catch (error) {
    console.error('Erreur lors du rollback:', error);
    throw error;
  }
}
