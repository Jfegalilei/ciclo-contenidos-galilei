/* CAMPOS DEL EDITOR
   Cada campo es independiente y cumple el mismo contrato:

     fabrica(datos, ctx) -> {nodo, leer(datos) -> "" | {error, foco}}

   `leer` vuelca lo que hay en pantalla sobre `datos` y devuelve un error
   si falta algo. El editor no conoce ningun campo por dentro: recibe la
   lista y la recorre, asi que un campo nuevo no obliga a tocarlo.

   ctx = {toast, al(evento, fn), emitir(evento, valor), semanas, fechas,
          temporada, temporadas} */

import { TIPOS, TIPO_KEYS, FAMILIAS, FAM_KEYS, OPER, OPER_KEYS, CDS, CD_KEYS, MAX_CDS, TOTAL_CO } from "../dominio/catalogos.js";
import { DOW, DOW_CORTO, MESES, MES_CORTO, hoy, larga, suma, lunesDe, parseYmd, ymd } from "../dominio/fechas.js";
import { NTH, proximaFecha, cumple } from "../dominio/reglasFijas.js";
import { semanaPausada } from "../dominio/ciclo.js";
import { TEMAS, TEMA_KEYS, MAX_DIAS, ORDINALES, temporadaDesdeDoc, duracion, fechaDeDia, rangoTxt,
         diaDe, diaDePub, fechaDeRegla, reglaDeFecha, etiquetaRegla } from "../dominio/temporadas.js";
import { arteDe } from "./temas.js";
import { crear, esc, opciones } from "./dom.js";
import { ICONO } from "./iconos.js";
import { comprimirImagen, pesoKB } from "./imagenes.js";

// Fila con icono a la izquierda, como en el editor de eventos de Google Calendar.
function fila(icono, html){
  var f = crear("div", "erow", '<span class="eico">' + (icono || "") + '</span><div class="ebody"></div>');
  if (html) f.querySelector(".ebody").innerHTML = html;
  return f;
}
function q(nodo, sel){ return nodo.querySelector(sel); }

/* ---------- titulo ---------- */
export function campoTitulo(datos){
  var nodo = crear("div", "etitle",
    '<input name="title" maxlength="70" placeholder="Agregar titulo" autocomplete="off" value="' + esc(datos.title) + '">');
  return {
    nodo: nodo,
    enfocar: function(){ var i = q(nodo, "input"); i.focus(); i.setSelectionRange(i.value.length, i.value.length); },
    leer: function(d){ d.title = q(nodo, "input").value.trim(); return ""; }
  };
}

/* ---------- tipo y categoria ---------- */
export function campoClasificacion(datos, ctx){
  var nodo = fila(ICONO.etiqueta,
    '<div class="einline">' +
      '<select name="type" aria-label="Tipo">' + opciones(TIPO_KEYS.map(function(k){ return {v:k, l:TIPOS[k].label}; }), datos.type) + "</select>" +
      '<select name="familia" aria-label="Categoria">' +
        opciones([{v:"", l:"Sin categoria"}].concat(FAM_KEYS.map(function(k){ return {v:k, l:FAMILIAS[k].label}; })), datos.familia) +
      "</select>" +
    "</div>");
  q(nodo, "[name=type]").onchange = function(){ ctx.emitir("tipo", this.value); };
  return {
    nodo: nodo,
    leer: function(d){ d.type = q(nodo, "[name=type]").value; d.familia = q(nodo, "[name=familia]").value; return ""; }
  };
}

