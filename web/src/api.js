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
  disenos: [
    { id: 'd1', nombre: 'Clásico', cuello: 'Cuello redondo' },
    { id: 'd2', nombre: 'Básico V', cuello: 'Cuello V' },
  ],
  lotes: [
    { id: 1, fecha: '2026-10-03', disenoId: 'd1', modelo: 'Cuello redondo', color: 'negro', paso: 5, rollos: 2, kilos: 19, precioKilo: 20, enviados: 100, recibidos: 98,
      enviadosT: '{"M":40,"Estándar":31,"L":29}', recibidosT: '{"M":40,"Estándar":30,"L":28}', tela: 380, confeccion: 3.5, otros: 20 },
    { id: 2, fecha: '2026-10-08', disenoId: 'd2', modelo: 'Cuello V', color: 'gris', paso: 5, rollos: 1, kilos: 11, precioKilo: 20, enviados: 50, recibidos: 50,
      enviadosT: '{"M":20,"Estándar":15,"L":15}', recibidosT: '{"M":20,"Estándar":15,"L":15}', tela: 220, confeccion: 3.8, otros: 10 },
    { id: 3, fecha: '2026-10-17', disenoId: 'd1', modelo: 'Cuello redondo', color: 'blanco', paso: 3, rollos: 2, kilos: 15, precioKilo: 20, enviados: 60, recibidos: 0,
      enviadosT: '{"M":20,"Estándar":20,"L":20}', tela: 300, confeccion: 4.5, otros: 0 },
  ],
  ventas: [
    { id: 'v1', fecha: '2026-10-10', disenoId: 'd1', color: 'negro', talla: 'M', cantidad: 12, precio: 14, pagado: true, cliente: '' },
    { id: 'v2', fecha: '2026-10-12', disenoId: 'd1', color: 'negro', talla: 'L', cantidad: 3, precio: 16, pagado: true, cliente: '' },
    { id: 'v3', fecha: '2026-10-15', disenoId: 'd1', color: 'negro', talla: 'Estándar', cantidad: 24, precio: 14, pagado: false, cliente: 'Sra. Rosa (mayorista)' },
    { id: 'v4', fecha: '2026-10-20', disenoId: 'd1', color: 'negro', talla: 'L', cantidad: 2, precio: 16, pagado: true, cliente: '' },
    { id: 'v5', fecha: '2026-10-24', disenoId: 'd2', color: 'gris', talla: 'M', cantidad: 10, precio: 14, pagado: true, cliente: '' },
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
    if (t) return { disenos: [], ...JSON.parse(t) }
  } catch (e) {}
  return JSON.parse(JSON.stringify(EJEMPLO))
}
function escribirDemo(d) {
  try { localStorage.setItem(CLAVE, JSON.stringify(d)) } catch (e) {}
  return JSON.parse(JSON.stringify(d))
}
const esperar = (ms) => new Promise((r) => setTimeout(r, ms))

function guardarEnDemo(lista, tipo, obj) {
  if (obj.id === undefined || obj.id === null || obj.id === '') {
    obj.id = tipo === 'lotes' ? lista.reduce((m, x) => Math.max(m, Number(x.id) || 0), 0) + 1 : Math.random().toString(36).slice(2, 10)
    lista.push(obj)
  } else {
    const i = lista.findIndex((x) => String(x.id) === String(obj.id))
    if (i >= 0) lista[i] = { ...lista[i], ...obj }; else lista.push(obj)
  }
}

const demo = {
  async getData() { await esperar(200); return leerDemo() },
  async guardar(tipo, obj) {
    await esperar(300)
    const d = leerDemo()
    guardarEnDemo(d[tipo], tipo, obj)
    return { datos: escribirDemo(d), id: obj.id }
  },
  async guardarVarios(tipo, objs) {
    await esperar(400)
    const d = leerDemo()
    objs.forEach((obj) => guardarEnDemo(d[tipo], tipo, obj))
    return { datos: escribirDemo(d), ids: objs.map((o) => o.id) }
  },
  async borrar(tipo, id) {
    await esperar(200)
    const d = leerDemo()
    d[tipo] = d[tipo].filter((x) => String(x.id) !== String(id))
    return { datos: escribirDemo(d) }
  },
  // Fotos: en modo de prueba se guardan en el navegador (caben pocas)
  async subirFoto(dataUrl) {
    await esperar(300)
    const fotos = leerFotosDemo()
    const id = 'f' + Math.random().toString(36).slice(2, 10)
    fotos[id] = dataUrl
    try { localStorage.setItem(CLAVE_FOTOS, JSON.stringify(fotos)) } catch (e) {
      throw new Error('Ya no caben más fotos en el modo de prueba.')
    }
    return id
  },
  async verFoto(id) { return leerFotosDemo()[id] || null },
  async borrarFoto(id) {
    const fotos = leerFotosDemo()
    delete fotos[id]
    try { localStorage.setItem(CLAVE_FOTOS, JSON.stringify(fotos)) } catch (e) {}
  },
}

const CLAVE_FOTOS = 'polos-de-mama-demo-fotos'
function leerFotosDemo() {
  try { return JSON.parse(localStorage.getItem(CLAVE_FOTOS)) || {} } catch (e) { return {} }
}

export const modoPrueba = !enAppsScript

// Las fotos ya vistas se guardan en memoria para no pedirlas otra vez
const fotosVistas = new Map()

export const api = {
  getData: () => (enAppsScript ? llamar('getData') : demo.getData()),
  guardar: (tipo, obj) => (enAppsScript ? llamar('guardar', tipo, obj) : demo.guardar(tipo, obj)),
  guardarVarios: (tipo, objs) => (enAppsScript ? llamar('guardarVarios', tipo, objs) : demo.guardarVarios(tipo, objs)),
  borrar: (tipo, id) => (enAppsScript ? llamar('borrar', tipo, id) : demo.borrar(tipo, id)),
  subirFoto: (dataUrl) => (enAppsScript ? llamar('subirFoto', dataUrl) : demo.subirFoto(dataUrl)),
  verFoto: (id) => {
    if (!fotosVistas.has(id)) {
      const p = (enAppsScript ? llamar('verFoto', id) : demo.verFoto(id)).catch(() => null)
      fotosVistas.set(id, p)
    }
    return fotosVistas.get(id)
  },
  borrarFoto: (id) => {
    fotosVistas.delete(id)
    return enAppsScript ? llamar('borrarFoto', id) : demo.borrarFoto(id)
  },
}
