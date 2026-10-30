import React, { useState } from 'react'
import { TALLAS, disenoPorId, fraccionUsada, telaDisponible, leerTallas, hoy, soles, fechaCorta } from '../calc.js'
import Muestra from './Muestra.jsx'
import NuevoDiseno from './NuevoDiseno.jsx'
import { FotoMini } from './Fotos.jsx'

const numero = (v) => Number(String(v ?? '').replace(',', '.')) || 0
const USOS = [
  { id: 'toda', texto: 'Toda' },
  { id: 'mitad', texto: 'La mitad' },
  { id: 'cuarto', texto: 'Un poco' },
]

// Nueva tanda: un diseño cortado con una o varias telas del almacén, contado por talla
export default function NuevaTanda({ datos, guardar, guardarVarios, ir, enVentana = false }) {
  const [disenoId, setDisenoId] = useState('')
  const [creandoDiseno, setCreandoDiseno] = useState(false)
  const [usos, setUsos] = useState([]) // [{ telaId, uso }]
  const [cortados, setCortados] = useState({}) // { M: '20', Estándar: '15', L: '10' }
  const [costoTela, setCostoTela] = useState('')
  // Precio de la costura: se propone el último usado
  const ultimaTanda = [...(datos.tandas || [])].sort((a, b) => Number(b.id) - Number(a.id)).find((t) => Number(t.precioTaller) > 0)
  const [precioTaller, setPrecioTaller] = useState(ultimaTanda ? String(ultimaTanda.precioTaller) : '')
  const [fecha, setFecha] = useState(hoy())
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const diseno = disenoPorId(disenoId)
  const estampado = diseno && diseno.tipo === 'Con estampado'
  const disponibles = (datos.telas || []).filter((t) => telaDisponible(t, datos)).sort((a, b) => String(a.color).localeCompare(String(b.color)) || String(a.fecha).localeCompare(String(b.fecha)))
  const telaDe = (id) => (datos.telas || []).find((t) => String(t.id) === String(id))
  // Colores de las telas elegidas: solo para reconocerlas, los polos se cuentan por talla
  const colores = [...new Set(usos.map((u) => String(telaDe(u.telaId).color).toLowerCase()))]
  const queda = (t) => 1 - fraccionUsada(t, datos)
  const total = TALLAS.reduce((s, t) => s + numero(cortados[t]), 0)

  const alternar = (t) => {
    if (usos.some((u) => String(u.telaId) === String(t.id))) setUsos(usos.filter((u) => String(u.telaId) !== String(t.id)))
    else setUsos([...usos, { telaId: t.id, uso: 'toda' }])
  }
  const cambiarUso = (telaId, uso) => setUsos(usos.map((u) => (String(u.telaId) === String(telaId) ? { ...u, uso } : u)))
  const fraccion = (u) => {
    const r = queda(telaDe(u.telaId))
    return u.uso === 'toda' ? r : Math.min(r, u.uso === 'mitad' ? 0.5 : 0.25)
  }

  const enviar = async () => {
    setError('')
    if (!diseno) return setError('Elige el diseño que cortaste.')
    if (!total) return setError('Pon cuántos cortaste de cada talla.')
    // Una sola línea con todas las telas: el costo de la tela se reparte entre todos los polos de la tanda
    const lineas = [{
      color: '',
      telas: usos.map((u) => ({ telaId: u.telaId, fraccion: Math.round(fraccion(u) * 1000) / 1000 })),
      // Sin telas del almacén, el costo de la tela se puede poner a mano
      ...(usos.length ? {} : { costoTela: numero(costoTela) }),
      cortadosT: leerTallas(Object.fromEntries(TALLAS.map((t) => [t, numero(cortados[t])]))),
    }]
    const tanda = {
      fecha, disenoId: diseno.id, etapa: estampado ? 1 : 2, otros: 0, pagado: false, colores: JSON.stringify(lineas),
      precioTaller: numero(precioTaller),
      ...(estampado ? {} : { fechaEnvio: fecha }),
    }
    setGuardando(true)
    try {
      const id = await guardar('tandas', tanda, estampado ? 'Tanda cortada: ahora a estampar' : 'Tanda mandada al taller')
      // Las telas usadas "toda" quedan como acabadas en el almacén
      const acabadas = usos.filter((u) => u.uso === 'toda').map((u) => ({ id: u.telaId, acabada: true }))
      if (acabadas.length) await guardarVarios('telas', acabadas)
      ir('tanda', id)
    } catch (e) {
      setError('No se pudo guardar. Revisa el internet y vuelve a intentar.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <>
      {!enVentana && (
        <>
          <button className="btn btn-link px-0 mb-2 fs-5" onClick={() => ir('produccion')}>← Producción</button>
          <h1 className="fw-bold mb-1">✂️ Nueva tanda</h1>
        </>
      )}
      <p className="fs-5 text-secondary mb-4">Elige el diseño y cuántos polos cortaste de cada talla.</p>

      <div className="row g-4">
        <div className="col-lg-8 d-flex flex-column gap-3">
          <div className="card border-0 shadow-sm"><div className="card-body p-4">
            <div className="fs-5 fw-bold mb-3">1. ¿Qué diseño cortaste?</div>
            <div className="d-flex flex-wrap gap-2">
              {(datos.disenos || []).map((d) => (
                <button key={d.id} type="button" className={'btn btn-lg btn-outline-secondary opcion text-start ' + (String(disenoId) === String(d.id) ? 'active' : '')} onClick={() => setDisenoId(d.id)}>
                  <span className="d-flex align-items-center gap-2">
                    <FotoMini de={d} tam="3rem" />
                    <span>
                      <span className="d-block fw-bold">{d.nombre}</span>
                      <span className="d-block small">{d.cuello} · {d.tipo === 'Con estampado' ? '🎨 estampado' : '⬜ liso'}</span>
                    </span>
                  </span>
                </button>
              ))}
              {!creandoDiseno && <button type="button" className="btn btn-lg btn-outline-warning border-2 border-dashed" onClick={() => setCreandoDiseno(true)}>＋ Nuevo diseño</button>}
            </div>
            {creandoDiseno && (
              <div className="mt-3">
                <NuevoDiseno datos={datos} guardar={guardar} onCancelar={() => setCreandoDiseno(false)} onListo={(id) => { setCreandoDiseno(false); setDisenoId(id) }} />
              </div>
            )}
          </div></div>

          <div className="card border-0 shadow-sm"><div className="card-body p-4">
            <div className="fs-5 fw-bold mb-3">2. ¿Cuántos cortaste de cada talla?</div>
            <div className="row g-3 align-items-end">
              {TALLAS.map((t) => (
                <div className="col-4 col-md-3" key={t}>
                  <label htmlFor={`corte-${t}`} className="fw-bold d-block text-center mb-1">{t}</label>
                  <input id={`corte-${t}`} className="form-control form-control-lg text-center fs-4" inputMode="numeric" placeholder="0"
                    value={cortados[t] ?? ''}
                    onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); setCortados((x) => ({ ...x, [t]: v })) }} />
                </div>
              ))}
              <div className="col-12 col-md-3 text-md-end fs-5">Total: <b className="fs-3">{total}</b> polos</div>
            </div>
          </div></div>

          <div className="card border-0 shadow-sm"><div className="card-body p-4">
            <div className="fs-5 fw-bold mb-1">3. ¿Qué telas usaste? <span className="text-secondary fw-normal fs-6">(opcional)</span></div>
            <p className="text-secondary mb-3">Sirve para saber cuánto costó cada polo. Si no la anotaste en el almacén, pon el costo abajo.</p>
            {disponibles.length === 0 && (
              <div className="text-secondary mb-2">No hay tela en el almacén. <button className="btn btn-link p-0 align-baseline" onClick={() => ir('compra-tela')}>Anotar una compra de tela</button></div>
            )}
            <div className="row g-2">
              {disponibles.map((t) => {
                const u = usos.find((x) => String(x.telaId) === String(t.id))
                return (
                  <div className="col-md-6" key={t.id}>
                    <div className={'border rounded-3 p-2 ' + (u ? 'border-success border-2 bg-success-subtle' : '')}>
                      <button type="button" className="btn w-100 text-start d-flex align-items-center gap-2 p-1" onClick={() => alternar(t)}>
                        <span className="fs-4">{u ? '☑' : '☐'}</span>
                        <Muestra color={t.color} tam="1.8rem" />
                        <span className="flex-grow-1">
                          <span className="d-block fw-bold text-capitalize">{t.color}</span>
                          <span className="d-block small text-secondary">{t.kilos} kg · {fechaCorta(t.fecha)}{queda(t) < 0.999 && ` · queda ${Math.round(queda(t) * 100)}%`}</span>
                        </span>
                      </button>
                      {u && (
                        <div className="btn-group w-100 mt-1">
                          {USOS.map((o) => (
                            <button key={o.id} type="button" className={'btn btn-sm ' + (u.uso === o.id ? 'btn-success' : 'btn-outline-success')} onClick={() => cambiarUso(t.id, o.id)}>{o.texto}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            {usos.length === 0 && (
              <div className="mt-3" style={{ maxWidth: '22rem' }}>
                <label htmlFor="costoTela" className="fw-bold mb-1">¿Cuánto costó la tela? <span className="text-secondary fw-normal">(opcional)</span></label>
                <div className="input-group input-group-lg">
                  <span className="input-group-text">S/</span>
                  <input id="costoTela" className="form-control" inputMode="decimal" placeholder="0.00" value={costoTela} onChange={(e) => setCostoTela(e.target.value)} />
                </div>
              </div>
            )}
          </div></div>

          <div className="card border-0 shadow-sm"><div className="card-body p-4">
            <label htmlFor="precioTaller" className="fs-5 fw-bold mb-1">4. ¿Cuánto cobra la costura por polo? <span className="text-secondary fw-normal fs-6">(opcional)</span></label>
            <p className="text-secondary mb-2">Sirve para saber cuánto te costó cada polo.</p>
            <div className="input-group input-group-lg" style={{ maxWidth: '16rem' }}>
              <span className="input-group-text">S/</span>
              <input id="precioTaller" className="form-control" inputMode="decimal" placeholder="0.00" value={precioTaller} onChange={(e) => setPrecioTaller(e.target.value)} />
            </div>
          </div></div>
          {estampado && (
            <div className="alert alert-info fs-5 mb-0">🎨 <b>{diseno.nombre}</b> es estampado: la tanda queda en «Estampando». Cuando terminen de estampar, en el tablero tocas «Mandé al taller».</div>
          )}
        </div>

        <div className="col-lg-4">
          <div className="card border-0 shadow sticky-top" style={{ top: '1rem' }}><div className="card-body p-4">
            <div className="fw-bold text-secondary">Esta tanda</div>
            <div className="fs-4 fw-bold">{diseno ? diseno.nombre : '—'}</div>
            <div className="d-flex flex-wrap gap-1 my-2">{colores.map((c) => <Muestra key={c} color={c} tam="1.4rem" />)}</div>
            {usos.length > 0 && <div className="d-flex justify-content-between fs-5"><span>Telas</span><b>{usos.length}</b></div>}
            <div className="d-flex justify-content-between fs-5"><span>Polos cortados</span><b>{total}</b></div>
            {numero(precioTaller) > 0 && total > 0 && (
              <div className="d-flex justify-content-between"><span>Costura</span><b>{soles(total * numero(precioTaller))}</b></div>
            )}
            <label htmlFor="fecha-corte" className="small fw-bold mt-3">Fecha de corte</label>
            <input id="fecha-corte" type="date" className="form-control" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}
            <button className="btn btn-marca btn-lg w-100 mt-3 py-3 fs-5" disabled={guardando} onClick={enviar}>
              {guardando ? <><span className="spinner-border spinner-border-sm me-2" />Guardando…</> : estampado ? 'Guardar: a estampar' : 'Guardar: mandé al taller'}
            </button>
          </div></div>
        </div>
      </div>
    </>
  )
}
