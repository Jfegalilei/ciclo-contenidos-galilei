/* PUBLICACIONES FIJAS
   Una publicacion puede quedar clavada a una fecha real en vez de
   flotar con el ciclo. El campo "fija" guarda la regla:
     null                    suelta: vive en su casilla (week, dow)
     {k:"mes", d:1..31}      ese dia de cada mes (d:0 = ultimo dia)
     {k:"ano", m:0..11, d:}  esa fecha exacta, cada ano
     {k:"nth", n:, w:0..6}   n-esimo dia de la semana del mes
                             (n: 1..4, o -1 para el ultimo)
   week y dow se conservan como casilla de origen, para cuando se suelte. */

import { MESES, DOW, suma, diasDelMes, dowDe } from "./fechas.js";

export var NTH = [{v:1,l:"primer"},{v:2,l:"segundo"},{v:3,l:"tercer"},{v:4,l:"cuarto"},{v:-1,l:"ultimo"}];

export function esFija(p){ return !!(p && p.fija && p.fija.k); }

// La regla llega de la db: se acepta solo si esta completa y en rango.
export function normFija(fx){
  if (!fx || typeof fx !== "object") return null;
  var a, b;
  if (fx.k === "mes"){ a = parseInt(fx.d, 10); return (a >= 0 && a <= 31) ? {k:"mes", d:a} : null; }
  if (fx.k === "ano"){
    a = parseInt(fx.m, 10); b = parseInt(fx.d, 10);
    return (a >= 0 && a <= 11 && b >= 1 && b <= 31) ? {k:"ano", m:a, d:b} : null;
  }
  if (fx.k === "nth"){
    a = parseInt(fx.n, 10); b = parseInt(fx.w, 10);
    return ((a === -1 || (a >= 1 && a <= 4)) && b >= 0 && b <= 6) ? {k:"nth", n:a, w:b} : null;
  }
  return null;
}

// Unica prueba: esta fecha cumple la regla?
export function cumple(fx, d){
  if (!fx || !fx.k) return false;
  if (fx.k === "mes") return fx.d === 0 ? d.getDate() === diasDelMes(d) : d.getDate() === fx.d;
  if (fx.k === "ano") return d.getMonth() === fx.m && d.getDate() === fx.d;
  if (fx.k === "nth"){
    if (dowDe(d) !== fx.w) return false;
    return fx.n === -1 ? (d.getDate() + 7 > diasDelMes(d)) : (Math.ceil(d.getDate() / 7) === fx.n);
  }
  return false;
}

// Primera fecha desde "desde" que cumple la regla. Un ano de margen
// basta para cualquiera de las tres reglas.
export function proximaFecha(fx, desde){
  for (var i = 0; i < 800; i++){
    var d = suma(desde, i);
    if (cumple(fx, d)) return d;
  }
  return null;
}

export function etiquetaFija(fx){
  if (!fx || !fx.k) return "";
  if (fx.k === "mes") return fx.d === 0 ? "ultimo dia del mes" : "dia " + fx.d + " de cada mes";
  if (fx.k === "ano") return fx.d + " de " + MESES[fx.m] + ", cada ano";
  if (fx.k === "nth"){
    var o = "";
    for (var i = 0; i < NTH.length; i++){ if (NTH[i].v === fx.n) o = NTH[i].l; }
    return o + " " + DOW[fx.w] + " del mes";
  }
  return "";
}
