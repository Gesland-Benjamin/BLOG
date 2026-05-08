import argon2 from 'argon2';
import User from '../models/User.model.js';
import { sequelize } from '../config/database.js';

async function createAdmin() {
  await sequelize.authenticate();

  const email = 'delbeemilie27500@gmail.com';
  const adminExists = await User.findOne({ where: { email } });

  if (!adminExists) {
    const hash = await argon2.hash('Alexandre145');
    await User.create({
      name: 'Admin Principal',
      email,
      password: hash,
      role: 'admin'
    });
    console.log('Admin créé');
  } else {
    await adminExists.update({
      name: 'Admin Principal',
      role: 'admin'
    });
    console.log('Admin déjà existant, mis à jour');
  }

  await sequelize.close();
}

createAdmin().catch(async (error) => {
  console.error('Erreur création admin:', error);
  await sequelize.close();
  process.exit(1);
});