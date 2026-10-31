import React, { useState } from 'react'
import { soles, hoy, mesDe, fechaCorta, MESES } from '../calc.js'
import { moverMes } from './Resumen.jsx'
import BotonBorrar from './BotonBorrar.jsx'

// Las 3 tablas del cuaderno de mamá, con sus mismas columnas, y el resumen del mes.
export const CAT_MATERIAL = 'Compra de material'
const numero = (v) => Number(String(v ?? '').replace(',', '.')) || 0
const delMes = (lista, mes) => lista.filter((x) => mesDe(x.fecha) === mes).sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)))
const nombreMes = (mes) => `${MESES[Number(mes.slice(5)) - 1]} ${mes.slice(0, 4)}`

function Encabezado({ titulo, mes, setMes }) {
  return (
    <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
      <h1 className="fw-bold mb-0">{titulo}</h1>
      <div className="btn-group btn-group-lg shadow-sm">
        <button className="btn btn-light border" aria-label="Mes anterior" onClick={() => setMes(moverMes(mes, -1))}>‹</button>
        <span className="btn btn-light border fw-bold px-4" style={{ minWidth: '13rem' }}>{nombreMes(mes)}</span>
        <button className="btn btn-light border" aria-label="Mes siguiente" onClick={() => setMes(moverMes(mes, 1))}>›</button>
      </div>
    </div>
  )
}

function Soles({ id, etiqueta, valor, onCambio }) {
  return (
    <>
      <label htmlFor={id} className="fw-bold mb-1">{etiqueta}</label>
      <div className="input-group input-group-lg">
        <span className="input-group-text">S/</span>
        <input id={id} className="form-control" inputMode="decimal" placeholder="0.00" value={valor} onChange={(e) => onCambio(e.target.value)} />
      </div>
    </>
  )
}

// Tabla 1: Fecha | Prenda | Costo | Venta | Ganancia
export function VentasCuaderno({ datos, guardar, borrar, mesFijo }) {
  const [mesPropio, setMes] = useState(mesDe(hoy()))
  const mes = mesFijo || mesPropio
  const [form, setForm] = useState({ fecha: hoy(), prenda: '', costo: '', venta: '' })
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const filas = delMes(datos.cuaderno || [], mes)
  const cambiar = (k) => (v) => setForm((f) => ({ ...f, [k]: v }))

  const anotar = async () => {
    setError('')
    if (!form.prenda.trim()) return setError('Escribe la prenda.')
    if (!numero(form.venta)) return setError('Escribe la venta.')
    setGuardando(true)
    try {
      await guardar('cuaderno', { fecha: form.fecha, prenda: form.prenda.trim(), costo: numero(form.costo), venta: numero(form.venta) }, 'Venta anotada')
      setForm((f) => ({ ...f, prenda: '', costo: '', venta: '' }))
    } catch (e) {
      setError('No se pudo guardar. Revisa el internet y vuelve a intentar.')
    } finally {
      setGuardando(false)
    }
  }

  const costo = filas.reduce((s, x) => s + numero(x.costo), 0)
  const venta = filas.reduce((s, x) => s + numero(x.venta), 0)
  return (
    <>
      {mesFijo ? <h2 className="fw-bold fs-3 mb-3">1. Ventas</h2> : <Encabezado titulo="💰 Ventas" mes={mes} setMes={setMes} />}
      <div className="card border-0 shadow-sm mb-4"><div className="card-body p-4">
        <div className="row g-3 align-items-end">
          <div className="col-md-2">
            <label htmlFor="v-fecha" className="fw-bold mb-1">Fecha</label>
            <input id="v-fecha" type="date" className="form-control form-control-lg" value={form.fecha} onChange={(e) => cambiar('fecha')(e.target.value)} />
          </div>
          <div className="col-md-4">
            <label htmlFor="v-prenda" className="fw-bold mb-1">Prenda</label>
            <input id="v-prenda" className="form-control form-control-lg" placeholder="Ej: 12 polos Clásico M" value={form.prenda} onChange={(e) => cambiar('prenda')(e.target.value)} />
          </div>
          <div className="col-6 col-md-2"><Soles id="v-costo" etiqueta="Costo" valor={form.costo} onCambio={cambiar('costo')} /></div>
          <div className="col-6 col-md-2"><Soles id="v-venta" etiqueta="Venta" valor={form.venta} onCambio={cambiar('venta')} /></div>
          <div className="col-md-2">
            <div className="small text-secondary">Ganancia: <b>{soles(numero(form.venta) - numero(form.costo))}</b></div>
            <button className="btn btn-marca btn-lg w-100" disabled={guardando} onClick={anotar}>{guardando ? 'Guardando…' : 'Anotar'}</button>
          </div>
        </div>
        {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}
      </div></div>

      <div className="card border-0 shadow-sm"><div className="card-body p-3 p-md-4 table-responsive">
        <table className="table align-middle mb-0">
          <thead><tr><th>Fecha</th><th>Prenda</th><th className="text-end">Costo</th><th className="text-end">Venta</th><th className="text-end">Ganancia</th><th /></tr></thead>
          <tbody>
            {filas.length === 0 && <tr><td colSpan={6} className="text-secondary text-center py-4">No hay ventas en este mes.</td></tr>}
            {filas.map((x) => (
              <tr key={x.id}>
                <td className="text-nowrap">{fechaCorta(x.fecha)}</td>
                <td>{x.prenda}</td>
                <td className="text-end text-nowrap">{soles(x.costo)}</td>
                <td className="text-end text-nowrap">{soles(x.venta)}</td>
                <td className="text-end text-nowrap fw-bold text-success">{soles(numero(x.venta) - numero(x.costo))}</td>
                <td className="text-end"><BotonBorrar onConfirmar={() => borrar('cuaderno', x.id, 'Venta borrada')} /></td>
              </tr>
            ))}
          </tbody>
          {filas.length > 0 && (
            <tfoot><tr className="fw-bold"><td colSpan={2}>Total</td><td className="text-end text-nowrap">{soles(costo)}</td><td className="text-end text-nowrap">{soles(venta)}</td><td className="text-end text-nowrap text-success">{soles(venta - costo)}</td><td /></tr></tfoot>
          )}
        </table>
      </div></div>
    </>
  )
}

