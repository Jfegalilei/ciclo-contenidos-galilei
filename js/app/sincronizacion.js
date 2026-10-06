/* Mantiene el estado al dia con la base: abre las suscripciones, cambia
   la del registro de envio cuando cambia la vuelta y las cierra todas
   si se pierde el acceso. */

import { inicioDeVuelta, claveDeVuelta } from "../dominio/ciclo.js";
import { hoy, ymd } from "../dominio/fechas.js";
import { describirError } from "../datos/escritura.js";

export function crearSincronizacion(repos, estado, avisos){
  var bajas = {};

  function soltar(nombre){
    if (!bajas[nombre]) return;
    try { bajas[nombre](); } catch(e){}
    bajas[nombre] = null;
  }
  function soloLectura(){
    Object.keys(bajas).forEach(soltar);
    estado.cambiar({conectado: false});
  }
  function avisar(e){ avisos.fijo(describirError(e), "err"); }
  function grave(e){ avisar(e); soloLectura(); }

  // El registro de envio es el unico que cambia con cada vuelta.
  var claveActual = null;
  function escucharEnvios(){
    var clave = claveDeVuelta(estado.get().inicio);
    if (clave === claveActual && bajas.envios) return;
    claveActual = clave;
    soltar("envios");
    bajas.envios = repos.envios.escuchar(clave, function(m){
      estado.cambiar({marcas: m});
    }, grave);
  }

  // El largo del ciclo y las temporadas deciden donde arranca cada vuelta:
  // si cambian, la vista se recoloca en la vuelta que contenia lo visible.
  function recolocar(parche){
    var s = estado.get();
    var semanas = parche.semanas || s.semanas, temps = parche.temporadas || s.temporadas;
    var base = parche.semanas ? hoy() : s.inicio;
    var ini = inicioDeVuelta(base, semanas, temps);
    if (ymd(ini) !== ymd(s.inicio)){ parche.inicio = ini; parche.marcas = {}; parche.seleccion = null; }
    estado.cambiar(parche);
    escucharEnvios();
  }

  return {
    arrancar: function(){
      bajas.config = repos.config.escuchar(function(n){
        if (n !== estado.get().semanas) recolocar({semanas: n});
      }, avisar);
      bajas.plantilla = repos.plantilla.escuchar(function(pubs){
        estado.cambiar({publicaciones: pubs, conectado: true});
        avisos.fijo("");
      }, grave);
      escucharEnvios();
      bajas.libreria = repos.libreria.escuchar(function(l){ estado.cambiar({libreria: l}); }, avisar);
      // Sin datos o sin permiso, la participacion simplemente no sale.
      bajas.calif = repos.calificaciones.escuchar(function(c){ estado.cambiar({calif: c}); },
                                                  function(){ estado.cambiar({calif: {}}); });
      // Si la base aun no tiene las reglas de temporadas, el ciclo sigue
      // funcionando igual: solo se avisa.
      bajas.temporadas = repos.temporadas.escuchar(function(t){
        estado.cambiar({temporadasOk: true});
        recolocar({temporadas: t});
      }, function(){ estado.cambiar({temporadas: [], temporadasOk: false}); });
      bajas.pubsTemporada = repos.pubsTemporada.escuchar(function(p){ estado.cambiar({pubsTemporada: p}); },
                                                         function(){ estado.cambiar({pubsTemporada: []}); });
    },
    // dir: 1 adelante, -1 atras; solo para la animacion.
    irAVuelta: function(inicio, dir){
      estado.cambiar({inicio: inicio, seleccion: null, marcas: {}, direccion: dir || 0});
      escucharEnvios();
    },
    soloLectura: soloLectura
  };
}
