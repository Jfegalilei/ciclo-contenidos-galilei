/* Pila de capas abiertas (panel, editor, confirmacion, menu). Escape
   cierra siempre la de arriba, sin que cada capa sepa de las demas. */

var pila = [];

export var capas = {
  abrir: function(cerrar){
    capas.quitar(cerrar);
    pila.push(cerrar);
  },
  quitar: function(cerrar){
    var i = pila.indexOf(cerrar);
    if (i >= 0) pila.splice(i, 1);
  },
  hayAbiertas: function(){ return pila.length > 0; }
};

document.addEventListener("keydown", function(ev){
  if (ev.key !== "Escape" || !pila.length) return;
  ev.preventDefault();
  pila[pila.length - 1]();
});
