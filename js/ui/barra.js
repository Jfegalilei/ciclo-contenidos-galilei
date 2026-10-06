/* Barra superior: navegacion entre vueltas (con el mapa de la vuelta),
   filtro por compania, pestanas de la barra lateral y el menu de
   ajustes (duracion del ciclo, tema de color y sesion). */

import { COMPANIAS, nombreCompania } from "../dominio/catalogos.js";
import { WEEKS_MIN, WEEKS_MAX, numeroDeVuelta } from "../dominio/ciclo.js";
import { TEMAS } from "../dominio/temporadas.js";
import { corta, hoy, ymd, lunesDe } from "../dominio/fechas.js";
import { vuelta } from "../app/consultas.js";
import { $, esc, opciones, plural } from "./dom.js";
import { capas } from "./capas.js";

export function montarBarra(acciones, estado){
  $("prev").onclick = acciones.vueltaAnterior;
  $("next").onclick = acciones.vueltaSiguiente;
  $("today").onclick = acciones.irAHoy;
  $("libToggle").onclick = acciones.alternarLateral;
  $("tabLib").onclick = function(){ acciones.verPestana("libreria"); };
  $("tabTemp").onclick = function(){ acciones.verPestana("temporadas"); };

  var co = $("fltCompany");
  co.innerHTML = '<option value="">Todas las companias</option>' +
    COMPANIAS.map(function(c){ return '<option value="' + c.id + '">' + esc(c.name) + "</option>"; }).join("");
  co.onchange = function(){ acciones.filtrarCompania(co.value); };

  var sem = $("weekSel"), lista = [];
  for (var i = WEEKS_MIN; i <= WEEKS_MAX; i++) lista.push({v:i, l:plural(i, "semana", "semanas")});
  sem.innerHTML = opciones(lista, estado.get().semanas);
  sem.onchange = function(){
    acciones.cambiarSemanas(parseInt(sem.value, 10)).then(null, function(){ sem.value = estado.get().semanas; });
  };

  [].forEach.call(document.querySelectorAll("[data-set-tema]"), function(b){
    b.onclick = function(){ acciones.cambiarTema(b.getAttribute("data-set-tema")); };
  });

  /* ---------- menu de ajustes ---------- */
  var menu = $("ajustes"), btn = $("ajustesBtn");
  function cerrarMenu(){ menu.hidden = true; btn.setAttribute("aria-expanded", "false"); capas.quitar(cerrarMenu); }
  btn.onclick = function(ev){
    ev.stopPropagation();
    if (!menu.hidden){ cerrarMenu(); return; }
    menu.hidden = false;
    btn.setAttribute("aria-expanded", "true");
    capas.abrir(cerrarMenu);
  };
  document.addEventListener("mousedown", function(ev){
    if (!menu.hidden && !menu.contains(ev.target) && ev.target !== btn && !btn.contains(ev.target)) cerrarMenu();
  });

  // Mapa de la vuelta: un segmento por semana. Las de temporada llevan su
  // color; la de hoy se resalta y las que ya pasaron quedan llenas.
  function mapa(s, v){
    var lunesHoy = ymd(lunesDe(hoy()));
    return v.filas.map(function(f){
      var fs = ymd(f.lunes), cls = "seg" + (f.pausa ? " pausa" : "") + (fs === lunesHoy ? " hoy" : fs < lunesHoy ? " paso" : "");
      var tit = f.pausa ? f.pausa.nombre + " (ciclo en pausa)" : "Semana " + f.w;
      return '<i class="' + cls + '"' + (f.pausa ? ' style="--tm:' + TEMAS[f.pausa.tema].color + '"' : "") + ' title="' + esc(tit) + '"></i>';
    }).join("");
  }

  return {
    pintar: function(s){
      var v = vuelta(s), fin = v.fin;
      var anos = s.inicio.getFullYear() === fin.getFullYear() ? fin.getFullYear() : s.inicio.getFullYear() + "-" + fin.getFullYear();
      $("rangoTxt").textContent = corta(s.inicio) + " – " + corta(fin) + " " + anos;
      var pausas = v.filas.filter(function(f){ return f.pausa; }).length;
      $("rangoSub").textContent = "Vuelta " + numeroDeVuelta(s.inicio, s.semanas, s.temporadas) +
        (pausas ? " · " + plural(pausas, "semana", "semanas") + " en pausa" : "");
      $("mapa").innerHTML = mapa(s, v);

      // Hoy ya esta a la vista: el boton se apaga.
      var hs = ymd(hoy());
      $("today").classList.toggle("aqui", !!v.porFecha[hs]);

      co.value = nombreCompania(s.filtroCo) ? s.filtroCo : "";
      co.parentNode.classList.toggle("on", !!s.filtroCo);
      sem.value = s.semanas;
      sem.disabled = !s.conectado;

      $("tabLib").classList.toggle("on", s.pestana === "libreria");
      $("tabTemp").classList.toggle("on", s.pestana === "temporadas");
      $("tabLib").setAttribute("aria-selected", s.pestana === "libreria" ? "true" : "false");
      $("tabTemp").setAttribute("aria-selected", s.pestana === "temporadas" ? "true" : "false");
      $("secLib").hidden = s.pestana !== "libreria";
      $("secTemp").hidden = s.pestana !== "temporadas";

      [].forEach.call(document.querySelectorAll("[data-set-tema]"), function(b){
        b.classList.toggle("on", b.getAttribute("data-set-tema") === s.tema);
      });
    }
  };
}
