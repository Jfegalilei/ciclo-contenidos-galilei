/* Preguntas que las vistas le hacen al estado. Son de solo lectura:
   ninguna escribe ni pinta. */

import { TOTAL_CO, COMPANIAS, FAMILIAS } from "../dominio/catalogos.js";
import { filasDeVuelta } from "../dominio/ciclo.js";
import { suma, ymd } from "../dominio/fechas.js";
import { esFija, cumple } from "../dominio/reglasFijas.js";
import { temporadaDe, diaDe, duracion, diaDePub } from "../dominio/temporadas.js";
import { resumirCorridas, mismoTitulo } from "../dominio/participacion.js";

/* ---------- la vuelta visible ----------
   Filas (semanas) y celdas (dias) de la vuelta que esta en pantalla.
   Cada celda: {fecha, fs: "AAAA-MM-DD", w: semana del ciclo (0 si la
   semana entera es de temporada), d: 0-6, temp: temporada o null}. */
var memoV = {inicio:null, semanas:0, temps:null, v:null};
export function vuelta(s){
  if (memoV.inicio === s.inicio && memoV.semanas === s.semanas && memoV.temps === s.temporadas) return memoV.v;
  var filas = filasDeVuelta(s.inicio, s.semanas, s.temporadas);
  var celdas = [], porFecha = {};
  filas.forEach(function(f){
    f.celdas = [];
    for (var d = 0; d < 7; d++){
      var fecha = suma(f.lunes, d);
      var c = {fecha: fecha, fs: ymd(fecha), w: f.w, d: d, temp: temporadaDe(s.temporadas, fecha)};
      f.celdas.push(c);
      celdas.push(c);
      porFecha[c.fs] = c;
    }
  });
  var v = {filas: filas, celdas: celdas, porFecha: porFecha, fin: celdas[celdas.length - 1].fecha};
  memoV = {inicio:s.inicio, semanas:s.semanas, temps:s.temporadas, v:v};
  return v;
}
export function celdaDe(s, fs){ return vuelta(s).porFecha[fs] || null; }

// Temporadas que tocan la vuelta visible, en orden.
export function temporadasEnVuelta(s){
  var v = vuelta(s), out = [];
  v.celdas.forEach(function(c){ if (c.temp && out.indexOf(c.temp) === -1) out.push(c.temp); });
  return out;
}

/* ---------- que se publica cada dia ----------
   Dia de temporada: lo programado para ese dia de la temporada.
   Dia del ciclo: lo de su casilla (semana, dia).
   Las fijas van a su fecha real en los dos casos: son de calendario
   (pagos, cierres de mes) y no se detienen por una temporada. */
var memo = {pubs:null, pt:null, v:null, temps:null, ix:null};
function porHora(a, b){ return (a.time || "99:99").localeCompare(b.time || "99:99"); }
function indice(s){
  var v = vuelta(s);
  if (memo.pubs === s.publicaciones && memo.pt === s.pubsTemporada && memo.v === v && memo.temps === s.temporadas) return memo.ix;
  var casilla = {}, fijas = [], deTemp = {};
  s.publicaciones.forEach(function(p){
    if (esFija(p)) fijas.push(p);
    else (casilla[p.week + ":" + p.dow] || (casilla[p.week + ":" + p.dow] = [])).push(p);
  });
  var temps = {};
  s.temporadas.forEach(function(t){ temps[t.id] = t; });
  s.pubsTemporada.forEach(function(p){
    var t = temps[p.temporada];
    if (!t) return;
    var k = p.temporada + ":" + diaDePub(t, p);
    (deTemp[k] || (deTemp[k] = [])).push(p);
  });
  var ix = {};
  v.celdas.forEach(function(c){
    var base = c.temp ? (deTemp[c.temp.id + ":" + diaDe(c.temp, c.fecha)] || [])
                      : (casilla[c.w + ":" + c.d] || []);
    var lista = base.concat(fijas.filter(function(p){ return cumple(p.fija, c.fecha); }));
    lista.sort(porHora);
    ix[c.fs] = lista;
  });
  memo = {pubs:s.publicaciones, pt:s.pubsTemporada, v:v, temps:s.temporadas, ix:ix};
  return ix;
}

