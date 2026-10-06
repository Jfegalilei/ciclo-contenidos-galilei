/* Pestana "Temporadas" de la barra lateral: las temporadas creadas, con
   cuanto aplazan el ciclo, y atajos para crear las de siempre. */

import { TEMAS, SUGERIDAS, proximaSugerida, duracion, estadoDe, rangoTxt } from "../dominio/temporadas.js";
import { semanasAplazadas } from "../dominio/ciclo.js";
import { hoy, difDias, parseYmd } from "../dominio/fechas.js";
import { pubsDeTemporada, fueraDeRango } from "../app/consultas.js";
import { $, esc, plural } from "./dom.js";
import { ICONO } from "./iconos.js";
import { arteDe } from "./temas.js";

export function montarTemporadas(acciones, editores, estado){
  var lista = $("tempList");
  var sugeridas = [];

  $("tempNew").onclick = function(){ editores.temporada(null); };

  lista.addEventListener("click", function(ev){
    var ed = ev.target.closest("[data-editar]");
    var sg = ev.target.closest("[data-sugerida]");
    var card = ev.target.closest("[data-temp]");
    var s = estado.get();
    if (sg){ editores.temporada(null, sugeridas[+sg.getAttribute("data-sugerida")]); return; }
    if (!card) return;
    var t = s.temporadas.filter(function(x){ return x.id === card.getAttribute("data-temp"); })[0];
    if (!t) return;
    if (ed) editores.temporada(t);
    else acciones.irATemporada(t);
  });

  function estadoTxt(t, h){
    var e = estadoDe(t, h);
    if (e === "curso") return "En curso";
    if (e === "terminada") return "Terminada";
    var n = difDias(h, t.ini);
    return n === 1 ? "Manana" : "En " + n + " dias";
  }

  function tarjeta(s, t, h){
    var sem = semanasAplazadas(t, s.temporadas), n = pubsDeTemporada(s, t.id).length, fuera = fueraDeRango(s, t).length;
    var e = estadoDe(t, h);
    return '<article class="tcard ' + e + '" data-temp="' + t.id + '" style="--tm:' + TEMAS[t.tema].color + '" tabindex="0" title="Ir a la temporada">' +
             '<span class="tico">' + arteDe(t.tema).icono + "</span>" +
             '<div class="tcuerpo">' +
               '<span class="testado">' + estadoTxt(t, h) + "</span>" +
               '<span class="tnom">' + esc(t.nombre) + "</span>" +
               '<span class="tfec">' + esc(rangoTxt(t)) + "</span>" +
               '<span class="tmeta">' + plural(duracion(t), "dia", "dias") + " · " +
                 (sem ? "pausa " + plural(sem, "semana", "semanas") : "sin pausa") + " · " + plural(n, "publicacion", "publicaciones") + "</span>" +
               (fuera ? '<span class="tfuera">' + plural(fuera, "quedo fuera del rango", "quedaron fuera del rango") + "</span>" : "") +
             "</div>" +
             '<div class="tlado">' +
               '<button class="iconbtn" data-editar aria-label="Editar temporada" title="Editar temporada"' + (s.conectado ? "" : " disabled") + ">" + ICONO.lapiz + "</button></div>" +
           "</article>";
  }

  return {
    pintar: function(s){
      var h = hoy();
      $("tempCount").textContent = s.temporadas.length || "";
      $("tempNew").disabled = !s.conectado || !s.temporadasOk;

      if (s.conectado && !s.temporadasOk){
        lista.innerHTML = '<div class="empty">Las temporadas aun no estan habilitadas en la base de datos. ' +
                          "Hay que publicar las reglas nuevas de <code>firestore.rules</code> en Firebase.</div>";
        return;
      }

      // Las que vienen y la que corre primero; las terminadas al final.
      var vivas = s.temporadas.filter(function(t){ return estadoDe(t, h) !== "terminada"; });
      var viejas = s.temporadas.filter(function(t){ return estadoDe(t, h) === "terminada"; }).reverse();
      var html = vivas.map(function(t){ return tarjeta(s, t, h); }).join("");
      if (!s.temporadas.length){
        html = '<div class="empty tvacio">' + ICONO.calendario +
               "<span>Sin temporadas todavia.</span><small>Mientras una temporada dura, el ciclo se pone en pausa y la programacion es la de la temporada.</small></div>";
      }

      // Sugeridas: las fechas de siempre que aun no estan creadas.
      sugeridas = SUGERIDAS.map(function(sg){ return proximaSugerida(sg, h); }).filter(function(sg){
        if (!sg) return false;
        var a = parseYmd(sg.desde), b = parseYmd(sg.hasta);
        return !s.temporadas.some(function(t){ return a <= t.fin && b >= t.ini; });
      }).sort(function(a, b){ return a.desde < b.desde ? -1 : 1; });
      if (sugeridas.length && s.conectado){
        html += '<div class="tsec">Sugeridas</div>' + sugeridas.map(function(sg, i){
          var t = {ini: parseYmd(sg.desde), fin: parseYmd(sg.hasta)};
          return '<button class="tsug" data-sugerida="' + i + '" style="--tm:' + TEMAS[sg.tema].color + '">' +
                 '<span class="tico">' + arteDe(sg.tema).icono + '</span><span class="tsug-txt"><b>' + esc(sg.nombre) + "</b><small>" +
                 esc(rangoTxt(t)) + '</small></span><span class="tmas">' + ICONO.mas + "</span></button>";
        }).join("");
      }
      if (viejas.length) html += '<div class="tsec">Terminadas</div>' + viejas.map(function(t){ return tarjeta(s, t, h); }).join("");
      lista.innerHTML = html;
    }
  };
}
