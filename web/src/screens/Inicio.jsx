import React from 'react'
import { resumenMes, porCobrar, stockPorLote, soles, totalVenta, hoy, mesDe, MESES, nombreLote, fechaCorta, etapaDe } from '../calc.js'

export default function Inicio({ datos, ir }) {
  const mes = mesDe(hoy())
  const r = resumenMes(datos, mes)
  const deben = porCobrar(datos.ventas).reduce((s, v) => s + totalVenta(v), 0)
  const stock = stockPorLote(datos).reduce((s, x) => s + x.quedan, 0)
  const enTaller = datos.lotes.filter((l) => etapaDe(l) === 2).length
  const nombreMes = MESES[Number(mes.slice(5, 7)) - 1]

  const ultimas = [
    ...datos.ventas.map((v) => {
      const l = datos.lotes.find((x) => String(x.id) === String(v.loteId))
      return { fecha: v.fecha, texto: `Vendí ${v.cantidad} ${l ? nombreLote(l) : ''} (${v.talla})`, monto: totalVenta(v), tipo: 'v' }
    }),
    ...datos.gastos.map((g) => ({ fecha: g.fecha, texto: g.concepto, monto: g.monto, tipo: 'g' })),
  ]
    .sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
    .slice(0, 5)

  const Boton = ({ color, icono, texto, sub, a }) => (
    <div className="col-md-6">
      <button className={`btn btn-${color} w-100 boton-grande shadow-sm d-flex align-items-center gap-3 px-4 text-start`} onClick={() => ir(a)}>
        <span className="icono">{icono}</span>
        <span>
          <span className="d-block fw-bold">{texto}</span>
          <span className="d-block fs-6 opacity-75">{sub}</span>
        </span>
      </button>
    </div>
  )

  return (
    <div className="row g-4">
      <div className="col-lg-8">
        <h1 className="fw-bold mb-1">Hola 👋</h1>
        <p className="fs-5 text-secondary mb-4">¿Qué quieres anotar?</p>
        <div className="row g-3">
          <Boton color="success" icono="💰" texto="Vendí" sub="Anotar una venta" a="vendi" />
          <Boton color="danger" icono="🧾" texto="Gasté" sub="Pasajes, luz, publicidad…" a="gaste" />
          <Boton color="warning" icono="🧵" texto="Mis lotes" sub="Tela, taller, recojo" a="lotes" />
          <Boton color="primary" icono="📊" texto="¿Cómo me va?" sub="Lo que me quedó este mes" a="resumen" />
        </div>
      </div>

      <div className="col-lg-4 d-flex flex-column gap-3">
        <div className="card border-0 shadow-sm text-bg-success">
          <div className="card-body">
            <div className="fw-bold opacity-75">En {nombreMes} me quedó</div>
            <div className="numero-grande">{soles(r.meQuedo)}</div>
            <div className="small opacity-75">Vendí {soles(r.vendido)}</div>
          </div>
        </div>
        <div className="row g-3">
          <div className="col-6">
            <div className="card border-0 shadow-sm h-100"><div className="card-body">
              <div className="small fw-bold text-secondary">Me deben</div>
              <div className="fs-4 fw-bold text-danger">{soles(deben)}</div>
            </div></div>
          </div>
          <div className="col-6">
            <div className="card border-0 shadow-sm h-100"><div className="card-body">
              <div className="small fw-bold text-secondary">Polos en stock</div>
              <div className="fs-4 fw-bold">{stock}</div>
              {enTaller > 0 && <div className="small text-warning-emphasis">{enTaller} lote{enTaller > 1 ? 's' : ''} en el taller</div>}
            </div></div>
          </div>
        </div>
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="fw-bold mb-2">Lo último que anoté</div>
            {ultimas.length === 0 && <div className="text-secondary">Todavía nada. Empieza con «Vendí» o «Mis lotes».</div>}
            <ul className="list-group list-group-flush">
              {ultimas.map((u, i) => (
                <li key={i} className="list-group-item px-0 d-flex justify-content-between gap-2">
                  <span className="text-truncate"><span className="text-secondary small me-2">{fechaCorta(u.fecha).slice(0, 5)}</span>{u.texto}</span>
                  <span className={'fw-bold text-nowrap ' + (u.tipo === 'v' ? 'text-success' : 'text-danger')}>
                    {u.tipo === 'v' ? '+' : '−'} {soles(u.monto)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
