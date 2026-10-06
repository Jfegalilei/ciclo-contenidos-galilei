/* Cada item lleva dos colores: el del tipo (franja principal) y el de
   la categoria. Las vistas los reciben como variables CSS. */

import { TIPOS, FAMILIAS } from "../dominio/catalogos.js";

export function coloresDe(x){
  return "--chipc:" + TIPOS[x.type].color + (x.familia ? ";--famc:" + FAMILIAS[x.familia].color : "");
}
