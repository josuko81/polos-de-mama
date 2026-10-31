// Cálculos del cuaderno de mamá: los usan las tablas y el dashboard.
import { mesDe } from './calc.js'

export const CAT_MATERIAL = 'Compra de material'
export const numero = (v) => Number(String(v ?? '').replace(',', '.')) || 0

// Lo último anotado primero: reverse deja arriba lo más nuevo cuando la fecha es la misma
export const delMes = (lista, mes) => lista.filter((x) => mesDe(x.fecha) === mes).reverse().sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)))

// Las filas guardan totales; las anotadas antes de existir la cantidad cuentan como 1
export const cantidadDe = (x) => numero(x.cantidad) || 1

// Totales del mes: "Me quedó" no resta el material porque ya está en el costo de cada prenda
export function cuentasMes(datos, mes) {
  const ventas = delMes(datos.cuaderno || [], mes)
  const gastos = delMes(datos.gastos || [], mes)
  const vendido = ventas.reduce((s, x) => s + numero(x.venta), 0)
  const costo = ventas.reduce((s, x) => s + numero(x.costo), 0)
  const ganancia = vendido - costo
  const suma = (lista) => lista.reduce((s, g) => s + numero(g.monto), 0)
  const material = suma(gastos.filter((g) => g.categoria === CAT_MATERIAL))
  const mensual = suma(gastos.filter((g) => g.categoria !== CAT_MATERIAL))
  const polos = ventas.reduce((s, x) => s + cantidadDe(x), 0)
  // "Dinero del mes" sí resta el material: es la plata que entró menos la que salió
  return { vendido, costo, ganancia, material, mensual, polos, queda: ganancia - mensual, dinero: vendido - material - mensual }
}
