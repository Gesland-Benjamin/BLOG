import User from "../models/User.model.js";

export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    await User.destroy({ where: { id: userId } });
    res.redirect("/admin/dashboard");
  } catch (error) {
    console.error("Erreur suppression utilisateur:", error);
    res.status(500).send("Erreur lors de la suppression de l'utilisateur");
  }
};
