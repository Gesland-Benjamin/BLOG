import argon2 from 'argon2';
import User from '../models/User.model.js';
import sequelize from './database.js';
import { registerSchema } from '../validators/schemas.js';

// Provisionnement explicite seulement ; ne jamais promouvoir un compte existant.
async function createAdmin() {
  if (process.env.ALLOW_ADMIN_PROVISION !== 'yes') throw new Error('Provisionnement désactivé.');
  const { value, error } = registerSchema.validate({ name: process.env.ADMIN_NAME, email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_INITIAL_PASSWORD, password_confirm: process.env.ADMIN_INITIAL_PASSWORD });
  if (error) throw new Error('Variables de provisionnement invalides.');
  if (await User.findOne({ where: { email: value.email } })) throw new Error('Compte déjà existant : aucune modification effectuée.');
  await User.create({ name: value.name, email: value.email, password: await argon2.hash(value.password), role: 'admin' });
  console.log('Administrateur créé. Retirez les variables de provisionnement.');
}
createAdmin().catch(() => { console.error('Provisionnement refusé ou échoué.'); process.exitCode = 1; }).finally(() => sequelize.close());
