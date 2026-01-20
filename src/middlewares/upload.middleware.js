// src/middlewares/upload.middleware.js
const multer = require("multer");

// En memoria (no en disco). Luego lo subimos a MinIO.
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB (ajusta a tu gusto)
});

module.exports = { upload };
