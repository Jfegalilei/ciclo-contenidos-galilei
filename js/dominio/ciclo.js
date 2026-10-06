/* MODELO DEL CICLO
   La programacion es un CICLO FIJO de N semanas que corre sin parar y
   no tiene nada que ver con los meses. Coleccion "plantilla":
     {week: 1-N, dow: 0-6, time, type, title, copy, fija}
   Son N*7 casillas fijas. Lo unico que cambia de una vuelta a la
   siguiente es el registro de envio,
   "envios/<AAAA-MM-DD del lunes en que arranca la vuelta>".

   Las temporadas (temporadas.js) APLAZAN el ciclo: una semana que una
   temporada cubre completa no cuenta, y el ciclo retoma despues donde
   iba. Por eso la posicion de una semana se mide en "semanas activas"
   desde el ancla, no en semanas de calendario. Sin temporadas las dos
   cuentas coinciden y todo queda exactamente como antes. */

import { parseYmd, lunesDe, suma, difDias, ymd } from "./fechas.js";
import { temporadaDe } from "./temporadas.js";

// Lunes de referencia: arranque del ciclo 1. Mover esta fecha recoloca
// el calendario, pero NO toca la plantilla: cada publicacion vive en su
// casilla (semana, dia), que no depende del ancla.
export var ANCHOR = "2026-08-31";
export var WEEKS_MIN = 1, WEEKS_MAX = 8, WEEKS_DEF = 4;

var TOPE = 1040;   // 20 anos de semanas: ningun bucle va mas lejos

function ancla(){ return lunesDe(parseYmd(ANCHOR)); }
function mod(a, n){ return ((a % n) + n) % n; }

// La temporada que cubre la semana completa de ese lunes, o null.
export function semanaPausada(temps, lunes){
  if (!temps || !temps.length) return null;
  var t = temporadaDe(temps, lunes);
  if (!t) return null;
  for (var i = 1; i < 7; i++){ if (!temporadaDe(temps, suma(lunes, i))) return null; }
  return t;
}

// Semanas activas entre el ancla y ese lunes. En una semana pausada da
// el indice de la proxima activa.
function indiceActivo(lunes, temps){
  var A = ancla(), k = Math.round(difDias(A, lunes) / 7), n = 0, i;
  if (!temps || !temps.length) return k;
  if (k >= 0){ for (i = 0; i < k; i++){ if (!semanaPausada(temps, suma(A, i * 7))) n++; } }
  else { for (i = k; i < 0; i++){ if (!semanaPausada(temps, suma(A, i * 7))) n--; } }
  return n;
}

// Lunes en que arranca la vuelta que contiene esa fecha. Una semana
// pausada pertenece a la vuelta que venia corriendo.
export function inicioDeVuelta(d, semanas, temps){
  var L = lunesDe(d), g = 0;
  while (semanaPausada(temps, L) && g++ < TOPE) L = suma(L, -7);
  var atras = mod(indiceActivo(L, temps), semanas);
  g = 0;
  while (atras > 0 && g++ < TOPE){
    L = suma(L, -7);
    if (!semanaPausada(temps, L)) atras--;
  }
  return L;
}

/* Las filas de una vuelta, en orden: sus N semanas activas y, metidas
   entre ellas o al final, las semanas que alguna temporada detuvo.
     {lunes, w: 1..N, pausa: null}       semana del ciclo
     {lunes, w: 0,    pausa: temporada}  semana completa de temporada */
export function filasDeVuelta(inicio, semanas, temps){
  var filas = [], L = inicio, w = 0, g = 0;
  while (g++ < TOPE){
    var t = semanaPausada(temps, L);
    if (t) filas.push({lunes: L, w: 0, pausa: t});
    else {
      if (w === semanas) break;
      w++;
      filas.push({lunes: L, w: w, pausa: null});
    }
    L = suma(L, 7);
  }
  return filas;
}

export function vueltaSiguiente(inicio, semanas, temps){
  var f = filasDeVuelta(inicio, semanas, temps);
  return suma(f[f.length - 1].lunes, 7);
}
export function vueltaAnterior(inicio, semanas, temps){
  return inicioDeVuelta(suma(inicio, -7), semanas, temps);
}

// Numero de vuelta, solo para nombrarla.
export function numeroDeVuelta(inicio, semanas, temps){
  return Math.floor(indiceActivo(inicio, temps) / semanas) + 1;
}
export function claveDeVuelta(inicio){ return ymd(inicio); }

// Semanas completas que detiene una temporada (con las demas en cuenta).
export function semanasAplazadas(t, temps){
  var n = 0, L = lunesDe(t.ini);
  while (L <= t.fin){
    var p = semanaPausada(temps, L);
    if (p && p.id === t.id) n++;
    L = suma(L, 7);
  }
  return n;
}
