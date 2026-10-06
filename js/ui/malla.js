/* Malla de la vuelta, al estilo de la vista de mes de Google Calendar:
   una pieza por publicacion (titulo y, debajo, hora, core drive y
   participacion) y el detalle en el panel. Aqui tambien vive el
   arrastrar y soltar sobre los dias.

   Los dias de temporada se tinen con el color de su tema y llevan sus
   adornos; las semanas que la temporada detiene completas se marcan en
   la columna de semanas con el icono del tema en vez de "S1, S2...". */

import { TIPOS, CDS } from "../dominio/catalogos.js";
import { DOW_CORTO, MES_CORTO, hoy, ymd } from "../dominio/fechas.js";
import { esFija, etiquetaFija } from "../dominio/reglasFijas.js";
import { TEMAS, diaDe, duracion, etiquetaRegla } from "../dominio/temporadas.js";
import { nivelPct, pctTxt } from "../dominio/participacion.js";
import { vuelta, delDia, estaLista, califDePublicacion } from "../app/consultas.js";
import { $, esc } from "./dom.js";
import { coloresDe } from "./colores.js";
import { arteDe } from "./temas.js";
import { ICONO } from "./iconos.js";

var CABEZA_DIA = 32;     // numero del dia y relleno

export function montarMalla(acciones, editores, estado){
  var weeks = $("weeks");
  var capacidad = 0, pintada = null;

  $("dow").innerHTML = '<div></div>' + DOW_CORTO.map(function(d){ return "<div>" + d + "</div>"; }).join("");

  // Cuantas lineas caben en un dia con el alto actual de la pantalla.
  // El alto de un evento lo decide el CSS (--ev-h): en celular es una linea.
  function medir(filas){
    var alto = weeks.clientHeight / filas;
    var ev = parseFloat(getComputedStyle(weeks).getPropertyValue("--ev-h")) || 36;
    return Math.max(1, Math.floor((alto - CABEZA_DIA) / ev));
  }

  // Hora a la izquierda; core drive y participacion, a la derecha.
  function segundaLinea(s, p){
    var cal = califDePublicacion(s, p), der = "";
    if (p.cds.length) der += '<span class="cd" title="' + esc(CDS[p.cds[0]].nombre) + '">' + CDS[p.cds[0]].label + "</span>";
    if (cal) der += '<span class="pct ' + nivelPct(cal.pct) + '" title="Participacion promedio">' + pctTxt(cal.pct) + "</span>";
    if (!p.time && !der) return "";
    return '<span class="l2">' + (p.time ? '<span class="hora">' + esc(p.time) + "</span>" : "") +
           (der ? '<span class="der">' + der + "</span>" : "") + "</span>";
  }

  function evento(s, p){
    var fija = esFija(p);
    var nota = fija ? " (fija: " + etiquetaFija(p.fija) + ")" : p.regla ? " (" + etiquetaRegla(p.regla) + " de la temporada)" : "";
    return '<span class="ev' + (estaLista(s, p) ? " done" : "") + (p.temporada ? " de-temp" : "") +
           '" draggable="' + (fija ? "false" : "true") + '" data-post="' + p.id + '" style="' + coloresDe(p) + '" title="' +
           esc((p.time ? p.time + " " : "") + (p.title || TIPOS[p.type].label) + nota) + '">' +
           '<span class="l1">' + (p.familia ? '<i class="dot"></i>' : "") +
             (p.regla ? '<span class="rg" aria-hidden="true">' + ICONO.repetir + "</span>" : "") +
             '<span class="tit">' + esc(p.title || TIPOS[p.type].label) + "</span></span>" +
           segundaLinea(s, p) + "</span>";
  }

  // Los adornos van salteados, no en cada dia: es un detalle, no un papel tapiz.
  function adornos(c){
    var t = c.temp, arte = arteDe(t.tema), dia = diaDe(t, c.fecha), html = "";
    if (dia === 0 && arte.esquina) html += '<span class="esquina">' + arte.esquina + "</span>";
    if ((dia + 2) % 4 === 0 || dia === duracion(t) - 1) html += '<span class="orn o' + (dia % 3) + '">' + arte.adorno + "</span>";
    return html;
  }

  function pintar(){
    var s = estado.get(), v = vuelta(s);
    weeks.style.gridTemplateRows = "repeat(" + v.filas.length + ",minmax(96px,1fr))";
    capacidad = medir(v.filas.length);

    var hoyStr = ymd(hoy()), sel = s.seleccion, html = "";

    v.filas.forEach(function(f){
      var actual = f.celdas.some(function(c){ return c.fs === hoyStr; });
      if (f.pausa){
        html += '<div class="wk pausa" style="--tm:' + TEMAS[f.pausa.tema].color + '" title="' + esc(f.pausa.nombre) +
                ': el ciclo esta en pausa esta semana">' + arteDe(f.pausa.tema).icono + "</div>";
      } else {
        html += '<div class="wk' + (actual ? " actual" : "") + '" title="Semana ' + f.w + ' del ciclo">S' + f.w + "</div>";
      }

      f.celdas.forEach(function(c){
        var items = delDia(s, c.fs);
        // Si no caben todas, la ultima linea se cede al "+N mas".
        var caben = items.length > capacidad ? capacidad - 1 : items.length;
        var primero = c === v.celdas[0] || c.fecha.getDate() === 1;
        var t = c.temp, clases = "day";
        if (c.fs === hoyStr) clases += " today";
        if (c.fs < hoyStr) clases += " pasado";
        if (sel && sel.fs === c.fs) clases += " sel";
        if (t){
          var dia = diaDe(t, c.fecha);
          clases += " temp tm-" + t.tema + (dia < 7 ? " t-sem1" : "");
          if (dia === 0 || c.d === 0) clases += " t-izq";
          if (dia === duracion(t) - 1 || c.d === 6) clases += " t-der";
        }

        html += '<div class="' + clases + '"' + (t ? ' style="--tm:' + TEMAS[t.tema].color + '"' : "") +
                ' role="button" tabindex="0" data-fs="' + c.fs + '" aria-label="' +
                esc(c.fecha.getDate() + " " + MES_CORTO[c.fecha.getMonth()] + (t ? ", " + t.nombre : "")) + '">';
        if (t) html += adornos(c);
        html += '<span class="dcab"><span class="daynum">' + (primero ? c.fecha.getDate() + " " + MES_CORTO[c.fecha.getMonth()] : c.fecha.getDate()) + "</span>";
        if (t && diaDe(t, c.fecha) === 0) html += '<span class="ttag">' + arteDe(t.tema).icono + "<span>" + esc(t.nombre) + "</span></span>";
        html += "</span>";
        items.slice(0, caben).forEach(function(p){ html += evento(s, p); });
        if (items.length > caben) html += '<span class="more" data-more>' + (items.length - caben) + " mas</span>";
        html += "</div>";
      });
    });
    weeks.innerHTML = html;

    // Al cambiar de vuelta, la malla entra desde el lado hacia donde se fue.
    var clave = ymd(s.inicio);
    if (pintada && pintada !== clave && s.direccion){
      weeks.classList.remove("entra-der", "entra-izq");
      void weeks.offsetWidth;
      weeks.classList.add(s.direccion > 0 ? "entra-der" : "entra-izq");
    }
    pintada = clave;
  }

  function fechaDe(el){ return el.getAttribute("data-fs"); }

  /* ---------- abrir ---------- */
  weeks.addEventListener("click", function(ev){
    var cell = ev.target.closest(".day");
    if (!cell) return;
    var chip = ev.target.closest("[data-post]");
    acciones.abrirDia(fechaDe(cell), chip ? chip.getAttribute("data-post") : null);
  });
  // Doble clic en un espacio vacio crea una publicacion ahi mismo.
  weeks.addEventListener("dblclick", function(ev){
    var cell = ev.target.closest(".day");
    if (!cell || ev.target.closest("[data-post],[data-more]") || !estado.get().conectado) return;
    editores.nuevaEn(fechaDe(cell));
  });
  weeks.addEventListener("keydown", function(ev){
    if (ev.key !== "Enter" && ev.key !== " ") return;
    var cell = ev.target.closest(".day");
    if (!cell) return;
    ev.preventDefault();
    acciones.abrirDia(fechaDe(cell));
  });

  /* ---------- arrastrar y soltar ---------- */
  function limpiarOver(){ var o = weeks.querySelector(".day.over"); if (o) o.classList.remove("over"); }
  weeks.addEventListener("dragstart", function(ev){
    var chip = ev.target.closest("[data-post]");
    if (!chip) return;
    ev.dataTransfer.setData("text/plain", "post:" + chip.getAttribute("data-post"));
    ev.dataTransfer.effectAllowed = "move";
    chip.classList.add("arrastrando");
  });
  weeks.addEventListener("dragend", function(ev){
    var chip = ev.target.closest("[data-post]");
    if (chip) chip.classList.remove("arrastrando");
    limpiarOver();
  });
  weeks.addEventListener("dragover", function(ev){
    var cell = ev.target.closest(".day");
    if (!cell || !estado.get().conectado) return;
    ev.preventDefault();
    var prev = weeks.querySelector(".day.over");
    if (prev && prev !== cell) prev.classList.remove("over");
    cell.classList.add("over");
  });
  weeks.addEventListener("dragleave", function(ev){
    var cell = ev.target.closest(".day");
    if (cell && !cell.contains(ev.relatedTarget)) cell.classList.remove("over");
  });
  weeks.addEventListener("drop", function(ev){
    var cell = ev.target.closest(".day");
    if (!cell) return;
    ev.preventDefault();
    cell.classList.remove("over");
    var raw = ev.dataTransfer.getData("text/plain") || "";
    if (raw.indexOf("lib:") === 0) acciones.programarPieza(raw.slice(4), fechaDe(cell));
    else if (raw.indexOf("post:") === 0) acciones.moverPublicacion(raw.slice(5), fechaDe(cell));
  });

  // Si cambia el alto de la pantalla, cambia cuantas lineas caben.
  window.addEventListener("resize", function(){
    if (medir(vuelta(estado.get()).filas.length) !== capacidad) pintar();
  });

  return { pintar: pintar };
}
