/* VISTA DE PRUEBA (solo en localhost, con ?demo en la direccion)
   Un almacen en memoria con el mismo API que el puente de Firebase
   (collection/doc/orderBy/onSnapshot/set/update/delete). Sirve para
   probar diseno y funciones sin entrar con Google y sin tocar los datos
   reales: todo se pierde al recargar.

   Arranca con web-actual.json si existe (lo baja `node gali.js exportar`)
   y le suma dos temporadas de ejemplo. */

import { hoy } from "../dominio/fechas.js";

var datos = {};          // {coleccion: {id: doc}}
var oyentes = [];        // {col, id, campo, fn}
var serie = 0;

function nuevoId(){ serie++; return "demo" + Date.now().toString(36) + serie; }
function clon(x){ return x == null ? x : JSON.parse(JSON.stringify(x)); }
function col(n){ return datos[n] || (datos[n] = {}); }

// Fusion profunda, como set(..., {merge:true}) de Firestore.
function fusionar(a, b){
  Object.keys(b).forEach(function(k){
    var v = b[k];
    if (v && typeof v === "object" && !Array.isArray(v) && a[k] && typeof a[k] === "object" && !Array.isArray(a[k])) fusionar(a[k], v);
    else a[k] = clon(v);
  });
  return a;
}

function fotoColeccion(n, campo){
  var c = col(n);
  var docs = Object.keys(c).map(function(id){ return {id: id, data: function(){ return clon(c[id]); }}; });
  if (campo) docs.sort(function(x, y){
    var a = c[x.id][campo], b = c[y.id][campo];
    return a === b ? 0 : (a == null ? -1 : b == null ? 1 : (a < b ? -1 : 1));
  });
  return {docs: docs};
}
function fotoDoc(n, id){
  var d = col(n)[id];
  return {exists: !!d, data: function(){ return clon(d); }};
}

function avisar(n){
  setTimeout(function(){
    oyentes.forEach(function(o){
      if (o.col !== n) return;
      o.fn(o.id ? fotoDoc(n, o.id) : fotoColeccion(n, o.campo));
    });
  }, 0);
}
function escuchar(o){
  oyentes.push(o);
  setTimeout(function(){ if (oyentes.indexOf(o) >= 0) o.fn(o.id ? fotoDoc(o.col, o.id) : fotoColeccion(o.col, o.campo)); }, 0);
  return function(){ var i = oyentes.indexOf(o); if (i >= 0) oyentes.splice(i, 1); };
}
// Un poco de espera, para que se note igual que con la red.
function luego(fn){ return new Promise(function(r){ setTimeout(function(){ fn(); r(); }, 120); }); }

function envolverDoc(n, id){
  return {
    set: function(v){ return luego(function(){ col(n)[id] = clon(v); avisar(n); }); },
    update: function(v){ return luego(function(){ col(n)[id] = fusionar(col(n)[id] || {}, v); avisar(n); }); },
    delete: function(){ return luego(function(){ delete col(n)[id]; avisar(n); }); },
    onSnapshot: function(fn){ return escuchar({col: n, id: id, fn: fn}); }
  };
}

var almacen = {
  collection: function(n){
    return {
      doc: function(id){ return envolverDoc(n, id || nuevoId()); },
      orderBy: function(campo){ return {onSnapshot: function(fn){ return escuchar({col: n, campo: campo, fn: fn}); }}; },
      onSnapshot: function(fn){ return escuchar({col: n, fn: fn}); }
    };
  },
  doc: function(ruta){
    var p = ruta.split("/");
    return envolverDoc(p[0], p.slice(1).join("/"));
  }
};

/* ---------- datos de ejemplo ---------- */
function pub(temporada, dia, time, type, familia, title, copy){
  return {temporada: temporada, dia: dia, time: time, type: type, familia: familia, operatividad: type === "reto" ? "media" : "",
          cds: ["cd7"], img: "", title: title, copy: copy};
}
function sembrarTemporadas(){
  var a = hoy().getFullYear();
  col("temporadas").halloween = {nombre: "Halloween " + a, tema: "halloween", desde: a + "-10-01", hasta: a + "-10-31"};
  col("temporadas").navidad = {nombre: "Navidad " + a, tema: "navidad", desde: a + "-12-01", hasta: (a + 1) + "-01-06"};
  var tp = col("temporadaPubs");
  tp.h1 = pub("halloween", 0, "09:00", "anuncio", "temporada", "Arranca el mes del terror", "Este mes los retos vienen disfrazados.");
  tp.h2 = pub("halloween", 4, "09:00", "reto", "juego", "Disfraza tu plato", "Mandanos la foto del plato mas terrorifico.");
  tp.h3 = pub("halloween", 8, "11:00", "reto", "creativo", "Historia de miedo en 3 lineas", "Cuenten la historia mas corta y aterradora del turno.");
  tp.h4 = pub("halloween", 11, "15:00", "recordatorio", "participacion", "Doble GaliTicket de octubre", "Recuerden: esta semana todo reto da doble ticket.");
  tp.h5 = pub("halloween", 15, "09:00", "reto", "juego", "Adivina el ingrediente embrujado", "Pista: es naranja y no es zanahoria.");
  tp.h6 = pub("halloween", 22, "11:00", "reto", "personal", "Tu monstruo de la cocina", "Que tarea del turno es tu monstruo? Cuentenlo.");
  tp.h7 = pub("halloween", 30, "16:00", "anuncio", "temporada", "Noche de Halloween", "Hoy cerramos la temporada con premios sorpresa.");
  tp.h2.regla = {n: 1, w: 0};      // primer lunes de Halloween
  tp.h6.regla = {n: -1, w: 4};     // ultimo viernes
  tp.n1 = pub("navidad", 0, "09:00", "anuncio", "temporada", "Llego diciembre", "Arrancamos la temporada de Navidad.");
  tp.n2 = pub("navidad", 6, "11:00", "reto", "juego", "Calendario de adviento", "Cada dia un reto corto con premio.");
  tp.n3 = pub("navidad", 15, "09:00", "reto", "creativo", "Novena del equipo", "Una foto del equipo en modo navideno.");
  tp.n4 = pub("navidad", 23, "18:00", "anuncio", "temporada", "Nochebuena", "Gracias por un ano de juego.");
}

export function abrirDemo(){
  var aviso = document.getElementById("puertaMsg");
  fetch("web-actual.json", {cache: "no-store"}).then(function(r){ return r.ok ? r.json() : {}; }, function(){ return {}; })
    .then(function(j){
      ["plantilla", "libreria", "config", "calificaciones"].forEach(function(n){ if (j && j[n]) datos[n] = j[n]; });
      sembrarTemporadas();
      document.getElementById("puerta").hidden = true;
      document.body.classList.remove("bloqueado");
      document.getElementById("quien").textContent = "Vista de prueba: no guarda nada";
      document.documentElement.classList.add("es-demo");
      window.GALI.abrir(almacen);
    }, function(e){ if (aviso) aviso.textContent = "No se pudo abrir la vista de prueba."; window.GALI.fallar(e); });
}