/* ---------- casilla, hora y fecha fija (solo publicaciones del ciclo) ---------- */
export function campoProgramacion(datos, ctx){
  // Si la publicacion vive en una semana guardada, su opcion sigue
  // disponible para poder traerla de vuelta.
  var maxSem = Math.max(ctx.semanas, datos.week || 1), semanas = [];
  for (var i = 1; i <= maxSem; i++) semanas.push({v:i, l:"Semana " + i + (i > ctx.semanas ? " (guardada)" : "")});

  var fx = datos.fija && datos.fija.k ? datos.fija : null;
  var k = fx ? fx.k : "";
  var dias = [{v:0, l:"el ultimo dia"}];
  for (var d = 1; d <= 31; d++) dias.push({v:d, l:"el dia " + d});
  var diasAno = [];
  for (var j = 1; j <= 31; j++) diasAno.push({v:j, l:"" + j});

  var nodo = fila(ICONO.reloj,
    '<div class="einline">' +
      '<select name="week" aria-label="Semana del ciclo">' + opciones(semanas, datos.week) + "</select>" +
      '<select name="dow" aria-label="Dia">' + opciones(DOW.map(function(n, i){ return {v:i, l:n}; }), datos.dow) + "</select>" +
      '<input name="time" type="time" aria-label="Hora" value="' + esc(datos.time) + '">' +
    "</div>" +
    '<select name="fix" class="eline" aria-label="Repeticion">' + opciones([
      {v:"",    l:"Sigue su casilla en cada vuelta del ciclo"},
      {v:"mes", l:"Fija a un dia del mes"},
      {v:"nth", l:"Fija a un dia de la semana del mes"},
      {v:"ano", l:"Fija a una fecha del ano"}
    ], k) + "</select>" +
    // Cada regla tiene sus controles; los que no aplican se ocultan pero
    // siguen en el DOM, asi volver a una regla no pierde lo puesto.
    '<div class="einline" data-regla="mes" hidden><span class="etxt">Cada mes,</span>' +
      '<select name="mesDia">' + opciones(dias, fx && fx.k === "mes" ? fx.d : 1) + "</select></div>" +
    '<div class="einline" data-regla="nth" hidden><span class="etxt">El</span>' +
      '<select name="nthN">' + opciones(NTH.map(function(o){ return {v:o.v, l:o.l}; }), fx && fx.k === "nth" ? fx.n : -1) + "</select>" +
      '<select name="nthW">' + opciones(DOW.map(function(n, i){ return {v:i, l:n}; }), fx && fx.k === "nth" ? fx.w : 4) + "</select>" +
      '<span class="etxt">del mes</span></div>' +
    '<div class="einline" data-regla="ano" hidden><span class="etxt">Cada</span>' +
      '<select name="anoDia">' + opciones(diasAno, fx && fx.k === "ano" ? fx.d : hoy().getDate()) + "</select>" +
      '<span class="etxt">de</span>' +
      '<select name="anoMes">' + opciones(MESES.map(function(m, i){ return {v:i, l:m}; }), fx && fx.k === "ano" ? fx.m : hoy().getMonth()) + "</select></div>" +
    '<span class="hint" data-hint></span>');

  function val(n){ return parseInt(q(nodo, "[name=" + n + "]").value, 10); }
  function regla(){
    var r = q(nodo, "[name=fix]").value;
    if (r === "mes") return {k:"mes", d: val("mesDia")};
    if (r === "nth") return {k:"nth", n: val("nthN"), w: val("nthW")};
    if (r === "ano") return {k:"ano", m: val("anoMes"), d: val("anoDia")};
    return null;
  }
  function pintar(){
    var r = q(nodo, "[name=fix]").value;
    [].forEach.call(nodo.querySelectorAll("[data-regla]"), function(g){ g.hidden = g.getAttribute("data-regla") !== r; });
    // Una fija no usa casilla: su sitio lo decide la fecha.
    q(nodo, "[name=week]").disabled = q(nodo, "[name=dow]").disabled = !!r;

    var f = regla(), h = q(nodo, "[data-hint]");
    if (!f){ h.innerHTML = "Se puede arrastrar a otro dia desde el calendario."; return; }
    var pr = proximaFecha(f, hoy());
    var dentro = (ctx.fechas || []).some(function(d){ return cumple(f, d); });
    h.innerHTML = (pr ? "Proxima vez: <b>" + esc(larga(pr)) + " de " + pr.getFullYear() + "</b>. " : "") +
      (dentro ? "Cae en la vuelta que estas viendo." : "No cae en esta vuelta: aparece sola cuando el ciclo pase por esa fecha.");
  }
  nodo.addEventListener("change", pintar);
  pintar();

  return {
    nodo: nodo,
    leer: function(d){
      d.week = val("week"); d.dow = val("dow");
      d.time = q(nodo, "[name=time]").value || "";
      d.fija = regla();
      return "";
    }
  };
}

