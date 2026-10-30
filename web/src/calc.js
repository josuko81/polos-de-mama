// Cálculos del negocio. Todo lo que la app "sabe" sale de aquí.

// Etapas del lote. En la hoja, la columna "paso" sigue usando la escala antigua de 1 a 5
// (`valor`), así los lotes anotados antes de este cambio caen solos en su etapa.
export const PASOS = [
  { n: 1, titulo: 'Compré la tela', estado: 'Tela comprada', icono: '🧶', color: 'info', valor: 1 },
  { n: 2, titulo: 'Corté y mandé al taller', estado: 'En el taller', icono: '✂️', color: 'warning', valor: 3 },
  { n: 3, titulo: 'Recogí del taller', estado: 'Empaquetando', icono: '🧼', color: 'primary', valor: 4 },
  { n: 4, titulo: 'Limpié y empaqueté', estado: 'Listo para vender', icono: '✅', color: 'success', valor: 5 },
]
// Etapa desde la que los polos se pueden vender
export const LISTO = PASOS.length

// Etapa (0 a 4) según el paso guardado: 1-2 → tela comprada, 3 → en el taller, 4 → empaquetando, 5 → listo
export const etapaDe = (l) => {
  const p = Number(l && l.paso) || 0
  return p >= 5 ? 4 : p >= 4 ? 3 : p >= 3 ? 2 : p >= 1 ? 1 : 0
}

export const TALLAS = ['M', 'Estándar', 'L']
// Precio por mayor según la talla (se puede cambiar al anotar la venta)
export const PRECIOS = { M: 14, 'Estándar': 14, L: 16 }

export const MODELOS = ['Cuello redondo', 'Cuello V']
export const TIPOS_DISENO = ['Liso', 'Con estampado']

// Colores con su muestra, para reconocerlos de un vistazo
export const COLORES = [
  { nombre: 'negro', hex: '#1c1c1c' },
  { nombre: 'blanco', hex: '#ffffff' },
  { nombre: 'gris', hex: '#9aa0a6' },
  { nombre: 'plomo', hex: '#5f6368' },
  { nombre: 'azul marino', hex: '#1f2a52' },
  { nombre: 'azul', hex: '#2f6fd6' },
  { nombre: 'celeste', hex: '#8ecdf2' },
  { nombre: 'rojo', hex: '#d32f2f' },
  { nombre: 'guinda', hex: '#7b1e34' },
  { nombre: 'rosado', hex: '#f4a6c0' },
  { nombre: 'amarillo', hex: '#f7d23e' },
  { nombre: 'mostaza', hex: '#c99a2e' },
  { nombre: 'naranja', hex: '#f57c00' },
  { nombre: 'verde', hex: '#2e7d32' },
  { nombre: 'verde agua', hex: '#6cc5b0' },
  { nombre: 'lila', hex: '#b39ddb' },
  { nombre: 'morado', hex: '#6a1b9a' },
  { nombre: 'beige', hex: '#e8d8b8' },
  { nombre: 'marrón', hex: '#6d4c41' },
]

// Color de muestra para un nombre (null si es un color escrito a mano)
export const colorHex = (nombre) => {
  const c = COLORES.find((x) => x.nombre === String(nombre || '').trim().toLowerCase())
  return c ? c.hex : null
}
export const CATEGORIAS = ['Pasajes', 'Luz y agua', 'Internet y celular', 'Publicidad', 'Alquiler / puesto', 'Bolsas y etiquetas', 'Otros']
export const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

const num = (v) => Number(v) || 0

