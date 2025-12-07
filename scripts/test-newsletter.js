#!/usr/bin/env node

/**
 * Script de test de la newsletter
 */

import { sequelize } from '../config/database.js';
import NewsletterSubscriber from '../models/NewsletterSubscriber.model.js';

async function testNewsletter() {
  try {
    console.log('\n📧 Test de la fonctionnalité Newsletter\n');
    
    // Statistiques
    const allSubscribers = await NewsletterSubscriber.findAll();
    const confirmedSubscribers = allSubscribers.filter(s => s.confirmed);
    const pendingSubscribers = allSubscribers.filter(s => !s.confirmed);
    
    console.log('📊 Statistiques:');
    console.log(`  Total d'abonnés: ${allSubscribers.length}`);
    console.log(`  ✅ Confirmés: ${confirmedSubscribers.length}`);
    console.log(`  ⏳ En attente: ${pendingSubscribers.length}`);
    
    if (allSubscribers.length > 0) {
      console.log('\n📋 Liste des abonnés:');
      allSubscribers.forEach(sub => {
        const status = sub.confirmed ? '✅' : '⏳';
        const date = sub.confirmed_at 
          ? `confirmé le ${sub.confirmed_at.toLocaleDateString()}` 
          : `inscrit le ${sub.date_inscription.toLocaleDateString()}`;
        console.log(`  ${status} ${sub.email} - ${date}`);
      });
    }
    
    console.log('\n✅ Test terminé\n');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

testNewsletter();
