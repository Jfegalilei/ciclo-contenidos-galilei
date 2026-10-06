/* Lo visual de cada tema de temporada: su icono y los adornos que se
   le ponen a la malla. Todo es SVG en linea (nada de emojis) y toma el
   color del tema con currentColor. */

function svg(d, extra){ return '<svg viewBox="0 0 24 24" aria-hidden="true"' + (extra || "") + ">" + d + "</svg>"; }

var CALABAZA = svg('<path d="M12 7.2c-1.6-1-3.6-1.1-5.3-.2C4.5 8.1 3.3 10.5 3.6 13.3c.3 3.4 2.8 6.2 5.8 6.5 1 .1 1.9-.2 2.6-.7.7.5 1.6.8 2.6.7 3-.3 5.5-3.1 5.8-6.5.3-2.8-.9-5.2-3.1-6.3-1.7-.9-3.7-.8-5.3.2z"/><path d="M12 7.2c-1.3 1.6-1.8 3.7-1.8 5.9s.6 4.4 1.8 6M12 7.2c1.3 1.6 1.8 3.7 1.8 5.9s-.6 4.4-1.8 6"/><path d="M12 7V4.6c0-.9.6-1.6 1.6-1.6"/>');
var MURCIELAGO = svg('<path d="M12 9.6l-1-1.6-.6 2.1C8.6 9.3 7 9.9 6.2 11.2 5.4 9.6 3.8 8.6 1.8 8.6c1.5 1.5 2.1 3.7 2 5.8 1-1 2.6-1.3 3.9-.6.5-1 1.6-1.6 2.8-1.4L12 15.6l1.5-3.2c1.2-.2 2.3.4 2.8 1.4 1.3-.7 2.9-.4 3.9.6-.1-2.1.5-4.3 2-5.8-2 0-3.6 1-4.4 2.6-.8-1.3-2.4-1.9-4.2-1.1L13 8z" fill="currentColor" stroke="none"/>');
var TELARANA = svg('<path d="M1 1l22 22M1 1l11 22M1 1l22 11M1 9c3 0 6-1.5 8-4M1 15c5 0 10-3 13-8M1 21c7 0 14-4 18-11M9 23c.5-4 2.5-8 6-11M15 23c0-5 3-9 8-11"/>', ' class="web"');
var COPO = svg('<path d="M12 2.5v19M3.8 7.2l16.4 9.6M3.8 16.8l16.4-9.6M12 5.5l-2-2M12 5.5l2-2M12 18.5l-2 2M12 18.5l2 2M6.4 8.7l-2.7-.7M6.4 8.7l-.7-2.7M17.6 15.3l2.7.7M17.6 15.3l.7 2.7M6.4 15.3l-2.7.7M6.4 15.3l-.7 2.7M17.6 8.7l2.7-.7M17.6 8.7l.7-2.7"/>');
var ESTRELLA = svg('<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/>');
var CORAZON = svg('<path d="M12 20s-7.5-4.6-7.5-10.1C4.5 7.1 6.6 5 9.1 5c1.3 0 2.3.6 2.9 1.5C12.6 5.6 13.6 5 14.9 5c2.5 0 4.6 2.1 4.6 4.9C19.5 15.4 12 20 12 20z"/>');
var FLOR = svg('<circle cx="12" cy="10" r="2.2"/><path d="M12 7.8c-1.2-2.6.2-4.8 0-4.8s1.2 2.2 0 4.8zM14.2 10c2.6-1.2 4.8.2 4.8 0s-2.2 1.2-4.8 0zM9.8 10c-2.6 1.2-4.8-.2-4.8 0s2.2-1.2 4.8 0zM12 12.2c1.2 2.6-.2 4.8 0 4.8"/><circle cx="12" cy="4.6" r="2.4"/><circle cx="17.4" cy="10" r="2.4"/><circle cx="6.6" cy="10" r="2.4"/><path d="M12 12.2V21M12 17c1.5-1.8 3.5-2.3 5-2"/>');
var DESTELLO = svg('<path d="M12 2.5c.6 4.8 2.7 6.9 7.5 7.5-4.8.6-6.9 2.7-7.5 7.5-.6-4.8-2.7-6.9-7.5-7.5 4.8-.6 6.9-2.7 7.5-7.5zM18.5 15.5c.3 2 1.1 2.8 3 3-1.9.3-2.7 1.1-3 3-.3-1.9-1.1-2.7-3-3 1.9-.2 2.7-1 3-3z"/>');

// icono: el que identifica al tema. adorno: el que se esparce, tenue,
// en los dias de la temporada.
export var ARTE = {
  halloween: {icono: CALABAZA, adorno: MURCIELAGO, esquina: TELARANA},
  navidad:   {icono: ESTRELLA, adorno: COPO,       esquina: ""},
  amor:      {icono: CORAZON,  adorno: CORAZON,    esquina: ""},
  madres:    {icono: FLOR,     adorno: FLOR,       esquina: ""},
  especial:  {icono: DESTELLO, adorno: DESTELLO,   esquina: ""}
};

export function arteDe(tema){ return ARTE[tema] || ARTE.especial; }
