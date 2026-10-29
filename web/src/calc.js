// Cálculos del negocio. Todo lo que la app "sabe" sale de aquí.

// Etapas del lote. En la hoja, la columna "paso" sigue usando la escala antigua de 1 a 5
// (`valor`), así los lotes anotados antes de este cambio caen solos en su etapa.
export const PASOS = [
  { n: 1, titulo: 'Compré la tela', estado: 'Tela comprada', icono: '🧶', color: 'info', valor: 1 },
  { n: 2, titulo: 'Corté y mandé al taller', estado: 'En el taller', icono: '✂️', color: 'warning', valor: 3 },
  { n: 3, titulo: 'Recogí del taller', estado: 'Listo para vender', icono: '✅', color: 'success', valor: 5 },
]

// Etapa (0 a 3) según el paso guardado: 1-2 → tela comprada, 3 → en el taller, 4-5 → listo
export const etapaDe = (l) => {
  const p = Number(l && l.paso) || 0
  return p >= 4 ? 3 : p >= 3 ? 2 : p >= 1 ? 1 : 0
}

export const TALLAS = ['M', 'Estándar', 'L']
// Precio por mayor según la talla (se puede cambiar al anotar la venta)
export const PRECIOS = { M: 14, 'Estándar': 14, L: 16 }

export const MODELOS = ['Cuello redondo', 'Cuello V']

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

// Costo por polo: solo se sabe cuando ya llegaron los polos del taller
export const costoPorPolo = (l) => (num(l.recibidos) > 0 ? costoTotalLote(l) / num(l.recibidos) : null)

export const vendidosDeLote = (loteId, ventas) =>
  ventas.filter((v) => String(v.loteId) === String(loteId)).reduce((s, v) => s + num(v.cantidad), 0)

export const stockDeLote = (l, ventas) => (etapaDe(l) >= 3 ? num(l.recibidos) - vendidosDeLote(l.id, ventas) : 0)

export const nombreLote = (l) => [l.modelo, l.color].filter(Boolean).join(' ')

// Las fotos del lote se guardan como ids separados por comas
export const fotosDe = (l) => String((l && l.fotos) || '').split(',').map((x) => x.trim()).filter(Boolean)

export const totalVenta = (v) => num(v.cantidad) * num(v.precio)

export const costoVenta = (v, lotes) => {
  const l = lotes.find((x) => String(x.id) === String(v.loteId))
  return l ? num(v.cantidad) * (costoPorPolo(l) || 0) : 0
}

export const mesDe = (iso) => (iso || '').slice(0, 7) // "2026-10"

export function resumenMes(datos, mes) {
  const { lotes, ventas, gastos } = datos
  const vMes = ventas.filter((v) => mesDe(v.fecha) === mes)
  const gMes = gastos.filter((g) => mesDe(g.fecha) === mes)
  const vendido = vMes.reduce((s, v) => s + totalVenta(v), 0)
  const costoPolos = vMes.reduce((s, v) => s + costoVenta(v, lotes), 0)
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

export function stockPorLote(datos) {
  return datos.lotes
    .filter((l) => etapaDe(l) >= 3)
    .map((l) => ({ lote: l, quedan: stockDeLote(l, datos.ventas), costo: costoPorPolo(l) }))
}
