/* Unico lugar que conoce las colecciones. Recibe el almacen por
   parametro (el puente de firebase-init.js, o cualquier otro con el
   mismo API: collection/doc/onSnapshot/set/update/delete), asi que el
   resto de la aplicacion no sabe que detras hay Firestore.

   Cada repositorio entrega objetos ya normalizados por modelos.js y
   devuelve la funcion para dejar de escuchar. */

import { publicacionDesdeDoc, piezaDesdeDoc, cuerpoPublicacion, cuerpoPieza, pubTemporadaDesdeDoc, cuerpoPubTemporada } from "../dominio/modelos.js";
import { temporadaDesdeDoc, cuerpoTemporada } from "../dominio/temporadas.js";
import { WEEKS_MIN, WEEKS_MAX, WEEKS_DEF } from "../dominio/ciclo.js";

// update() fusiona en profundidad; si el documento aun no existe y el
// almacen lo rechaza, se crea con set().
function fusionar(ref, datos){
  return ref.update(datos).catch(function(e){
    if (e && e.code === "invalid_argument") return ref.set(datos);
    throw e;
  });
}

export function crearRepositorios(almacen){
  return {
    plantilla: {
      escuchar: function(alDato, alError){
        return almacen.collection("plantilla").orderBy("week").onSnapshot(function(snap){
          alDato(snap.docs.map(function(d){ return publicacionDesdeDoc(d.id, d.data()); }));
        }, alError);
      },
      guardar: function(p){
        var col = almacen.collection("plantilla");
        var ref = p.id ? col.doc(p.id) : col.doc();
        return ref.set(cuerpoPublicacion(p));
      },
      mover: function(id, w, dw){ return almacen.collection("plantilla").doc(id).update({week:w, dow:dw}); },
      borrar: function(id){ return almacen.collection("plantilla").doc(id).delete(); }
    },

    libreria: {
      escuchar: function(alDato, alError){
        return almacen.collection("libreria").orderBy("title").onSnapshot(function(snap){
          alDato(snap.docs.map(function(d){ return piezaDesdeDoc(d.id, d.data()); }));
        }, alError);
      },
      guardar: function(it){
        var col = almacen.collection("libreria");
        return (it.id ? col.doc(it.id) : col.doc()).set(cuerpoPieza(it));
      },
      borrar: function(id){ return almacen.collection("libreria").doc(id).delete(); }
    },

    // Registro de envio de una vuelta: {marks: {idPost: {idCompania: fechaISO}}}.
    // Cadena vacia = no enviado; la fusion profunda deja que dos personas
    // marquen publicaciones distintas sin pisarse.
    envios: {
      escuchar: function(clave, alDato, alError){
        return almacen.doc("envios/" + clave).onSnapshot(function(snap){
          var b = snap.exists ? (snap.data() || {}) : {};
          alDato((b.marks && typeof b.marks === "object") ? b.marks : {});
        }, alError);
      },
      marcar: function(clave, parche){ return fusionar(almacen.doc("envios/" + clave), {marks: parche}); }
    },

    // Duracion del ciclo: una sola config compartida por todos. Acortar
    // solo cambia este numero; ninguna publicacion se borra.
    config: {
      escuchar: function(alDato, alError){
        return almacen.doc("config/ciclo").onSnapshot(function(snap){
          var b = snap.exists ? (snap.data() || {}) : {};
          var n = parseInt(b.weeks, 10);
          alDato((n >= WEEKS_MIN && n <= WEEKS_MAX) ? n : WEEKS_DEF);
        }, alError);
      },
      guardarSemanas: function(n){ return fusionar(almacen.doc("config/ciclo"), {weeks: n}); }
    },

    // Temporadas especiales: el rango de fechas y el tema.
    temporadas: {
      escuchar: function(alDato, alError){
        return almacen.collection("temporadas").orderBy("desde").onSnapshot(function(snap){
          var out = [];
          snap.docs.forEach(function(d){ var t = temporadaDesdeDoc(d.id, d.data()); if (t) out.push(t); });
          alDato(out);
        }, alError);
      },
      guardar: function(t){
        var col = almacen.collection("temporadas");
        return (t.id ? col.doc(t.id) : col.doc()).set(cuerpoTemporada(t));
      },
      borrar: function(id){ return almacen.collection("temporadas").doc(id).delete(); }
    },

    // Lo programado dentro de cada temporada, un documento por publicacion.
    pubsTemporada: {
      escuchar: function(alDato, alError){
        return almacen.collection("temporadaPubs").orderBy("dia").onSnapshot(function(snap){
          alDato(snap.docs.map(function(d){ return pubTemporadaDesdeDoc(d.id, d.data()); }));
        }, alError);
      },
      guardar: function(p){
        var col = almacen.collection("temporadaPubs");
        return (p.id ? col.doc(p.id) : col.doc()).set(cuerpoPubTemporada(p));
      },
      mover: function(id, dia, regla){
        var cambio = {dia: dia};
        if (regla) cambio.regla = regla;
        return almacen.collection("temporadaPubs").doc(id).update(cambio);
      },
      borrar: function(id){ return almacen.collection("temporadaPubs").doc(id).delete(); }
    },

    // Lo escribe Chatmanager; aqui solo se lee.
    calificaciones: {
      escuchar: function(alDato, alError){
        return almacen.collection("calificaciones").onSnapshot(function(snap){
          var out = {};
          snap.docs.forEach(function(d){
            var b = d.data() || {};
            if (b.corridas && typeof b.corridas === "object") out[d.id] = b.corridas;
          });
          alDato(out);
        }, alError);
      }
    }
  };
}