export function delDia(s, fs){ return indice(s)[fs] || []; }

// Lo que el ciclo tenia en un dia que una temporada le quito. No se
// pierde: sigue en la plantilla y sale en la proxima vuelta.
export function reemplazadas(s, c){
  if (!c || !c.temp || !c.w) return [];
  return s.publicaciones.filter(function(p){ return !esFija(p) && p.week === c.w && p.dow === c.d; });
}

// Fecha de la vuelta visible donde se ve una publicacion, o null.
export function fechaEnVuelta(s, p){
  var v = vuelta(s);
  for (var i = 0; i < v.celdas.length; i++){
    var c = v.celdas[i];
    if (p.temporada){ if (c.temp && c.temp.id === p.temporada && diaDe(c.temp, c.fecha) === diaDePub(c.temp, p)) return c.fs; }
    else if (esFija(p)){ if (cumple(p.fija, c.fecha)) return c.fs; }
    else if (!c.temp && c.w === p.week && c.d === p.dow) return c.fs;
  }
  return null;
}

export function buscarPublicacion(s, id){
  for (var i = 0; i < s.publicaciones.length; i++){ if (s.publicaciones[i].id === id) return s.publicaciones[i]; }
  for (var j = 0; j < s.pubsTemporada.length; j++){ if (s.pubsTemporada[j].id === id) return s.pubsTemporada[j]; }
  return null;
}
export function buscarPieza(s, id){
  for (var i = 0; i < s.libreria.length; i++){ if (s.libreria[i].id === id) return s.libreria[i]; }
  return null;
}
export function buscarTemporada(s, id){
  for (var i = 0; i < s.temporadas.length; i++){ if (s.temporadas[i].id === id) return s.temporadas[i]; }
  return null;
}

/* ---------- temporadas ---------- */
export function pubsDeTemporada(s, id){
  return s.pubsTemporada.filter(function(p){ return p.temporada === id; });
}
// Las que quedaron mas alla del ultimo dia al acortar la temporada, o
// cuya regla no cae en ella (un quinto lunes que no existe).
export function fueraDeRango(s, t){
  var n = duracion(t);
  return pubsDeTemporada(s, t.id).filter(function(p){ var d = diaDePub(t, p); return d < 0 || d >= n; });
}

/* ---------- envios de la vuelta visible ---------- */
export function enviosDe(s, id){ return s.marcas[id] || {}; }
export function cuantasEnviadas(s, p){
  var e = enviosDe(s, p.id), n = 0;
  for (var i = 0; i < TOTAL_CO; i++){ if (e[COMPANIAS[i].id]) n++; }
  return n;
}
// "Lista" depende del punto de vista: con filtro, lista para esa
// compania; sin filtro, lista cuando salio en las 12.
export function estaLista(s, p){
  return s.filtroCo ? !!enviosDe(s, p.id)[s.filtroCo] : cuantasEnviadas(s, p) === TOTAL_CO;
}

// Publicaciones que quedaron en semanas de mas al acortar el ciclo.
// No se borran: siguen en la db y reaparecen si se vuelve a ampliar.
export function guardadas(s){
  return s.publicaciones.filter(function(p){ return !esFija(p) && p.week > s.semanas; });
}

/* ---------- participacion ---------- */
export function califDePieza(s, libId){ return resumirCorridas(s.calif[libId]); }
export function califDePublicacion(s, p){
  if (p.type !== "reto") return null;
  for (var i = 0; i < s.libreria.length; i++){
    if (mismoTitulo(s.libreria[i].title, p.title)) return califDePieza(s, s.libreria[i].id);
  }
  return null;
}

/* ---------- libreria filtrada ---------- */
export function piezasVisibles(s){
  var f = s.libFiltro, q = f.q.trim().toLowerCase();
  return s.libreria.filter(function(it){
    if (f.fam && it.familia !== f.fam) return false;
    if (f.tipo && it.type !== f.tipo) return false;
    if (!q) return true;
    var fam = it.familia ? FAMILIAS[it.familia].label : "";
    return (it.title + " " + it.copy + " " + fam).toLowerCase().indexOf(q) !== -1;
  });
}
