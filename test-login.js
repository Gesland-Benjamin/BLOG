import { User } from './models/index.js';
import sequelize from './config/database.js';
import argon2 from 'argon2';

async function testLogin() {
  console.log('\n=== TEST LOGIN ===\n');

  // Chercher l'utilisateur SANS scope (avec password exclu)
  const userNoScope = await User.findOne({ where: { email: 'delbeemilie27500@gmail.com' } });
  console.log('1. User WITHOUT scope (should exclude password):');
  console.log('   Fields:', Object.keys(userNoScope?.dataValues || {}));
  console.log('   Password value:', userNoScope?.password);

  // Chercher l'utilisateur AVEC scope withPassword
  const userWithScope = await User.scope('withPassword').findOne({ where: { email: 'delbeemilie27500@gmail.com' } });
  console.log('\n2. User WITH scope("withPassword"):');
  console.log('   Fields:', Object.keys(userWithScope?.dataValues || {}));
  console.log('   Password value:', userWithScope?.password ? '✅ PRESENT' : '❌ MISSING');

  // Test de vérification du mot de passe
  if (userWithScope?.password) {
    try {
      const valid = await argon2.verify(userWithScope.password, 'Alexandre145');
      console.log('\n3. Password verification:');
      console.log('   Result:', valid ? '✅ VALID' : '❌ INVALID');
    } catch (err) {
      console.error('   Error:', err.message);
    }
  }

  await sequelize.close();
}

testLogin().catch(console.error);
