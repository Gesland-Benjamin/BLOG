#!/usr/bin/env node

/**
 * Script de test de l'export CSV
 */

import { sequelize } from '../config/database.js';
import NewsletterSubscriber from '../models/NewsletterSubscriber.model.js';

async function generateTestCSV() {
  try {
    console.log('\n📊 Génération d\'un exemple d\'export CSV\n');
    
    const subscribers = await NewsletterSubscriber.findAll({
      order: [['date_inscription', 'DESC']]
    });
    
    // Générer le CSV
    let csv = 'Email,Statut,Date Inscription,Date Confirmation\n';
    
    subscribers.forEach(sub => {
      const email = sub.email;
      const statut = sub.confirmed ? 'Confirmé' : 'En attente';
      const dateInscription = sub.date_inscription ? 
        new Date(sub.date_inscription).toLocaleDateString('fr-FR') : '';
      const dateConfirmation = sub.confirmed_at ? 
        new Date(sub.confirmed_at).toLocaleDateString('fr-FR') : '';
      
      csv += `"${email}","${statut}","${dateInscription}","${dateConfirmation}"\n`;
    });
    
    console.log('📄 Aperçu du CSV généré:\n');
    console.log(csv);
    
    console.log(`\n✅ Export terminé - ${subscribers.length} abonné(s)\n`);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

generateTestCSV();
