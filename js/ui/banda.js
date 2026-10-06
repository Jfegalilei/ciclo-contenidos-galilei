/* Banda de temporada, encima de la malla. Dice que temporada toca la
   vuelta visible y cuanto aplaza el ciclo; si no hay ninguna pero se
   acerca una, la anuncia con tiempo para preparar su contenido. */

import { TEMAS, rangoTxt, estadoDe, duracion } from "../dominio/temporadas.js";
import { semanasAplazadas, semanaPausada } from "../dominio/ciclo.js";
import { hoy, difDias, suma, lunesDe, MESES } from "../dominio/fechas.js";
import { temporadasEnVuelta, pubsDeTemporada } from "../app/consultas.js";
import { $, esc, plural } from "./dom.js";
import { arteDe } from "./temas.js";

var AVISO_DIAS = 45;   // con cuanta anticipacion se anuncia la proxima

export function montarBanda(acciones, editores, estado){
  var banda = $("banda");

  banda.addEventListener("click", function(ev){
    var b = ev.target.closest("[data-ir]");
    if (!b) return;
    var t = estado.get().temporadas.filter(function(x){ return x.id === b.getAttribute("data-ir"); })[0];
    if (t) acciones.irATemporada(t);
  });

  function retoma(t, temps){
    var n = semanasAplazadas(t, temps);
    if (!n) return "no detiene ninguna semana completa del ciclo";
    // El lunes siguiente a la ultima semana que la temporada detiene.
    var L = lunesDe(t.ini), vuelve = null;
    while (L <= t.fin){
      var p = semanaPausada(temps, L);
      if (p && p.id === t.id) vuelve = suma(L, 7);
      L = suma(L, 7);
    }
    return "el ciclo hace una pausa de " + plural(n, "semana", "semanas") + " y retoma el lunes " + vuelve.getDate() + " de " + MESES[vuelve.getMonth()];
  }

  function bloque(s, t, kicker, ir){
    var n = pubsDeTemporada(s, t.id).length;
    return '<div class="banda-t tm-' + t.tema + '" style="--tm:' + TEMAS[t.tema].color + '">' +
             '<span class="bico">' + arteDe(t.tema).icono + "</span>" +
             '<div class="btxt"><span class="kicker">' + kicker + "</span>" +
               '<span class="blinea"><b>' + esc(t.nombre) + "</b><span>" + esc(rangoTxt(t)) + " · " + retoma(t, s.temporadas) + "</span></span></div>" +
             '<span class="bcont">' + plural(n, "publicacion", "publicaciones") + " de " + plural(duracion(t), "dia", "dias") + "</span>" +
             (ir ? '<button class="btn" data-ir="' + t.id + '">Ver temporada</button>' : "") +
           "</div>";
  }

  return {
    pintar: function(s){
      var h = hoy(), en = temporadasEnVuelta(s), html = "";
      en.forEach(function(t){
        var e = estadoDe(t, h);
        html += bloque(s, t, e === "curso" ? "Temporada en curso" : e === "proxima" ? "Temporada en esta vuelta" : "Temporada pasada", false);
      });
      if (!en.length){
        var prox = s.temporadas.filter(function(t){ return t.ini > h && difDias(h, t.ini) <= AVISO_DIAS; })[0];
        if (prox){
          var d = difDias(h, prox.ini);
          html = bloque(s, prox, "Proxima temporada · " + (d === 1 ? "empieza manana" : "empieza en " + d + " dias"), true);
        }
      }
      banda.innerHTML = html;
      banda.hidden = !html;
    }
  };
}
