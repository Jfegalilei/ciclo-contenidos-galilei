/* Iconos de trazo, todos en una caja de 24x24. El color lo da currentColor. */

function svg(d){ return '<svg viewBox="0 0 24 24" aria-hidden="true">' + d + "</svg>"; }

export var ICONO = {
  menu:     svg('<path d="M4 6h16M4 12h16M4 18h16"/>'),
  izq:      svg('<path d="M15 5l-7 7 7 7"/>'),
  der:      svg('<path d="M9 5l7 7-7 7"/>'),
  mas:      svg('<path d="M12 5v14M5 12h14"/>'),
  cerrar:   svg('<path d="M6 6l12 12M18 6L6 18"/>'),
  ajustes:  svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/>'),
  buscar:   svg('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>'),
  lapiz:    svg('<path d="M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4"/>'),
  basura:   svg('<path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13M10 11v6M14 11v6"/>'),
  copiar:   svg('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 012-2h8"/>'),
  check:    svg('<path d="M5 12l5 5L19 6"/>'),
  candado:  svg('<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 018 0v3"/>'),
  imagen:   svg('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.5"/><path d="M21 16l-5-5-6 6"/>'),
  bajar:    svg('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>'),
  reloj:    svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  grafica:  svg('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
  diana:    svg('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>'),
  enviar:   svg('<path d="M21 3L10 14M21 3l-7 18-4-7-7-4 18-7z"/>'),
  info:     svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'),
  etiqueta: svg('<path d="M3 12V4h8l10 10-8 8L3 12z"/><circle cx="7.5" cy="8.5" r="1.5"/>'),
  texto:    svg('<path d="M4 6h16M4 12h16M4 18h10"/>'),
  calendario: svg('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
  repetir:  svg('<path d="M17 2l3 3-3 3"/><path d="M4 11V9a4 4 0 014-4h12M7 22l-3-3 3-3"/><path d="M20 13v2a4 4 0 01-4 4H4"/>'),
  pausa:    svg('<path d="M9 6v12M15 6v12"/>'),
  sol:      svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  luna:     svg('<path d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z"/>'),
  libro:    svg('<path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2V5z"/><path d="M4 19a2 2 0 012-2h13"/>')
};
