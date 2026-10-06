/* Avisos que calcula la propia vista: nada se pierde al acortar el ciclo,
   y aqui se dice donde quedo lo que no se ve en pantalla. */

import { guardadas } from "../app/consultas.js";
import { plural } from "./dom.js";

export function avisosDelCiclo(s){
  var g = guardadas(s);
  if (!g.length) return [];
  var sem = {};
  g.forEach(function(p){ sem[p.week] = 1; });
  var claves = Object.keys(sem).sort(function(a, b){ return a - b; });
  return [plural(g.length, "publicacion quedo guardada", "publicaciones quedaron guardadas") +
    (claves.length === 1 ? " en la semana " : " en las semanas ") + claves.join(", ") +
    ", fuera del ciclo de " + plural(s.semanas, "semana", "semanas") +
    ". No se borro nada: vuelve" + (g.length === 1 ? "" : "n") + " a aparecer si amplias el ciclo."];
}
