/* Tres canales de aviso que conviven:
   - toast: pasa y se va (confirmaciones de lo que se hizo);
   - fijo: estado o error de conexion, se queda hasta que se limpia;
   - vista: lo que calcula la propia pantalla en cada pintada. */

import { $, esc } from "./dom.js";
import { ICONO } from "./iconos.js";

export function crearAvisos(){
  var timer = null, fijoHtml = "", vistaHtml = "";

  function bloque(msg, tipo){
    return '<div class="notice' + (tipo === "err" ? " err" : "") + '">' + ICONO.info + "<span>" + esc(msg) + "</span></div>";
  }
  function pintar(){ $("notice").innerHTML = fijoHtml + vistaHtml; }

  return {
    toast: function(msg){
      var t = $("toast");
      t.textContent = msg;
      t.classList.add("show");
      clearTimeout(timer);
      timer = setTimeout(function(){ t.classList.remove("show"); }, 2800);
    },
    fijo: function(msg, tipo){
      fijoHtml = msg ? bloque(msg, tipo) : "";
      pintar();
    },
    // Uno o varios textos; cada uno en su propio bloque.
    vista: function(lista){
      vistaHtml = (lista || []).map(function(m){ return bloque(m); }).join("");
      pintar();
    }
  };
}
