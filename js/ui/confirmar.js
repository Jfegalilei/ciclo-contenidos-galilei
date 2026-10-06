/* Dialogo de confirmacion antes de borrar. Va por encima de todo. */

import { $ } from "./dom.js";
import { capas } from "./capas.js";

var alAceptar = null;

function cerrar(){
  alAceptar = null;
  $("cwrap").classList.remove("open");
  capas.quitar(cerrar);
}

// textoHtml ya debe venir escapado por quien llama.
export function confirmar(titulo, textoHtml, fn){
  alAceptar = fn;
  $("cTitle").textContent = titulo;
  $("cTexto").innerHTML = textoHtml;
  $("cwrap").classList.add("open");
  capas.abrir(cerrar);
  $("cNo").focus();
}

$("cNo").onclick = cerrar;
$("cSi").onclick = function(){
  var fn = alAceptar;
  cerrar();
  if (fn) fn();
};
$("cwrap").addEventListener("mousedown", function(ev){ if (ev.target === this) cerrar(); });
