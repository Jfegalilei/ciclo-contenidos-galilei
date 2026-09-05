/* Puente entre el calendario y Firebase.
   ------------------------------------------------------------------
   El calendario nacio como artifact de Claude y hablaba con un almacen
   con forma de Firestore: collection().orderBy().onSnapshot(), doc().set(),
   update(), delete(). Aqui se le da exactamente ese mismo API sobre
   Firestore de verdad, asi que la aplicacion no cambio ni una linea de
   su logica.

   Dos detalles que importan:

   - update() se traduce a set(..., {merge:true}), NO al update() nativo.
     El calendario marca envios con objetos anidados ({idPost:{idCompania:fecha}})
     y cuenta con que la fusion sea profunda, para que dos personas puedan
     marcar publicaciones distintas sin pisarse. El update() de Firestore
     reemplazaria el mapa completo; set con merge lo fusiona.

   - set() sin merge se conserva tal cual: guardar una publicacion debe
     reemplazarla entera, para que quitar un campo lo quite de verdad.
   ------------------------------------------------------------------ */

import { initializeApp }
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged,
  setPersistence, browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore, collection, doc, onSnapshot, query, orderBy,
  setDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

var CFG = window.GALI_CONFIG || {};
var DOMINIO = (CFG.dominio || "").toLowerCase();
var G = window.GALI;

/* ---------- pantalla de entrada ---------- */
var puerta   = document.getElementById("puerta");
var btnEntrar= document.getElementById("entrar");
var puertaMsg= document.getElementById("puertaMsg");
var quien    = document.getElementById("quien");
var btnSalir = document.getElementById("salir");

function mostrarPuerta(msg, esError){
  puerta.hidden = false;
  document.body.classList.add("bloqueado");
  puertaMsg.textContent = msg || "";
  puertaMsg.classList.toggle("err", !!esError);
  btnEntrar.disabled = false;
}
function ocultarPuerta(){
  puerta.hidden = true;
  document.body.classList.remove("bloqueado");
}

if (!CFG.firebase || String(CFG.firebase.apiKey).indexOf("PEGAR") === 0){
  mostrarPuerta("Falta configurar Firebase: abre config.js y pega las claves del proyecto.", true);
  btnEntrar.disabled = true;   // sin claves no hay a donde entrar
  throw new Error("config incompleta");
}

var app  = initializeApp(CFG.firebase);
var auth = getAuth(app);
var fs   = getFirestore(app);

/* ---------- el almacen, con el API que la aplicacion espera ---------- */
function envolverDoc(ref){
  return {
    // Reemplaza el documento completo.
    set: function(datos){ return setDoc(ref, datos); },
    // Fusion profunda: ver la nota de arriba.
    update: function(datos){ return setDoc(ref, datos, {merge: true}); },
    delete: function(){ return deleteDoc(ref); },
    onSnapshot: function(alDato, alError){
      return onSnapshot(ref, function(s){
        alDato({exists: s.exists(), data: function(){ return s.data(); }});
      }, alError);
    }
  };
}

var almacen = {
  collection: function(nombre){
    var col = collection(fs, nombre);
    return {
      doc: function(id){ return envolverDoc(id ? doc(fs, nombre, id) : doc(col)); },
      orderBy: function(campo){
        return {
          onSnapshot: function(alDato, alError){
            return onSnapshot(query(col, orderBy(campo)), alDato, alError);
          }
        };
      },
      onSnapshot: function(alDato, alError){
        return onSnapshot(col, alDato, alError);
      }
    };
  },
  doc: function(ruta){
    var p = ruta.split("/");
    return envolverDoc(doc(fs, p[0], p.slice(1).join("/")));
  }
};

/* ---------- entrar y salir ---------- */
var proveedor = new GoogleAuthProvider();
if (DOMINIO) proveedor.setCustomParameters({hd: DOMINIO});   // sugiere la cuenta correcta

btnEntrar.onclick = function(){
  btnEntrar.disabled = true;
  puertaMsg.textContent = "Abriendo la ventana de Google...";
  puertaMsg.classList.remove("err");
  signInWithPopup(auth, proveedor).catch(function(e){
    var c = e && e.code;
    if (c === "auth/popup-closed-by-user" || c === "auth/cancelled-popup-request"){
      mostrarPuerta("");
    } else if (c === "auth/popup-blocked"){
      mostrarPuerta("El navegador bloqueo la ventana de Google. Permite las ventanas emergentes de este sitio y vuelve a intentar.", true);
    } else if (c === "auth/unauthorized-domain"){
      mostrarPuerta("Este sitio no esta autorizado en Firebase. Agregalo en Authentication > Settings > Dominios autorizados.", true);
    } else {
      mostrarPuerta("No se pudo entrar: " + (e && e.message ? e.message : "error desconocido"), true);
    }
  });
};

btnSalir.onclick = function(){ signOut(auth); location.reload(); };

var resuelto = false;
onAuthStateChanged(auth, function(user){
  if (!user){
    mostrarPuerta(resuelto ? "Se cerro la sesion." : "");
    return;
  }
  var correo = (user.email || "").toLowerCase();
  if (DOMINIO && correo.slice(-(DOMINIO.length + 1)) !== "@" + DOMINIO){
    signOut(auth);
    mostrarPuerta("La cuenta " + correo + " no es de Galilei. Entra con tu correo @" + DOMINIO + ".", true);
    return;
  }
  quien.textContent = correo;
  btnSalir.hidden = false;
  ocultarPuerta();
  if (!resuelto){ resuelto = true; G.abrir(almacen); }
});

setPersistence(auth, browserLocalPersistence).catch(function(){});
