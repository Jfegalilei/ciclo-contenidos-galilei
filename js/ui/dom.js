/* Utilidades de DOM que comparten todas las vistas. */

export function $(id){ return document.getElementById(id); }

export function esc(s){
  return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){
    return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
  });
}

// crear("button", "btn btn-quiet", "<svg>...</svg>Editar")
export function crear(tag, clase, html){
  var el = document.createElement(tag);
  if (clase) el.className = clase;
  if (html != null) el.innerHTML = html;
  return el;
}

// <option>s a partir de [{v, l}], marcando la elegida.
export function opciones(lista, elegida){
  return lista.map(function(o){
    return '<option value="' + esc(o.v) + '"' + (String(o.v) === String(elegida) ? " selected" : "") + ">" + esc(o.l) + "</option>";
  }).join("");
}

export function plural(n, uno, varios){ return n + " " + (n === 1 ? uno : varios); }
