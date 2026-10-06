/* Catalogos fijos del calendario: tipos, categorias, operatividad,
   core drives y companias. Es lo unico que hay que tocar para agregar
   una opcion nueva; ninguna pantalla lleva estas listas escritas. */

export var TIPOS = {
  reto:         {label:"Reto",         color:"var(--t-reto)"},
  anuncio:      {label:"Anuncio",      color:"var(--t-anuncio)"},
  recordatorio: {label:"Recordatorio", color:"var(--t-recordatorio)"}
};
export var TIPO_KEYS = ["reto","anuncio","recordatorio"];

// Categorias de la libreria, con color propio aparte del tipo.
export var FAMILIAS = {
  participacion: {label:"Participacion", color:"var(--f-participacion)"},
  juego:         {label:"Juego",         color:"var(--f-juego)"},
  creativo:      {label:"Creativo",      color:"var(--f-creativo)"},
  negocio:       {label:"Negocio",       color:"var(--f-negocio)"},
  personal:      {label:"Personal",      color:"var(--f-personal)"},
  temporada:     {label:"Temporada",     color:"var(--f-temporada)"}
};
export var FAM_KEYS = ["participacion","juego","creativo","negocio","personal","temporada"];

// Cuanto trabajo cuesta ejecutar el reto. Obligatorio al crear.
export var OPER = {
  baja:  {label:"Baja",  ayuda:"Se manda y ya: no hay que revisar nada despues."},
  media: {label:"Media", ayuda:"Toca revisar respuestas o llevar la cuenta de quien participo."},
  alta:  {label:"Alta",  ayuda:"Exige premiar, verificar uno por uno o coordinar con el cliente."}
};
export var OPER_KEYS = ["baja","media","alta"];

// Core Drives del Octalysis. Se eligen hasta 3; el primero es el principal.
export var CDS = {
  cd1: {label:"CD1", nombre:"Significado epico y llamado"},
  cd2: {label:"CD2", nombre:"Desarrollo y logro"},
  cd3: {label:"CD3", nombre:"Creatividad y retroalimentacion"},
  cd4: {label:"CD4", nombre:"Propiedad y posesion"},
  cd5: {label:"CD5", nombre:"Influencia social y pertenencia"},
  cd6: {label:"CD6", nombre:"Escasez e impaciencia"},
  cd7: {label:"CD7", nombre:"Imprevisibilidad y curiosidad"},
  cd8: {label:"CD8", nombre:"Perdida y evitacion"}
};
export var CD_KEYS = ["cd1","cd2","cd3","cd4","cd5","cd6","cd7","cd8"];
export var MAX_CDS = 3;

export var COMPANIAS = [
  {id:"niku",             name:"Niku"},
  {id:"power-shakes",     name:"Power Shakes"},
  {id:"liso-saludable",   name:"Liso Saludable"},
  {id:"maximo",           name:"Maximo"},
  {id:"auteco",           name:"Auteco"},
  {id:"smash-avocaderia", name:"Smash Avocadería"},
  {id:"general-cafe",     name:"General Cafe"},
  {id:"oni-nikkei",       name:"ONI Nikkei"},
  {id:"lavocaderia",      name:"Lavocadería"},
  {id:"mimos",            name:"Mimos"},
  {id:"machetico",        name:"Machetico"},
  {id:"chick-fil-a",      name:"Chick-Fil-A"}
];
export var TOTAL_CO = COMPANIAS.length;

export function nombreCompania(id){
  for (var i = 0; i < TOTAL_CO; i++){ if (COMPANIAS[i].id === id) return COMPANIAS[i].name; }
  return "";
}

// Lo que venga de la db: hasta 3 claves validas, sin repetir.
export function normCds(v){
  if (!v) return [];
  var out = [];
  (Array.isArray(v) ? v : [v]).forEach(function(k){
    k = String(k || "").toLowerCase();
    if (CDS[k] && out.indexOf(k) === -1 && out.length < MAX_CDS) out.push(k);
  });
  return out;
}
// Solo los retos se ejecutan: un anuncio o un recordatorio no tiene operatividad.
export function normOper(v, tipo){
  if (tipo !== "reto") return "";
  v = String(v || "").toLowerCase();
  return OPER[v] ? v : "";
}
