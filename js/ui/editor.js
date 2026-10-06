/* Editor modal generico. No sabe si edita una publicacion del ciclo o
   una pieza de la libreria: recibe los campos, la validacion y que hacer
   al guardar o borrar.

   abrirEditor({
     titulo, datos, campos: [fabrica...], ctx: {semanas, inicio},
     validar(datos) -> "" | mensaje,
     alGuardar(datos),
     borrar: {titulo, texto, fn}   // opcional
   }) */

import { $, crear, esc } from "./dom.js";
import { ICONO } from "./iconos.js";
import { capas } from "./capas.js";
import { confirmar } from "./confirmar.js";
import { TEMAS } from "../dominio/temporadas.js";
import { arteDe } from "./temas.js";

var toast = function(){};
export function usarAvisos(avisos){ toast = avisos.toast; }

function cerrar(){
  $("mwrap").classList.remove("open");
  $("mbox").innerHTML = "";
  $("mbox").classList.remove("con-tema");
  capas.quitar(cerrar);
}

export function abrirEditor(cfg){
  var datos = cfg.datos;
  var oyentes = {};
  var ctx = Object.assign({
    toast: toast,
    al: function(ev, fn){ (oyentes[ev] || (oyentes[ev] = [])).push(fn); },
    emitir: function(ev, v){ (oyentes[ev] || []).forEach(function(fn){ fn(v); }); }
  }, cfg.ctx || {});

  var box = $("mbox");
  box.innerHTML = "";

  var head = crear("div", "mhead", '<span class="mtema"></span><span class="mtitle">' + esc(cfg.titulo) + "</span>");
  // Lo que se edita dentro de una temporada lleva su color y su icono.
  function tematizar(t){
    box.classList.toggle("con-tema", !!t);
    box.style.setProperty("--tm", t ? TEMAS[t].color : "");
    head.querySelector(".mtema").innerHTML = t ? arteDe(t).icono : "";
  }
  tematizar(cfg.tema);
  ctx.al("tema", tematizar);
  var x = crear("button", "iconbtn", ICONO.cerrar);
  x.type = "button";
  x.setAttribute("aria-label", "Cerrar");
  x.onclick = cerrar;
  head.appendChild(x);

  var form = crear("form", "editor");
  var campos = cfg.campos.map(function(fabrica){ return fabrica(datos, ctx); });
  campos.forEach(function(c){ form.appendChild(c.nodo); });

  var pie = crear("div", "mfoot");
  if (cfg.borrar){
    var b = crear("button", "btn btn-danger", ICONO.basura + "Eliminar");
    b.type = "button";
    b.onclick = function(){ confirmar(cfg.borrar.titulo, cfg.borrar.texto, function(){ cerrar(); cfg.borrar.fn(); }); };
    pie.appendChild(b);
  }
  pie.appendChild(crear("span", "sp"));
  var cancelar = crear("button", "btn btn-quiet", "Cancelar");
  cancelar.type = "button";
  cancelar.onclick = cerrar;
  pie.appendChild(cancelar);
  pie.appendChild(crear("button", "btn btn-primary", "Guardar"));
  form.appendChild(pie);

  form.onsubmit = function(ev){
    ev.preventDefault();
    for (var i = 0; i < campos.length; i++){
      var r = campos[i].leer(datos);
      if (r){ toast(r.error); if (r.foco) r.foco.focus(); return; }
    }
    var msg = cfg.validar ? cfg.validar(datos) : "";
    if (msg){ toast(msg); return; }
    cerrar();
    cfg.alGuardar(datos);
  };

  box.appendChild(head);
  box.appendChild(form);
  $("mwrap").classList.add("open");
  capas.abrir(cerrar);
  if (campos[0] && campos[0].enfocar) campos[0].enfocar();
}

// Clic fuera del cuadro cierra; dentro, no.
$("mwrap").addEventListener("mousedown", function(ev){ if (ev.target === this) cerrar(); });
