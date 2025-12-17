exports.requerirRol = (rolesPermitidos = []) => {
  return (req, res, next) => {
    const rolUsuario = req.user?.rol?.nombre; // lo que pusimos en el token

    if (!rolUsuario) {
      return res.status(403).json({ message: "Rol de usuario no disponible" });
    }

    if (!rolesPermitidos.includes(rolUsuario)) {
      return res.status(403).json({
        message: "No tienes permisos para acceder a este recurso",
      });
    }

    next();
  };
};