/* ---------- operatividad y core drives ----------
   Operatividad obligatoria en los retos (aparece y desaparece con el
   tipo) y hasta 3 core drives: el primero que se marca es el principal. */
export function campoEstrategia(datos, ctx){
  var orden = (datos.cds || []).slice();
  var nodo = fila(ICONO.diana,
    '<div class="efield" data-oper' + (datos.type === "reto" ? "" : " hidden") + ">" +
      '<select name="oper" aria-label="Operatividad">' +
        opciones([{v:"", l:"Operatividad..."}].concat(OPER_KEYS.map(function(k){ return {v:k, l:"Operatividad " + OPER[k].label.toLowerCase()}; })), datos.operatividad) +
      "</select>" +
      '<span class="hint" data-oper-hint></span>' +
    "</div>" +
    '<div class="efield"><span class="elabel">Core drives, hasta ' + MAX_CDS + "</span>" +
      '<div class="cdpick">' + CD_KEYS.map(function(k){
        return '<button type="button" data-cd="' + k + '" title="' + esc(CDS[k].nombre) + '">' + CDS[k].label + "</button>";
      }).join("") + "</div>" +
      '<span class="hint" data-cd-hint></span>' +
    "</div>");

  var sel = q(nodo, "[name=oper]");
  function pintarOper(){
    q(nodo, "[data-oper-hint]").textContent = sel.value ? OPER[sel.value].ayuda : "Cuanto trabajo cuesta ejecutar el reto.";
  }
  function pintarCds(){
    [].forEach.call(nodo.querySelectorAll("[data-cd]"), function(b){
      var i = orden.indexOf(b.getAttribute("data-cd"));
      b.className = i === 0 ? "on principal" : i > 0 ? "on" : "";
    });
    q(nodo, "[data-cd-hint]").innerHTML = orden.length
      ? "Principal: <b>" + esc(CDS[orden[0]].nombre) + "</b>" +
        (orden.length > 1 ? ". Tambien: " + orden.slice(1).map(function(k){ return esc(CDS[k].nombre); }).join(", ") : "")
      : "El primero que marques es el principal.";
  }
  sel.onchange = pintarOper;
  q(nodo, ".cdpick").onclick = function(ev){
    var b = ev.target.closest("[data-cd]");
    if (!b) return;
    var k = b.getAttribute("data-cd"), i = orden.indexOf(k);
    if (i >= 0) orden.splice(i, 1);
    else if (orden.length >= MAX_CDS) ctx.toast("Maximo " + MAX_CDS + " core drives por pieza.");
    else orden.push(k);
    pintarCds();
  };
  ctx.al("tipo", function(t){ q(nodo, "[data-oper]").hidden = t !== "reto"; });
  pintarOper(); pintarCds();

  return {
    nodo: nodo,
    leer: function(d){
      var esReto = d.type === "reto";
      if (esReto && !sel.value) return {error: "Elige la operatividad del reto.", foco: sel};
      if (!orden.length) return {error: "Marca al menos un Core Drive."};
      d.operatividad = esReto ? sel.value : "";
      d.cds = orden.slice(0, MAX_CDS);
      return "";
    }
  };
}

/* ---------- copy ---------- */
export function campoCopy(datos, ctx, conAyuda){
  var nodo = fila(ICONO.texto,
    '<textarea name="copy" placeholder="El mensaje exacto que se pega en el grupo">' + esc(datos.copy) + "</textarea>" +
    (conAyuda ? '<span class="hint">Se repite en cada vuelta, igual para las ' + TOTAL_CO + " companias.</span>" : ""));
  return {
    nodo: nodo,
    leer: function(d){ d.copy = q(nodo, "textarea").value; return ""; }
  };
}

/* ---------- imagen ----------
   Se elige, se arrastra o se pega con Ctrl+V. El pegado lo atiende el
   campo vivo mas reciente, asi no hay que desmontar nada al cerrar. */