export const soles = (n) =>
  'S/ ' + num(n).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const hoy = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const fechaCorta = (iso) => {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export const estadoLote = (l) => (etapaDe(l) > 0 ? PASOS[etapaDe(l) - 1].estado : 'Nuevo')

// Costo total del lote: tela + confección por polo × polos + pasajes y otros.
// Corte y etiquetas ya no se preguntan, pero se suman si un lote antiguo los tiene.
export const costoTotalLote = (l) =>
  num(l.tela) + num(l.corte) + num(l.confeccion) * (num(l.recibidos) || num(l.enviados)) + num(l.etiquetas) + num(l.otros)

// Cuántos polos buenos salieron por kilo de tela (null si falta el dato)
export const rinde = (l) => (num(l.kilos) > 0 && num(l.recibidos) > 0 ? Math.round((num(l.recibidos) / num(l.kilos)) * 10) / 10 : null)

// Costo por polo: solo se sabe cuando ya llegaron los polos del taller
export const costoPorPolo = (l) => (num(l.recibidos) > 0 ? costoTotalLote(l) / num(l.recibidos) : null)

// ---------- Diseños ----------
// La app registra aquí los diseños al cargar los datos, para poder nombrar lotes y ventas.
let disenosActuales = []
export const registrarDisenos = (lista) => { disenosActuales = lista || [] }
export const disenoPorId = (id) => disenosActuales.find((d) => String(d.id) === String(id)) || null
export const nombreDiseno = (id) => { const d = disenoPorId(id); return d ? d.nombre : '' }

// Cantidades por talla: se guardan en la hoja como texto JSON, p. ej. {"M":40,"L":28}
export const leerTallas = (v) => {
  let o = v
  if (typeof v === 'string') { try { o = JSON.parse(v) } catch (e) { o = null } }
  const r = {}
  if (o && typeof o === 'object') Object.keys(o).forEach((t) => { if (num(o[t]) > 0) r[t] = num(o[t]) })
  return r
}
export const sumaTallas = (o) => Object.values(leerTallas(o)).reduce((s, n) => s + n, 0)
export const textoTallas = (o) => {
  const t = leerTallas(o)
  return [...TALLAS, ...Object.keys(t).filter((k) => !TALLAS.includes(k))].filter((k) => t[k]).map((k) => `${k} ${t[k]}`).join(' · ')
}

// Antes de cortar, el lote se llama por su tela; después, por su diseño y color
export const nombreLote = (l) => {
  if (l.disenoId && nombreDiseno(l.disenoId)) return `${nombreDiseno(l.disenoId)} ${l.color || ''}`.trim()
  return l.modelo ? [l.modelo, l.color].filter(Boolean).join(' ') : `Tela ${l.color || ''}`.trim()
}

// ---------- Fechas ----------
const aDia = (iso) => Math.floor(Date.parse(String(iso || '').slice(0, 10) + 'T12:00:00') / 86400000)
export const diasEntre = (desde, hasta) => (desde && hasta ? aDia(hasta) - aDia(desde) : null)
export const sumarDias = (iso, n) => {
  const d = new Date(Date.parse(iso + 'T12:00:00') + n * 86400000)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ---------- Tandas de producción ----------
// Una tanda es un diseño cortado en varios colores que va junto al taller. En la hoja,
// `colores` guarda por color: las telas usadas (con qué parte de cada una), lo cortado y lo recibido.
export const ETAPAS_TANDA = [
  { n: 1, estado: 'Estampando', icono: '🎨', color: 'secondary' },
  { n: 2, estado: 'En el taller', icono: '🏭', color: 'warning' },
  { n: 3, estado: 'Empaquetando', icono: '🧼', color: 'primary' },
  { n: 4, estado: 'Listo para vender', icono: '✅', color: 'success' },
]
export const etapaTanda = (t) => num(t && t.etapa)
export const coloresDeTanda = (t) => {
  let c = t && t.colores
  if (typeof c === 'string') { try { c = JSON.parse(c) } catch (e) { c = [] } }
  return Array.isArray(c) ? c : []
}
export const cortadosDeTanda = (t) => coloresDeTanda(t).reduce((s, x) => s + sumaTallas(x.cortadosT), 0)
export const recibidosDeTanda = (t) => coloresDeTanda(t).reduce((s, x) => s + sumaTallas(x.recibidosT), 0)
export const tallerPorId = (datos, id) => (datos.talleres || []).find((x) => String(x.id) === String(id)) || null
export const telaPorId = (datos, id) => (datos.telas || []).find((x) => String(x.id) === String(id)) || null

// Tela: qué parte se usó (1 = toda) sumando las tandas que la usaron
export const usosDeTela = (tela, datos) =>
  (datos.tandas || []).flatMap((t) => coloresDeTanda(t).flatMap((c) => (c.telas || []).filter((u) => String(u.telaId) === String(tela.id)).map((u) => ({ tanda: t, fraccion: num(u.fraccion) }))))
export const fraccionUsada = (tela, datos) => Math.min(1, usosDeTela(tela, datos).reduce((s, u) => s + u.fraccion, 0))
export const telaDisponible = (tela, datos) => !tela.acabada && fraccionUsada(tela, datos) < 0.999

// Cuánto cuesta la parte de una tela usada en una tanda. Si la tela se acabó y sobró algo (se bota),
// ese sobrante se reparte entre las tandas que la usaron.
export const costoTelaUsada = (tela, fraccion, datos) => {
  const usado = fraccionUsada(tela, datos)
  return tela.acabada && usado > 0 ? (num(tela.costo) * fraccion) / usado : num(tela.costo) * fraccion
}

// Cada color de una tanda se comporta como un lote para el stock y el costo por polo
export function piezasDeTanda(t, datos) {
  const colores = coloresDeTanda(t)
  const totalRec = colores.reduce((s, x) => s + (sumaTallas(x.recibidosT) || sumaTallas(x.cortadosT)), 0)
  return colores.map((x, i) => {
    const rec = sumaTallas(x.recibidosT) || sumaTallas(x.cortadosT)
    const tela = (x.telas || []).reduce((s, u) => { const te = telaPorId(datos, u.telaId); return s + (te ? costoTelaUsada(te, num(u.fraccion), datos) : 0) }, 0)
    return {
      id: `T${t.id}-${i}`, tandaId: t.id, fecha: t.fechaRecojo || t.fecha, disenoId: t.disenoId,
      modelo: (disenoPorId(t.disenoId) || {}).cuello || '', color: x.color,
      paso: etapaTanda(t) >= 4 ? 5 : 0, recibidosT: x.recibidosT, recibidos: rec,
      tela, confeccion: num(t.precioTaller), otros: totalRec ? (num(t.otros) * rec) / totalRec : 0,
    }
  })
}
export const nombreTanda = (t) => `Tanda ${t.id}${nombreDiseno(t.disenoId) ? ' · ' + nombreDiseno(t.disenoId) : ''}`

// Tandas pendientes en cada taller, para el panel de Inicio
export function pendientesPorTaller(datos) {
  const hoyIso = hoy()
  return (datos.talleres || []).map((tl) => {
    const tandas = (datos.tandas || []).filter((t) => etapaTanda(t) === 2 && String(t.tallerId) === String(tl.id))
      .map((t) => ({
        tanda: t, polos: cortadosDeTanda(t), dias: diasEntre(t.fechaEnvio, hoyIso),
        atraso: t.fechaEstimada ? Math.max(0, diasEntre(t.fechaEstimada, hoyIso)) : 0,
        aPagar: cortadosDeTanda(t) * num(t.precioTaller),
      }))
      .sort((a, b) => b.dias - a.dias)
    const hechas = (datos.tandas || []).filter((t) => String(t.tallerId) === String(tl.id) && t.fechaEnvio && t.fechaRecojo)
    const promedio = hechas.length ? Math.round(hechas.reduce((s, t) => s + diasEntre(t.fechaEnvio, t.fechaRecojo), 0) / hechas.length) : null
    return {
      taller: tl, tandas, promedio,
      polos: tandas.reduce((s, x) => s + x.polos, 0),
      aPagar: tandas.reduce((s, x) => s + x.aPagar, 0),
    }
  })
}

// ---------- Stock ----------
// Un "producto" es diseño + color + talla. Si varios lotes tienen el mismo producto, su stock se suma.
// Al vender se descuenta primero del lote más antiguo, así el costo de cada venta sale de su lote real.
const baseDeLote = (l) => (l.disenoId ? 'd:' + l.disenoId : 'm:' + (l.modelo || ''))
const baseDeVenta = (v) => (v.disenoId ? 'd:' + v.disenoId : null)
const colorNorm = (c) => String(c || '').trim().toLowerCase()

// Polos que entraron a stock de un lote, por talla. Los lotes antiguos sin tallas usan '' (sin talla).
const unidadesLote = (l) => {
  if (etapaDe(l) < LISTO) return {}
  const t = leerTallas(l.recibidosT)
  return Object.keys(t).length ? t : { '': num(l.recibidos) }
}

const cacheInventario = new WeakMap()
export function inventario(datos) {
  if (cacheInventario.has(datos)) return cacheInventario.get(datos)
  const orden = (a, b) => (String(a.fecha) < String(b.fecha) ? -1 : String(a.fecha) > String(b.fecha) ? 1
    : String(a.id).localeCompare(String(b.id), undefined, { numeric: true }))
  // Lotes antiguos + cada color de las tandas ya empaquetadas
  const fuentes = [...datos.lotes, ...(datos.tandas || []).flatMap((t) => (etapaTanda(t) >= 4 ? piezasDeTanda(t, datos) : []))]
  const lotes = fuentes.filter((l) => etapaDe(l) >= LISTO).sort(orden)
  const restante = {}
  lotes.forEach((l) => { restante[l.id] = { ...unidadesLote(l) } })
  const costoVentas = new Map()

  const sacar = (l, talla, cantidad) => {
    const r = restante[l.id]
    const k = r[talla] !== undefined ? talla : r[''] !== undefined ? '' : talla
    const n = Math.min(cantidad, Math.max(0, r[k] || 0))
    r[k] = (r[k] || 0) - n
    return n
  }

  ;[...datos.ventas].sort(orden).forEach((v) => {
    let falta = num(v.cantidad)
    let costo = 0
    const viejo = !baseDeVenta(v) && datos.lotes.find((l) => String(l.id) === String(v.loteId))
    if (viejo) {
      // Venta anotada antes de los diseños: sale de su lote
      if (restante[viejo.id]) sacar(viejo, v.talla, falta)
      costo = falta * (costoPorPolo(viejo) || 0)
    } else {
      const candidatos = lotes.filter((l) => baseDeLote(l) === baseDeVenta(v) && colorNorm(l.color) === colorNorm(v.color))
      for (const l of candidatos) {
        if (!falta) break
        const n = sacar(l, v.talla, falta)
        costo += n * (costoPorPolo(l) || 0)
        falta -= n
      }
      // Si se vendió más de lo anotado, se usa el costo del último lote
      if (falta && candidatos.length) costo += falta * (costoPorPolo(candidatos[candidatos.length - 1]) || 0)
    }
    costoVentas.set(String(v.id), costo)
  })

  const res = { lotes, restante, costoVentas }
  cacheInventario.set(datos, res)
  return res
}

export const stockDeLote = (l, datos) => {
  const r = inventario(datos).restante[l.id]
  return r ? Object.values(r).reduce((s, n) => s + Math.max(0, n), 0) : 0
}
export const stockPorTallaDeLote = (l, datos) => inventario(datos).restante[l.id] || {}
export const stockDeTanda = (t, datos) => piezasDeTanda(t, datos).reduce((s, p) => s + stockDeLote(p, datos), 0)
export const vendidosDeLote = (l, datos) => (etapaDe(l) >= LISTO ? num(l.recibidos) - stockDeLote(l, datos) : 0)

// Productos con stock (diseño + color + talla), sumando todos sus lotes, del más antiguo al más nuevo
export function productos(datos) {
  const { lotes, restante } = inventario(datos)
  const mapa = new Map()
  lotes.forEach((l) => {
    Object.entries(restante[l.id]).forEach(([talla, n]) => {
      if (n <= 0) return
      const clave = `${baseDeLote(l)}|${colorNorm(l.color)}|${talla}`
      if (!mapa.has(clave)) {
        mapa.set(clave, {
          clave, base: baseDeLote(l), disenoId: l.disenoId || '', modelo: l.modelo || '',
          nombre: l.disenoId ? nombreDiseno(l.disenoId) : l.modelo || 'Polo', color: colorNorm(l.color), talla, quedan: 0, lotes: [],
        })
      }
      const p = mapa.get(clave)
      p.quedan += n
      p.lotes.push({ lote: l, quedan: n, costo: costoPorPolo(l) })
    })
  })
  return [...mapa.values()]
}

// Costo de vender `cantidad` de un producto, sacando del lote más antiguo primero
export function costoEstimado(producto, cantidad) {
  let falta = cantidad
  let costo = 0
  for (const x of producto.lotes) {
    const n = Math.min(falta, x.quedan)
    costo += n * (x.costo || 0)
    falta -= n
    if (!falta) break
  }
  if (falta && producto.lotes.length) costo += falta * (producto.lotes[producto.lotes.length - 1].costo || 0)
  return costo
}

export const nombreVenta = (v, lotes) => {
  if (v.disenoId) return `${nombreDiseno(v.disenoId) || 'Polo'} ${v.color || ''}`.trim()
  const l = lotes.find((x) => String(x.id) === String(v.loteId))
  return l ? nombreLote(l) : 'polo'
}

// Las fotos del lote se guardan como ids separados por comas
export const fotosDe = (l) => String((l && l.fotos) || '').split(',').map((x) => x.trim()).filter(Boolean)

export const totalVenta = (v) => num(v.cantidad) * num(v.precio)

export const costoVenta = (v, datos) => inventario(datos).costoVentas.get(String(v.id)) || 0

export const mesDe = (iso) => (iso || '').slice(0, 7) // "2026-10"

export function resumenMes(datos, mes) {
  const { ventas, gastos } = datos
  const vMes = ventas.filter((v) => mesDe(v.fecha) === mes)
  const gMes = gastos.filter((g) => mesDe(g.fecha) === mes)
  const vendido = vMes.reduce((s, v) => s + totalVenta(v), 0)
  const costoPolos = vMes.reduce((s, v) => s + costoVenta(v, datos), 0)
  const gastosMes = gMes.reduce((s, g) => s + num(g.monto), 0)
  return {
    vendido,
    costoPolos,
    gastos: gastosMes,
    gasto: costoPolos + gastosMes,
    meQuedo: vendido - costoPolos - gastosMes,
    polosVendidos: vMes.reduce((s, v) => s + num(v.cantidad), 0),
    ventas: vMes,
    listaGastos: gMes,
  }
}

export const porCobrar = (ventas) => ventas.filter((v) => !v.pagado)

// ---------- Pedidos y clientes ----------
export const CANALES = [
  { id: 'Gamarra', icono: '🏪' },
  { id: 'WhatsApp', icono: '💬' },
  { id: 'Facebook', icono: '📘' },
]
export const clientePorId = (datos, id) => (datos.clientes || []).find((c) => String(c.id) === String(id)) || null
export const nombreCliente = (v, datos) => {
  const c = v.clienteId ? clientePorId(datos, v.clienteId) : null
  return c ? c.nombre : v.cliente || ''
}
export const enlaceWhatsApp = (tel) => `https://wa.me/51${String(tel || '').replace(/\D/g, '').replace(/^51/, '')}`

// Una venta de varios productos son varias filas con el mismo pedidoId. Las ventas antiguas son un pedido cada una.
export function pedidos(ventas, datos) {
  const mapa = new Map()
  ventas.forEach((v) => {
    const id = v.pedidoId || 'v:' + v.id
    if (!mapa.has(id)) {
      mapa.set(id, { id, fecha: v.fecha, clienteId: v.clienteId || '', cliente: nombreCliente(v, datos), canal: v.canal || '', lineas: [] })
    }
    mapa.get(id).lineas.push(v)
  })
  return [...mapa.values()].map((p) => ({
    ...p,
    pagado: p.lineas.every((v) => v.pagado),
    cantidad: p.lineas.reduce((s, v) => s + num(v.cantidad), 0),
    total: p.lineas.reduce((s, v) => s + totalVenta(v), 0),
  })).sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)))
}
export const textoPedido = (p, lotes) =>
  p.lineas.map((v) => `${v.cantidad} ${nombreVenta(v, lotes)} ${v.talla}`).join(' · ')

export const stockTotal = (datos) => productos(datos).reduce((s, p) => s + p.quedan, 0)
