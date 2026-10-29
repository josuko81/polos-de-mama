import React, { useState } from 'react'
import { stockPorLote, nombreLote, soles, TALLAS, hoy } from '../calc.js'

export default function Vendi({ datos, guardar, ir }) {
  const disponibles = stockPorLote(datos).filter((x) => x.quedan > 0)
  const [loteId, setLoteId] = useState(disponibles[0] ? disponibles[0].lote.id : null)
  const [talla, setTalla] = useState('M')
  const [cantidad, setCantidad] = useState(1)
  const [precio, setPrecio] = useState('')
  const [pagado, setPagado] = useState(true)
  const [cliente, setCliente] = useState('')
  const [fecha, setFecha] = useState(hoy())
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const sel = disponibles.find((x) => String(x.lote.id) === String(loteId))
  const p = Number(String(precio).replace(',', '.')) || 0
  const total = cantidad * p
  const ganancia = sel && sel.costo !== null ? total - cantidad * sel.costo : null

  const enviar = async (otra) => {
    setError('')
    if (!sel) return setError('Elige qué polo vendiste.')
    if (!cantidad || cantidad < 1) return setError('La cantidad tiene que ser al menos 1.')
    if (cantidad > sel.quedan) return setError(`Solo te quedan ${sel.quedan} de ese polo.`)
    if (!p) return setError('Escribe a cuánto vendiste cada polo.')
    if (!pagado && !cliente.trim()) return setError('Si te deben, escribe quién es, para acordarte.')
    setGuardando(true)
    try {
      await guardar('ventas', { fecha, loteId: sel.lote.id, talla, cantidad, precio: p, pagado, cliente: cliente.trim() }, `Venta guardada: ${soles(total)}`)
      if (otra) { setCantidad(1); setPrecio(''); setCliente(''); setPagado(true) } else ir('inicio')
    } catch (e) {
      setError('No se pudo guardar. Revisa el internet y vuelve a intentar.')
    } finally {
      setGuardando(false)
    }
  }

  if (disponibles.length === 0) {
    return (
      <div className="card border-0 shadow-sm"><div className="card-body p-5 text-center">
        <h2 className="fw-bold">No tienes polos para vender todavía</h2>
        <p className="fs-5 text-secondary">Cuando recojas un lote del taller, aparecerá aquí.</p>
        <button className="btn btn-warning btn-lg" onClick={() => ir('lotes')}>🧵 Ir a mis lotes</button>
      </div></div>
    )
  }

  return (
    <div className="row g-4">
      <div className="col-lg-8">
        <h1 className="fw-bold mb-4">💰 Vendí</h1>

        <div className="card border-0 shadow-sm mb-3"><div className="card-body p-4">
          <div className="fs-5 fw-bold mb-3">1. ¿Qué polo vendiste?</div>
          <div className="row g-2">
            {disponibles.map((x) => (
              <div className="col-md-6" key={x.lote.id}>
                <button
                  className={'btn btn-outline-secondary opcion w-100 text-start p-3 ' + (String(x.lote.id) === String(loteId) ? 'active' : '')}
                  onClick={() => setLoteId(x.lote.id)}
                >
                  <div className="fw-bold fs-5">{nombreLote(x.lote)}</div>
                  <div className="small">Lote {x.lote.id} · quedan <b>{x.quedan}</b>{x.costo !== null && <> · cada uno te costó {soles(x.costo)}</>}</div>
                </button>
              </div>
            ))}
          </div>
        </div></div>

        <div className="card border-0 shadow-sm mb-3"><div className="card-body p-4">
          <div className="row g-4">
            <div className="col-md-7">
              <div className="fs-5 fw-bold mb-3">2. ¿Qué talla?</div>
              <div className="d-flex flex-wrap gap-2">
                {TALLAS.map((t) => (
                  <button key={t} className={'btn btn-lg btn-outline-secondary opcion px-4 ' + (t === talla ? 'active' : '')} onClick={() => setTalla(t)}>{t}</button>
                ))}
              </div>
            </div>
            <div className="col-md-5">
              <div className="fs-5 fw-bold mb-3">3. ¿Cuántos?</div>
              <div className="input-group input-group-lg">
                <button className="btn btn-outline-secondary px-4 fw-bold" onClick={() => setCantidad(Math.max(1, cantidad - 1))}>−</button>
                <input id="cantidad" className="form-control text-center fw-bold fs-3" inputMode="numeric" value={cantidad}
                  onChange={(e) => setCantidad(parseInt(e.target.value.replace(/\D/g, ''), 10) || 0)} />
                <button className="btn btn-outline-secondary px-4 fw-bold" onClick={() => setCantidad(cantidad + 1)}>+</button>
              </div>
            </div>
          </div>
        </div></div>

        <div className="card border-0 shadow-sm"><div className="card-body p-4">
          <div className="row g-4">
            <div className="col-md-6">
              <label htmlFor="precio" className="fs-5 fw-bold mb-2">4. ¿A cuánto cada uno?</label>
              <div className="input-group input-group-lg">
                <span className="input-group-text">S/</span>
                <input id="precio" className="form-control fs-4" inputMode="decimal" placeholder="0.00" value={precio} onChange={(e) => setPrecio(e.target.value)} />
              </div>
            </div>
            <div className="col-md-6">
              <div className="fs-5 fw-bold mb-2">5. ¿Ya te pagaron?</div>
              <div className="d-flex gap-2">
                <button className={'btn btn-lg btn-outline-secondary opcion flex-fill ' + (pagado ? 'active' : '')} onClick={() => setPagado(true)}>Sí, ya me pagó</button>
                <button className={'btn btn-lg btn-outline-danger flex-fill ' + (!pagado ? 'active' : '')} onClick={() => setPagado(false)}>Me debe</button>
              </div>
            </div>
            <div className="col-md-6">
              <label htmlFor="cliente" className="fw-bold mb-2">Cliente o nota {pagado && <span className="text-secondary fw-normal">(opcional)</span>}</label>
              <input id="cliente" className="form-control form-control-lg" placeholder="Ej: Sra. Rosa" value={cliente} onChange={(e) => setCliente(e.target.value)} />
            </div>
            <div className="col-md-6">
              <label htmlFor="fecha" className="fw-bold mb-2">Fecha</label>
              <input id="fecha" type="date" className="form-control form-control-lg" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>
          </div>
        </div></div>
      </div>

      <div className="col-lg-4">
        <div className="card border-0 shadow sticky-top" style={{ top: '1rem' }}>
          <div className="card-body p-4">
            <div className="fw-bold text-secondary">Esta venta</div>
            <div className="fs-5 mb-3">{sel ? `${cantidad} × ${nombreLote(sel.lote)} (${talla})` : '—'}</div>
            <div className="d-flex justify-content-between fs-5"><span>Total</span><b>{soles(total)}</b></div>
            {ganancia !== null && (
              <div className="d-flex justify-content-between fs-5 text-success"><span>Ganas</span><b>{soles(ganancia)}</b></div>
            )}
            {!pagado && <div className="badge text-bg-danger mt-2 fs-6">Queda como deuda</div>}
            {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}
            <button className="btn btn-marca btn-lg w-100 mt-4 py-3 fs-4" disabled={guardando} onClick={() => enviar(false)}>
              {guardando ? <><span className="spinner-border spinner-border-sm me-2" />Guardando…</> : 'Guardar venta'}
            </button>
            <button className="btn btn-link w-100 mt-2" disabled={guardando} onClick={() => enviar(true)}>Guardar y anotar otra</button>
          </div>
        </div>
      </div>
    </div>
  )
}
