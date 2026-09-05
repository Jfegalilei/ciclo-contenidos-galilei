/* Configuracion del proyecto de Firebase.
   Pega aqui el bloque que da la consola en Configuracion del proyecto >
   Tus apps > Configuracion del SDK. Estas claves son publicas por diseno:
   quien protege los datos son las reglas de Firestore, no el secreto de
   estas cadenas.

   DOMINIO es el correo que se permite editar el calendario. Cambialo aqui
   Y en firestore.rules: los dos tienen que decir lo mismo. */

window.GALI_CONFIG = {
  firebase: {
    // Estos tres ya salen del ID del proyecto.
    authDomain:        "ciclo-de-contenidos-galilei.firebaseapp.com",
    projectId:         "ciclo-de-contenidos-galilei",
    storageBucket:     "ciclo-de-contenidos-galilei.appspot.com",
    // Estos tres los da la consola al crear la app web.
    apiKey:            "AIzaSyBRmGScmcJKATSX1EAiXSSGHlMtN-Z-IeE",
    messagingSenderId: "253360502665",
    appId:             "1:253360502665:web:15df55d7901d95c4585358"
  },
  dominio: "galileilearning.com"
};
