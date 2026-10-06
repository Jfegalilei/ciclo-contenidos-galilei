/* Participacion de cada reto. La calcula Chatmanager mirando los grupos,
   no el calendario: reconoce que reto de la LIBRERIA se lanzo y le deja
   la calificacion a ese item. Aqui solo se resume y se clasifica. */

// Promedio de todas las corridas y el detalle de la ultima.
export function resumirCorridas(corridas){
  if (!corridas) return null;
  var fechas = Object.keys(corridas).sort();
  if (!fechas.length) return null;
  var suma = fechas.reduce(function(a, f){ return a + corridas[f].pct; }, 0);
  var ult = fechas[fechas.length - 1];
  return {
    pct: Math.round(suma / fechas.length * 10) / 10,
    corridas: fechas.length,
    ultima: {fecha: ult, datos: corridas[ult]}
  };
}

// Semaforo: mas de 40 verde, mas de 20 amarillo, el resto rojo.
export function nivelPct(v){ return v > 40 ? "ok" : v > 20 ? "medio" : "bajo"; }
export function pctTxt(v){ return String(Math.round(v * 10) / 10).replace(".", ",") + "%"; }

// Un reto del ciclo es una copia de la libreria: se reconoce por el titulo.
export function mismoTitulo(a, b){
  return String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();
}
