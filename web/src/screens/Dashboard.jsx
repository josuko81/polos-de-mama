import React from 'react'
import { soles, MESES } from '../calc.js'
import { numero, delMes, cantidadDe, cuentasMes } from '../cuaderno.js'
import { moverMes } from './Resumen.jsx'

// Dashboard del mes elegido, debajo de las tarjetas del Cuaderno.
// Los colores se asignan por dato y no cambian entre meses (validados con el script de dataviz).
const SERIE = {
  vendido: { nombre: 'Ventas', color: 'var(--serie-1)' },
  ganancia: { nombre: 'Ganancia', color: 'var(--serie-2)' },
  queda: { nombre: 'Me quedó', color: 'var(--serie-3)' },
  dinero: { nombre: 'Dinero del mes', color: 'var(--serie-4)' },
}
const MESES_GRAFICO = 6
const corto = (mes) => MESES[Number(mes.slice(5)) - 1].slice(0, 3)
const porcentaje = (parte, total) => (total ? Math.round((parte / total) * 100) : 0)

// Eje con números redondos que incluye el cero
function escala(valores) {
  const max = Math.max(0, ...valores)
  const min = Math.min(0, ...valores)
  const rango = max - min || 1
  const base = 10 ** Math.floor(Math.log10(rango))
  const paso = [1, 2, 5, 10].map((x) => x * base).find((x) => rango / x <= 4) || base * 10
  const tope = Math.ceil(max / paso) * paso || paso
  const piso = Math.floor(min / paso) * paso
  const marcas = []
  for (let v = piso; v <= tope + paso / 2; v += paso) marcas.push(v)
  return { tope, piso, marcas }
}

