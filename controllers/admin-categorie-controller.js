import Categorie from '../models/Categorie.model.js';
import Article from '../models/Article.model.js';
import { Op } from 'sequelize';
import { getPaginationParams, createPaginationData } from '../utils/pagination.js';
import { categorySchema } from '../validators/schemas.js';

// =========================
// LIST
// =========================
export const listCategories = async (req, res) => {
  try {
    console.log("📦 [LIST] GET /admin/categories");
    console.log("📄 Query:", req.query);

    const pageSize = 20;
    const { offset, limit, page } = getPaginationParams(req.query.page, pageSize);

    console.log("📊 Pagination:", { offset, limit, page });

    const { count, rows } = await Categorie.findAndCountAll({
      attributes: ['id', 'name', 'description'],
      order: [['name', 'ASC']],
      limit,
      offset
    });

    console.log(`📚 Categories trouvées: ${rows.length}/${count}`);

    const categoriesWithCount = await Promise.all(
      rows.map(async (cat) => {
        const articleCount = await Article.count({
          where: { categorieId: cat.id }
        });

        return {
          ...cat.toJSON(),
          articleCount
        };
      })
    );

    console.log("✅ Categories enrichies avec articleCount");

    const pagination = createPaginationData(
      count,
      page,
      pageSize,
      '/admin/categories'
    );

    res.render('admin-categories', {
      categories: categoriesWithCount,
      pagination,
      baseUrl: '/admin/categories',
      message: req.session.message || null
    });

    delete req.session.message;

  } catch (error) {
    console.error("❌ LIST CATEGORIES ERROR:", error);
    res.status(500).render('500');
  }
};

// =========================
// FORM ADD
// =========================
export const showAddCategoryForm = (req, res) => {
  console.log("📄 [FORM] GET /admin/categories/new");

  res.render('admin-category-form', {
    category: null,
    error: null,
    formData: {}
  });
};

// =========================
// FORM EDIT
// =========================
export const showEditCategoryForm = async (req, res) => {
  try {
    console.log("✏️ [FORM EDIT] ID:", req.params.id);

    const category = await Categorie.findByPk(req.params.id);

    if (!category) {
      console.log("❌ Category NOT FOUND");
      return res.status(404).render('404');
    }

    console.log("✅ Category trouvé:", category.name);

    res.render('admin-category-form', {
      category: category.toJSON(),
      error: null,
      formData: {}
    });

  } catch (error) {
    console.error("❌ EDIT FORM ERROR:", error);
    res.status(500).render('500');
  }
};

// =========================
// CREATE
// =========================
export const createCategory = async (req, res) => {
  try {
    console.log("🚀 [CREATE CATEGORY] POST /admin/categories");
    console.log("📦 BODY REÇU:", req.body);

    const { name, description } = req.body;

    console.log("🔎 name:", name);
    console.log("🔎 description:", description);

    // 🔥 VALIDATION
    const { error } = categorySchema.validate({ name });

    if (error) {
      console.log("❌ VALIDATION ERROR:", error.details);
      return res.render('admin-category-form', {
        category: null,
        error: error.details[0].message,
        formData: req.body
      });
    }

    const cleanName = name.trim();
    console.log("🧼 Clean name:", cleanName);

    const existing = await Categorie.findOne({
      where: { name: cleanName }
    });

    if (existing) {
      console.log("⚠️ Category déjà existante");
      return res.render('admin-category-form', {
        category: null,
        error: 'Cette catégorie existe déjà',
        formData: req.body
      });
    }

    const created = await Categorie.create({
      name: cleanName,
      description: description || null
    });

    console.log("✅ CATEGORY CREATED:", created.id, created.name);

    req.session.message = {
      type: 'success',
      text: 'Catégorie créée'
    };

    return res.redirect('/admin/categories');

  } catch (error) {
    console.error("❌ CREATE CATEGORY ERROR:", error);
    res.status(500).render('500');
  }
};

// =========================
// UPDATE
// =========================
export const updateCategory = async (req, res) => {
  try {
    console.log("✏️ [UPDATE CATEGORY] ID:", req.params.id);
    console.log("📦 BODY:", req.body);

    const { name, description } = req.body;

    const category = await Categorie.findByPk(req.params.id);

    if (!category) {
      console.log("❌ CATEGORY NOT FOUND");
      return res.status(404).render('404');
    }

    console.log("📌 Existing category:", category.name);

    const { error } = categorySchema.validate({ name });

    if (error) {
      console.log("❌ VALIDATION ERROR:", error.details);
      return res.render('admin-category-form', {
        category: category.toJSON(),
        error: error.details[0].message,
        formData: req.body
      });
    }

    const cleanName = name.trim();

    const existing = await Categorie.findOne({
      where: {
        name: cleanName,
        id: { [Op.ne]: req.params.id }
      }
    });

    if (existing) {
      console.log("⚠️ NAME ALREADY USED");
      return res.render('admin-category-form', {
        category: category.toJSON(),
        error: 'Nom déjà utilisé',
        formData: req.body
      });
    }

    await category.update({
      name: cleanName,
      description: description || null
    });

    console.log("✅ CATEGORY UPDATED");

    req.session.message = {
      type: 'success',
      text: 'Catégorie mise à jour'
    };

    res.redirect('/admin/categories');

  } catch (error) {
    console.error("❌ UPDATE CATEGORY ERROR:", error);
    res.status(500).render('500');
  }
};

// =========================
// DELETE
// =========================
export const deleteCategory = async (req, res) => {
  try {
    console.log("🗑️ [DELETE CATEGORY] ID:", req.params.id);

    const category = await Categorie.findByPk(req.params.id);

    if (!category) {
      console.log("❌ CATEGORY NOT FOUND");
      return res.status(404).render('404');
    }

    const articleCount = await Article.count({
      where: { categorieId: category.id }
    });

    console.log("📊 Articles liés:", articleCount);

    if (articleCount > 0) {
      console.log("🚫 DELETE BLOCKED (articles liés)");
      req.session.message = {
        type: 'error',
        text: `Impossible de supprimer : ${articleCount} article(s) lié(s)`
      };
      return res.redirect('/admin/categories');
    }

    await category.destroy();

    console.log("✅ CATEGORY DELETED");

    req.session.message = {
      type: 'success',
      text: 'Catégorie supprimée'
    };

    res.redirect('/admin/categories');

  } catch (error) {
    console.error("❌ DELETE CATEGORY ERROR:", error);
    res.status(500).render('500');
  }
};