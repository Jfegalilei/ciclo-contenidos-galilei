/* TEMPORADAS ESPECIALES
   Una temporada es un rango de fechas reales (Halloween, Navidad...) con
   su propia programacion. Mientras dura, el ciclo NO corre: se aplaza y
   retoma donde iba cuando la temporada termina.

   Coleccion "temporadas":    {nombre, tema, desde: AAAA-MM-DD, hasta: AAAA-MM-DD}
   Coleccion "temporadaPubs": una publicacion por documento, con
     {temporada: idTemporada, dia: 0..N-1, time, type, ...}
   El dia se cuenta desde el arranque de la temporada: mover las fechas
   corre toda la programacion junto, sin tener que tocarla.

   Como se aplaza el ciclo: solo las semanas (lunes a domingo) que la
   temporada cubre COMPLETAS lo detienen. En una semana compartida el
   ciclo sigue contando, pero los dias de temporada reemplazan lo que el
   ciclo tenia ese dia. Asi el lunes del ciclo siempre cae en lunes. */

import { parseYmd, ymd, suma, difDias, dowDe, MESES, DOW } from "./fechas.js";

export var TEMAS = {
  halloween: {label:"Halloween",       color:"var(--tm-halloween)"},
  navidad:   {label:"Navidad",         color:"var(--tm-navidad)"},
  amor:      {label:"Amor y amistad",  color:"var(--tm-amor)"},
  madres:    {label:"Dia de la madre", color:"var(--tm-madres)"},
  especial:  {label:"Especial",        color:"var(--tm-especial)"}
};
export var TEMA_KEYS = ["halloween","navidad","amor","madres","especial"];

export var MAX_DIAS = 120;

// Fechas de siempre, para crear una temporada con un clic. Mes 0-11;
// si "hasta" cae antes que "desde", la temporada cruza el ano.
export var SUGERIDAS = [
  {tema:"amor",      nombre:"Amor y amistad", desde:[8, 1],  hasta:[8, 30]},
  {tema:"halloween", nombre:"Halloween",      desde:[9, 1],  hasta:[9, 31]},
  {tema:"navidad",   nombre:"Navidad",        desde:[11, 1], hasta:[0, 6]},
  {tema:"madres",    nombre:"Mes de la madre",desde:[4, 1],  hasta:[4, 31]}
];

// La proxima vez que ocurre una sugerida (la que esta en curso cuenta).
export function proximaSugerida(sg, hoyD){
  for (var a = hoyD.getFullYear() - 1; a <= hoyD.getFullYear() + 1; a++){
    var ini = new Date(a, sg.desde[0], sg.desde[1]);
    var fin = new Date(sg.hasta[0] < sg.desde[0] ? a + 1 : a, sg.hasta[0], sg.hasta[1]);
    if (fin >= hoyD) return {nombre: sg.nombre + " " + ini.getFullYear(), tema: sg.tema, desde: ymd(ini), hasta: ymd(fin)};
  }
  return null;
}

function fechaValida(s){
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(s || ""))) return null;
  var d = parseYmd(s);
  return ymd(d) === s ? d : null;
}

/* ---------- forma del documento ---------- */
export function temporadaDesdeDoc(id, b){
  b = b || {};
  var ini = fechaValida(b.desde), fin = fechaValida(b.hasta);
  if (!ini || !fin || fin < ini) return null;
  return {
    id: id,
    nombre: b.nombre || "Temporada",
    tema: TEMAS[b.tema] ? b.tema : "especial",
    desde: b.desde, hasta: b.hasta,
    ini: ini, fin: fin
  };
}
export function temporadaNueva(base){
  base = base || {};
  return {id:null, nombre: base.nombre || "", tema: base.tema || "especial", desde: base.desde || "", hasta: base.hasta || ""};
}
export function cuerpoTemporada(t){ return {nombre: t.nombre || "", tema: t.tema, desde: t.desde, hasta: t.hasta}; }

