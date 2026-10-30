import React, { useState } from 'react'
import { productos, costoEstimado, disenoPorId, fotosDe, soles, TALLAS, PRECIOS, CANALES, hoy } from '../calc.js'
import Muestra from './Muestra.jsx'
import { FotoMini } from './Fotos.jsx'
import { FormCliente } from './Clientes.jsx'

const precioDe = (t) => (PRECIOS[t] ? String(PRECIOS[t]) : '')

// Una venta puede llevar varios productos (diseño + color + talla). El stock ya viene sumado de todos los lotes.
export default function Vendi({ datos, guardar, guardarVarios, ir }) {
  const prods = productos(datos)
  const bases = [...new Map(prods.map((p) => [p.base, p])).values()]
  const coloresDe = (b) => [...new Set(prods.filter((p) => p.base === b).map((p) => p.color))]
  const primeraTalla = (b, c) => TALLAS.find((t) => prods.some((x) => x.base === b && x.color === c && (x.talla === t || x.talla === ''))) || TALLAS[0]

  const [base, setBase] = useState(bases[0] ? bases[0].base : null)
  const [color, setColor] = useState(bases[0] ? coloresDe(bases[0].base)[0] : null)
  const [talla, setTalla] = useState(() => (bases[0] ? primeraTalla(bases[0].base, coloresDe(bases[0].base)[0]) : TALLAS[0]))
  const [cantidad, setCantidad] = useState(1)
  const [precio, setPrecio] = useState(() => precioDe(talla))
  const [pedido, setPedido] = useState([]) // productos ya agregados a esta venta
  const [clienteId, setClienteId] = useState('')
  const [creandoCliente, setCreandoCliente] = useState(false)
  const [canal, setCanal] = useState(CANALES[0].id)
  const [pagado, setPagado] = useState(true)
  const [fecha, setFecha] = useState(hoy())
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  // Producto de cada talla del color elegido. Los lotes antiguos sin tallas sirven para cualquier talla.
  const delColor = prods.filter((p) => p.base === base && p.color === color)
  const sinTalla = delColor.find((p) => p.talla === '')
  const productoDe = (t) => sinTalla || delColor.find((p) => p.talla === t) || null
  // Lo que queda descontando lo ya agregado a este pedido
  const yaEnPedido = (p) => pedido.filter((x) => x.producto.clave === p.clave).reduce((s, x) => s + x.cantidad, 0)
  const quedanDe = (p) => (p ? p.quedan - yaEnPedido(p) : 0)
  const sel = productoDe(talla)
  const p = Number(String(precio).replace(',', '.')) || 0

  const elegirTalla = (t) => { setTalla(t); setPrecio(precioDe(t)) }
  const elegirColor = (c) => { setColor(c); elegirTalla(primeraTalla(base, c)) }
  const elegirBase = (b) => { const c = coloresDe(b)[0]; setBase(b); setColor(c); elegirTalla(primeraTalla(b, c)) }

  // Valida lo elegido arriba y lo devuelve como línea del pedido (o null con error)
  const lineaActual = () => {
    if (!sel || quedanDe(sel) <= 0) { setError('No te quedan polos de esa talla. Elige otra.'); return null }
    if (!cantidad || cantidad < 1) { setError('La cantidad tiene que ser al menos 1.'); return null }
    if (cantidad > quedanDe(sel)) { setError(`Solo te quedan ${quedanDe(sel)} de ese polo en talla ${talla}.`); return null }
    if (!p) { setError('Escribe a cuánto vendiste cada polo.'); return null }
    return { producto: sel, talla, cantidad, precio: p }
  }
  const agregar = () => {
    setError('')
    const l = lineaActual()
    if (!l) return
    // El mismo producto, talla y precio se junta en una sola línea
    const i = pedido.findIndex((x) => x.producto.clave === l.producto.clave && x.talla === l.talla && x.precio === l.precio)
    setPedido(i >= 0 ? pedido.map((x, j) => (j === i ? { ...x, cantidad: x.cantidad + l.cantidad } : x)) : [...pedido, l])
    setCantidad(1)
  }

  const total = pedido.reduce((s, x) => s + x.cantidad * x.precio, 0)
  const costo = pedido.reduce((s, x) => s + costoEstimado(x.producto, x.cantidad), 0)
  const ganancia = pedido.length ? total - costo : null
  const cliente = (datos.clientes || []).find((c) => String(c.id) === String(clienteId))

  const enviar = async (otra) => {
    setError('')
    // Si no agregó nada todavía, se guarda lo elegido arriba (venta de un solo producto)
    let lineas = pedido
    if (!lineas.length) { const l = lineaActual(); if (!l) return; lineas = [l] }
    if (!pagado && !cliente) return setError('Si te deben, elige quién es el cliente.')
    const pedidoId = 'P' + Date.now().toString(36)
    const filas = lineas.map((x) => ({
      fecha, pedidoId, clienteId: cliente ? cliente.id : '', cliente: cliente ? cliente.nombre : '', canal, pagado,
      color: x.producto.color, talla: x.talla, cantidad: x.cantidad, precio: x.precio,
      ...(x.producto.disenoId ? { disenoId: x.producto.disenoId } : { loteId: x.producto.lotes[0].lote.id }),
    }))
    const monto = filas.reduce((s, f) => s + f.cantidad * f.precio, 0)
    setGuardando(true)
    try {
      await guardarVarios('ventas', filas, `Venta guardada: ${filas.reduce((s, f) => s + f.cantidad, 0)} polos por ${soles(monto)}`)
      setPedido([]); setCantidad(1); setPagado(true); setClienteId('')
      if (!otra) ir('inicio')
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
        <p className="fs-5 text-secondary">Cuando una tanda esté empaquetada, aparecerá aquí.</p>
        <button className="btn btn-warning btn-lg" onClick={() => ir('produccion')}>✂️ Ir a producción</button>
      </div></div>
    )
  }

  // Foto para mostrar: la del diseño (p. ej. su estampado) y si no tiene, la de algún lote
  const fotoDe = (b) => {
    const grupo = prods.filter((q) => q.base === b)
    const d = grupo[0] && grupo[0].disenoId ? disenoPorId(grupo[0].disenoId) : null
    if (d && fotosDe(d).length) return d
    return grupo.flatMap((q) => q.lotes.map((y) => y.lote)).find((l) => fotosDe(l).length) || null
  }
  const cuelloBase = (b) => (b.disenoId ? (disenoPorId(b.disenoId) || {}).cuello : 'Sin diseño')
  const quedanBase = (b) => prods.filter((x) => x.base === b).reduce((s, x) => s + quedanDe(x), 0)
  const quedanColor = (c) => prods.filter((x) => x.base === base && x.color === c).reduce((s, x) => s + quedanDe(x), 0)

  return (
    <div className="row g-4">
      <div className="col-lg-7 col-xxl-8">
        <h1 className="fw-bold mb-4">💰 Vendí</h1>

        <div className="card border-0 shadow-sm mb-3"><div className="card-body p-4">
          <div className="fs-5 fw-bold mb-3">1. ¿Qué diseño?</div>
          <div className="row g-2">
            {bases.map((b) => {
              const foto = fotoDe(b.base)
              return (
                <div className="col-md-6 col-xxl-4" key={b.base}>
                  <button className={'btn btn-outline-secondary opcion w-100 text-start p-3 ' + (b.base === base ? 'active' : '')} onClick={() => elegirBase(b.base)}>
                    <div className="d-flex align-items-center gap-3">
                      {foto && <FotoMini de={foto} />}
                      <div>
                        <div className="fw-bold fs-5">{b.nombre}</div>
                        <div className="small">{cuelloBase(b)} · quedan <b>{quedanBase(b.base)}</b></div>
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
            {coloresDe(base).map((c) => (
              <button key={c} className={'btn btn-outline-secondary opcion d-flex align-items-center gap-2 px-3 py-2 ' + (c === color ? 'active' : '')} onClick={() => elegirColor(c)}>
                <Muestra color={c} tam="1.8rem" />
                <span className="text-start"><span className="d-block fw-bold text-capitalize">{c}</span><span className="d-block small">quedan {quedanColor(c)}</span></span>
              </button>
            ))}
          </div>
        </div></div>

        <div className="card border-0 shadow-sm"><div className="card-body p-4">
          <div className="row g-4">
            <div className="col-md-6">
              <div className="fs-5 fw-bold mb-3">3. ¿Qué talla?</div>
              <div className="d-flex flex-wrap gap-2">
                {TALLAS.map((t) => {
                  const n = quedanDe(productoDe(t))
                  return (
                    <button key={t} disabled={n <= 0} className={'btn btn-lg btn-outline-secondary opcion px-3 ' + (t === talla ? 'active' : '')} onClick={() => elegirTalla(t)}>
                      <span className="d-block">{t}</span>
                      <span className="d-block small">{n > 0 ? `quedan ${n}` : 'no hay'}</span>
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="col-md-6">
              <div className="row g-3">
                <div className="col-6 col-md-12 col-xl-6">
                  <div className="fs-5 fw-bold mb-2">4. ¿Cuántos?</div>
                  <div className="input-group input-group-lg">
                    <button className="btn btn-outline-secondary px-3 fw-bold" onClick={() => setCantidad(Math.max(1, cantidad - 1))}>−</button>
                    <input id="cantidad" className="form-control text-center fw-bold fs-4" inputMode="numeric" value={cantidad}
                      onChange={(e) => setCantidad(parseInt(e.target.value.replace(/\D/g, ''), 10) || 0)} />
                    <button className="btn btn-outline-secondary px-3 fw-bold" onClick={() => setCantidad(cantidad + 1)}>+</button>
                  </div>
                </div>
                <div className="col-6 col-md-12 col-xl-6">
                  <label htmlFor="precio" className="fs-5 fw-bold mb-2">5. ¿A cuánto c/u?</label>
                  <div className="input-group input-group-lg">
                    <span className="input-group-text">S/</span>
                    <input id="precio" className="form-control fs-4" inputMode="decimal" placeholder="0.00" value={precio} onChange={(e) => setPrecio(e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="form-text">Por mayor: M y Estándar S/ 14 · L S/ 16. Si vendiste a otro precio, cámbialo.</div>
            </div>
          </div>
          <button className="btn btn-warning btn-lg fw-bold w-100 mt-4 py-3" onClick={agregar}>
            ＋ Agregar al pedido: {cantidad} × {sel ? sel.nombre : ''} {color} ({talla})
          </button>
          <div className="form-text text-center">¿Lleva más colores o tallas? Agrégalos uno por uno y guarda al final.</div>
        </div></div>
      </div>

      <div className="col-lg-5 col-xxl-4">
        <div className="card border-0 shadow sticky-top" style={{ top: '1rem' }}><div className="card-body p-4">
          <div className="fw-bold text-secondary mb-2">Este pedido</div>
          {pedido.length === 0 && <p className="text-secondary">Todavía no agregas productos. Si es uno solo, puedes guardar directo.</p>}
          <div className="d-flex flex-column gap-2">
            {pedido.map((x, i) => (
              <div key={i} className="d-flex align-items-center gap-2 border rounded-3 p-2">
                <Muestra color={x.producto.color} tam="1.4rem" />
                <div className="flex-grow-1">
                  <div className="fw-bold">{x.cantidad} × {x.producto.nombre} <span className="text-capitalize">{x.producto.color}</span></div>
                  <div className="small text-secondary">Talla {x.talla} · {soles(x.precio)} c/u</div>
                </div>
                <b>{soles(x.cantidad * x.precio)}</b>
                <button className="btn btn-sm btn-outline-secondary" title="Quitar" onClick={() => setPedido(pedido.filter((_, j) => j !== i))}>✕</button>
              </div>
            ))}
          </div>
          {pedido.length > 0 && (
            <div className="border-top mt-3 pt-2">
              <div className="d-flex justify-content-between fs-5"><span>{pedido.reduce((s, x) => s + x.cantidad, 0)} polos</span><b>{soles(total)}</b></div>
              {ganancia !== null && (ganancia >= 0
                ? <div className="d-flex justify-content-between text-success"><span>Ganas</span><b>{soles(ganancia)}</b></div>
                : <div className="alert alert-warning py-1 mt-1 mb-0 small">Ojo: estás vendiendo por debajo de lo que te costó ({soles(-ganancia)}).</div>)}
            </div>
          )}

          <div className="fw-bold mt-4 mb-2">Cliente <span className="text-secondary fw-normal">{pagado ? '(opcional)' : ''}</span></div>
          {creandoCliente ? (
            <FormCliente datos={datos} guardar={guardar} onListo={() => setCreandoCliente(false)} onCreado={(id) => setClienteId(id)} />
          ) : (
            <div className="d-flex gap-2">
              <select id="cliente" className="form-select form-select-lg" value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
                <option value="">— Sin cliente —</option>
                {[...(datos.clientes || [])].sort((a, b) => a.nombre.localeCompare(b.nombre)).map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
              <button className="btn btn-outline-warning text-nowrap" onClick={() => setCreandoCliente(true)}>＋ Nuevo</button>
            </div>
          )}

          <div className="fw-bold mt-3 mb-2">¿Dónde vendiste?</div>
          <div className="d-flex gap-2">
            {CANALES.map((c) => (
              <button key={c.id} className={'btn btn-outline-secondary opcion flex-fill ' + (canal === c.id ? 'active' : '')} onClick={() => setCanal(c.id)}>{c.icono} {c.id}</button>
            ))}
          </div>

          <div className="fw-bold mt-3 mb-2">¿Ya te pagaron?</div>
          <div className="d-flex gap-2">
            <button className={'btn btn-outline-secondary opcion flex-fill ' + (pagado ? 'active' : '')} onClick={() => setPagado(true)}>Sí, ya me pagó</button>
            <button className={'btn btn-outline-danger flex-fill ' + (!pagado ? 'active' : '')} onClick={() => setPagado(false)}>Me debe</button>
          </div>

          <label htmlFor="fecha" className="small fw-bold mt-3">Fecha</label>
          <input id="fecha" type="date" className="form-control" value={fecha} onChange={(e) => setFecha(e.target.value)} />

          {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}
          <button className="btn btn-marca btn-lg w-100 mt-3 py-3 fs-4" disabled={guardando} onClick={() => enviar(false)}>
            {guardando ? <><span className="spinner-border spinner-border-sm me-2" />Guardando…</> : pedido.length > 1 ? `Guardar venta (${pedido.length} productos)` : 'Guardar venta'}
          </button>
          <button className="btn btn-link w-100 mt-1" disabled={guardando} onClick={() => enviar(true)}>Guardar y anotar otra venta</button>
        </div></div>
      </div>
    </div>
  )
}
