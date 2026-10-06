/* Estado de la pantalla en un solo sitio. Quien lo cambia no sabe quien
   lo pinta: cada vista se suscribe y se repinta sola. */

export function crearEstado(inicial){
  var s = inicial, oyentes = [], pendiente = false;

  // Varios cambios en el mismo turno se pintan una sola vez. No se usa
  // requestAnimationFrame: se detiene con la pestana en segundo plano.
  function avisar(){
    if (pendiente) return;
    pendiente = true;
    Promise.resolve().then(function(){
      pendiente = false;
      oyentes.forEach(function(fn){ fn(s); });
    });
  }

  return {
    get: function(){ return s; },
    cambiar: function(parche){ Object.assign(s, parche); avisar(); },
    alCambiar: function(fn){ oyentes.push(fn); }
  };
}
