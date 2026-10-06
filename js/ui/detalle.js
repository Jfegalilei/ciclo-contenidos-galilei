/* Detalle de una publicacion dentro del panel del dia.

   Se arma con una lista de SECCIONES. Cada una recibe el contexto y
   devuelve un nodo, o null si no aplica a esa publicacion. Para mostrar
   algo nuevo se agrega una seccion; no hay que tocar las demas.

   ctx = {s, p, acciones, editores, abiertos} */

import { TIPOS, FAMILIAS, OPER, CDS, COMPANIAS, TOTAL_CO, nombreCompania } from "../dominio/catalogos.js";
import { MES_CORTO, parseYmd, sello } from "../dominio/fechas.js";
import { esFija, etiquetaFija } from "../dominio/reglasFijas.js";
import { etiquetaRegla } from "../dominio/temporadas.js";
import { nivelPct, pctTxt } from "../dominio/participacion.js";
import { enviosDe, cuantasEnviadas, califDePublicacion, buscarTemporada } from "../app/consultas.js";
import { crear, esc, plural } from "./dom.js";
import { ICONO } from "./iconos.js";
import { confirmar } from "./confirmar.js";
import { copiarTexto, copiarImagen, descargarImagen, puedeCopiarImagen } from "./imagenes.js";

var toast = function(){};
export function usarAvisos(avisos){ toast = avisos.toast; }

function fila(icono, html){
  return crear("div", "drow", '<span class="dico">' + icono + '</span><div class="dcont">' + html + "</div>");
}
function pct(v){ return '<span class="pct ' + nivelPct(v) + '">' + pctTxt(v) + "</span>"; }

// Boton que cambia su texto un momento para confirmar que funciono.
function botonCopiar(clase, icono, texto, hecho, accion){
  var b = crear("button", clase, icono + "<span>" + texto + "</span>");
  b.onclick = function(){
    accion().then(function(){
      b.innerHTML = ICONO.check + "<span>" + hecho + "</span>";
      setTimeout(function(){ b.innerHTML = icono + "<span>" + texto + "</span>"; }, 2000);
    }, function(){ toast("El navegador bloqueo el portapapeles. Hazlo a mano."); });
  };
  return b;
}

/* ---------- secciones ---------- */

// Editar y eliminar van en la cabecera del item, no en el cuerpo.
export function herramientas(ctx){
  var p = ctx.p, bar = crear("div", "dtools");
  var ed = crear("button", "iconbtn", ICONO.lapiz);
  ed.title = p.temporada ? "Editar" : "Editar (cambia todas las vueltas del ciclo)";
  ed.setAttribute("aria-label", "Editar");
  ed.disabled = !ctx.s.conectado;
  ed.onclick = function(){ ctx.editores.publicacion(p); };

  var del = crear("button", "iconbtn", ICONO.basura);
  del.title = "Eliminar";
  del.setAttribute("aria-label", "Eliminar");
  del.disabled = !ctx.s.conectado;
  del.onclick = function(){
    confirmar("Eliminar publicacion",
      "<b>" + esc(p.title || TIPOS[p.type].label) + "</b> " +
        (p.temporada ? "se elimina de la temporada." : "se elimina del ciclo completo, en todas sus vueltas.") + " Esto no se puede deshacer.",
      function(){ ctx.acciones.borrarPublicacion(p); });
  };
  bar.appendChild(ed);
  bar.appendChild(del);
  return bar;
}

function seccionCuando(ctx){
  var p = ctx.p;
  var partes = [p.time || "Sin hora", TIPOS[p.type].label];
  if (p.familia) partes.push(FAMILIAS[p.familia].label);
  return fila(ICONO.reloj,
    "<span>" + esc(partes.join(" · ")) + "</span>" +
    (esFija(p) ? '<span class="dnota">' + ICONO.candado + "Fija: " + esc(etiquetaFija(p.fija)) + "</span>" : "") +
    (p.temporada ? '<span class="dnota">' + ICONO.calendario +
      (p.regla ? "El " + esc(etiquetaRegla(p.regla)) + " de " : "Solo en ") +
      esc((buscarTemporada(ctx.s, p.temporada) || {}).nombre || "la temporada") + "</span>" : ""));
}

function seccionContenido(ctx){
  var p = ctx.p, box = crear("div", "dcopy");
  var texto = crear("div", "copybox" + (p.copy ? "" : " vacio"));
  texto.textContent = p.copy || "Sin copy escrito todavia.";
  box.appendChild(texto);

  if (p.img){
    var th = crear("div", "thumb");
    var im = document.createElement("img");
    im.src = p.img; im.alt = "";
    th.appendChild(im);
    box.appendChild(th);
  }

  var acts = crear("div", "dacts");
  var copy = botonCopiar("btn btn-primary", ICONO.copiar, "Copiar texto", "Copiado", function(){ return copiarTexto(p.copy); });
  copy.disabled = !p.copy;
  acts.appendChild(copy);
  if (p.img){
    acts.appendChild(botonCopiar("btn", ICONO.imagen, "Copiar imagen", "Imagen copiada", function(){
      return puedeCopiarImagen() ? copiarImagen(p.img) : Promise.reject();
    }));
    var dl = crear("button", "iconbtn", ICONO.bajar);
    dl.title = "Descargar imagen";
    dl.setAttribute("aria-label", "Descargar imagen");
    dl.onclick = function(){ try { descargarImagen(p.img, p.title); } catch(e){ toast("No se pudo descargar la imagen."); } };
    acts.appendChild(dl);
  }
  box.appendChild(acts);
  return box;
}

