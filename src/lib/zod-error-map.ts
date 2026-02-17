import { z } from "zod";

z.config({
  customError: (iss) => {
    switch (iss.code) {
      case "invalid_type":
        if (iss.received === "undefined" || iss.received === "null") {
          return "Ce champ est requis";
        }
        return `Type attendu : ${iss.expected}`;
      case "too_small":
        if (iss.origin === "string") {
          if (iss.minimum === 1) return "Ce champ est requis";
          return `Minimum ${iss.minimum} caractères`;
        }
        if (iss.origin === "number") {
          return `La valeur doit être au moins ${iss.minimum}`;
        }
        if (iss.origin === "array") {
          return `Au moins ${iss.minimum} élément(s) requis`;
        }
        return undefined;
      case "too_big":
        if (iss.origin === "string") {
          return `Maximum ${iss.maximum} caractères`;
        }
        if (iss.origin === "number") {
          return `La valeur ne peut pas dépasser ${iss.maximum}`;
        }
        return undefined;
      case "invalid_format":
        if (iss.format === "email") {
          return "Email invalide";
        }
        if (iss.format === "url") {
          return "URL invalide";
        }
        return "Format invalide";
      case "invalid_value":
        return "Valeur non autorisée";
      default:
        return undefined;
    }
  },
});

export {};