// Tablas 2 y 3: Fecha | Compras material | Costo y Fecha | Gasto mensual | Total
export function GastosCuaderno({ datos, guardar, borrar, material, mesFijo }) {
  const [mesPropio, setMes] = useState(mesDe(hoy()))
  const mes = mesFijo || mesPropio
  const pre = material ? 'm' : 'g' // las dos tablas pueden estar en la misma página
  const [form, setForm] = useState({ fecha: hoy(), concepto: '', monto: '' })
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const filas = delMes((datos.gastos || []).filter((g) => (g.categoria === CAT_MATERIAL) === material), mes)
  const columna = material ? 'Compras material' : 'Gasto mensual'
  const columnaMonto = material ? 'Costo' : 'Total'

  const anotar = async () => {
    setError('')
    if (!form.concepto.trim()) return setError(`Escribe ${material ? 'qué material compraste' : 'el gasto'}.`)
    if (!numero(form.monto)) return setError(`Escribe ${material ? 'el costo' : 'el total'}.`)
    setGuardando(true)
    try {
      await guardar('gastos', { fecha: form.fecha, concepto: form.concepto.trim(), categoria: material ? CAT_MATERIAL : 'Gasto mensual', monto: numero(form.monto) }, 'Anotado')
      setForm((f) => ({ ...f, concepto: '', monto: '' }))
    } catch (e) {
      setError('No se pudo guardar. Revisa el internet y vuelve a intentar.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <>
      {mesFijo
        ? <h2 className="fw-bold fs-3 mb-3 mt-5">{material ? '2. Gastos del mes: compra de material' : '3. Gasto mensual'}</h2>
        : <Encabezado titulo={material ? '🧵 Compra de material' : '🧾 Gastos del mes'} mes={mes} setMes={setMes} />}
      <div className="card border-0 shadow-sm mb-4"><div className="card-body p-4">
        <div className="row g-3 align-items-end">
          <div className="col-md-3">
            <label htmlFor={`${pre}-fecha`} className="fw-bold mb-1">Fecha</label>
            <input id={`${pre}-fecha`} type="date" className="form-control form-control-lg" value={form.fecha} onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))} />
          </div>
          <div className="col-md-4">
            <label htmlFor={`${pre}-concepto`} className="fw-bold mb-1">{columna}</label>
            <input id={`${pre}-concepto`} className="form-control form-control-lg" placeholder={material ? 'Ej: Tela negra' : 'Ej: Luz'} value={form.concepto} onChange={(e) => setForm((f) => ({ ...f, concepto: e.target.value }))} />
          </div>
          <div className="col-md-3"><Soles id={`${pre}-monto`} etiqueta={columnaMonto} valor={form.monto} onCambio={(v) => setForm((f) => ({ ...f, monto: v }))} /></div>
          <div className="col-md-2"><button className="btn btn-marca btn-lg w-100" disabled={guardando} onClick={anotar}>{guardando ? 'Guardando…' : 'Anotar'}</button></div>
        </div>
        {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}
      </div></div>

      <div className="card border-0 shadow-sm"><div className="card-body p-3 p-md-4 table-responsive">
        <table className="table align-middle mb-0">
          <thead><tr><th>Fecha</th><th>{columna}</th><th className="text-end">{columnaMonto}</th><th /></tr></thead>
          <tbody>
            {filas.length === 0 && <tr><td colSpan={4} className="text-secondary text-center py-4">No hay nada anotado en este mes.</td></tr>}
            {filas.map((g) => (
              <tr key={g.id}>
                <td className="text-nowrap">{fechaCorta(g.fecha)}</td>
                <td>{g.concepto}</td>
                <td className="text-end text-nowrap">{soles(g.monto)}</td>
                <td className="text-end"><BotonBorrar onConfirmar={() => borrar('gastos', g.id, 'Borrado')} /></td>
              </tr>
            ))}
          </tbody>
          {filas.length > 0 && (
            <tfoot><tr className="fw-bold"><td colSpan={2}>Total</td><td className="text-end text-nowrap">{soles(filas.reduce((s, g) => s + numero(g.monto), 0))}</td><td /></tr></tfoot>
          )}
        </table>
      </div></div>
    </>
  )
}

