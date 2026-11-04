const crypto = require('crypto');

// Genera una contraseña temporal de 8 caracteres que cumple la politica
// del sistema: al menos 1 mayuscula y 1 numero.
function generarContrasena() {
  const mayusculas = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const minusculas = 'abcdefghijkmnpqrstuvwxyz';
  const numeros = '23456789';
  const todos = mayusculas + minusculas + numeros;

  const chars = [
    mayusculas[crypto.randomInt(mayusculas.length)],
    numeros[crypto.randomInt(numeros.length)]
  ];

  for (let i = 0; i < 6; i++) {
    chars.push(todos[crypto.randomInt(todos.length)]);
  }

  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join('');
}

module.exports = { generarContrasena };
