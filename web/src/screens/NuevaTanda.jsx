import React, { useState } from 'react'
import { TALLAS, disenoPorId, fraccionUsada, telaDisponible, pendientesPorTaller, leerTallas, hoy, sumarDias, soles, fechaCorta } from '../calc.js'
import Muestra from './Muestra.jsx'
import NuevoDiseno from './NuevoDiseno.jsx'
import { FotoMini } from './Fotos.jsx'
import { FormTaller } from './Talleres.jsx'

const numero = (v) => Number(String(v ?? '').replace(',', '.')) || 0
const USOS = [
  { id: 'toda', texto: 'Toda' },
  { id: 'mitad', texto: 'La mitad' },
  { id: 'cuarto', texto: 'Un poco' },
]

// Taller, precio y fecha estimada: se piden al mandar al taller (aquí o después de estampar)
export function CamposTaller({ datos, guardar, valor, onCambio }) {
  const talleres = datos.talleres || []
  const [agregando, setAgregando] = useState(false)
  const promedios = Object.fromEntries(pendientesPorTaller(datos).map((f) => [f.taller.id, f.promedio]))
  const elegir = (t) => onCambio({
    ...valor, tallerId: t.id, precioTaller: String(t.precio || ''),
    fechaEstimada: sumarDias(hoy(), promedios[t.id] || 7),
  })
  // Agregar un taller aquí mismo, sin salir de la ventana ni perder lo escrito
  const formNuevo = (
    <FormTaller datos={datos} guardar={guardar} onListo={() => setAgregando(false)} onCreado={elegir} />
  )
  if (!talleres.length) {
    return (
      <>
        <div className="alert alert-warning">Todavía no tienes talleres. Agrega el primero:</div>
        {formNuevo}
      </>
    )
  }
  return (
    <div className="row g-3">
      <div className="col-12">
        <div className="fw-bold mb-2">¿A qué taller?</div>
        <div className="d-flex flex-wrap gap-2">
          {talleres.map((t) => (
            <button key={t.id} type="button" className={'btn btn-lg btn-outline-secondary opcion ' + (String(valor.tallerId) === String(t.id) ? 'active' : '')} onClick={() => elegir(t)}>
              <span className="d-block fw-bold">{t.nombre}</span>
              <span className="d-block small">{soles(t.precio)} por polo{promedios[t.id] ? ` · ~${promedios[t.id]} días` : ''}</span>
            </button>
          ))}
          {!agregando && <button type="button" className="btn btn-lg btn-outline-warning border-2 border-dashed" onClick={() => setAgregando(true)}>＋ Otro taller</button>}
        </div>
        {agregando && <div className="mt-3">{formNuevo}</div>}
      </div>
      <div className="col-md-6">
        <label htmlFor="precioTaller" className="fw-bold mb-2">¿Cuánto cobra por polo?</label>
        <div className="input-group input-group-lg">
          <span className="input-group-text">S/</span>
          <input id="precioTaller" className="form-control" inputMode="decimal" value={valor.precioTaller || ''} onChange={(e) => onCambio({ ...valor, precioTaller: e.target.value })} />
        </div>
      </div>
      <div className="col-md-6">
        <label htmlFor="fechaEstimada" className="fw-bold mb-2">¿Para cuándo dijeron que entregan?</label>
        <input id="fechaEstimada" type="date" className="form-control form-control-lg" value={valor.fechaEstimada || ''} onChange={(e) => onCambio({ ...valor, fechaEstimada: e.target.value })} />
      </div>
    </div>
  )
}

export const validarTaller = (v) => (!v.tallerId ? 'Elige a qué taller la mandas.' : !numero(v.precioTaller) ? 'Escribe cuánto cobra el taller por polo.' : '')

