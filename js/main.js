/* Punto de arranque. Es el unico archivo que conoce todas las piezas:
   crea el estado, recibe el almacen de firebase-init.js, arma los
   repositorios y las acciones, y monta las vistas. Ninguna otra pieza
   crea sus dependencias: las recibe desde aqui. */

import { WEEKS_DEF, inicioDeVuelta } from "./dominio/ciclo.js";
import { hoy } from "./dominio/fechas.js";
import { nombreCompania } from "./dominio/catalogos.js";
import { crearRepositorios } from "./datos/repositorios.js";
import { crearEscritor } from "./datos/escritura.js";
import { crearEstado } from "./app/estado.js";
import { crearSincronizacion } from "./app/sincronizacion.js";
import { crearAcciones } from "./app/acciones.js";
import { preferencias } from "./app/preferencias.js";
import { crearAvisos } from "./ui/avisos.js";
import { usarAvisos as avisosEditor } from "./ui/editor.js";
import { usarAvisos as avisosDetalle } from "./ui/detalle.js";
import { crearEditores } from "./ui/editores.js";
import { montarBarra } from "./ui/barra.js";
import { montarMalla } from "./ui/malla.js";
import { montarPanel } from "./ui/panel.js";
import { montarLibreria } from "./ui/libreria.js";
import { avisosDelCiclo } from "./ui/avisosCiclo.js";
import { montarTemporadas } from "./ui/temporadasLista.js";
import { montarBanda } from "./ui/banda.js";

var companiaGuardada = preferencias.compania();

var estado = crearEstado({
  semanas: WEEKS_DEF,
  inicio: inicioDeVuelta(hoy(), WEEKS_DEF, []),
  publicaciones: [],
  temporadas: [],
  pubsTemporada: [],
  temporadasOk: true,
  direccion: 0,
  tema: preferencias.tema(),
  pestana: preferencias.pestana(),
  marcas: {},
  libreria: [],
  calif: {},
  conectado: false,
  filtroCo: nombreCompania(companiaGuardada) ? companiaGuardada : "",
  seleccion: null,          // {fs: "AAAA-MM-DD", postId}: dia abierto en el panel
  libAbierta: preferencias.libreriaAbierta() && window.innerWidth > 900,
  libFiltro: {q: "", tipo: "", fam: ""}
});

var avisos = crearAvisos();
avisosEditor(avisos);
avisosDetalle(avisos);

// Hasta que alguien entra no hay almacen: las acciones que lo necesitan
// lo encuentran aqui cuando llegue.
var dep = {estado: estado, avisos: avisos, repos: null, sinc: null, escribir: null};
dep.sinc = {
  irAVuelta: function(inicio, dir){ estado.cambiar({inicio: inicio, seleccion: null, marcas: {}, direccion: dir || 0}); },
  soloLectura: function(){}
};
var acciones = crearAcciones(dep);
var editores = crearEditores(acciones, estado);

var vistas = [
  montarBarra(acciones, estado),
  montarLibreria(acciones, editores, estado),
  montarTemporadas(acciones, editores, estado),
  montarBanda(acciones, editores, estado),
  montarMalla(acciones, editores, estado),
  montarPanel(acciones, editores, estado),
  {pintar: function(s){ avisos.vista(avisosDelCiclo(s)); }}
];
function pintarTodo(s){ vistas.forEach(function(v){ v.pintar(s); }); }
estado.alCambiar(pintarTodo);

// La barra cambia de alto al reajustarse; el calendario se mide debajo.
function altoBarra(){ document.documentElement.style.setProperty("--tb", document.getElementById("topbar").offsetHeight + "px"); }
window.addEventListener("resize", altoBarra);
altoBarra();

pintarTodo(estado.get());
avisos.fijo("Conectando con el calendario.");

window.GALI.listo.then(function(almacen){
  dep.repos = crearRepositorios(almacen);
  dep.sinc = crearSincronizacion(dep.repos, estado, avisos);
  dep.escribir = crearEscritor(avisos, function(){ dep.sinc.soloLectura(); });
  dep.sinc.arrancar();
}, function(e){
  avisos.fijo((e && e.message) || "No se pudo abrir el calendario.", "err");
});
