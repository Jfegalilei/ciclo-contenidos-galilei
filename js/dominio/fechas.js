/* Fechas sin hora: todo el calendario cuenta en dias locales. */

export var MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
export var MES_CORTO = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
export var DOW = ["lunes","martes","miercoles","jueves","viernes","sabado","domingo"];
export var DOW_CORTO = ["lun","mar","mie","jue","vie","sab","dom"];

export function pad(n){ return n < 10 ? "0" + n : "" + n; }
export function ymd(d){ return d.getFullYear() + "-" + pad(d.getMonth()+1) + "-" + pad(d.getDate()); }
export function parseYmd(s){ var p = s.split("-"); return new Date(+p[0], +p[1]-1, +p[2]); }
export function hoy(){ var t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); }
export function suma(d, dias){ var x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + dias); return x; }
export function difDias(a, b){ return Math.round((b - a) / 86400000); }
// Lunes = 0 ... domingo = 6, como en la plantilla.
export function dowDe(d){ return (d.getDay() + 6) % 7; }
export function lunesDe(d){ return suma(d, -dowDe(d)); }
export function diasDelMes(d){ return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); }

export function corta(d){ return d.getDate() + " " + MES_CORTO[d.getMonth()]; }
export function larga(d){ return DOW[dowDe(d)] + " " + d.getDate() + " de " + MESES[d.getMonth()]; }

// "el 3 sep a las 14:05", para el registro de envio.
export function sello(iso){
  var d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return "el " + d.getDate() + " " + MES_CORTO[d.getMonth()] + " a las " + pad(d.getHours()) + ":" + pad(d.getMinutes());
}
