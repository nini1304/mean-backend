// src/utils/password.util.js
function generarContrasenaSegura(longitud = 12) {
  const mayus = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const minus = "abcdefghijkmnpqrstuvwxyz";
  const nums = "23456789";
  const especiales = "!@$%&*?-_.";

  const todo = mayus + minus + nums + especiales;

  function charRandom(cadena) {
    return cadena[Math.floor(Math.random() * cadena.length)];
  }

  // Garantizar al menos uno de cada tipo
  let password = [
    charRandom(mayus),
    charRandom(minus),
    charRandom(nums),
    charRandom(especiales),
  ];

  // Completar hasta la longitud deseada
  for (let i = password.length; i < longitud; i++) {
    password.push(charRandom(todo));
  }

  // Mezclar caracteres (shuffle simple)
  password = password
    .map((c) => ({ c, r: Math.random() }))
    .sort((a, b) => a.r - b.r)
    .map((x) => x.c)
    .join("");

  return password;
}

module.exports = { generarContrasenaSegura };
