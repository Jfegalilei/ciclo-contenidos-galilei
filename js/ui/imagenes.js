/* IMAGENES
   La imagen viaja dentro del documento como data URI, comprimida en el
   navegador para no pasarse del limite por documento. Para mandarla por
   WhatsApp se copia al portapapeles o se descarga. */

export var LIMITE_IMG = 168000;   // caracteres del data URI, con margen

export function pesoKB(uri){ return Math.round(uri.length * 0.75 / 1024); }

// Rechaza con "tipo", "lectura" o "peso".
export function comprimirImagen(file){
  return new Promise(function(resolve, reject){
    if (!file || !/^image\//.test(file.type)) return reject("tipo");
    var fr = new FileReader();
    fr.onerror = function(){ reject("lectura"); };
    fr.onload = function(){
      var im = new Image();
      im.onerror = function(){ reject("lectura"); };
      im.onload = function(){
        var c = document.createElement("canvas"), ctx;
        var escala = Math.min(1, 1100 / Math.max(im.width, im.height));
        var an = Math.max(1, Math.round(im.width * escala));
        var al = Math.max(1, Math.round(im.height * escala));

        function pintar(w, h, q){
          c.width = w; c.height = h;
          ctx = c.getContext("2d");
          ctx.fillStyle = "#ffffff";        // los PNG con transparencia quedarian negros en JPEG
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(im, 0, 0, w, h);
          return c.toDataURL("image/jpeg", q);
        }

        var q = 0.78;
        var out = pintar(an, al, q);
        while (out.length > LIMITE_IMG && q > 0.4){ q -= 0.1; out = pintar(an, al, q); }
        while (out.length > LIMITE_IMG && an > 420){
          an = Math.round(an * 0.8); al = Math.round(al * 0.8);
          out = pintar(an, al, 0.7);
        }
        if (out.length > LIMITE_IMG) return reject("peso");
        resolve(out);
      };
      im.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}

function dataUriABlob(uri){
  var partes = uri.split(",");
  var m = /:(.*?);/.exec(partes[0]);
  var bin = atob(partes[1]);
  var n = bin.length, u8 = new Uint8Array(n);
  while (n--) u8[n] = bin.charCodeAt(n);
  return new Blob([u8], {type: m ? m[1] : "image/jpeg"});
}

function nombreArchivo(titulo){
  var s = String(titulo || "imagen").normalize("NFD").replace(/[̀-ͯ]/g, "")
           .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
  return (s || "imagen") + ".jpg";
}

export function descargarImagen(uri, titulo){
  var a = document.createElement("a");
  a.href = URL.createObjectURL(dataUriABlob(uri));
  a.download = nombreArchivo(titulo);
  document.body.appendChild(a);
  a.click();
  setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

export function puedeCopiarImagen(){
  return !!(navigator.clipboard && window.ClipboardItem && window.isSecureContext);
}

// El portapapeles solo acepta PNG, asi que se reconvierte al vuelo. El
// ClipboardItem debe construirse dentro del clic: se le pasa la promesa.
export function copiarImagen(uri){
  var png = new Promise(function(resolve, reject){
    var im = new Image();
    im.onload = function(){
      var c = document.createElement("canvas");
      c.width = im.width; c.height = im.height;
      c.getContext("2d").drawImage(im, 0, 0);
      c.toBlob(function(b){ b ? resolve(b) : reject(new Error("blob")); }, "image/png");
    };
    im.onerror = function(){ reject(new Error("img")); };
    im.src = uri;
  });
  return navigator.clipboard.write([new ClipboardItem({"image/png": png})]);
}

export function copiarTexto(txt){
  if (!navigator.clipboard || !navigator.clipboard.writeText) return Promise.reject();
  return navigator.clipboard.writeText(txt);
}
