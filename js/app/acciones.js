/* Casos de uso: lo que una persona puede hacer en el calendario. Las
   vistas solo llaman aqui; no tocan repositorios ni estado directamente.

   dep = {repos, estado, sinc, escribir, avisos} */

import { TIPOS, COMPANIAS, TOTAL_CO } from "../dominio/catalogos.js";
import { DOW, hoy, ymd, parseYmd, larga } from "../dominio/fechas.js";
import { inicioDeVuelta, vueltaSiguiente, vueltaAnterior, claveDeVuelta } from "../dominio/ciclo.js";
import { esFija, etiquetaFija } from "../dominio/reglasFijas.js";
import { diaDe, diaDePub, reglaDeFecha, etiquetaRegla } from "../dominio/temporadas.js";
import { publicacionDesdePieza, pubTemporadaDesdePieza, esDeTemporada } from "../dominio/modelos.js";
import { buscarPublicacion, buscarPieza, enviosDe, celdaDe, fechaEnVuelta, pubsDeTemporada } from "./consultas.js";
import { preferencias } from "./preferencias.js";

export function crearAcciones(dep){
  var estado = dep.estado, avisos = dep.avisos;
  function s(){ return estado.get(); }
  function nada(){}

  // Toda escritura exige conexion; sin ella se avisa y no se intenta.
  function conectado(){
    if (s().conectado) return true;
    avisos.toast("Sin conexion al almacenamiento del calendario.");
    return false;
  }
  function donde(w, dw){ return "semana " + w + ", " + DOW[dw]; }
  function nombreFecha(fs){ return larga(parseYmd(fs)); }
  function abrirEn(fs, id){ estado.cambiar({seleccion: fs ? {fs: fs, postId: id || null} : null}); }

  var api = {
    /* ---------- navegacion ---------- */
    vueltaAnterior: function(){ dep.sinc.irAVuelta(vueltaAnterior(s().inicio, s().semanas, s().temporadas), -1); },
    vueltaSiguiente: function(){ dep.sinc.irAVuelta(vueltaSiguiente(s().inicio, s().semanas, s().temporadas), 1); },
    irAHoy: function(){ api.irAFecha(hoy()); },
    irAFecha: function(d){
      var ini = inicioDeVuelta(d, s().semanas, s().temporadas);
      if (ymd(ini) !== ymd(s().inicio)) dep.sinc.irAVuelta(ini, ini > s().inicio ? 1 : -1);
    },
    abrirDia: function(fs, postId){ abrirEn(fs, postId); },
    enfocarPublicacion: function(postId){
      var sel = s().seleccion;
      if (sel) abrirEn(sel.fs, sel.postId === postId ? null : postId);
    },
    cerrarPanel: function(){ estado.cambiar({seleccion: null}); },
    filtrarCompania: function(id){
      preferencias.guardarCompania(id);
      estado.cambiar({filtroCo: id || ""});
    },
    alternarLateral: function(){
      var v = !s().libAbierta;
      preferencias.guardarLibreriaAbierta(v);
      estado.cambiar({libAbierta: v});
    },
    verPestana: function(p){
      preferencias.guardarPestana(p);
      estado.cambiar({pestana: p, libAbierta: true});
    },
    filtrarLibreria: function(parche){
      estado.cambiar({libFiltro: Object.assign({}, s().libFiltro, parche)});
    },
    cambiarTema: function(t){
      preferencias.guardarTema(t);
      document.documentElement.setAttribute("data-theme", t);
      estado.cambiar({tema: t});
    },

    /* ---------- publicaciones (del ciclo o de una temporada) ---------- */
    guardarPublicacion: function(p){
      if (!conectado()) return;
      var deTemp = esDeTemporada(p);
      // El panel se abre donde de verdad quedo (una fija va a su fecha).
      var fs = fechaEnVuelta(s(), p);
      if (fs) abrirEn(fs, p.id);
      var repo = deTemp ? dep.repos.pubsTemporada : dep.repos.plantilla;
      dep.escribir(function(){ return repo.guardar(p); }).then(function(){
        if (deTemp) avisos.toast(p.id ? "Cambios guardados en la temporada." : "Agregada a la temporada.");
        else if (esFija(p)) avisos.toast((p.id ? "Fijada" : "Agregada y fijada") + " al " + etiquetaFija(p.fija) + (fs ? "." : ": no cae en esta vuelta."));
        else avisos.toast(p.id ? "Cambios guardados en el ciclo." : "Agregada a la " + donde(p.week, p.dow) + ".");
      }, nada);
    },
    borrarPublicacion: function(p){
      if (!conectado()) return;
      var repo = esDeTemporada(p) ? dep.repos.pubsTemporada : dep.repos.plantilla;
      dep.escribir(function(){ return repo.borrar(p.id); })
        .then(function(){ avisos.toast(esDeTemporada(p) ? "Eliminada de la temporada." : "Eliminada del ciclo."); }, nada);
    },
    // Soltar una publicacion en otro dia. Las del ciclo se mueven entre
    // dias del ciclo; las de temporada, dentro de su temporada.
    moverPublicacion: function(id, fs){
      if (!conectado()) return;
      var p = buscarPublicacion(s(), id), c = celdaDe(s(), fs);
      if (!p || !c) return;
      if (esDeTemporada(p)){
        if (!c.temp || c.temp.id !== p.temporada){ avisos.toast("Esa publicacion es de temporada: solo se mueve entre dias de su temporada."); return; }
        var dia = diaDe(c.temp, c.fecha);
        if (dia === diaDePub(c.temp, p)) return;
        // Con regla, la regla sigue al dia donde se suelta: soltar el
        // "primer lunes" en un miercoles lo vuelve "primer miercoles".
        var regla = p.regla ? reglaDeFecha(c.temp, c.fecha) : null;
        dep.escribir(function(){ return dep.repos.pubsTemporada.mover(id, dia, regla); })
          .then(function(){
            avisos.toast(regla ? "Ahora sale el " + etiquetaRegla(regla) + " de " + c.temp.nombre + "." : "Movida al " + nombreFecha(fs) + ".");
          }, nada);
        return;
      }
      if (esFija(p)){ avisos.toast("Esa publicacion esta fija al " + etiquetaFija(p.fija) + ". Cambia la regla desde Editar."); return; }
      if (c.temp){ avisos.toast("Ese dia es de " + c.temp.nombre + ": el ciclo no corre ahi."); return; }
      if (p.week === c.w && p.dow === c.d) return;
      dep.escribir(function(){ return dep.repos.plantilla.mover(id, c.w, c.d); })
        .then(function(){ avisos.toast("Movida a " + donde(c.w, c.d) + "."); }, nada);
    },
    // Programar una pieza de la libreria = copiarla al dia donde se suelta.
    programarPieza: function(libId, fs){
      if (!conectado()) return;
      var it = buscarPieza(s(), libId), c = celdaDe(s(), fs);
      if (!it){ avisos.toast("Esa pieza ya no esta en la libreria."); return; }
      if (!c) return;
      var nombre = '"' + (it.title || TIPOS[it.type].label) + '"';
      if (c.temp){
        var t = c.temp, p = pubTemporadaDesdePieza(it, t.id, diaDe(t, c.fecha));
        dep.escribir(function(){ return dep.repos.pubsTemporada.guardar(p); })
          .then(function(){ avisos.toast(nombre + " programada en " + t.nombre + ", " + nombreFecha(fs) + "."); }, nada);
        return;
      }
      dep.escribir(function(){ return dep.repos.plantilla.guardar(publicacionDesdePieza(it, c.w, c.d)); })
        .then(function(){ avisos.toast(nombre + " programada en " + donde(c.w, c.d) + "."); }, nada);
    },

    /* ---------- envios de la vuelta visible ---------- */
    marcarEnvio: function(p, companiaId, enviado){
      if (!conectado()) return;
      var parche = {}; parche[p.id] = {}; parche[p.id][companiaId] = enviado ? new Date().toISOString() : "";
      var clave = claveDeVuelta(s().inicio);
      dep.escribir(function(){ return dep.repos.envios.marcar(clave, parche); }).then(null, nada);
    },
    marcarTodas: function(p, enviado){
      if (!conectado()) return;
      var previas = enviosDe(s(), p.id), ahora = new Date().toISOString(), dentro = {};
      COMPANIAS.forEach(function(c){ dentro[c.id] = enviado ? (previas[c.id] || ahora) : ""; });
      var parche = {}; parche[p.id] = dentro;
      var clave = claveDeVuelta(s().inicio);
      dep.escribir(function(){ return dep.repos.envios.marcar(clave, parche); }).then(function(){
        avisos.toast(enviado ? "Marcada para las " + TOTAL_CO + " companias." : "Envios desmarcados.");
      }, nada);
    },

    /* ---------- libreria ---------- */
    guardarPieza: function(it){
      if (!conectado()) return;
      dep.escribir(function(){ return dep.repos.libreria.guardar(it); })
        .then(function(){ avisos.toast(it.id ? "Pieza actualizada." : "Pieza guardada en la libreria."); }, nada);
    },
    borrarPieza: function(it){
      if (!conectado()) return;
      dep.escribir(function(){ return dep.repos.libreria.borrar(it.id); })
        .then(function(){ avisos.toast("Pieza eliminada de la libreria."); }, nada);
    },

    /* ---------- temporadas ---------- */
    guardarTemporada: function(t){
      if (!conectado()) return;
      var nueva = !t.id;
      dep.escribir(function(){ return dep.repos.temporadas.guardar(t); }).then(function(){
        avisos.toast(nueva ? t.nombre + " creada. El ciclo se aplaza mientras dure." : "Temporada actualizada.");
      }, nada);
      if (nueva) api.irAFecha(parseYmd(t.desde));
    },
    // Borra la temporada y todo lo programado en ella. El ciclo vuelve a
    // correr esas semanas como si nada.
    borrarTemporada: function(t){
      if (!conectado()) return;
      var pubs = pubsDeTemporada(s(), t.id);
      dep.escribir(function(){
        return Promise.all(pubs.map(function(p){ return dep.repos.pubsTemporada.borrar(p.id); }))
          .then(function(){ return dep.repos.temporadas.borrar(t.id); });
      }).then(function(){ avisos.toast(t.nombre + " eliminada. El ciclo vuelve a correr en esas fechas."); }, nada);
    },
    irATemporada: function(t){ api.irAFecha(t.ini); },

    /* ---------- configuracion del ciclo ---------- */
    cambiarSemanas: function(n){
      if (!conectado()) return Promise.reject();
      return dep.escribir(function(){ return dep.repos.config.guardarSemanas(n); }).then(function(){
        avisos.toast("El ciclo ahora dura " + n + (n === 1 ? " semana." : " semanas."));
      });
    }
  };
  return api;
}
