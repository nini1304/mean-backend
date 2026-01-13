// src/app.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const userRoutes = require("./routes/user.routes");
const roleRoutes = require("./routes/role.routes");
const contrasenaRoutes = require("./routes/contrasena.routes");
const authRoutes = require("./routes/auth.routes");
const tipoMascotaRoutes = require("./routes/tipo_mascota.routes");
const mascotaRoutes = require("./routes/mascota.routes");
const usuarioMascotaRoutes = require("./routes/usuario_mascota.routes");
const pacienteRoutes = require("./routes/paciente.routes");

// Cargar variables de entorno
dotenv.config();

// Conectar a Mongo
connectDB();

const app = express();
const PORT = process.env.PORT || 3000;


// Middlewares
app.use(cors());
app.use(express.json());
app.use("/api/roles", roleRoutes);
app.use("/api/users", userRoutes);
app.use("/api/contrasenas", contrasenaRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/tipo-mascota", tipoMascotaRoutes);
app.use("/api/mascotas", mascotaRoutes);
app.use("/api/usuario-mascota", usuarioMascotaRoutes);
app.use("/api/pacientes", pacienteRoutes);

// Ruta de prueba
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    message: "API MEAN funcionando correctamente 🚀",
  });
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
