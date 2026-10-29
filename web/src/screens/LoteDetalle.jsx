import React, { useEffect, useState } from 'react'
import { PASOS, nombreLote, costoTotalLote, costoPorPolo, stockDeLote, vendidosDeLote, soles, hoy, fechaCorta } from '../calc.js'
import BotonBorrar from './BotonBorrar.jsx'

// Qué se pregunta en cada paso
const CAMPOS = {
  1: [
    { k: 'modelo', label: 'Modelo del polo', tipo: 'texto', ph: 'Ej: Cuello redondo' },
    { k: 'color', label: 'Color', tipo: 'texto', ph: 'Ej: negro' },
    { k: 'tela', label: '¿Cuánto pagaste por la tela?', tipo: 'soles' },
    { k: 'fecha', label: 'Fecha de compra', tipo: 'fecha' },
  ],
  2: [{ k: 'corte', label: '¿Cuánto pagaste por el corte?', tipo: 'soles', ayuda: 'Si lo cortaste tú, pon 0.' }],
  3: [
    { k: 'enviados', label: '¿Cuántos polos mandaste a confeccionar?', tipo: 'numero' },
    { k: 'confeccion', label: '¿Cuánto cobra el taller por cada polo?', tipo: 'soles' },
  ],
  4: [
    { k: 'recibidos', label: '¿Cuántos polos recogiste?', tipo: 'numero', ayuda: 'Si llegaron menos o algunos con falla, pon solo los buenos.' },
    { k: 'otros', label: 'Pasajes u otros gastos del lote', tipo: 'soles' },
  ],
  5: [{ k: 'etiquetas', label: '¿Cuánto gastaste en etiquetas y bolsas?', tipo: 'soles' }],
}

