"use strict";

console.error(
  "El backend Node legado fue deshabilitado por seguridad. " +
  "Usa: python -m uvicorn api.index:app --host 127.0.0.1 --port 8000"
);
process.exitCode = 1;
