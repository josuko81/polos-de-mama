import React, { useState } from 'react'
import { resumenMes, porCobrar, productos, soles, totalVenta, hoy, mesDe, MESES, nombreLote, nombreVenta, fechaCorta, etapaDe, LISTO, TALLAS,
  etapaTanda, nombreTanda, coloresDeTanda, cortadosDeTanda, recibidosDeTanda } from '../calc.js'
import Muestra from './Muestra.jsx'
import BotonBorrar from './BotonBorrar.jsx'

const moverMes = (mes, d) => {
  let [y, m] = mes.split('-').map(Number)
  m += d
  if (m < 1) { m = 12; y-- }
  if (m > 12) { m = 1; y++ }
  return `${y}-${String(m).padStart(2, '0')}`
}

export default function Resumen({ datos, guardar, borrar }) {
  const [mes, setMes] = useState(mesDe(hoy()))
  const r = resumenMes(datos, mes)
  const deben = porCobrar(datos.ventas)
  // Stock sumado por diseño + color + talla, ordenado para leerlo fácil
  const orden = (t) => (TALLAS.indexOf(t) < 0 ? 99 : TALLAS.indexOf(t))
  const stock = productos(datos).sort((a, b) => a.nombre.localeCompare(b.nombre) || a.color.localeCompare(b.color) || orden(a.talla) - orden(b.talla))
  const enTaller = datos.lotes.filter((l) => etapaDe(l) > 0 && etapaDe(l) < LISTO)
  const titulo = `${MESES[Number(mes.slice(5)) - 1]} ${mes.slice(0, 4)}`

  const historial = [
    ...r.ventas.map((v) => ({ ...v, tipo: 'ventas', texto: `${v.cantidad} × ${nombreVenta(v, datos.lotes)} (${v.talla})`, monto: totalVenta(v) })),
    ...r.listaGastos.map((g) => ({ ...g, tipo: 'gastos', texto: g.concepto, monto: g.monto })),
  ].sort((a, b) => (a.fecha < b.fecha ? 1 : -1))

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <h1 className="fw-bold mb-0">📊 ¿Cómo me va?</h1>
        <div className="btn-group btn-group-lg shadow-sm">
          <button className="btn btn-light border" onClick={() => setMes(moverMes(mes, -1))}>‹</button>
          <span className="btn btn-light border fw-bold px-4" style={{ minWidth: '13rem' }}>{titulo}</span>
          <button className="btn btn-light border" onClick={() => setMes(moverMes(mes, 1))}>›</button>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100"><div className="card-body p-4">
            <div className="fw-bold text-secondary">Vendí</div>
            <div className="numero-grande">{soles(r.vendido)}</div>
            <div className="text-secondary">{r.polosVendidos} polos</div>
          </div></div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100"><div className="card-body p-4">
            <div className="fw-bold text-secondary">Me costó</div>
            <div className="numero-grande text-danger">{soles(r.gasto)}</div>
            <div className="text-secondary small">Polos vendidos {soles(r.costoPolos)} + gastos {soles(r.gastos)}</div>
          </div></div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow h-100 text-bg-success"><div className="card-body p-4">
            <div className="fw-bold opacity-75">Me quedó</div>
            <div className="numero-grande">{soles(r.meQuedo)}</div>
            <div className="small opacity-75">Lo que ganaste de verdad este mes</div>
          </div></div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-6 d-flex flex-column gap-4">
          <div className="card border-0 shadow-sm"><div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-baseline mb-2">
              <span className="fs-5 fw-bold">Me deben</span>
              <span className="fs-5 fw-bold text-danger">{soles(deben.reduce((s, v) => s + totalVenta(v), 0))}</span>
            </div>
            {deben.length === 0 && <div className="text-secondary">Nadie te debe. 👍</div>}
            <ul className="list-group list-group-flush">
              {deben.map((v) => (
                <li key={v.id} className="list-group-item px-0 d-flex align-items-center gap-2">
                  <div className="flex-grow-1">
                    <div className="fw-bold">{v.cliente || 'Sin nombre'}</div>
                    <div className="small text-secondary">{fechaCorta(v.fecha)} · {v.cantidad} polos</div>
                  </div>
                  <b className="text-nowrap">{soles(totalVenta(v))}</b>
                  <button className="btn btn-success btn-sm" onClick={() => guardar('ventas', { id: v.id, pagado: true }, 'Marcado como pagado')}>Ya me pagó</button>
                </li>
              ))}
            </ul>
          </div></div>

          <div className="card border-0 shadow-sm"><div className="card-body p-4">
            <div className="fs-5 fw-bold mb-2">Me quedan</div>
            <table className="table align-middle mb-0">
              <tbody>
                {stock.map((s) => (
                  <tr key={s.clave}>
                    <td><span className="d-inline-flex align-items-center gap-2"><Muestra color={s.color} />{s.nombre} {s.color}</span>
                      {s.talla && <span className="badge text-bg-light border ms-2">{s.talla}</span>}</td>
                    <td className="text-end fw-bold fs-5">{s.quedan}</td>
                  </tr>
                ))}
                {enTaller.map((l) => (
                  <tr key={'t' + l.id}>
                    <td>{nombreLote(l)} <span className="small text-secondary">· lote {l.id}</span></td>
                    <td className="text-end">{etapaDe(l) === 3
                      ? <span className="badge text-bg-primary">empaquetando ({l.recibidos || '?'})</span>
                      : <span className="badge text-bg-warning">en camino ({l.enviados || '?'})</span>}</td>
                  </tr>
                ))}
                {(datos.tandas || []).filter((t) => etapaTanda(t) < 4).map((t) => (
                  <tr key={'tanda' + t.id}>
                    <td>{nombreTanda(t)} <span className="small text-secondary">· {coloresDeTanda(t).length} colores</span></td>
                    <td className="text-end">{etapaTanda(t) === 3
                      ? <span className="badge text-bg-primary">empaquetando ({recibidosDeTanda(t)})</span>
                      : <span className="badge text-bg-warning">{etapaTanda(t) === 1 ? 'estampando' : 'en el taller'} ({cortadosDeTanda(t)})</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div></div>
        </div>

        <div className="col-lg-6">
          <div className="card border-0 shadow-sm"><div className="card-body p-4">
            <div className="fs-5 fw-bold mb-2">Lo anotado en {titulo}</div>
            {historial.length === 0 && <div className="text-secondary">No hay nada anotado este mes.</div>}
            <ul className="list-group list-group-flush">
              {historial.map((h) => (
                <li key={h.tipo + h.id} className="list-group-item px-0 d-flex align-items-center gap-2">
                  <span className="small text-secondary" style={{ width: '3.2rem' }}>{fechaCorta(h.fecha).slice(0, 5)}</span>
                  <span className="flex-grow-1">{h.texto}</span>
                  <b className={'text-nowrap ' + (h.tipo === 'ventas' ? 'text-success' : 'text-danger')}>
                    {h.tipo === 'ventas' ? '+' : '−'} {soles(h.monto)}
                  </b>
                  <BotonBorrar onConfirmar={() => borrar(h.tipo, h.id, h.tipo === 'ventas' ? 'Venta borrada' : 'Gasto borrado')} />
                </li>
              ))}
            </ul>
          </div></div>
        </div>
      </div>
    </>
  )
}
