#!/usr/bin/env node
/* Consola del calendario contra la Firestore de la pagina publica.
   ------------------------------------------------------------------
   Entra con la cuenta de servicio, asi que pasa por encima de las
   reglas de Firestore: no necesita un correo de Galilei.

   La clave NO viaja en el repositorio (esta en .gitignore). Este
   archivo tampoco guarda secretos: solo busca el JSON en la carpeta.

     node gali.js ver                 el ciclo y el resumen de la libreria
     node gali.js ver libreria        la libreria completa
     node gali.js exportar [archivo]  baja lo que hay en vivo a un JSON
     node gali.js dif <semilla.json>  que sobra y que falta contra un archivo
     node gali.js sync <semilla.json> deja Firestore igual al archivo (BORRA)
     node gali.js sync <s.json> --dry  ensayo: dice que haria y no toca nada

   "sync" es el unico que escribe. Siempre imprime lo que va a hacer y,
   sin --si, pide confirmacion escribiendo SI.
   ------------------------------------------------------------------ */
const fs   = require("fs");
const path = require("path");
// firebase-admin 14 ya solo trae la API modular.
const {initializeApp, cert} = require("firebase-admin/app");
const {getFirestore}        = require("firebase-admin/firestore");

const COLS = ["plantilla", "libreria", "config"];
const DOW  = ["lun","mar","mie","jue","vie","sab","dom"];

function clave(){
  const f = fs.readdirSync(__dirname)
    .find(n => /firebase-adminsdk.*\.json$|^serviceAccount.*\.json$/.test(n));
  if (!f) {
    console.error("No encontre la clave de la cuenta de servicio en esta carpeta.");
    console.error("Descargala en Firebase > Configuracion del proyecto > Cuentas de servicio.");
    process.exit(1);
  }
  return path.join(__dirname, f);
}

initializeApp({credential: cert(require(clave()))});
const db = getFirestore();

async function leer(col){
  const snap = await db.collection(col).get();
  const out = {};
  snap.forEach(d => out[d.id] = d.data());
  return out;
}

function linea(v){
  const fija = v.fija ? "  [fija]" : "";
  return `  S${v.week} ${DOW[v.dow]} ${(v.time||"--").padEnd(5)} ` +
         `${(v.type||"").slice(0,5).padEnd(5)} ${(v.title||"(sin titulo)").slice(0,52)}${fija}`;
}

async function ver(que){
  if (que === "libreria"){
    const lib = await leer("libreria");
    const porTipo = {};
    Object.values(lib).forEach(v => (porTipo[v.type] = porTipo[v.type] || []).push(v.title));
    Object.keys(porTipo).sort().forEach(t => {
      console.log(`\n${t.toUpperCase()} (${porTipo[t].length})`);
      porTipo[t].sort().forEach(x => console.log("  " + x));
    });
    return;
  }
  const [tpl, cfg] = [await leer("plantilla"), await leer("config")];
  const semanas = (cfg.ciclo && cfg.ciclo.weeks) || 4;
  console.log(`CICLO DE ${semanas} SEMANAS — ${Object.keys(tpl).length} publicaciones\n`);
  const filas = Object.values(tpl).sort((a,b) =>
    a.week-b.week || a.dow-b.dow || String(a.time||"").localeCompare(String(b.time||"")));
  let w = 0;
  filas.forEach(v => { if (v.week !== w){ w = v.week; console.log(`Semana ${w}`); } console.log(linea(v)); });
  const lib = await leer("libreria");
  const t = {};
  Object.values(lib).forEach(v => t[v.type] = (t[v.type]||0)+1);
  console.log(`\nLibreria: ${Object.keys(lib).length} items —`,
    Object.entries(t).map(([k,n]) => `${n} ${k}`).join(", "));
}

/* Dos documentos son "el mismo" si dicen lo mismo, aunque Firestore
   devuelva las claves en otro orden. Y como la aplicacion lee todo con
   `b.campo || ""`, un campo ausente, null o vacio son la misma cosa. */
function canon(v){
  if (v === null || v === undefined || v === "") return "";
  if (Array.isArray(v)) return v.map(canon);
  if (typeof v === "object"){
    const o = {};
    Object.keys(v).sort().forEach(k => { const c = canon(v[k]); if (c !== "") o[k] = c; });
    return o;
  }
  return v;
}
const igual = (a,b) => JSON.stringify(canon(a)) === JSON.stringify(canon(b));

