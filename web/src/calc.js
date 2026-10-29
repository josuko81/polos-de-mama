// Cálculos del negocio. Todo lo que la app "sabe" sale de aquí.

export const PASOS = [
  { n: 1, titulo: 'Compré la tela', estado: 'Tela comprada' },
  { n: 2, titulo: 'Lo corté', estado: 'Cortado' },
  { n: 3, titulo: 'Lo mandé al taller', estado: 'En el taller' },
  { n: 4, titulo: 'Lo recogí', estado: 'Recogido' },
  { n: 5, titulo: 'Etiquetado y listo', estado: 'Listo para vender' },
]

export const TALLAS = ['S', 'M', 'L', 'XL', 'XXL']
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

export const estadoLote = (l) => (num(l.paso) > 0 ? PASOS[num(l.paso) - 1].estado : 'Nuevo')

// Costo total del lote: tela + corte + confección por polo × polos + etiquetas + pasajes y otros
export const costoTotalLote = (l) =>
  num(l.tela) + num(l.corte) + num(l.confeccion) * (num(l.recibidos) || num(l.enviados)) + num(l.etiquetas) + num(l.otros)

// Costo por polo: solo se sabe cuando ya llegaron los polos del taller
export const costoPorPolo = (l) => (num(l.recibidos) > 0 ? costoTotalLote(l) / num(l.recibidos) : null)

export const vendidosDeLote = (loteId, ventas) =>
  ventas.filter((v) => String(v.loteId) === String(loteId)).reduce((s, v) => s + num(v.cantidad), 0)

export const stockDeLote = (l, ventas) => (num(l.paso) >= 4 ? num(l.recibidos) - vendidosDeLote(l.id, ventas) : 0)

export const nombreLote = (l) => [l.modelo, l.color].filter(Boolean).join(' ')

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
    .filter((l) => num(l.paso) >= 4)
    .map((l) => ({ lote: l, quedan: stockDeLote(l, datos.ventas), costo: costoPorPolo(l) }))
}
