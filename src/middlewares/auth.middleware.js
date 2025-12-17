// src/middlewares/auth.middleware.js
const jwt = require("jsonwebtoken");

exports.autenticarJWT = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  // Esperamos: Authorization: Bearer <token>
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: "Token de autenticación no proporcionado" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Guardamos el payload en la request para usarlo en los controladores
    req.user = decoded; // { sub, correo, rol: { id, nombre }, iat, exp }

    next();
  } catch (error) {
    console.error("Error verificando JWT:", error);
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
};
