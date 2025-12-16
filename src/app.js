// src/app.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const userRoutes = require("./routes/user.routes");
const roleRoutes = require("./routes/role.routes");

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
