import NewsletterSubscriber from "../models/NewsletterSubscriber.model.js";
import User from "../models/User.model.js";
import { getPaginationParams, createPaginationData } from "../utils/pagination.js";

// Liste des abonnés (admin uniquement)
export const listSubscribers = async (req, res) => {
  try {
    const pageSize = 20;
    const { offset, limit, page } = getPaginationParams(req.query.page, pageSize);
    const search = req.query.search ? req.query.search.trim() : '';

    // Filtrage dynamique
    const where = {};
    if (search) {
      where[Symbol.for('or')] = [
        { email: { [Symbol.for('like')]: `%${search}%` } },
        { date_inscription: { [Symbol.for('like')]: `%${search}%` } }
      ];
    }

    const { count, rows } = await NewsletterSubscriber.findAndCountAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['nom_prenom'] }],
      order: [['date_inscription', 'DESC']],
      limit,
      offset
    });

    const stats = {
      total: count,
      confirmed: rows.filter(s => s.confirmed).length,
      pending: rows.filter(s => !s.confirmed).length
    };

    const baseUrl = '/admin/newsletter';
    const paginationData = createPaginationData(count, page, pageSize, baseUrl);

    res.render("admin-newsletter", {
      title: "Gestion de la newsletter",
      subscribers: rows,
      stats,
      pagination: paginationData,
      baseUrl,
      user: req.user,
      search
    });
  } catch (error) {
    console.error('Erreur liste abonnés:', error);
    res.status(500).render("500", { error: error.message });
  }
};

// Export CSV des abonnés
export const exportSubscribersCSV = async (req, res) => {
  try {
    const { status } = req.query; // 'all', 'confirmed', 'pending'
    
    let whereClause = {};
    if (status === 'confirmed') {
      whereClause.confirmed = true;
    } else if (status === 'pending') {
      whereClause.confirmed = false;
    }
    
    const subscribers = await NewsletterSubscriber.findAll({
      where: whereClause,
      include: [{ model: User, as: 'user', attributes: ['nom_prenom'] }],
      order: [['date_inscription', 'DESC']]
    });
    
    // Générer le CSV
    let csv = 'Email,Statut,Date Inscription,Date Confirmation,Utilisateur\n';
    
    subscribers.forEach(sub => {
      const email = sub.email;
      const statut = sub.confirmed ? 'Confirmé' : 'En attente';
      const dateInscription = sub.date_inscription ? 
        new Date(sub.date_inscription).toLocaleDateString('fr-FR') : '';
      const dateConfirmation = sub.confirmed_at ? 
        new Date(sub.confirmed_at).toLocaleDateString('fr-FR') : '';
      const userName = sub.user ? sub.user.nom_prenom : '';
      
      csv += `"${email}","${statut}","${dateInscription}","${dateConfirmation}","${userName}"\n`;
    });
    
    // Définir les headers pour le téléchargement
    const filename = `newsletter_${status || 'all'}_${new Date().toISOString().split('T')[0]}.csv`;
    const bom = '\uFEFF';
    const csvWithBom = bom + csv;
    res.set('Content-Type', 'text/csv; charset=utf-8');
    res.set('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Envoyer le CSV (avec BOM) en une seule fois et sortir
    return res.send(csvWithBom);
    
  } catch (error) {
    console.error('Erreur export CSV:', error);
    if (res.headersSent) {
      // Réponse déjà envoyée, ne pas renvoyer
      return;
    }
    return res.status(500).send('Erreur lors de l\'export');
  }
};

// Supprimer un abonné (admin)
export const deleteSubscriber = async (req, res) => {
  try {
    const { id } = req.params;
    
    const subscriber = await NewsletterSubscriber.findByPk(id);
    if (!subscriber) {
      return res.status(404).json({ error: 'Abonné non trouvé' });
    }
    
    await subscriber.destroy();
    
    res.redirect('/admin/newsletter?message=Abonné supprimé avec succès');
  } catch (error) {
    console.error('Erreur suppression abonné:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
};

// Renvoyer email de confirmation (admin)
export const resendConfirmation = async (req, res) => {
  try {
    const { id } = req.params;
    
    const subscriber = await NewsletterSubscriber.findByPk(id);
    if (!subscriber) {
      return res.status(404).json({ error: 'Abonné non trouvé' });
    }
    
    if (subscriber.confirmed) {
      return res.status(400).json({ error: 'Cet abonné est déjà confirmé' });
    }
    
    // Importer la fonction d'envoi d'email
    const { sendNewsletterConfirmationEmail } = await import('../services/email.js');
    
    await sendNewsletterConfirmationEmail(subscriber.email, subscriber.confirmation_token);
    
    res.json({ success: true, message: 'Email de confirmation renvoyé' });
  } catch (error) {
    console.error('Erreur renvoi email:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi' });
  }
};
