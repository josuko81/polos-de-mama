import React, { useState } from 'react'
import { CATEGORIAS, soles, hoy, mesDe, fechaCorta } from '../calc.js'
import BotonBorrar from './BotonBorrar.jsx'

export default function Gaste({ datos, guardar, borrar }) {
  const [concepto, setConcepto] = useState('')
  const [categoria, setCategoria] = useState('Pasajes')
  const [monto, setMonto] = useState('')
  const [fecha, setFecha] = useState(hoy())
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const mes = mesDe(hoy())
  const delMes = datos.gastos.filter((g) => mesDe(g.fecha) === mes).sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
  const totalMes = delMes.reduce((s, g) => s + Number(g.monto || 0), 0)

  const enviar = async () => {
    setError('')
    const m = Number(String(monto).replace(',', '.')) || 0
    if (!m) return setError('Escribe cuánto gastaste.')
    setGuardando(true)
    try {
      await guardar('gastos', { fecha, concepto: concepto.trim() || categoria, categoria, monto: m }, `Gasto guardado: ${soles(m)}`)
      setConcepto(''); setMonto('')
    } catch (e) {
      setError('No se pudo guardar. Revisa el internet y vuelve a intentar.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="row g-4">
      <div className="col-lg-7">
        <h1 className="fw-bold mb-1">🧾 Gasté</h1>
        <p className="fs-5 text-secondary mb-4">Lo que no es de un lote. Lo de tela, corte o taller va en «Mis lotes».</p>
        <div className="card border-0 shadow-sm"><div className="card-body p-4 d-flex flex-column gap-4">
          <div>
            <div className="fs-5 fw-bold mb-2">¿En qué?</div>
            <div className="d-flex flex-wrap gap-2">
              {CATEGORIAS.map((c) => (
                <button key={c} className={'btn btn-lg btn-outline-secondary opcion ' + (c === categoria ? 'active' : '')} onClick={() => setCategoria(c)}>{c}</button>
              ))}
            </div>
          </div>
          <div className="row g-3">
            <div className="col-md-6">
              <label htmlFor="monto" className="fs-5 fw-bold mb-2">¿Cuánto?</label>
              <div className="input-group input-group-lg">
                <span className="input-group-text">S/</span>
                <input id="monto" className="form-control fs-4" inputMode="decimal" placeholder="0.00" value={monto} onChange={(e) => setMonto(e.target.value)} />
              </div>
            </div>
            <div className="col-md-6">
              <label htmlFor="fechaG" className="fs-5 fw-bold mb-2">Fecha</label>
              <input id="fechaG" type="date" className="form-control form-control-lg" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>
            <div className="col-12">
              <label htmlFor="concepto" className="fw-bold mb-2">Detalle <span className="text-secondary fw-normal">(opcional)</span></label>
              <input id="concepto" className="form-control form-control-lg" placeholder="Ej: Pasaje a la feria" value={concepto} onChange={(e) => setConcepto(e.target.value)} />
            </div>
          </div>
          {error && <div className="alert alert-danger mb-0">{error}</div>}
          <button className="btn btn-marca btn-lg py-3 fs-4" disabled={guardando} onClick={enviar}>
            {guardando ? <><span className="spinner-border spinner-border-sm me-2" />Guardando…</> : 'Guardar gasto'}
          </button>
        </div></div>
      </div>

      <div className="col-lg-5">
        <div className="card border-0 shadow-sm"><div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-baseline mb-2">
            <span className="fs-5 fw-bold">Gastos de este mes</span>
            <span className="fs-5 fw-bold text-danger">{soles(totalMes)}</span>
          </div>
          {delMes.length === 0 && <div className="text-secondary">Aún no hay gastos este mes.</div>}
          <ul className="list-group list-group-flush">
            {delMes.map((g) => (
              <li key={g.id} className="list-group-item px-0 d-flex align-items-center gap-2">
                <div className="flex-grow-1">
                  <div>{g.concepto}</div>
                  <div className="small text-secondary">{fechaCorta(g.fecha)} · {g.categoria}</div>
                </div>
                <b className="text-nowrap">{soles(g.monto)}</b>
                <BotonBorrar onConfirmar={() => borrar('gastos', g.id, 'Gasto borrado')} />
              </li>
            ))}
          </ul>
        </div></div>
      </div>
    </div>
  )
}
