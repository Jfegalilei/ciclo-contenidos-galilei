# Ciclo de Contenidos Galilei

El calendario de contenidos de WhatsApp: un ciclo de 4 semanas que se repite sin
parar, igual para las 12 companias. Es la misma herramienta que vivia como
artifact de Claude, movida a una pagina propia para que **todo el equipo pueda
abrirla y editarla**, con los datos compartidos y en vivo.

- Los datos viven en **Firestore**: lo que cambia una persona lo ven las demas al
  instante, sin recargar.
- Entrar exige **cuenta de Google de Galilei**. Quien tenga el enlace pero no una
  cuenta `@galileilearning.com` no ve nada.

## Archivos

| Archivo | Que es |
|---|---|
| `index.html` | El calendario. Toda la aplicacion. |
| `config.js` | Las claves de tu proyecto de Firebase. **Hay que llenarlo.** |
| `firebase-init.js` | El login y el puente con Firestore. |
| `firestore.rules` | Quien puede leer y escribir. Se publica en Firebase. |
| `importar.html` | Carga los datos que ya existian. Se usa una sola vez. |
| `datos-iniciales.json` | Las 11 publicaciones del ciclo y las 37 piezas de la libreria. |

## Puesta en marcha

Son cuatro pasos. La primera vez toma unos 20 minutos; despues no se vuelve a
tocar.

### 1. Crear el proyecto de Firebase

1. Entra a <https://console.firebase.google.com> con tu correo de Galilei y crea
   un proyecto (por ejemplo `galilei-ciclo`). Puedes desactivar Google Analytics.
2. En **Compilacion > Firestore Database**, crea la base de datos. Elige
   **modo de produccion** (las reglas del paso 3 son las que abren el acceso) y
   una region cercana, por ejemplo `southamerica-east1`.
3. En **Compilacion > Authentication > Sign-in method**, habilita **Google**.
4. En **Configuracion del proyecto > Tus apps**, crea una app **Web** (el icono
   `</>`). Copia el objeto `firebaseConfig` que te muestra.

### 2. Pegar las claves

Abre `config.js` y reemplaza los `PEGAR-AQUI` con los valores del paso anterior.

Esas claves son publicas por diseno: van dentro de la pagina y cualquiera puede
verlas. Lo que protege los datos son las reglas del paso siguiente, no el
secreto de estas cadenas.

### 3. Publicar las reglas

En la consola, **Firestore Database > Reglas**: borra lo que haya, pega el
contenido de `firestore.rules` y publica.

Esto es lo que de verdad cierra el calendario: sin una sesion con correo
`@galileilearning.com` verificado, Firestore rechaza toda lectura y toda
escritura, venga de donde venga.

### 4. Publicar la pagina en GitHub Pages

1. Crea un repositorio en GitHub (puede ser privado; Pages funciona igual en
   cuentas con Pages habilitado para privados, y si no, hazlo publico: el codigo
   no guarda secretos).
2. Sube el contenido de esta carpeta a la rama `main`.
3. En **Settings > Pages**, elige `Deploy from a branch`, rama `main`, carpeta
   `/ (root)`. Guarda.
4. A los pocos minutos queda en `https://<tu-usuario>.github.io/<repo>/`.
5. Vuelve a Firebase, **Authentication > Settings > Dominios autorizados**, y
   agrega `<tu-usuario>.github.io`. Sin esto el login falla con
   `auth/unauthorized-domain`.

### 5. Cargar los datos que ya existian

Abre `https://<tu-usuario>.github.io/<repo>/importar.html`, entra con tu correo
y pulsa **Importar los datos**. Escribe las 11 publicaciones y las 37 piezas de
la libreria.

**Se hace una sola vez.** Si lo repites, sobrescribe esos documentos con los
datos originales y pierdes lo que se haya cambiado desde entonces.

Listo: reparte el enlace de `index.html` al equipo.

## Como esta armado

El calendario nacio hablando con un almacen que tiene forma de Firestore
(`collection().orderBy().onSnapshot()`, `doc().set()`, `update()`, `delete()`).
`firebase-init.js` le entrega exactamente ese mismo API sobre Firestore de
verdad, asi que la logica de la aplicacion no cambio.

Un detalle que importa si algun dia se toca ese archivo: el `update()` del
puente se traduce a `set(..., {merge:true})`, **no** al `update()` nativo. Las
marcas de envio son objetos anidados (`{idPost: {idCompania: fecha}}`) y el
calendario cuenta con que la fusion sea profunda, para que dos personas puedan
marcar publicaciones distintas sin pisarse. El `update()` de Firestore
reemplazaria el mapa completo y borraria las marcas de las demas.

## Modelo de datos

- `plantilla/{id}` — una publicacion del ciclo:
  `{week: 1-8, dow: 0-6, time, type, familia, title, copy, img}`.
  `week` es la semana **dentro del ciclo**, no del ano; `dow` 0 = lunes.
- `libreria/{id}` — una pieza reutilizable, fuera del ciclo:
  `{type, familia, grupos, title, copy, img}`.
- `envios/{AAAA-MM-DD}` — las marcas de una vuelta, con la fecha del lunes en
  que arranco: `{marks: {idPost: {idCompania: fechaISO}}}`. Cadena vacia = no
  enviado.
- `config/ciclo` — `{weeks: 4}`, la duracion del ciclo, compartida por todos.

Las imagenes viajan dentro del documento como data URI, comprimidas en el
navegador a unos 168 KB para no pasarse del limite de 1 MB por documento de
Firestore.

## Costo

El plan gratuito de Firebase (Spark) cubre 50.000 lecturas y 20.000 escrituras
por dia. Un equipo pequeno operando un calendario no se acerca a eso.