// El cuaderno completo: las 3 tablas en una sola página, del mismo mes
export default function Cuaderno(props) {
  const [mes, setMes] = useState(mesDe(hoy()))
  return (
    <>
      <Encabezado titulo="📒 Cuaderno" mes={mes} setMes={setMes} />
      <VentasCuaderno {...props} mesFijo={mes} />
      <GastosCuaderno {...props} material mesFijo={mes} />
      <GastosCuaderno {...props} material={false} mesFijo={mes} />
    </>
  )
}

// Resumen del mes con los totales de las 3 tablas
export function ResumenCuaderno({ datos }) {
  const [mes, setMes] = useState(mesDe(hoy()))
  const ventas = delMes(datos.cuaderno || [], mes)
  const gastos = delMes(datos.gastos || [], mes)
  const vendido = ventas.reduce((s, x) => s + numero(x.venta), 0)
  const ganancia = vendido - ventas.reduce((s, x) => s + numero(x.costo), 0)
  const material = gastos.filter((g) => g.categoria === CAT_MATERIAL).reduce((s, g) => s + numero(g.monto), 0)
  const mensual = gastos.filter((g) => g.categoria !== CAT_MATERIAL).reduce((s, g) => s + numero(g.monto), 0)
  const fila = (texto, valor, clase = '') => (
    <div className={'d-flex justify-content-between py-2 border-bottom fs-5 ' + clase}><span>{texto}</span><b>{soles(valor)}</b></div>
  )
  return (
    <>
      <Encabezado titulo="📊 Resumen" mes={mes} setMes={setMes} />
      <div className="card border-0 shadow-sm" style={{ maxWidth: '36rem' }}><div className="card-body p-4">
        {fila('Vendí', vendido)}
        {fila('Ganancia de las prendas', ganancia, 'text-success')}
        {fila('Compra de material', material)}
        {fila('Gastos del mes', mensual)}
        <div className="d-flex justify-content-between pt-3"><span className="fs-4 fw-bold">Me quedó</span><span className="fs-3 fw-bold text-success">{soles(ganancia - mensual)}</span></div>
        <div className="small text-secondary">Ganancia de las prendas menos gastos del mes. La compra de material no se resta porque ya está en el costo de cada prenda.</div>
      </div></div>
    </>
  )
}