var camposImg = [];
document.addEventListener("paste", function(ev){
  camposImg = camposImg.filter(function(c){ return document.contains(c.nodo); });
  if (!camposImg.length) return;
  var items = (ev.clipboardData && ev.clipboardData.items) || [];
  for (var i = 0; i < items.length; i++){
    if (items[i].type && items[i].type.indexOf("image/") === 0){
      var f = items[i].getAsFile();
      if (!f) continue;
      ev.preventDefault();
      camposImg[camposImg.length - 1].cargar(f);
      return;
    }
  }
});

export function campoImagen(datos, ctx){
  var uri = datos.img || "";
  var nodo = fila(ICONO.imagen,
    '<div class="imgprev" data-prev></div>' +
    '<div class="imgacts">' +
      '<button type="button" class="btn btn-quiet" data-elegir></button>' +
      '<button type="button" class="btn btn-quiet" data-quitar>Quitar</button>' +
      '<span class="peso" data-peso></span>' +
      '<input type="file" accept="image/*" hidden>' +
    "</div>");
  var prev = q(nodo, "[data-prev]"), input = q(nodo, "input[type=file]"), peso = q(nodo, "[data-peso]");

  function pintar(){
    prev.innerHTML = uri ? '<img alt="" src="' + uri + '">'
                         : '<span class="vacia">Sin imagen. Pega con Ctrl+V o arrastra un archivo aqui.</span>';
    prev.classList.toggle("llena", !!uri);
    q(nodo, "[data-elegir]").textContent = uri ? "Cambiar imagen" : "Elegir imagen";
    q(nodo, "[data-quitar]").hidden = !uri;
    peso.textContent = uri ? pesoKB(uri) + " KB" : "";
  }
  function cargar(f){
    if (!f) return;
    peso.textContent = "comprimiendo...";
    comprimirImagen(f).then(function(u){ uri = u; pintar(); }, function(motivo){
      peso.textContent = "";
      ctx.toast(motivo === "peso" ? "La imagen pesa demasiado incluso comprimida. Prueba con una mas pequena."
              : motivo === "tipo" ? "Ese archivo no es una imagen." : "No se pudo leer la imagen.");
    });
  }

  q(nodo, "[data-elegir]").onclick = function(){ input.click(); };
  q(nodo, "[data-quitar]").onclick = function(){ uri = ""; pintar(); };
  input.onchange = function(){ var f = input.files && input.files[0]; input.value = ""; cargar(f); };
  prev.addEventListener("dragover", function(ev){ ev.preventDefault(); prev.classList.add("over"); });
  prev.addEventListener("dragleave", function(){ prev.classList.remove("over"); });
  prev.addEventListener("drop", function(ev){
    ev.preventDefault();
    prev.classList.remove("over");
    cargar(ev.dataTransfer && ev.dataTransfer.files && ev.dataTransfer.files[0]);
  });
  camposImg.push({nodo: nodo, cargar: cargar});
  pintar();

  return { nodo: nodo, leer: function(d){ d.img = uri; return ""; } };
}

/* ---------- dia y hora dentro de una temporada ----------
   Dos formas: un dia exacto de la temporada, o una regla relativa a
   ella ("primer lunes", "ultimo viernes"), que se acomoda sola si la
   temporada cambia de fechas. */