export default function LoteDetalle({ datos, loteId, guardar, borrar, ir }) {
  const esNuevo = loteId === 'nuevo'
  const lote = esNuevo ? { paso: 0, fecha: hoy() } : datos.lotes.find((l) => String(l.id) === String(loteId))
  const paso = Number(lote && lote.paso) || 0
  const [elegido, setElegido] = useState(Math.min(paso + 1, 5))
  const [form, setForm] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!lote) return
    const f = {}
    CAMPOS[elegido].forEach((c) => { f[c.k] = lote[c.k] === undefined || lote[c.k] === 0 && elegido > paso ? '' : lote[c.k] })
    if (elegido === 4 && (f.recibidos === '' || f.recibidos === undefined) && lote.enviados) f.recibidos = lote.enviados
    if (elegido === 1 && !f.fecha) f.fecha = hoy()
    setForm(f)
    setError('')
  }, [elegido, loteId, paso])

  if (!lote) return <div className="alert alert-warning">No encontré ese lote.</div>

  const enviar = async () => {
    setError('')
    const datosPaso = {}
    for (const c of CAMPOS[elegido]) {
      let v = form[c.k]
      if (c.tipo === 'soles' || c.tipo === 'numero') {
        v = Number(String(v === undefined ? '' : v).replace(',', '.'))
        if (String(form[c.k] ?? '').trim() === '' || isNaN(v)) return setError(`Falta: ${c.label}`)
      } else if (c.tipo === 'texto' && c.k === 'modelo' && !String(v || '').trim()) {
        return setError('Escribe el modelo del polo.')
      }
      datosPaso[c.k] = typeof v === 'string' ? v.trim() : v
    }
    setGuardando(true)
    try {
      const nuevoPaso = Math.max(paso, elegido)
      const obj = esNuevo ? { ...datosPaso, paso: 1 } : { id: lote.id, ...datosPaso, paso: nuevoPaso }
      const msg = elegido > paso ? `Listo: ${PASOS[elegido - 1].titulo.toLowerCase()}` : 'Cambios guardados'
      const id = await guardar('lotes', obj, msg)
      if (esNuevo) ir('lote', id)
      else setElegido(Math.min(nuevoPaso + 1, 5))
    } catch (e) {
      setError('No se pudo guardar. Revisa el internet y vuelve a intentar.')
    } finally {
      setGuardando(false)
    }
  }

  const vista = { ...lote, ...Object.fromEntries(Object.entries(form).filter(([, v]) => v !== '')) }
  const cu = costoPorPolo(vista)
  const vendidos = esNuevo ? 0 : vendidosDeLote(lote.id, datos.ventas)
  const editando = elegido <= paso

  return (
    <>
      <button className="btn btn-link px-0 mb-2 fs-5" onClick={() => ir('lotes')}>← Mis lotes</button>
      <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-4">
        <div>
          <h1 className="fw-bold mb-1">🧵 {esNuevo ? 'Nuevo lote' : `Lote ${lote.id} · ${nombreLote(lote)}`}</h1>
          {!esNuevo && <p className="fs-5 text-secondary mb-0">Empezó el {fechaCorta(lote.fecha)}{lote.enviados ? ` · ${lote.enviados} polos` : ''}</p>}
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-4">
          <div className="d-flex flex-column gap-2">
            {PASOS.map((p) => {
              const hecho = p.n <= paso
              const actual = p.n === paso + 1
              const activo = p.n === elegido
              const bloqueado = p.n > paso + 1
              return (
                <button key={p.n} disabled={bloqueado}
                  className={'btn text-start d-flex align-items-center gap-3 p-3 border-2 ' +
                    (activo ? 'btn-light border-warning shadow-sm' : hecho ? 'btn-light border-success-subtle' : 'btn-light border-light-subtle')}
                  onClick={() => setElegido(p.n)}>
                  <span className={'paso-circulo rounded-circle d-flex align-items-center justify-content-center fw-bold ' +
                    (hecho ? 'text-bg-success' : actual ? 'text-bg-warning' : 'text-bg-light border')}>{hecho ? '✓' : p.n}</span>
                  <span className="fs-5 flex-grow-1">{p.titulo}</span>
                  {hecho && <small className="text-secondary">editar</small>}
                </button>
              )
            })}
          </div>

          {!esNuevo && (
            <div className="card border-0 shadow-sm mt-3"><div className="card-body">
              <div className="d-flex justify-content-between"><span>Gastado en el lote</span><b>{soles(costoTotalLote(lote))}</b></div>
              {costoPorPolo(lote) !== null && <div className="d-flex justify-content-between"><span>Cada polo cuesta</span><b>{soles(costoPorPolo(lote))}</b></div>}
              {paso >= 4 && <div className="d-flex justify-content-between"><span>Vendidos / quedan</span><b>{vendidos} / {stockDeLote(lote, datos.ventas)}</b></div>}
            </div></div>
          )}
        </div>

        <div className="col-lg-8">
          <div className="card border-0 shadow-sm"><div className="card-body p-4">
            <div className="text-secondary fw-bold">Paso {elegido} de 5{editando ? ' · corrigiendo' : ''}</div>
            <h2 className="fw-bold mb-4">{PASOS[elegido - 1].titulo}</h2>
            <div className="row g-3">
              {CAMPOS[elegido].map((c) => (
                <div className={CAMPOS[elegido].length > 1 ? 'col-md-6' : 'col-md-8'} key={c.k}>
                  <label htmlFor={'f-' + c.k} className="fs-5 fw-bold mb-2">{c.label}</label>
                  {c.tipo === 'soles' ? (
                    <div className="input-group input-group-lg">
                      <span className="input-group-text">S/</span>
                      <input id={'f-' + c.k} className="form-control fs-4" inputMode="decimal" placeholder="0.00"
                        value={form[c.k] ?? ''} onChange={(e) => setForm({ ...form, [c.k]: e.target.value })} />
                    </div>
                  ) : (
                    <input id={'f-' + c.k} className={'form-control form-control-lg ' + (c.tipo === 'numero' ? 'fs-4' : '')}
                      type={c.tipo === 'fecha' ? 'date' : 'text'} inputMode={c.tipo === 'numero' ? 'numeric' : undefined}
                      placeholder={c.ph} value={form[c.k] ?? ''} onChange={(e) => setForm({ ...form, [c.k]: e.target.value })} />
                  )}
                  {c.ayuda && <div className="form-text">{c.ayuda}</div>}
                </div>
              ))}
            </div>

            {elegido >= 3 && cu !== null && (
              <div className="alert alert-success fs-5 mt-4 mb-0">Cada polo te cuesta <b>{soles(cu)}</b></div>
            )}
            {elegido === 3 && vista.enviados > 0 && vista.confeccion > 0 && (
              <div className="alert alert-light border fs-5 mt-4 mb-0">Al taller le pagarás <b>{soles(vista.enviados * vista.confeccion)}</b></div>
            )}
            {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}

            <div className="d-flex flex-wrap gap-3 align-items-center mt-4">
              <button className="btn btn-marca btn-lg py-3 px-5 fs-4" disabled={guardando} onClick={enviar}>
                {guardando ? <><span className="spinner-border spinner-border-sm me-2" />Guardando…</>
                  : esNuevo ? 'Crear lote' : editando ? 'Guardar cambios' : `Listo: ${PASOS[elegido - 1].titulo.toLowerCase()}`}
              </button>
              {!esNuevo && vendidos === 0 && (
                <BotonBorrar texto="Borrar este lote" onConfirmar={async () => { await borrar('lotes', lote.id, 'Lote borrado'); ir('lotes') }} />
              )}
            </div>
            {paso >= 5 && !editando && <div className="alert alert-success mt-4 mb-0 fs-5">Este lote está listo para vender 🎉</div>}
          </div></div>
        </div>
      </div>
    </>
  )
}
