import Categorie from '../models/Categorie.model.js';
import Article from '../models/Article.model.js';
import { Op } from 'sequelize';
import { getPaginationParams, createPaginationData } from '../utils/pagination.js';

// Liste toutes les catégories
export const listCategories = async (req, res) => {
  try {
    const pageSize = 20;
    const { offset, limit, page } = getPaginationParams(req.query.page, pageSize);

    const { count, rows } = await Categorie.findAndCountAll({
      attributes: ['id', 'nom'],
      order: [['nom', 'ASC']],
      limit,
      offset
    });

    // Ajouter le nombre d'articles par catégorie
    const categoriesWithCount = await Promise.all(
      rows.map(async (cat) => {
        const count = await Article.count({ where: { categorie_id: cat.id } });
        return { ...cat.toJSON(), articleCount: count };
      })
    );

    const baseUrl = '/admin/categories';
    const paginationData = createPaginationData(count, page, pageSize, baseUrl);

    res.render('admin-categories', { 
      categories: categoriesWithCount,
      pagination: paginationData,
      baseUrl
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des catégories:', error);
    res.status(500).render('500');
  }
};

// Affiche le formulaire d'ajout
export const showAddCategoryForm = async (req, res) => {
  try {
    res.render('admin-category-form', { category: null, error: null });
  } catch (error) {
    console.error('Erreur lors de l\'affichage du formulaire:', error);
    res.status(500).render('500');
  }
};

// Ajoute une nouvelle catégorie
export const createCategory = async (req, res) => {
  try {
    const { nom } = req.body;

    // Validation
    if (!nom || nom.trim() === '') {
      return res.render('admin-category-form', {
        category: null,
        error: 'Le nom de la catégorie est requis'
      });
    }

    // Vérifier si la catégorie existe déjà
    const existingCategory = await Categorie.findOne({
      where: { nom: nom.trim() }
    });

    if (existingCategory) {
      return res.render('admin-category-form', {
        category: null,
        error: 'Une catégorie avec ce nom existe déjà'
      });
    }

    // Créer la catégorie
    await Categorie.create({
      nom: nom.trim()
    });

    req.session.message = { type: 'success', text: 'Catégorie créée avec succès' };
    res.redirect('/admin/categories');
  } catch (error) {
    console.error('Erreur lors de la création de la catégorie:', error);
    res.status(500).render('500');
  }
};

// Affiche le formulaire d'édition
export const showEditCategoryForm = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Categorie.findByPk(id, {
      attributes: ['id', 'nom']
    });

    if (!category) {
      return res.status(404).render('404');
    }

    res.render('admin-category-form', { category: category.toJSON(), error: null });
  } catch (error) {
    console.error('Erreur lors de l\'affichage du formulaire d\'édition:', error);
    res.status(500).render('500');
  }
};

// Met à jour une catégorie
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom } = req.body;

    const category = await Categorie.findByPk(id, {
      attributes: ['id', 'nom']
    });

    if (!category) {
      return res.status(404).render('404');
    }

    // Validation
    if (!nom || nom.trim() === '') {
      return res.render('admin-category-form', {
        category: category.toJSON(),
        error: 'Le nom de la catégorie est requis'
      });
    }

    // Vérifier si un autre catégorie a déjà ce nom
    const existingCategory = await Categorie.findOne({
      where: { 
        nom: nom.trim(),
        id: { [Op.ne]: id }
      }
    });

    if (existingCategory) {
      return res.render('admin-category-form', {
        category: category.toJSON(),
        error: 'Une autre catégorie avec ce nom existe déjà'
      });
    }

    // Mettre à jour
    await category.update({ nom: nom.trim() });

    req.session.message = { type: 'success', text: 'Catégorie mise à jour avec succès' };
    res.redirect('/admin/categories');
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la catégorie:', error);
    res.status(500).render('500');
  }
};

// Supprime une catégorie
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Categorie.findByPk(id);

    if (!category) {
      return res.status(404).render('404');
    }

    // Compter les articles liés
    const articleCount = await Article.count({ where: { categorie_id: id } });

    // Supprimer tous les articles liés
    if (articleCount > 0) {
      await Article.destroy({ where: { categorie_id: id } });
    }

    // Supprimer la catégorie
    await category.destroy();

    req.session.message = {
      type: 'success',
      text: `Catégorie supprimée avec succès. ${articleCount > 0 ? articleCount + ' article(s) liés ont aussi été supprimés.' : ''}`
    };
    res.redirect('/admin/categories');
  } catch (error) {
    console.error('Erreur lors de la suppression de la catégorie:', error);
    res.status(500).render('500');
  }
};
