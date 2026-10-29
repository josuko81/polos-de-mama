// Conexión con Google Sheets (Apps Script).
// Si la página NO está dentro de Apps Script (por ejemplo con `npm run dev`),
// usa un modo de prueba que guarda en el navegador con datos de ejemplo.

const enAppsScript = typeof window !== 'undefined' && window.google && window.google.script && window.google.script.run

function llamar(funcion, ...args) {
  return new Promise((resolve, reject) => {
    window.google.script.run.withSuccessHandler(resolve).withFailureHandler(reject)[funcion](...args)
  })
}

// ---------- Modo de prueba ----------
const CLAVE = 'polos-de-mama-demo'

const EJEMPLO = {
  lotes: [
    { id: 1, fecha: '2026-10-03', modelo: 'Cuello redondo', color: 'negro', paso: 5, enviados: 100, recibidos: 98, tela: 380, corte: 50, confeccion: 3.5, etiquetas: 40, otros: 20 },
    { id: 2, fecha: '2026-10-08', modelo: 'Cuello V', color: 'gris', paso: 5, enviados: 50, recibidos: 50, tela: 220, corte: 30, confeccion: 3.8, etiquetas: 20, otros: 10 },
    { id: 3, fecha: '2026-10-17', modelo: 'Oversize', color: 'blanco', paso: 3, enviados: 60, recibidos: 0, tela: 300, corte: 30, confeccion: 4.5, etiquetas: 0, otros: 0 },
  ],
  ventas: [
    { id: 'v1', fecha: '2026-10-10', loteId: 1, talla: 'M', cantidad: 12, precio: 13, pagado: true, cliente: '' },
    { id: 'v2', fecha: '2026-10-12', loteId: 1, talla: 'L', cantidad: 3, precio: 18, pagado: true, cliente: '' },
    { id: 'v3', fecha: '2026-10-15', loteId: 1, talla: 'S', cantidad: 24, precio: 12.5, pagado: false, cliente: 'Sra. Rosa (mayorista)' },
    { id: 'v4', fecha: '2026-10-20', loteId: 1, talla: 'XL', cantidad: 2, precio: 18, pagado: true, cliente: '' },
    { id: 'v5', fecha: '2026-10-24', loteId: 2, talla: 'M', cantidad: 10, precio: 16, pagado: true, cliente: '' },
  ],
  gastos: [
    { id: 'g1', fecha: '2026-10-05', concepto: 'Pasajes a la feria', categoria: 'Pasajes', monto: 24 },
    { id: 'g2', fecha: '2026-10-08', concepto: 'Publicidad en Facebook', categoria: 'Publicidad', monto: 30 },
    { id: 'g3', fecha: '2026-10-25', concepto: 'Recarga de celular', categoria: 'Internet y celular', monto: 15 },
  ],
}

function leerDemo() {
  try {
    const t = localStorage.getItem(CLAVE)
    if (t) return JSON.parse(t)
  } catch (e) {}
  return JSON.parse(JSON.stringify(EJEMPLO))
}
function escribirDemo(d) {
  try { localStorage.setItem(CLAVE, JSON.stringify(d)) } catch (e) {}
  return JSON.parse(JSON.stringify(d))
}
const esperar = (ms) => new Promise((r) => setTimeout(r, ms))

const demo = {
  async getData() { await esperar(200); return leerDemo() },
  async guardar(tipo, obj) {
    await esperar(300)
    const d = leerDemo()
    const lista = d[tipo]
    if (obj.id === undefined || obj.id === null || obj.id === '') {
      obj.id = tipo === 'lotes' ? lista.reduce((m, x) => Math.max(m, Number(x.id) || 0), 0) + 1 : Math.random().toString(36).slice(2, 10)
      lista.push(obj)
    } else {
      const i = lista.findIndex((x) => String(x.id) === String(obj.id))
      if (i >= 0) lista[i] = { ...lista[i], ...obj }; else lista.push(obj)
    }
    return { datos: escribirDemo(d), id: obj.id }
  },
  async borrar(tipo, id) {
    await esperar(200)
    const d = leerDemo()
    d[tipo] = d[tipo].filter((x) => String(x.id) !== String(id))
    return { datos: escribirDemo(d) }
  },
}

export const modoPrueba = !enAppsScript

export const api = {
  getData: () => (enAppsScript ? llamar('getData') : demo.getData()),
  guardar: (tipo, obj) => (enAppsScript ? llamar('guardar', tipo, obj) : demo.guardar(tipo, obj)),
  borrar: (tipo, id) => (enAppsScript ? llamar('borrar', tipo, id) : demo.borrar(tipo, id)),
}
