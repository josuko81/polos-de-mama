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
    { id: 'd1', nombre: 'Clásico', cuello: 'Cuello redondo', tipo: 'Liso' },
    { id: 'd2', nombre: 'Básico V', cuello: 'Cuello V', tipo: 'Liso' },
  ],
  lotes: [],
  talleres: [
    { id: 'w1', nombre: 'Taller Rosa', telefono: '', precio: 3.5 },
    { id: 'w2', nombre: 'Taller Juan', telefono: '', precio: 4 },
  ],
  telas: [
    { id: 't1', fecha: '2026-09-28', color: 'negro', rollos: 2, kilos: 19, precioKilo: 20, costo: 380, acabada: true },
    { id: 't2', fecha: '2026-09-28', color: 'gris', rollos: 1, kilos: 11, precioKilo: 20, costo: 220, acabada: true },
    { id: 't3', fecha: '2026-10-15', color: 'blanco', rollos: 2, kilos: 15, precioKilo: 20, costo: 300, acabada: false },
    { id: 't4', fecha: '2026-10-25', color: 'lila', rollos: 1, kilos: 8, precioKilo: 22, costo: 176, acabada: false },
    { id: 't5', fecha: '2026-10-25', color: 'rojo', rollos: 1, kilos: 10, precioKilo: 22, costo: 220, acabada: false },
  ],
  tandas: [
    { id: 1, fecha: '2026-10-01', disenoId: 'd1', etapa: 4, tallerId: 'w1', precioTaller: 3.5, fechaEnvio: '2026-10-01', fechaEstimada: '2026-10-08', fechaRecojo: '2026-10-07', otros: 20, pagado: true,
      colores: '[{"color":"negro","telas":[{"telaId":"t1","fraccion":1}],"cortadosT":{"M":40,"Estándar":31,"L":29},"recibidosT":{"M":40,"Estándar":30,"L":28}}]' },
    { id: 2, fecha: '2026-10-02', disenoId: 'd2', etapa: 4, tallerId: 'w2', precioTaller: 3.8, fechaEnvio: '2026-10-02', fechaEstimada: '2026-10-09', fechaRecojo: '2026-10-08', otros: 10, pagado: true,
      colores: '[{"color":"gris","telas":[{"telaId":"t2","fraccion":1}],"cortadosT":{"M":20,"Estándar":15,"L":15},"recibidosT":{"M":20,"Estándar":15,"L":15}}]' },
    { id: 3, fecha: '2026-10-17', disenoId: 'd1', etapa: 2, tallerId: 'w1', precioTaller: 3.5, fechaEnvio: '2026-10-17', fechaEstimada: '2026-10-24', otros: 0, pagado: false,
      colores: '[{"color":"blanco","telas":[{"telaId":"t3","fraccion":0.5}],"cortadosT":{"M":20,"Estándar":20,"L":20}}]' },
  ],
  clientes: [
    { id: 'c1', nombre: 'Sra. Rosa', telefono: '987654321', nota: 'Mayorista, puesto en Gamarra' },
    { id: 'c2', nombre: 'Don Pedro', telefono: '', nota: '' },
  ],
  ventas: [
    { id: 'v1', fecha: '2026-10-10', pedidoId: 'p1', clienteId: 'c2', cliente: 'Don Pedro', canal: 'Gamarra', disenoId: 'd1', color: 'negro', talla: 'M', cantidad: 12, precio: 14, pagado: true },
    { id: 'v2', fecha: '2026-10-10', pedidoId: 'p1', clienteId: 'c2', cliente: 'Don Pedro', canal: 'Gamarra', disenoId: 'd1', color: 'negro', talla: 'L', cantidad: 3, precio: 16, pagado: true },
    { id: 'v3', fecha: '2026-10-15', pedidoId: 'p2', clienteId: 'c1', cliente: 'Sra. Rosa', canal: 'Gamarra', disenoId: 'd1', color: 'negro', talla: 'Estándar', cantidad: 24, precio: 14, pagado: false },
    { id: 'v4', fecha: '2026-10-20', pedidoId: 'p3', canal: 'WhatsApp', disenoId: 'd1', color: 'negro', talla: 'L', cantidad: 2, precio: 16, pagado: true, cliente: '' },
    { id: 'v5', fecha: '2026-10-24', pedidoId: 'p4', clienteId: 'c1', cliente: 'Sra. Rosa', canal: 'WhatsApp', disenoId: 'd2', color: 'gris', talla: 'M', cantidad: 10, precio: 14, pagado: true },
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
    if (t) return { disenos: [], telas: [], talleres: [], tandas: [], clientes: [], ...JSON.parse(t) }
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
    obj.id = tipo === 'lotes' || tipo === 'tandas' ? lista.reduce((m, x) => Math.max(m, Number(x.id) || 0), 0) + 1 : Math.random().toString(36).slice(2, 10)
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
  async borrar(tipo, id) { return demo.borrarVarios(tipo, [id]) },
  async borrarVarios(tipo, ids) {
    await esperar(200)
    const d = leerDemo()
    const quitar = ids.map(String)
    d[tipo] = d[tipo].filter((x) => !quitar.includes(String(x.id)))
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
  borrarVarios: (tipo, ids) => (enAppsScript ? llamar('borrarVarios', tipo, ids) : demo.borrarVarios(tipo, ids)),
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