function seccionParticipacion(ctx){
  var cal = califDePublicacion(ctx.s, ctx.p);
  if (!cal) return null;
  var grupos = cal.ultima.datos.grupos || {};
  var filas = Object.keys(grupos).map(function(k){ return grupos[k]; }).sort(function(a, b){ return b.pct - a.pct; });
  var f = parseYmd(cal.ultima.fecha);
  var clave = "calif:" + ctx.p.id;

  var nodo = fila(ICONO.grafica,
    "<span>" + pct(cal.pct) + " de participacion</span>" +
    '<span class="dnota">Promedio de ' + plural(cal.corridas, "corrida", "corridas") +
      ". Ultima: " + f.getDate() + " " + MES_CORTO[f.getMonth()] + ", " + plural(filas.length, "grupo", "grupos") + ".</span>" +
    "<details" + (ctx.abiertos[clave] ? " open" : "") + "><summary>Ver por grupo</summary><table>" +
      filas.map(function(g){
        return "<tr><td>" + esc(nombreCompania(g.companyId) || g.grupo) + '</td><td class="n">' +
               g.participaron + "/" + g.miembros + '</td><td class="s">' + pct(g.pct) + "</td></tr>";
      }).join("") +
    "</table></details>");
  nodo.querySelector("details").addEventListener("toggle", function(){ ctx.abiertos[clave] = this.open; });
  return nodo;
}

function seccionEstrategia(ctx){
  var p = ctx.p;
  if (!p.cds.length && !p.operatividad) return null;
  return fila(ICONO.diana,
    (p.cds.length ? "<span>" + p.cds.map(function(k, i){
      return (i === 0 ? "<b>" : "") + CDS[k].label + " " + esc(CDS[k].nombre) + (i === 0 ? "</b>" : "");
    }).join(", ") + "</span>" : "") +
    (p.operatividad ? '<span class="dnota">Operatividad ' + OPER[p.operatividad].label.toLowerCase() + ": " + esc(OPER[p.operatividad].ayuda) + "</span>" : ""));
}

// Con una compania filtrada basta un boton; la grilla completa queda plegada.
function seccionEnvios(ctx){
  var s = ctx.s, p = ctx.p, e = enviosDe(s, p.id), n = cuantasEnviadas(s, p);
  var nodo = fila(ICONO.enviar, "");
  var cont = nodo.querySelector(".dcont");

  function toggle(c){
    var on = !!e[c.id];
    var b = crear("button", "co-tog" + (on ? " on" : ""), '<span class="box">' + ICONO.check + '</span><span class="nm">' + esc(c.name) + "</span>");
    b.disabled = !s.conectado;
    b.title = on ? "Enviado " + sello(e[c.id]) : "Marcar como enviado a " + c.name;
    b.onclick = function(){ ctx.acciones.marcarEnvio(p, c.id, !on); };
    return b;
  }

  var cab = crear("div", "dsend", "<span>Enviado a <b>" + n + "</b> de " + TOTAL_CO + "</span>");
  var todas = crear("button", "btn btn-quiet", n === TOTAL_CO ? "Quitar todas" : "Marcar todas");
  todas.disabled = !s.conectado;
  todas.onclick = function(){ ctx.acciones.marcarTodas(p, n !== TOTAL_CO); };
  cab.appendChild(todas);
  cont.appendChild(cab);

  var grilla = crear("div", "sendgrid");
  COMPANIAS.forEach(function(c){ grilla.appendChild(toggle(c)); });

  if (s.filtroCo){
    var solo = COMPANIAS.filter(function(c){ return c.id === s.filtroCo; })[0];
    if (solo) cont.insertBefore(toggle(solo), cab);
    var clave = "envios:" + p.id;
    var det = crear("details", "", "<summary>Todas las companias</summary>");
    det.open = !!ctx.abiertos[clave];
    det.addEventListener("toggle", function(){ ctx.abiertos[clave] = det.open; });
    det.appendChild(grilla);
    cont.appendChild(det);
  } else {
    cont.appendChild(grilla);
  }
  return nodo;
}

export var SECCIONES = [seccionCuando, seccionContenido, seccionParticipacion, seccionEstrategia, seccionEnvios];

export function detallePublicacion(ctx){
  var el = crear("div", "detalle");
  SECCIONES.forEach(function(sec){
    var nodo = sec(ctx);
    if (nodo) el.appendChild(nodo);
  });
  return el;
}
