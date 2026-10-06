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
| `index.html` | El marcado de la pagina. No lleva logica. |
| `css/estilos.css` | Todos los estilos (tema oscuro de marca y claro). |
| `assets/` | Isotipo de Galilei y favicon. |
| `js/` | La aplicacion, en modulos. Ver *Como esta armado*. |
| `config.js` | Las claves de tu proyecto de Firebase. **Hay que llenarlo.** |
| `firebase-init.js` | El login y el puente con Firestore. |
| `firestore.rules` | Quien puede leer y escribir. Se publica en Firebase. |
| `importar.html` | Carga los datos que ya existian. Se usa una sola vez. |
| `datos-iniciales.json` | Las 21 publicaciones del ciclo y los 48 items de la libreria. |

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
y pulsa **Importar los datos**. Escribe las 21 publicaciones y los 48 items de
la libreria.

**Se hace una sola vez.** Si lo repites, sobrescribe esos documentos con los
datos originales y pierdes lo que se haya cambiado desde entonces.

Listo: reparte el enlace de `index.html` al equipo.

## Como esta armado

La aplicacion esta partida en capas; cada archivo tiene una sola razon para
cambiar y recibe sus dependencias desde `js/main.js`, que es el unico que
conoce todas las piezas.

| Carpeta | Que hay | Depende de |
|---|---|---|
| `js/dominio/` | Reglas puras: catalogos, fechas, ciclo, fechas fijas, participacion y forma de los documentos. | nada |
| `js/datos/` | Repositorios (el unico codigo que conoce las colecciones) y la politica de escritura. | dominio + el almacen que se le pase |
| `js/app/` | Estado de la pantalla, consultas de solo lectura, casos de uso (`acciones.js`) y la sincronizacion con la base. | dominio, datos |
| `js/ui/` | Vistas: barra, malla, panel del dia, libreria y el editor. | app, dominio |

Para extender sin tocar lo que ya funciona:

- **Un dato nuevo en el detalle de una publicacion**: una funcion mas en
  `SECCIONES` de `js/ui/detalle.js`.
- **Un campo nuevo en el editor**: una fabrica mas en `js/ui/campos.js` y
  agregarla a la lista del editor que la necesite en `js/ui/editores.js`.
- **Una categoria, tipo o compania nueva**: `js/dominio/catalogos.js`.


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
- `temporadas/{id}` — una temporada especial: `{nombre, tema, desde, hasta}`
  con fechas `AAAA-MM-DD`. `tema` es `halloween`, `navidad`, `amor`, `madres`
  o `especial` y decide el color y los adornos.
- `temporadaPubs/{id}` — lo programado dentro de una temporada:
  `{temporada, dia, time, type, familia, operatividad, cds, img, title, copy}`.
  `dia` cuenta desde el primer dia de la temporada (0 = el primero), asi que
  mover las fechas de la temporada corre toda su programacion junta.

## Temporadas especiales

Mientras dura una temporada (Halloween, Navidad...) **el ciclo se aplaza**: no
avanza, y al terminar retoma en la semana donde iba. La programacion de esos
dias es la de la temporada.

- Solo las semanas (lunes a domingo) que la temporada cubre **completas**
  detienen el ciclo. En una semana que comparte, el ciclo sigue contando pero
  los dias de temporada reemplazan lo que el ciclo tenia ese dia (el panel del
  dia lo avisa). Asi el lunes del ciclo siempre cae en lunes.
- Las publicaciones **fijas** (dia del mes, fecha del ano) siguen saliendo en su
  fecha aunque haya temporada: son de calendario, como pagos o cierres.
- Una vuelta muestra sus N semanas del ciclo y, entre ellas, las semanas en
  pausa, marcadas con el icono del tema en la columna de semanas.
- Las vueltas se cuentan en *semanas activas* desde el ancla. Crear una
  temporada **en el pasado** corre los arranques de vuelta siguientes y deja
  sus marcas de envio en una clave que ya no se lee; crearla a futuro no afecta
  nada de lo ya enviado.
- `gali.js` no incluye estas colecciones en `exportar`/`sync` a proposito:
  un `sync` con una semilla vieja las borraria.

Para que funcionen hay que **publicar las reglas** de `firestore.rules`
(Firestore > Reglas). Sin ellas el calendario sigue andando igual y la pestana
Temporadas lo avisa.

## Vista de prueba

`http://localhost:8080/?demo` abre la pagina sin Google y sin Firebase, con un
almacen en memoria: arranca con `web-actual.json` (lo baja
`node gali.js exportar`) mas dos temporadas de ejemplo. Nada se guarda. Solo
funciona en `localhost`.

## Marca

Sigue el sistema de Galilei: superficies Neutralverse, GaliGreen solo como
acento (hoy, boton principal, pestana activa), Radio Canada Big en titulos y
Space Grotesk en el resto, sin sombras. Oscuro por defecto; el claro se elige
en Ajustes y queda guardado en ese navegador.

Las imagenes viajan dentro del documento como data URI, comprimidas en el
navegador a unos 168 KB para no pasarse del limite de 1 MB por documento de
Firestore.

## Costo

El plan gratuito de Firebase (Spark) cubre 50.000 lecturas y 20.000 escrituras
por dia. Un equipo pequeno operando un calendario no se acerca a eso.