/* ---------- consultas ---------- */
export function duracion(t){ return difDias(t.ini, t.fin) + 1; }
export function diaDe(t, d){ return difDias(t.ini, d); }
export function fechaDeDia(t, dia){ return suma(t.ini, dia); }

// La temporada que cubre esa fecha, o null.
export function temporadaDe(temps, d){
  for (var i = 0; i < temps.length; i++){
    if (d >= temps[i].ini && d <= temps[i].fin) return temps[i];
  }
  return null;
}

/* ---------- reglas dentro de una temporada ----------
   Una publicacion de temporada puede ir a un dia fijo (dia N) o a una
   regla relativa a la temporada: {n: 1..5 | -1, w: 0..6}, "el n-esimo
   <dia de la semana> de la temporada" (-1 = el ultimo). Con regla, si
   se mueven las fechas o la temporada vuelve otro ano, el "primer lunes
   de Halloween" sigue cayendo en lunes. */
export var ORDINALES = [{v:1,l:"primer"},{v:2,l:"segundo"},{v:3,l:"tercer"},{v:4,l:"cuarto"},{v:5,l:"quinto"},{v:-1,l:"ultimo"}];

export function normRegla(r){
  if (!r || typeof r !== "object") return null;
  var n = parseInt(r.n, 10), w = parseInt(r.w, 10);
  return ((n === -1 || (n >= 1 && n <= 5)) && w >= 0 && w <= 6) ? {n: n, w: w} : null;
}
// Fecha de la regla dentro de la temporada, o null si no existe (un
// quinto lunes que la temporada no alcanza).
export function fechaDeRegla(t, r){
  var hits = [];
  for (var d = t.ini; d <= t.fin; d = suma(d, 1)){ if (dowDe(d) === r.w) hits.push(d); }
  if (!hits.length) return null;
  return r.n === -1 ? hits[hits.length - 1] : (hits[r.n - 1] || null);
}
// La regla que describe una fecha: "segundo miercoles" de la temporada.
export function reglaDeFecha(t, d){
  return {n: Math.floor(difDias(t.ini, d) / 7) + 1, w: dowDe(d)};
}
export function etiquetaRegla(r){
  var o = "";
  ORDINALES.forEach(function(x){ if (x.v === r.n) o = x.l; });
  return o + " " + DOW[r.w];
}
// Dia efectivo de una publicacion de temporada: por regla o por dia.
// -1 si la regla no cae dentro de la temporada.
export function diaDePub(t, p){
  if (!p.regla) return p.dia;
  var f = fechaDeRegla(t, p.regla);
  return f ? difDias(t.ini, f) : -1;
}

export function estadoDe(t, hoyD){
  if (hoyD < t.ini) return "proxima";
  if (hoyD > t.fin) return "terminada";
  return "curso";
}

export function rangoTxt(t){
  var a = t.ini, b = t.fin;
  var mismoAno = a.getFullYear() === b.getFullYear();
  return a.getDate() + " " + MESES[a.getMonth()].slice(0, 3) + (mismoAno ? "" : " " + a.getFullYear()) +
         " – " + b.getDate() + " " + MESES[b.getMonth()].slice(0, 3) + " " + b.getFullYear();
}

// "" si se puede guardar, o el motivo para no hacerlo.
export function validarTemporada(datos, temps){
  if (!String(datos.nombre || "").trim()) return "Ponle un nombre a la temporada.";
  var ini = fechaValida(datos.desde), fin = fechaValida(datos.hasta);
  if (!ini || !fin) return "Elige la fecha de inicio y la de cierre.";
  if (fin < ini) return "La temporada termina antes de empezar.";
  if (difDias(ini, fin) + 1 > MAX_DIAS) return "Una temporada dura maximo " + MAX_DIAS + " dias.";
  for (var i = 0; i < temps.length; i++){
    var o = temps[i];
    if (o.id === datos.id) continue;
    if (ini <= o.fin && fin >= o.ini) return "Se cruza con " + o.nombre + " (" + rangoTxt(o) + ").";
  }
  return "";
}
