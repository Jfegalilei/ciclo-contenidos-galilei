/* Panel lateral del dia: la lista de lo programado, una linea por
   publicacion. La que se elige se despliega con su detalle; si el dia
   tiene una sola, sale desplegada. */

import { TIPOS, TOTAL_CO } from "../dominio/catalogos.js";
import { larga, parseYmd, DOW } from "../dominio/fechas.js";
import { TEMAS, diaDe, duracion } from "../dominio/temporadas.js";
import { delDia, celdaDe, reemplazadas, estaLista, enviosDe, cuantasEnviadas } from "../app/consultas.js";
import { $, crear, esc, plural } from "./dom.js";
import { ICONO } from "./iconos.js";
import { capas } from "./capas.js";
import { coloresDe } from "./colores.js";
import { detallePublicacion, herramientas } from "./detalle.js";
import { arteDe } from "./temas.js";

export function montarPanel(acciones, editores, estado){
  var abiertos = {};   // <details> desplegados, para no plegarlos al repintar
  var dibujado = null; // casilla que esta pintada, para conservar el scroll

  function cerrar(){ acciones.cerrarPanel(); }
  $("dClose").onclick = cerrar;
  $("scrim").onclick = cerrar;
  $("dAdd").onclick = function(){
    var sel = estado.get().seleccion;
    if (sel) editores.nuevaEn(sel.fs);
  };

  function estadoEnvio(s, p){
    if (s.filtroCo) return enviosDe(s, p.id)[s.filtroCo] ? "Enviado" : "Pendiente";
    return cuantasEnviadas(s, p) + "/" + TOTAL_CO;
  }

  function pintar(){
    var s = estado.get(), sel = s.seleccion, open = !!sel;
    $("drawer").classList.toggle("open", open);
    $("drawer").setAttribute("aria-hidden", open ? "false" : "true");
    $("scrim").classList.toggle("open", open);
    if (!open){ capas.quitar(cerrar); dibujado = null; return; }
    // Solo al abrirse: repintar no debe ponerlo encima del editor.
    if (dibujado === null) capas.abrir(cerrar);

    var items = delDia(s, sel.fs), c = celdaDe(s, sel.fs);
    var clave = s.inicio.getTime() + ":" + sel.fs;
    var body = $("dBody"), scroll = dibujado === clave ? body.scrollTop : 0;
    dibujado = clave;

    $("dTitle").textContent = larga(parseYmd(sel.fs));
    var cuenta = items.length ? " · " + plural(items.length, "publicacion", "publicaciones") : "";
    var t = c && c.temp;
    $("dSub").textContent = t ? "Dia " + (diaDe(t, c.fecha) + 1) + " de " + duracion(t) + cuenta
                              : c ? "Semana " + c.w + " del ciclo" + cuenta : "";
    $("dTemp").hidden = !t;
    if (t){
      $("dTemp").setAttribute("style", "--tm:" + TEMAS[t.tema].color);
      $("dTemp").innerHTML = arteDe(t.tema).icono + "<span>" + esc(t.nombre) + "</span>";
    }
    $("drawer").classList.toggle("en-temp", !!t);
    $("drawer").style.setProperty("--tm", t ? TEMAS[t.tema].color : "");
    $("dAdd").disabled = !s.conectado || !c;

    body.innerHTML = "";
    // Lo que el ciclo tenia este dia sigue guardado: se avisa sin alarma.
    var fuera = reemplazadas(s, c);
    if (fuera.length){
      body.appendChild(crear("div", "reemplazo", ICONO.info + "<span>" + esc(t.nombre) + " ocupa este dia: " +
        plural(fuera.length, "publicacion", "publicaciones") + " del ciclo (semana " + c.w + ", " + DOW[c.d] +
        ") no sale" + (fuera.length === 1 ? "" : "n") + " esta vuelta. No se borra" + (fuera.length === 1 ? "" : "n") + ".</span>"));
    }
    if (!items.length){
      body.appendChild(crear("div", "empty",
        (t ? '<span class="vacio-orn" style="--tm:' + TEMAS[t.tema].color + '">' + arteDe(t.tema).icono + "</span>" : "") +
        "<span>" + (s.conectado ? (t ? "Nada programado para " + esc(t.nombre) + " este dia." : "Nada programado este dia.") : "Conectando con el calendario.") + "</span>" +
        (s.conectado ? "<small>Arrastra una pieza de la libreria o usa el boton +.</small>" : "")));
    }
    items.forEach(function(p){
      var abierta = items.length === 1 || sel.postId === p.id;
      var card = crear("article", "item" + (abierta ? " abierta" : "") + (estaLista(s, p) ? " done" : ""));
      card.setAttribute("style", coloresDe(p));

      var ctx = {s: s, p: p, acciones: acciones, editores: editores, abiertos: abiertos};
      var cab = crear("div", "ihead");
      var tog = crear("button", "itog",
        '<i class="dot"></i>' +
        '<span class="hora">' + esc(p.time || "--:--") + "</span>" +
        '<span class="tit">' + esc(p.title || TIPOS[p.type].label) + "</span>" +
        (abierta ? "" : '<span class="est">' + estadoEnvio(s, p) + "</span>"));
      tog.setAttribute("aria-expanded", abierta ? "true" : "false");
      tog.onclick = function(){ if (items.length > 1) acciones.enfocarPublicacion(p.id); };
      cab.appendChild(tog);
      if (abierta) cab.appendChild(herramientas(ctx));
      card.appendChild(cab);
      if (abierta) card.appendChild(detallePublicacion(ctx));
      body.appendChild(card);
    });
    body.scrollTop = scroll;
  }

  return { pintar: pintar };
}
