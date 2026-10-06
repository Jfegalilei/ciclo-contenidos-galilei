/* Forma de los documentos. Todo lo que entra de la db pasa por aqui y
   sale normalizado; todo lo que se guarda sale de aqui con la forma
   exacta que espera la coleccion. Ninguna pantalla arma cuerpos a mano. */

import { TIPOS, FAMILIAS, normCds, normOper } from "./catalogos.js";
import { normFija } from "./reglasFijas.js";
import { normRegla } from "./temporadas.js";
import { WEEKS_MAX } from "./ciclo.js";

function tipo(v, porDefecto){ return TIPOS[v] ? v : porDefecto; }
function familia(v){ return FAMILIAS[v] ? v : ""; }

/* ---------- publicacion del ciclo (coleccion "plantilla") ---------- */
export function publicacionDesdeDoc(id, b){
  b = b || {};
  var w = parseInt(b.week, 10), dw = parseInt(b.dow, 10);
  var t = tipo(b.type, "anuncio");
  return {
    id: id,
    week: (w >= 1 && w <= WEEKS_MAX) ? w : 1,
    dow: (dw >= 0 && dw <= 6) ? dw : 0,
    time: b.time || "",
    type: t,
    familia: familia(b.familia),
    operatividad: normOper(b.operatividad, t),
    cds: normCds(b.cds),
    img: b.img || "",
    title: b.title || "",
    copy: b.copy || "",
    fija: normFija(b.fija)
  };
}
export function publicacionNueva(w, dw){
  return {id:null, week:w, dow:dw, time:"09:00", type:"reto", familia:"", operatividad:"", cds:[], img:"", title:"", copy:"", fija:null};
}
export function cuerpoPublicacion(p){
  return {
    week: p.week, dow: p.dow, time: p.time || "", type: p.type, familia: p.familia || "",
    operatividad: normOper(p.operatividad, p.type), cds: p.cds || [], img: p.img || "",
    title: p.title || "", copy: p.copy || "", fija: p.fija || null
  };
}

/* ---------- publicacion de temporada (coleccion "temporadaPubs") ----------
   Mismo contenido que una del ciclo, pero vive en un dia de la temporada
   (dia 0 = el primero) y no tiene casilla ni regla fija. */
export function pubTemporadaDesdeDoc(id, b){
  b = b || {};
  var t = tipo(b.type, "reto"), dia = parseInt(b.dia, 10);
  return {
    id: id,
    temporada: String(b.temporada || ""),
    dia: dia >= 0 ? dia : 0,
    regla: normRegla(b.regla),
    time: b.time || "",
    type: t,
    familia: familia(b.familia),
    operatividad: normOper(b.operatividad, t),
    cds: normCds(b.cds),
    img: b.img || "",
    title: b.title || "",
    copy: b.copy || "",
    fija: null
  };
}
export function pubTemporadaNueva(idTemporada, dia){
  return {id:null, temporada:idTemporada, dia:dia, regla:null, time:"09:00", type:"reto", familia:"temporada", operatividad:"", cds:[], img:"", title:"", copy:"", fija:null};
}
export function cuerpoPubTemporada(p){
  return {
    temporada: p.temporada, dia: p.dia, regla: p.regla || null, time: p.time || "", type: p.type, familia: p.familia || "",
    operatividad: normOper(p.operatividad, p.type), cds: p.cds || [], img: p.img || "",
    title: p.title || "", copy: p.copy || ""
  };
}
export function esDeTemporada(p){ return !!(p && p.temporada); }

/* ---------- pieza de la libreria (coleccion "libreria") ---------- */
export function piezaDesdeDoc(id, b){
  b = b || {};
  var t = tipo(b.type, "reto");
  return {
    id: id,
    type: t,
    familia: familia(b.familia),
    operatividad: normOper(b.operatividad, t),
    cds: normCds(b.cds),
    grupos: parseInt(b.grupos, 10) || 0,
    img: b.img || "",
    title: b.title || "",
    copy: b.copy || ""
  };
}
export function piezaNueva(){
  return {id:null, type:"reto", familia:"", operatividad:"", cds:[], grupos:0, img:"", title:"", copy:""};
}
// grupos no se edita: se conserva tal como estaba.
export function cuerpoPieza(it){
  return {
    type: it.type, familia: it.familia || "", operatividad: normOper(it.operatividad, it.type),
    cds: it.cds || [], grupos: it.grupos || 0, img: it.img || "", title: it.title || "", copy: it.copy || ""
  };
}

// Programar una pieza es COPIARLA a una casilla: editar el ciclo no toca
// la libreria ni al reves.
export function publicacionDesdePieza(it, w, dw){
  var p = publicacionNueva(w, dw);
  p.type = it.type; p.familia = it.familia; p.operatividad = it.operatividad;
  p.cds = (it.cds || []).slice(); p.img = it.img; p.title = it.title; p.copy = it.copy;
  return p;
}

export function pubTemporadaDesdePieza(it, idTemporada, dia){
  var p = pubTemporadaNueva(idTemporada, dia);
  p.type = it.type; p.familia = it.familia; p.operatividad = it.operatividad;
  p.cds = (it.cds || []).slice(); p.img = it.img; p.title = it.title; p.copy = it.copy;
  return p;
}

// Al reves: un reto nuevo del calendario tambien queda en la libreria.
export function piezaDesdePublicacion(p){
  var it = piezaNueva();
  it.type = p.type; it.familia = p.familia; it.operatividad = p.operatividad;
  it.cds = (p.cds || []).slice(); it.img = p.img; it.title = p.title; it.copy = p.copy;
  return it;
}

// Copia editable de cualquiera de los dos, para los formularios.
export function copiar(x){
  var c = {};
  Object.keys(x).forEach(function(k){ c[k] = Array.isArray(x[k]) ? x[k].slice() : x[k]; });
  return c;
}
