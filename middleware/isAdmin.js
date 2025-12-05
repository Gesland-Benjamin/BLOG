export default function isAdmin(req, res, next) {
    console.log("req.user dans isAdmin :", req.user);
  if (req.user && req.user.role.toLowerCase() === 'admin') {
    return next();
  }
  res.status(403).send('Accès refusé');
}