export function campoDiaTemporada(datos, ctx){
  var t = ctx.temporada, n = Math.max(duracion(t), datos.dia + 1), dias = [];
  for (var i = 0; i < n; i++){
    var f = fechaDeDia(t, i);
    dias.push({v:i, l: DOW_CORTO[(f.getDay() + 6) % 7] + " " + f.getDate() + " " + MES_CORTO[f.getMonth()] +
                    " · dia " + (i + 1) + (i >= duracion(t) ? " (fuera del rango)" : "")});
  }
  // La regla por defecto describe el dia que ya tiene: cambiar de modo no lo mueve.
  var diaHoy = diaDePub(t, datos);
  var base = datos.regla || reglaDeFecha(t, fechaDeDia(t, diaHoy >= 0 ? diaHoy : datos.dia));
  if (base.n > 5) base = {n: -1, w: base.w};

  var nodo = fila(ICONO.reloj,
    '<select name="modo" class="eline" aria-label="Como se ubica">' + opciones([
      {v:"dia",   l:"Un dia exacto de la temporada"},
      {v:"regla", l:"Un dia de la semana dentro de la temporada"}
    ], datos.regla ? "regla" : "dia") + "</select>" +
    '<div class="einline" data-modo="dia">' +
      '<select name="dia" aria-label="Dia de la temporada">' + opciones(dias, datos.dia) + "</select>" +
    "</div>" +
    '<div class="einline" data-modo="regla"><span class="etxt">El</span>' +
      '<select name="reglaN" aria-label="Cual">' + opciones(ORDINALES, base.n) + "</select>" +
      '<select name="reglaW" aria-label="Dia de la semana">' + opciones(DOW.map(function(d, k){ return {v:k, l:d}; }), base.w) + "</select>" +
      '<span class="etxt">de ' + esc(t.nombre) + "</span>" +
    "</div>" +
    '<div class="einline"><span class="etxt">a las</span><input name="time" type="time" aria-label="Hora" value="' + esc(datos.time) + '"></div>' +
    '<span class="hint" data-hint></span>');

  function val(k){ return parseInt(q(nodo, "[name=" + k + "]").value, 10); }
  function regla(){ return q(nodo, "[name=modo]").value === "regla" ? {n: val("reglaN"), w: val("reglaW")} : null; }
  function pintar(){
    var modo = q(nodo, "[name=modo]").value, r = regla(), h = q(nodo, "[data-hint]");
    [].forEach.call(nodo.querySelectorAll("[data-modo]"), function(g){ g.hidden = g.getAttribute("data-modo") !== modo; });
    if (!r){
      h.innerHTML = "Solo sale en <b>" + esc(t.nombre) + "</b> (" + esc(rangoTxt(t)) + "). Si cambias las fechas de la temporada, se corre con ella.";
      return;
    }
    var f = fechaDeRegla(t, r);
    h.innerHTML = f ? "Este ano cae el <b>" + esc(larga(f)) + "</b>. Si la temporada cambia de fechas, sigue siendo el " + esc(etiquetaRegla(r)) + "."
                    : "La temporada no tiene " + esc(etiquetaRegla(r)) + ": con estas fechas no saldria.";
  }
  nodo.addEventListener("change", pintar);
  pintar();

  return {
    nodo: nodo,
    leer: function(d){
      var r = regla();
      if (r){
        var f = fechaDeRegla(t, r);
        if (!f) return {error: "La temporada no tiene " + etiquetaRegla(r) + ". Elige otro.", foco: q(nodo, "[name=reglaN]")};
        d.regla = r;
        d.dia = diaDe(t, f);          // origen, por si luego se quita la regla
      } else {
        d.regla = null;
        d.dia = val("dia");
      }
      d.time = q(nodo, "[name=time]").value || "";
      return "";
    }
  };
}

/* ---------- nombre de la temporada ---------- */
export function campoNombre(datos){
  var nodo = crear("div", "etitle",
    '<input name="nombre" maxlength="40" placeholder="Nombre de la temporada" autocomplete="off" value="' + esc(datos.nombre) + '">');
  return {
    nodo: nodo,
    enfocar: function(){ var i = q(nodo, "input"); i.focus(); i.setSelectionRange(i.value.length, i.value.length); },
    leer: function(d){ d.nombre = q(nodo, "input").value.trim(); return ""; }
  };
}

/* ---------- tema: decide color e iconos ---------- */
export function campoTema(datos, ctx){
  var elegido = datos.tema || "especial";
  var nodo = fila(ICONO.etiqueta,
    '<div class="temapick" role="radiogroup" aria-label="Tema">' + TEMA_KEYS.map(function(k){
      return '<button type="button" role="radio" data-tema="' + k + '" style="--tm:' + TEMAS[k].color + '">' +
             arteDe(k).icono + "<span>" + esc(TEMAS[k].label) + "</span></button>";
    }).join("") + "</div>");
  function pintar(){
    [].forEach.call(nodo.querySelectorAll("[data-tema]"), function(b){
      var on = b.getAttribute("data-tema") === elegido;
      b.classList.toggle("on", on);
      b.setAttribute("aria-checked", on ? "true" : "false");
    });
  }
  q(nodo, ".temapick").onclick = function(ev){
    var b = ev.target.closest("[data-tema]");
    if (!b) return;
    elegido = b.getAttribute("data-tema");
    pintar();
    ctx.emitir("tema", elegido);
  };
  pintar();
  return { nodo: nodo, leer: function(d){ d.tema = elegido; return ""; } };
}

