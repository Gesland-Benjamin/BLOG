import argon2 from 'argon2';
import User from '../models/User.model.js';
import { sequelize } from '../config/database.js';

async function createAdmin() {
  await sequelize.sync();

  const adminExists = await User.findOne({ where: { role: 'admin' } });
  if (!adminExists) {
    const hash = await argon2.hash('Alexandre145');
    await User.create({
      nom_prenom: 'Admin Principal',
      email: 'delbeemilie27500@gmail.com',
      mot_de_passe: hash,
      role: 'admin'
    });
    console.log('Admin créé');
  } else {
    console.log('Admin déjà existant');
  }
  process.exit();
}

createAdmin();