// Barras agrupadas por mes (hechas con HTML para adaptarse a cualquier ancho)
function BarrasPorMes({ titulo, filas, claves, mes }) {
  const { tope, piso, marcas } = escala(filas.flatMap((f) => claves.map((k) => f[k])))
  const y = (v) => ((tope - v) / (tope - piso)) * 100
  return (
    <div className="panel-dash h-100">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
        <h2 className="titulo-panel mb-0">{titulo}</h2>
        <div className="d-flex flex-wrap gap-3 small">
          {claves.map((k) => <span key={k} className="d-inline-flex align-items-center gap-1"><span className="leyenda-dash" style={{ background: SERIE[k].color }} />{SERIE[k].nombre}</span>)}
        </div>
      </div>
      <div className="plot-dash">
        {marcas.map((m) => (
          <div key={m} className={'marca-dash ' + (m === 0 ? 'marca-cero' : '')} style={{ top: `${y(m)}%` }}><span>{m.toLocaleString('es-PE')}</span></div>
        ))}
        <div className="columnas-dash">
          {filas.map((f) => (
            <div key={f.mes} className="columna-dash" tabIndex={0} aria-label={`${corto(f.mes)}: ${claves.map((k) => `${SERIE[k].nombre} ${soles(f[k])}`).join(', ')}`}>
              <div className="grupo-dash">
                {claves.map((k) => {
                  const positivo = f[k] >= 0
                  const arriba = y(positivo ? f[k] : 0)
                  const alto = Math.abs(y(f[k]) - y(0))
                  return <div key={k} className={'barra-dash ' + (positivo ? 'hacia-arriba' : 'hacia-abajo')} style={{ top: `${arriba}%`, height: `${alto}%`, background: SERIE[k].color }} />
                })}
              </div>
              <div className="tip-dash">
                <b>{MESES[Number(f.mes.slice(5)) - 1]}</b>
                {claves.map((k) => <div key={k}>{SERIE[k].nombre}: <b>{soles(f[k])}</b></div>)}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="etiquetas-dash">
        {filas.map((f) => <span key={f.mes} className={f.mes === mes ? 'fw-bold' : ''}>{corto(f.mes)}</span>)}
      </div>
      <details className="small mt-1">
        <summary className="text-secondary">Ver tabla</summary>
        <table className="table table-sm mb-0">
          <thead><tr><th>Mes</th>{claves.map((k) => <th key={k} className="text-end">{SERIE[k].nombre}</th>)}</tr></thead>
          <tbody>{filas.map((f) => <tr key={f.mes}><td>{corto(f.mes)}</td>{claves.map((k) => <td key={k} className="text-end text-nowrap">{soles(f[k])}</td>)}</tr>)}</tbody>
        </table>
      </details>
    </div>
  )
}

// Lista con barra de porcentaje: un solo dato, un solo color
function BarrasPorcentaje({ titulo, filas, vacio }) {
  const max = Math.max(...filas.map((f) => f.pct), 1)
  return (
    <div className="panel-dash h-100">
      <h2 className="titulo-panel mb-2">{titulo}</h2>
      {filas.length === 0 && <div className="text-secondary small py-3 text-center">{vacio}</div>}
      {filas.map((f) => (
        <div key={f.nombre} className="fila-pct">
          <div className="d-flex justify-content-between small gap-2">
            <span className="text-truncate">{f.nombre}</span>
            <span className="text-nowrap"><b>{f.pct}%</b> · {f.valor}</span>
          </div>
          <div className="pista-pct"><div className="relleno-pct" style={{ width: `${(f.pct / max) * 100}%` }} /></div>
        </div>
      ))}
    </div>
  )
}

function Indicador({ titulo, valor, detalle }) {
  return (
    <div className="col-6 col-lg-3">
      <div className="panel-dash h-100 py-1">
        <div className="text-secondary">{titulo}</div>
        <div className="d-flex flex-wrap align-items-baseline gap-2">
          <span className="fs-4 fw-bold">{valor}</span>
          {detalle && <span className="small text-secondary">{detalle}</span>}
        </div>
      </div>
    </div>
  )
}

// Agrupa las ventas del mes por lo que indique `clave` y calcula su parte del total
function partes(ventas, clave) {
  const grupos = {}
  ventas.forEach((x) => {
    const nombre = clave(x)
    if (!nombre) return
    grupos[nombre] = (grupos[nombre] || 0) + cantidadDe(x)
  })
  const total = Object.values(grupos).reduce((s, n) => s + n, 0)
  return Object.entries(grupos).sort((a, b) => b[1] - a[1]).slice(0, 3)
    .map(([nombre, n]) => ({ nombre, pct: porcentaje(n, total), valor: `${n} ${n === 1 ? 'polo' : 'polos'}` }))
}

export default function Dashboard({ datos, mes }) {
  const c = cuentasMes(datos, mes)
  const pasado = cuentasMes(datos, moverMes(mes, -1))
  const filas = []
  for (let i = MESES_GRAFICO - 1, m = mes; i >= 0; i--) {
    filas.unshift({ mes: m, ...cuentasMes(datos, m) })
    m = moverMes(m, -1)
  }
  const ventas = delMes(datos.cuaderno || [], mes)
  const cambio = pasado.vendido ? `${c.vendido >= pasado.vendido ? '▲' : '▼'} ${Math.abs(porcentaje(c.vendido - pasado.vendido, pasado.vendido))}% que ${MESES[Number(moverMes(mes, -1).slice(5)) - 1]}` : 'Sin ventas el mes pasado'
  // ¿A dónde se fue lo vendido? Solo tiene sentido si hubo ventas
  const reparto = c.vendido ? [
    { nombre: 'Costo de las prendas', pct: porcentaje(c.costo, c.vendido), valor: soles(c.costo) },
    { nombre: 'Gastos del mes', pct: porcentaje(c.mensual, c.vendido), valor: soles(c.mensual) },
    { nombre: 'Me quedó', pct: Math.max(0, porcentaje(c.queda, c.vendido)), valor: soles(c.queda) },
  ] : []

  return (
    <div className="dashboard mt-3">
      <div className="row g-2 mb-2">
        <Indicador titulo="De lo vendido, ganas" valor={`${porcentaje(c.ganancia, c.vendido)}%`} />
        <Indicador titulo="Ganas por cada polo" valor={soles(c.polos ? c.ganancia / c.polos : 0)} />
        <Indicador titulo="Polos vendidos" valor={c.polos} detalle={cambio} />
        <Indicador titulo="De lo vendido, va a gastos" valor={`${porcentaje(c.mensual, c.vendido)}%`} />
      </div>
      <div className="row g-2 mb-2">
        <div className="col-lg-6"><BarrasPorMes titulo="Ventas y ganancia por mes (S/)" filas={filas} claves={['vendido', 'ganancia']} mes={mes} /></div>
        <div className="col-lg-6"><BarrasPorMes titulo="Me quedó y dinero del mes (S/)" filas={filas} claves={['queda', 'dinero']} mes={mes} /></div>
      </div>
      <div className="row g-2">
        <div className="col-md-4"><BarrasPorcentaje titulo="¿A dónde se fue lo vendido?" filas={reparto} vacio="Sin ventas este mes." /></div>
        <div className="col-md-4"><BarrasPorcentaje titulo="Lo más vendido" filas={partes(ventas, (x) => x.prenda)} vacio="Sin ventas este mes." /></div>
        <div className="col-md-4"><BarrasPorcentaje titulo="Ventas por talla" filas={partes(ventas, (x) => x.talla)} vacio="Sin tallas anotadas este mes." /></div>
      </div>
    </div>
  )
}