/* ---------- rango de fechas, con lo que le pasa al ciclo ---------- */
function rangoCorto(a, b){
  return a.getDate() + " " + MES_CORTO[a.getMonth()] + (a.getTime() === b.getTime() ? "" : " – " + b.getDate() + " " + MES_CORTO[b.getMonth()]);
}
export function campoRango(datos, ctx){
  var nodo = fila(ICONO.calendario,
    '<div class="einline">' +
      '<label class="efecha"><span class="elabel">Empieza</span><input name="desde" type="date" value="' + esc(datos.desde) + '"></label>' +
      '<label class="efecha"><span class="elabel">Termina</span><input name="hasta" type="date" value="' + esc(datos.hasta) + '"></label>' +
    "</div>" +
    '<div class="aplazo" data-aplazo></div>');

  function pintar(){
    var caja = q(nodo, "[data-aplazo]");
    var t = temporadaDesdeDoc(datos.id || "__nueva", {nombre: "x", tema: "especial",
      desde: q(nodo, "[name=desde]").value, hasta: q(nodo, "[name=hasta]").value});
    if (!t){ caja.innerHTML = '<span class="hint">Elige las dos fechas para ver como se mueve el ciclo.</span>'; return; }
    if (duracion(t) > MAX_DIAS){ caja.innerHTML = '<span class="hint">Una temporada dura maximo ' + MAX_DIAS + " dias.</span>"; return; }
    var temps = (ctx.temporadas || []).filter(function(o){ return o.id !== t.id; }).concat([t]);

    // Semanas que se detienen completas y dias sueltos que reemplazan.
    var pausadas = [], sueltos = [], L = lunesDe(t.ini);
    while (L <= t.fin){
      var p = semanaPausada(temps, L);
      if (p && p.id === t.id) pausadas.push(L);
      else for (var i = 0; i < 7; i++){ var d = suma(L, i); if (d >= t.ini && d <= t.fin) sueltos.push(d); }
      L = suma(L, 7);
    }
    // Dias sueltos agrupados en tramos seguidos.
    var tramos = [];
    sueltos.forEach(function(d){
      var u = tramos[tramos.length - 1];
      if (u && suma(u[1], 1).getTime() === d.getTime()) u[1] = d; else tramos.push([d, d]);
    });

    var n = pausadas.length, html = '<div class="aplazo-n"><b>' + n + "</b><span>" + (n === 1 ? "semana" : "semanas") + " de pausa</span></div><div class=\"aplazo-txt\">";
    if (n){
      var ult = suma(pausadas[n - 1], 6), vuelve = suma(pausadas[n - 1], 7);
      html += "El ciclo se detiene del <b>" + esc(rangoCorto(pausadas[0], ult)) + "</b> y retoma el lunes " +
              vuelve.getDate() + " de " + MESES[vuelve.getMonth()] + " en la semana donde iba.";
    } else {
      html += "La temporada no cubre ninguna semana completa: el ciclo no se aplaza.";
    }
    if (tramos.length){
      html += " " + (tramos.length === 1 ? "El tramo " : "Los tramos ") + tramos.map(function(r){ return "<b>" + esc(rangoCorto(r[0], r[1])) + "</b>"; }).join(" y ") +
              " comparte" + (tramos.length === 1 ? "" : "n") + " semana con el ciclo: ahi la temporada reemplaza lo de esos dias.";
    }
    caja.innerHTML = html + "</div>";
  }
  nodo.addEventListener("input", pintar);
  nodo.addEventListener("change", pintar);
  pintar();

  return {
    nodo: nodo,
    leer: function(d){
      d.desde = q(nodo, "[name=desde]").value;
      d.hasta = q(nodo, "[name=hasta]").value;
      return "";
    }
  };
}
