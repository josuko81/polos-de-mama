import React from 'react'
import { PASOS, estadoLote, nombreLote, costoTotalLote, costoPorPolo, stockDeLote, soles, fechaCorta } from '../calc.js'

export default function Lotes({ datos, ir }) {
  const lotes = [...datos.lotes].sort((a, b) => Number(b.id) - Number(a.id))
  const color = (paso) => (paso >= 5 ? 'success' : paso === 3 ? 'warning' : paso === 4 ? 'info' : 'secondary')

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="fw-bold mb-1">🧵 Mis lotes</h1>
          <p className="fs-5 text-secondary mb-0">Un lote es una tanda de tela que mandas a hacer.</p>
        </div>
        <button className="btn btn-warning btn-lg fw-bold px-4 py-3" onClick={() => ir('lote', 'nuevo')}>＋ Nuevo lote (compré tela)</button>
      </div>

      {lotes.length === 0 && (
        <div className="card border-0 shadow-sm"><div className="card-body p-5 text-center fs-5 text-secondary">
          Aún no tienes lotes. Cuando compres tela, toca «Nuevo lote».
        </div></div>
      )}

      <div className="row g-3">
        {lotes.map((l) => {
          const paso = Number(l.paso) || 0
          const cu = costoPorPolo(l)
          return (
            <div className="col-md-6 col-xl-4" key={l.id}>
              <div className="card border-0 shadow-sm h-100 cursor-pointer" onClick={() => ir('lote', l.id)}>
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <div className="small text-secondary">Lote {l.id} · {fechaCorta(l.fecha)}</div>
                      <div className="fs-4 fw-bold">{nombreLote(l)}</div>
                    </div>
                    <span className={`badge text-bg-${color(paso)} fs-6`}>{estadoLote(l)}</span>
                  </div>
                  <div className="progress mb-3" style={{ height: '0.75rem' }}>
                    <div className={`progress-bar bg-${color(paso)}`} style={{ width: `${(paso / PASOS.length) * 100}%` }} />
                  </div>
                  <div className="d-flex justify-content-between"><span className="text-secondary">Gastado en el lote</span><b>{soles(costoTotalLote(l))}</b></div>
                  {cu !== null && <div className="d-flex justify-content-between"><span className="text-secondary">Cada polo cuesta</span><b>{soles(cu)}</b></div>}
                  {paso >= 4 && <div className="d-flex justify-content-between"><span className="text-secondary">Quedan</span><b>{stockDeLote(l, datos.ventas)} de {l.recibidos}</b></div>}
                  {paso < 4 && l.enviados > 0 && <div className="d-flex justify-content-between"><span className="text-secondary">Polos en el taller</span><b>{l.enviados}</b></div>}
                  {paso < 5 && <div className="mt-3 text-primary fw-bold">Siguiente: {PASOS[paso].titulo} →</div>}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
