/* Barra lateral: la libreria de piezas reutilizables.
   Una pieza se arrastra a un dia para programarla (se COPIA) y se abre
   con un clic para editarla. */

import { TIPOS, TIPO_KEYS, FAMILIAS, FAM_KEYS } from "../dominio/catalogos.js";
import { nivelPct, pctTxt } from "../dominio/participacion.js";
import { piezasVisibles, califDePieza } from "../app/consultas.js";
import { $, esc, opciones } from "./dom.js";
import { coloresDe } from "./colores.js";

export function montarLibreria(acciones, editores, estado){
  var list = $("libList");

  $("libNew").onclick = function(){ editores.pieza(null); };

  $("libSearch").oninput = function(){ acciones.filtrarLibreria({q: this.value}); };
  var tipo = $("libTypeSel"), fam = $("libFamSel");
  tipo.innerHTML = opciones([{v:"", l:"Todo tipo"}].concat(TIPO_KEYS.map(function(k){ return {v:k, l:TIPOS[k].label + "s"}; })), "");
  tipo.onchange = function(){ acciones.filtrarLibreria({tipo: tipo.value}); };
  fam.innerHTML = opciones([{v:"", l:"Toda categoria"}].concat(FAM_KEYS.map(function(k){ return {v:k, l:FAMILIAS[k].label}; })), "");
  fam.onchange = function(){ acciones.filtrarLibreria({fam: fam.value}); };

  list.addEventListener("click", function(ev){
    var el = ev.target.closest("[data-lib]");
    if (!el) return;
    var id = el.getAttribute("data-lib");
    var it = estado.get().libreria.filter(function(x){ return x.id === id; })[0];
    if (it) editores.pieza(it);
  });
  list.addEventListener("dragstart", function(ev){
    var el = ev.target.closest("[data-lib]");
    if (!el) return;
    ev.dataTransfer.setData("text/plain", "lib:" + el.getAttribute("data-lib"));
    ev.dataTransfer.effectAllowed = "copy";
    el.classList.add("arrastrando");
  });
  list.addEventListener("dragend", function(ev){
    var el = ev.target.closest("[data-lib]");
    if (el) el.classList.remove("arrastrando");
  });

  function tarjeta(s, it){
    var c = it.type === "reto" ? califDePieza(s, it.id) : null;
    var meta = [];
    if (it.familia) meta.push('<span class="cat"><i></i>' + esc(FAMILIAS[it.familia].label) + "</span>");
    else meta.push("<span>" + esc(TIPOS[it.type].label) + "</span>");
    if (c) meta.push('<span class="pct ' + nivelPct(c.pct) + '" title="Participacion promedio">' + pctTxt(c.pct) + "</span>");
    return '<div class="libitem" draggable="true" data-lib="' + it.id + '" style="' + coloresDe(it) + '" title="' +
           esc((it.copy || "").slice(0, 240)) + '"><span class="ltit">' + esc(it.title || "Sin titulo") + "</span>" +
           '<span class="lmeta">' + meta.join("") + "</span></div>";
  }

  return {
    pintar: function(s){
      $("app").classList.toggle("sin-lateral", !s.libAbierta);
      $("libCount").textContent = s.libreria.length || "";
      var items = piezasVisibles(s);
      list.innerHTML = items.length ? items.map(function(it){ return tarjeta(s, it); }).join("")
        : '<div class="empty">' + (!s.conectado && !s.libreria.length ? "Cargando la libreria."
          : s.libreria.length ? "Nada coincide con el filtro." : "La libreria esta vacia.") + "</div>";
    }
  };
}