function comparar(remoto, local){
  const plan = {sobran:[], faltan:[], cambian:[], iguales:0};
  COLS.forEach(col => {
    const r = remoto[col] || {}, l = local[col] || {};
    Object.keys(r).forEach(id => { if (!(id in l)) plan.sobran.push([col, id, r[id]]); });
    Object.keys(l).forEach(id => {
      if (!(id in r)) plan.faltan.push([col, id, l[id]]);
      else if (!igual(r[id], l[id])) plan.cambian.push([col, id, l[id], r[id]]);
      else plan.iguales++;
    });
  });
  return plan;
}

function mostrar(plan){
  const nombre = ([col,id,v]) => `${col}/${id}` + (v && v.title ? `  "${String(v.title).slice(0,46)}"` : "");
  console.log(`\nSe borran   ${plan.sobran.length}`);  plan.sobran.forEach(x => console.log("  - " + nombre(x)));
  console.log(`Se crean    ${plan.faltan.length}`);   plan.faltan.forEach(x => console.log("  + " + nombre(x)));
  console.log(`Se cambian  ${plan.cambian.length}`);
  plan.cambian.forEach(([col,id,l,r]) => {
    console.log("  ~ " + nombre([col,id,l]));
    new Set([...Object.keys(r||{}), ...Object.keys(l||{})]).forEach(c => {
      if (igual(r[c], l[c])) return;
      const corto = x => JSON.stringify(canon(x)).slice(0,70);
      console.log(`      ${c}:  web ${corto(r[c])}`);
      console.log(`      ${" ".repeat(c.length)}   archivo ${corto(l[c])}`);
    });
  });
  console.log(`Sin tocar   ${plan.iguales}`);
}

/* Baja el estado vivo a un archivo, en el mismo formato de la semilla.
   Es el punto de partida para poner el artifact al dia con la web. */
async function exportar(archivo){
  const salida = archivo || "web-actual.json";
  const datos = {};
  for (const c of COLS) datos[c] = await leer(c);
  fs.writeFileSync(salida, JSON.stringify(datos, null, 1), "utf8");
  const n = COLS.map(c => `${Object.keys(datos[c]).length} ${c}`).join(", ");
  console.log(`Escrito ${salida}  —  ${n}`);
}

async function dif(archivo){
  const local = JSON.parse(fs.readFileSync(archivo, "utf8"));
  const remoto = {};
  for (const c of COLS) remoto[c] = await leer(c);
  mostrar(comparar(remoto, local));
}

async function sync(archivo, opciones){
  const local = JSON.parse(fs.readFileSync(archivo, "utf8"));
  const remoto = {};
  for (const c of COLS) remoto[c] = await leer(c);
  const plan = comparar(remoto, local);
  mostrar(plan);

  if (opciones.dry){ console.log("\nEnsayo: no se escribio nada."); return; }
  if (!plan.sobran.length && !plan.faltan.length && !plan.cambian.length){
    console.log("\nYa estaba igual: no hay nada que hacer."); return;
  }
  if (!opciones.si){
    process.stdout.write("\nEscribe SI para aplicarlo: ");
    const resp = fs.readFileSync(0, "utf8").trim();
    if (resp !== "SI"){ console.log("Cancelado, no se toco nada."); return; }
  }

  // En lotes: Firestore admite 500 operaciones por lote.
  const ops = [
    ...plan.sobran.map(([col,id]) => ({tipo:"del", col, id})),
    ...plan.faltan.map(([col,id,v]) => ({tipo:"set", col, id, v})),
    ...plan.cambian.map(([col,id,v]) => ({tipo:"set", col, id, v}))
  ];
  for (let i = 0; i < ops.length; i += 400){
    const lote = db.batch();
    ops.slice(i, i+400).forEach(o => {
      const ref = db.collection(o.col).doc(o.id);
      o.tipo === "del" ? lote.delete(ref) : lote.set(ref, o.v);
    });
    await lote.commit();
    console.log(`  aplicadas ${Math.min(i+400, ops.length)} / ${ops.length}`);
  }
  console.log("Listo. La pagina ya muestra esto.");
}

(async () => {
  const [cmd, arg] = process.argv.slice(2);
  const op = {dry: process.argv.includes("--dry"), si: process.argv.includes("--si")};
  try {
    if (cmd === "ver")            await ver(arg);
    else if (cmd === "exportar") await exportar(arg);
    else if (cmd === "dif")      await dif(arg);
    else if (cmd === "sync")     await sync(arg, op);
    else console.log(fs.readFileSync(__filename, "utf8").split("*/")[0].split("---\n")[1]);
  } catch (e){
    console.error("Error:", e.message);
    process.exit(1);
  }
  process.exit(0);
})();
