/* Politica comun para toda escritura: un reintento si el servicio no
   esta disponible, un mensaje entendible si falla, y solo lectura si
   se revoca el acceso. Los repositorios no saben nada de esto. */

export function describirError(e){
  var code = e && e.code;
  if (code === "invalid_argument" || code === "transform_error") return "El dato no se pudo guardar: revisa la semana y la hora.";
  if (code === "quota_exceeded") return "El ciclo llego a su tope de publicaciones. Elimina algunas para poder crear mas.";
  if (code === "resource_exhausted") return "Demasiados cambios seguidos. Espera unos segundos y vuelve a intentar.";
  if (code === "revoked") return "Se cerro el acceso al calendario. La vista quedo en solo lectura.";
  if (code === "not_granted" || code === "capability_disabled" || code === "capability_removed") return "Esta vista no tiene acceso al almacenamiento del calendario.";
  if (code === "permission-denied") return "Tu cuenta no tiene permiso para cambiar el calendario.";
  return "No se pudo guardar. Reintenta en un momento.";
}

// avisos: {toast(msg), fijo(msg, tipo)}; alRevocar: pasa la vista a solo lectura.
export function crearEscritor(avisos, alRevocar){
  return function escribir(fn){
    return fn().catch(function(e){
      if (e && e.code === "unavailable"){
        return new Promise(function(r){ setTimeout(r, 400 + Math.random() * 400); }).then(fn);
      }
      throw e;
    }).catch(function(e){
      avisos.toast(describirError(e));
      if (e && e.code === "revoked"){ avisos.fijo(describirError(e), "err"); alRevocar(); }
      throw e;
    });
  };
}