// Nueva tanda: un diseño cortado en varios colores, con telas del almacén
export default function NuevaTanda({ datos, guardar, guardarVarios, ir, enVentana = false }) {
  const [disenoId, setDisenoId] = useState('')
  const [creandoDiseno, setCreandoDiseno] = useState(false)
  const [usos, setUsos] = useState([]) // [{ telaId, uso }]
  const [cortados, setCortados] = useState({}) // { color: { M: '20', ... } }
  const [taller, setTaller] = useState({})
  const [fecha, setFecha] = useState(hoy())
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const diseno = disenoPorId(disenoId)
  const estampado = diseno && diseno.tipo === 'Con estampado'
  const disponibles = (datos.telas || []).filter((t) => telaDisponible(t, datos)).sort((a, b) => String(a.color).localeCompare(String(b.color)) || String(a.fecha).localeCompare(String(b.fecha)))
  const telaDe = (id) => (datos.telas || []).find((t) => String(t.id) === String(id))
  const colores = [...new Set(usos.map((u) => String(telaDe(u.telaId).color).toLowerCase()))]
  const queda = (t) => 1 - fraccionUsada(t, datos)
  const totalColor = (c) => TALLAS.reduce((s, t) => s + numero((cortados[c] || {})[t]), 0)
  const total = colores.reduce((s, c) => s + totalColor(c), 0)

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
    if (!usos.length) return setError('Elige qué telas usaste.')
    const sinCantidad = colores.find((c) => !totalColor(c))
    if (sinCantidad) return setError(`Pon cuántos cortaste de ${sinCantidad}.`)
    if (!estampado) { const e = validarTaller(taller); if (e) return setError(e) }
    const lineas = colores.map((c) => ({
      color: c,
      telas: usos.filter((u) => String(telaDe(u.telaId).color).toLowerCase() === c).map((u) => ({ telaId: u.telaId, fraccion: Math.round(fraccion(u) * 1000) / 1000 })),
      cortadosT: leerTallas(Object.fromEntries(TALLAS.map((t) => [t, numero((cortados[c] || {})[t])]))),
    }))
    const tanda = {
      fecha, disenoId: diseno.id, etapa: estampado ? 1 : 2, otros: 0, pagado: false, colores: JSON.stringify(lineas),
      ...(estampado ? {} : { tallerId: taller.tallerId, precioTaller: numero(taller.precioTaller), fechaEnvio: fecha, fechaEstimada: taller.fechaEstimada || '' }),
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
      <p className="fs-5 text-secondary mb-4">Un diseño cortado en uno o varios colores, que va junto al taller.</p>

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
            <div className="fs-5 fw-bold mb-1">2. ¿Qué telas usaste?</div>
            <p className="text-secondary mb-3">Toca cada tela del almacén y di si usaste toda o una parte.</p>
            {disponibles.length === 0 && (
              <div className="alert alert-warning mb-0">No hay tela en el almacén. <button className="btn btn-link p-0 align-baseline" onClick={() => ir('compra-tela')}>Anota la compra de tela</button>.</div>
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
          </div></div>

          {colores.length > 0 && (
            <div className="card border-0 shadow-sm"><div className="card-body p-4">
              <div className="fs-5 fw-bold mb-3">3. ¿Cuántos cortaste de cada color y talla?</div>
              <div className="table-responsive">
                <table className="table align-middle mb-0 tabla-tallas">
                  <thead><tr><th>Color</th>{TALLAS.map((t) => <th key={t} className="text-center">{t}</th>)}<th className="text-end">Total</th></tr></thead>
                  <tbody>
                    {colores.map((c) => (
                      <tr key={c}>
                        <td className="text-capitalize"><span className="d-inline-flex align-items-center gap-2"><Muestra color={c} />{c}</span></td>
                        {TALLAS.map((t) => (
                          <td key={t}>
                            <input id={`corte-${c}-${t}`} className="form-control form-control-lg text-center" inputMode="numeric" placeholder="0"
                              value={(cortados[c] || {})[t] ?? ''}
                              onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); setCortados((x) => ({ ...x, [c]: { ...(x[c] || {}), [t]: v } })) }} />
                          </td>
                        ))}
                        <td className="text-end fw-bold fs-5">{totalColor(c)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot><tr><td colSpan={TALLAS.length + 1} className="fw-bold">Total de la tanda</td><td className="text-end fw-bold fs-4">{total}</td></tr></tfoot>
                </table>
              </div>
            </div></div>
          )}

          {diseno && !estampado && (
            <div className="card border-0 shadow-sm"><div className="card-body p-4">
              <div className="fs-5 fw-bold mb-3">4. Mandar al taller</div>
              <CamposTaller datos={datos} guardar={guardar} valor={taller} onCambio={setTaller} />
            </div></div>
          )}
          {estampado && (
            <div className="alert alert-info fs-5 mb-0">🎨 <b>{diseno.nombre}</b> es estampado: la tanda queda en «Estampando». Cuando terminen de estampar, la mandas al taller desde la tanda.</div>
          )}
        </div>

        <div className="col-lg-4">
          <div className="card border-0 shadow sticky-top" style={{ top: '1rem' }}><div className="card-body p-4">
            <div className="fw-bold text-secondary">Esta tanda</div>
            <div className="fs-4 fw-bold">{diseno ? diseno.nombre : '—'}</div>
            <div className="d-flex flex-wrap gap-1 my-2">{colores.map((c) => <Muestra key={c} color={c} tam="1.4rem" />)}</div>
            <div className="d-flex justify-content-between fs-5"><span>Colores</span><b>{colores.length}</b></div>
            <div className="d-flex justify-content-between fs-5"><span>Polos cortados</span><b>{total}</b></div>
            {!estampado && numero(taller.precioTaller) > 0 && total > 0 && (
              <div className="d-flex justify-content-between"><span>Al recoger pagarás</span><b>{soles(total * numero(taller.precioTaller))}</b></div>
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
