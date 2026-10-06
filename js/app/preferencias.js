/* Preferencias de este navegador (no se comparten con el equipo).
   localStorage puede fallar en ventana privada: nunca es obligatorio. */

var CLAVES = {libreria: "gali_cal_lib", compania: "gali_cal_compania", pestana: "gali_cal_pestana", tema: "gali_cal_tema"};

function leer(k, def){
  try { var v = localStorage.getItem(CLAVES[k]); return v == null ? def : v; } catch(e){ return def; }
}
function guardar(k, v){
  try { localStorage.setItem(CLAVES[k], v); } catch(e){}
}

export var preferencias = {
  libreriaAbierta: function(){ return leer("libreria", "1") !== "0"; },
  guardarLibreriaAbierta: function(v){ guardar("libreria", v ? "1" : "0"); },
  compania: function(){ return leer("compania", ""); },
  guardarCompania: function(id){ guardar("compania", id || ""); },
  // Que se ve en la barra lateral: la libreria o las temporadas.
  pestana: function(){ return leer("pestana", "libreria") === "temporadas" ? "temporadas" : "libreria"; },
  guardarPestana: function(p){ guardar("pestana", p); },
  // Oscuro por defecto, como todo producto Galilei.
  tema: function(){ return leer("tema", "dark") === "light" ? "light" : "dark"; },
  guardarTema: function(t){ guardar("tema", t); }
};
