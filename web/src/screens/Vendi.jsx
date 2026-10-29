import React, { useState } from 'react'
import { productos, costoEstimado, disenoPorId, fotosDe, soles, TALLAS, PRECIOS, hoy } from '../calc.js'
import Muestra from './Muestra.jsx'
import { FotoMini } from './Fotos.jsx'

const precioDe = (t) => (PRECIOS[t] ? String(PRECIOS[t]) : '')

// Se vende por diseño + color + talla; el stock ya viene sumado de todos los lotes
export default function Vendi({ datos, guardar, ir }) {
  const prods = productos(datos)
  const bases = [...new Map(prods.map((p) => [p.base, p])).values()]
  const [base, setBase] = useState(bases[0] ? bases[0].base : null)
  const coloresDe = (b) => [...new Set(prods.filter((p) => p.base === b).map((p) => p.color))]
  const primeraTalla = (b, c) => TALLAS.find((t) => prods.some((x) => x.base === b && x.color === c && (x.talla === t || x.talla === ''))) || TALLAS[0]
  const [color, setColor] = useState(bases[0] ? coloresDe(bases[0].base)[0] : null)
  const [talla, setTalla] = useState(() => (bases[0] ? primeraTalla(bases[0].base, coloresDe(bases[0].base)[0]) : TALLAS[0]))
  const [cantidad, setCantidad] = useState(1)
  const [precio, setPrecio] = useState(() => precioDe(talla))
  const [pagado, setPagado] = useState(true)
  const [cliente, setCliente] = useState('')
  const [fecha, setFecha] = useState(hoy())
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  // Producto para cada talla del color elegido. Los lotes antiguos sin tallas sirven para cualquier talla.
  const delColor = prods.filter((p) => p.base === base && p.color === color)
  const sinTalla = delColor.find((p) => p.talla === '')
  const productoDe = (t) => sinTalla || delColor.find((p) => p.talla === t) || null
  const sel = productoDe(talla)
  const quedan = sel ? sel.quedan : 0

  const p = Number(String(precio).replace(',', '.')) || 0
  const total = cantidad * p
  const ganancia = sel && p > 0 ? total - costoEstimado(sel, cantidad) : null

  const elegirTalla = (t) => { setTalla(t); setPrecio(precioDe(t)) }
  const elegirColor = (c) => { setColor(c); elegirTalla(primeraTalla(base, c)) }
  const elegirBase = (b) => {
    const c = coloresDe(b)[0]
    setBase(b)
    setColor(c)
    elegirTalla(primeraTalla(b, c))
  }

  const enviar = async (otra) => {
    setError('')
    if (!sel) return setError('No te quedan polos de esa talla. Elige otra.')
    if (!cantidad || cantidad < 1) return setError('La cantidad tiene que ser al menos 1.')
    if (cantidad > quedan) return setError(`Solo te quedan ${quedan} de ese polo en talla ${talla}.`)
    if (!p) return setError('Escribe a cuánto vendiste cada polo.')
    if (!pagado && !cliente.trim()) return setError('Si te deben, escribe quién es, para acordarte.')
    const venta = sel.disenoId
      ? { fecha, disenoId: sel.disenoId, color: sel.color, talla, cantidad, precio: p, pagado, cliente: cliente.trim() }
      : { fecha, loteId: sel.lotes[0].lote.id, color: sel.color, talla, cantidad, precio: p, pagado, cliente: cliente.trim() }
    setGuardando(true)
    try {
      await guardar('ventas', venta, `Venta guardada: ${soles(total)}`)
      if (otra) { setCantidad(1); setPrecio(precioDe(talla)); setCliente(''); setPagado(true) } else ir('inicio')
    } catch (e) {
      setError('No se pudo guardar. Revisa el internet y vuelve a intentar.')
    } finally {
      setGuardando(false)
    }
  }

  if (prods.length === 0) {
    return (
      <div className="card border-0 shadow-sm"><div className="card-body p-5 text-center">
        <h2 className="fw-bold">No tienes polos para vender todavía</h2>
        <p className="fs-5 text-secondary">Cuando recojas un lote del taller, aparecerá aquí.</p>
        <button className="btn btn-warning btn-lg" onClick={() => ir('lotes')}>🧵 Ir a mis lotes</button>
      </div></div>
    )
  }

  const fotoDe = (b, c) => {
    const x = prods.filter((q) => q.base === b && (!c || q.color === c)).flatMap((q) => q.lotes.map((y) => y.lote)).find((l) => fotosDe(l).length)
    return x || null
  }
  const nombreBase = (b) => (b.disenoId ? `${b.nombre}` : b.nombre)
  const cuelloBase = (b) => (b.disenoId ? (disenoPorId(b.disenoId) || {}).cuello : 'Sin diseño')

  return (
    <div className="row g-4">
      <div className="col-lg-8">
        <h1 className="fw-bold mb-4">💰 Vendí</h1>

        <div className="card border-0 shadow-sm mb-3"><div className="card-body p-4">
          <div className="fs-5 fw-bold mb-3">1. ¿Qué diseño?</div>
          <div className="row g-2">
            {bases.map((b) => {
              const n = prods.filter((x) => x.base === b.base).reduce((s, x) => s + x.quedan, 0)
              const foto = fotoDe(b.base)
              return (
                <div className="col-md-6" key={b.base}>
                  <button className={'btn btn-outline-secondary opcion w-100 text-start p-3 ' + (b.base === base ? 'active' : '')} onClick={() => elegirBase(b.base)}>
                    <div className="d-flex align-items-center gap-3">
                      {foto && <FotoMini lote={foto} />}
                      <div>
                        <div className="fw-bold fs-5">{nombreBase(b)}</div>
                        <div className="small">{cuelloBase(b)} · quedan <b>{n}</b></div>
                      </div>
                    </div>
                  </button>
                </div>
              )
            })}
          </div>
        </div></div>

        <div className="card border-0 shadow-sm mb-3"><div className="card-body p-4">
          <div className="fs-5 fw-bold mb-3">2. ¿Qué color?</div>
          <div className="d-flex flex-wrap gap-2">
            {coloresDe(base).map((c) => {
              const n = prods.filter((x) => x.base === base && x.color === c).reduce((s, x) => s + x.quedan, 0)
              return (
                <button key={c} className={'btn btn-outline-secondary opcion d-flex align-items-center gap-2 px-3 py-2 ' + (c === color ? 'active' : '')} onClick={() => elegirColor(c)}>
                  <Muestra color={c} tam="1.8rem" />
                  <span className="text-start"><span className="d-block fw-bold text-capitalize">{c}</span><span className="d-block small">quedan {n}</span></span>
                </button>
              )
            })}
          </div>
        </div></div>

        <div className="card border-0 shadow-sm mb-3"><div className="card-body p-4">
          <div className="row g-4">
            <div className="col-md-7">
              <div className="fs-5 fw-bold mb-3">3. ¿Qué talla?</div>
              <div className="d-flex flex-wrap gap-2">
                {TALLAS.map((t) => {
                  const pt = productoDe(t)
                  const n = pt ? pt.quedan : 0
                  return (
                    <button key={t} disabled={!n} className={'btn btn-lg btn-outline-secondary opcion px-3 ' + (t === talla ? 'active' : '')} onClick={() => elegirTalla(t)}>
                      <span className="d-block">{t}</span>
                      <span className="d-block small">{n ? `quedan ${n}` : 'no hay'}</span>
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="col-md-5">
              <div className="fs-5 fw-bold mb-3">4. ¿Cuántos?</div>
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
              <label htmlFor="precio" className="fs-5 fw-bold mb-2">5. ¿A cuánto cada uno?</label>
              <div className="input-group input-group-lg">
                <span className="input-group-text">S/</span>
                <input id="precio" className="form-control fs-4" inputMode="decimal" placeholder="0.00" value={precio} onChange={(e) => setPrecio(e.target.value)} />
              </div>
              <div className="form-text">Por mayor: M y Estándar S/ 14 · L S/ 16. Si vendiste a otro precio, cámbialo.</div>
            </div>
            <div className="col-md-6">
              <div className="fs-5 fw-bold mb-2">6. ¿Ya te pagaron?</div>
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
            <div className="fs-5 mb-3 d-flex align-items-center gap-2">
              {sel ? <><Muestra color={color} />{`${cantidad} × ${sel.nombre} ${color} (${talla})`}</> : '—'}
            </div>
            <div className="d-flex justify-content-between fs-5"><span>Total</span><b>{soles(total)}</b></div>
            {ganancia !== null && (ganancia >= 0 ? (
              <div className="d-flex justify-content-between fs-5 text-success"><span>Ganas</span><b>{soles(ganancia)}</b></div>
            ) : (
              <>
                <div className="d-flex justify-content-between fs-5 text-danger"><span>Pierdes</span><b>{soles(-ganancia)}</b></div>
                <div className="alert alert-warning mt-2 mb-0 small">Ojo: estás vendiendo por debajo de lo que te costó.</div>
              </>
            ))}
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
