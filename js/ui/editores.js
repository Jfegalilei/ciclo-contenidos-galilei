/* Los editores concretos, armados sobre el editor generico. Lo unico
   que cambia entre ellos es la lista de campos y a donde se guarda. */

import { copiar, publicacionNueva, pubTemporadaNueva, piezaNueva } from "../dominio/modelos.js";
import { temporadaNueva, validarTemporada, diaDe } from "../dominio/temporadas.js";
import { vuelta, celdaDe, buscarTemporada, pubsDeTemporada } from "../app/consultas.js";
import { esc, plural } from "./dom.js";
import { abrirEditor } from "./editor.js";
import { campoTitulo, campoClasificacion, campoProgramacion, campoEstrategia, campoCopy, campoImagen,
         campoDiaTemporada, campoNombre, campoTema, campoRango } from "./campos.js";

function tituloOCopy(d){ return (d.title || d.copy) ? "" : "Escribe al menos un titulo o el copy."; }

export function crearEditores(acciones, estado){
  var ed = {
    // p: publicacion existente (del ciclo o de una temporada), o null para
    // una nueva del ciclo en la casilla (w, dw).
    publicacion: function(p, w, dw){
      if (p && p.temporada) return ed.deTemporada(p);
      var s = estado.get();
      abrirEditor({
        titulo: p ? "Editar publicacion" : "Nueva publicacion",
        datos: p ? copiar(p) : publicacionNueva(w, dw),
        ctx: {semanas: s.semanas, fechas: vuelta(s).celdas.map(function(c){ return c.fecha; })},
        campos: [
          campoTitulo, campoProgramacion, campoClasificacion, campoEstrategia,
          function(d, ctx){ return campoCopy(d, ctx, true); },
          campoImagen
        ],
        validar: tituloOCopy,
        alGuardar: acciones.guardarPublicacion
      });
    },

    // Publicacion de temporada: existente, o nueva en (temporada, dia).
    deTemporada: function(p, t, dia){
      var s = estado.get();
      t = t || buscarTemporada(s, p.temporada);
      if (!t) return;
      abrirEditor({
        titulo: (p ? "Editar publicacion de " : "Nueva publicacion de ") + t.nombre,
        tema: t.tema,
        datos: p ? copiar(p) : pubTemporadaNueva(t.id, dia),
        ctx: {temporada: t},
        campos: [
          campoTitulo, campoDiaTemporada, campoClasificacion, campoEstrategia,
          function(d, ctx){ return campoCopy(d, ctx, false); },
          campoImagen
        ],
        validar: tituloOCopy,
        alGuardar: acciones.guardarPublicacion
      });
    },

    // Nueva publicacion en un dia de la vuelta visible: si el dia es de
    // temporada, va a la temporada; si no, a la casilla del ciclo.
    nuevaEn: function(fs){
      var c = celdaDe(estado.get(), fs);
      if (!c) return;
      if (c.temp) ed.deTemporada(null, c.temp, diaDe(c.temp, c.fecha));
      else ed.publicacion(null, c.w, c.d);
    },

    pieza: function(it){
      abrirEditor({
        titulo: it ? "Editar pieza de la libreria" : "Nueva pieza de la libreria",
        datos: it ? copiar(it) : piezaNueva(),
        campos: [campoTitulo, campoClasificacion, campoEstrategia, campoCopy, campoImagen],
        validar: tituloOCopy,
        alGuardar: acciones.guardarPieza,
        borrar: it ? {
          titulo: "Eliminar de la libreria",
          texto: "<b>" + esc(it.title || "Sin titulo") + "</b> se quita de la libreria. Lo que ya hayas programado en el ciclo no se toca.",
          fn: function(){ acciones.borrarPieza(it); }
        } : null
      });
    },

    // base: temporada existente, o {nombre, tema, desde, hasta} sugerido.
    temporada: function(t, base){
      var s = estado.get();
      var n = t ? pubsDeTemporada(s, t.id).length : 0;
      abrirEditor({
        titulo: t ? "Editar temporada" : "Nueva temporada",
        tema: (t || base || {}).tema || "especial",
        datos: t ? {id: t.id, nombre: t.nombre, tema: t.tema, desde: t.desde, hasta: t.hasta} : temporadaNueva(base),
        ctx: {temporadas: s.temporadas, semanas: s.semanas},
        campos: [campoNombre, campoTema, campoRango],
        validar: function(d){ return validarTemporada(d, estado.get().temporadas); },
        alGuardar: acciones.guardarTemporada,
        borrar: t ? {
          titulo: "Eliminar temporada",
          texto: "<b>" + esc(t.nombre) + "</b> se elimina" + (n ? " junto con " + plural(n, "publicacion programada", "publicaciones programadas") + " en ella" : "") +
                 ". El ciclo vuelve a correr en esas fechas. Esto no se puede deshacer.",
          fn: function(){ acciones.borrarTemporada(t); }
        } : null
      });
    }
  };
  return ed;
}
