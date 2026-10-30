import React, { useState } from 'react'
import { pendientesPorTaller, coloresDeTelas, nombreTanda, soles, fechaCorta } from '../calc.js'
import Muestra from './Muestra.jsx'
import BotonBorrar from './BotonBorrar.jsx'

const numero = (v) => Number(String(v ?? '').replace(',', '.')) || 0

// Lo que cada taller tiene pendiente de entregar. Va arriba en Inicio.
export function PanelTalleres({ datos, ir }) {
  const filas = pendientesPorTaller(datos)
  if (!filas.length) return null
  return (
    <div className="card border-0 shadow-sm mb-4"><div className="card-body p-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="fs-4 fw-bold mb-0">🏭 Lo que debe cada taller</h2>
        <button className="btn btn-sm btn-outline-secondary" onClick={() => ir('produccion')}>Ver producción →</button>
      </div>
      <div className="row g-3">
        {filas.map((f) => (
          <div className="col-md-6" key={f.taller.id}>
            <div className={'border rounded-3 p-3 h-100 ' + (f.tandas.some((x) => x.atraso > 0) ? 'border-danger border-2' : '')}>
              <div className="d-flex justify-content-between align-items-baseline">
                <span className="fs-5 fw-bold">{f.taller.nombre}</span>
                <span className="text-secondary small">{f.promedio !== null ? `suele demorar ${f.promedio} días` : ''}</span>
              </div>
              {f.tandas.length === 0 ? (
                <div className="text-success fw-bold mt-1">✓ No te debe nada</div>
              ) : (
                <>
                  <div className="fs-4 fw-bold">{f.tandas.length} {f.tandas.length === 1 ? 'tanda' : 'tandas'} · {f.polos} polos</div>
                  <div className="small text-secondary mb-2">Al recoger pagas {soles(f.aPagar)}</div>
                  {f.tandas.map((x) => (
                    <button key={x.tanda.id} className="btn btn-light border w-100 text-start d-flex align-items-center gap-2 mb-2" onClick={() => ir('tanda', x.tanda.id)}>
                      <span className="d-flex gap-1">{coloresDeTelas(x.tanda, datos).slice(0, 6).map((c) => <Muestra key={c} color={c} tam="1rem" />)}</span>
                      <span className="flex-grow-1">{nombreTanda(x.tanda)} · {x.polos} polos</span>
                      {x.atraso > 0
                        ? <span className="badge text-bg-danger">⚠️ {x.atraso} {x.atraso === 1 ? 'día' : 'días'} de atraso</span>
                        : <span className="badge text-bg-light border">hace {x.dias} {x.dias === 1 ? 'día' : 'días'}</span>}
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div></div>
  )
}

export function FormTaller({ datos, guardar, taller, onListo, onCreado }) {
  const [nombre, setNombre] = useState(taller ? taller.nombre : '')
  const [telefono, setTelefono] = useState(taller ? taller.telefono || '' : '')
  const [precio, setPrecio] = useState(taller ? String(taller.precio || '') : '')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const enviar = async () => {
    setError('')
    const n = nombre.trim()
    if (!n) return setError('Escribe el nombre del taller.')
    if (!numero(precio)) return setError('Escribe cuánto cobra por polo.')
    if ((datos.talleres || []).some((t) => t.nombre.trim().toLowerCase() === n.toLowerCase() && (!taller || String(t.id) !== String(taller.id)))) {
      return setError('Ya tienes un taller con ese nombre.')
    }
    setGuardando(true)
    try {
      const id = await guardar('talleres', { ...(taller ? { id: taller.id } : {}), nombre: n, telefono: telefono.trim(), precio: numero(precio) }, taller ? 'Taller actualizado' : `Taller «${n}» agregado`)
      if (onCreado) onCreado({ id, nombre: n, precio: numero(precio) })
      onListo()
    } catch (e) {
      setError('No se pudo guardar. Revisa el internet y vuelve a intentar.')
    } finally {
      setGuardando(false)
    }
  }
  return (
    <div className="border border-2 border-warning rounded-3 p-3 bg-white">
      <div className="row g-2">
        <div className="col-md-5">
          <label className="fw-bold mb-1" htmlFor="taller-nombre">Nombre</label>
          <input id="taller-nombre" className="form-control form-control-lg" placeholder="Ej: Taller Rosa" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </div>
        <div className="col-md-4">
          <label className="fw-bold mb-1" htmlFor="taller-telefono">Teléfono (WhatsApp)</label>
          <input id="taller-telefono" className="form-control form-control-lg" inputMode="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
        </div>
        <div className="col-md-3">
          <label className="fw-bold mb-1" htmlFor="taller-precio">Cobra por polo</label>
          <div className="input-group input-group-lg">
            <span className="input-group-text">S/</span>
            <input id="taller-precio" className="form-control" inputMode="decimal" value={precio} onChange={(e) => setPrecio(e.target.value)} />
          </div>
        </div>
      </div>
      {error && <div className="alert alert-danger py-2 mt-2 mb-0">{error}</div>}
      <div className="d-flex gap-2 mt-3">
        <button className="btn btn-marca btn-lg" disabled={guardando} onClick={enviar}>{guardando ? 'Guardando…' : taller ? 'Guardar cambios' : 'Agregar taller'}</button>
        <button className="btn btn-light btn-lg border" onClick={onListo}>Cancelar</button>
      </div>
    </div>
  )
}

// Lista de talleres: precio, teléfono y cuánto suelen demorar
export default function Talleres({ datos, guardar, borrar, ir, enVentana = false }) {
  const [creando, setCreando] = useState(false)
  const [editando, setEditando] = useState(null)
  const filas = pendientesPorTaller(datos)
  const whatsapp = (tel) => `https://wa.me/51${String(tel).replace(/\D/g, '').replace(/^51/, '')}`

  return (
    <>
      <div className={'d-flex flex-wrap align-items-center gap-3 mb-4 ' + (enVentana ? 'justify-content-end' : 'justify-content-between')}>
        {!enVentana && <h1 className="fw-bold mb-0">🏭 Talleres</h1>}
        {!creando && <button className="btn btn-warning btn-lg fw-bold" onClick={() => setCreando(true)}>＋ Agregar taller</button>}
      </div>
      {creando && <div className="mb-4"><FormTaller datos={datos} guardar={guardar} onListo={() => setCreando(false)} /></div>}
      {filas.length === 0 && !creando && (
        <div className="card border-0 shadow-sm"><div className="card-body p-5 text-center fs-5 text-secondary">Agrega tus talleres para saber qué tiene cada uno.</div></div>
      )}
      <div className="row g-3">
        {filas.map((f) => {
          const usado = (datos.tandas || []).some((t) => String(t.tallerId) === String(f.taller.id))
          return (
            <div className="col-md-6" key={f.taller.id}>
              <div className="card border-0 shadow-sm h-100"><div className="card-body p-4">
                {editando === f.taller.id ? (
                  <FormTaller datos={datos} guardar={guardar} taller={f.taller} onListo={() => setEditando(null)} />
                ) : (
                  <>
                    <div className="d-flex align-items-start gap-2">
                      <div className="flex-grow-1">
                        <div className="fs-3 fw-bold text-marca">{f.taller.nombre}</div>
                        <div className="text-secondary">Cobra {soles(f.taller.precio)} por polo{f.promedio !== null && ` · suele demorar ${f.promedio} días`}</div>
                      </div>
                      <button className="btn btn-sm btn-outline-secondary" onClick={() => setEditando(f.taller.id)}>Editar</button>
                      {!usado && <BotonBorrar onConfirmar={() => borrar('talleres', f.taller.id, 'Taller borrado')} />}
                    </div>
                    {f.taller.telefono && (
                      <a className="btn btn-success mt-2" href={whatsapp(f.taller.telefono)} target="_blank" rel="noreferrer">💬 WhatsApp</a>
                    )}
                    <div className="mt-3 fw-bold">{f.tandas.length ? `Pendiente: ${f.tandas.length} ${f.tandas.length === 1 ? 'tanda' : 'tandas'}, ${f.polos} polos` : 'No tiene tandas pendientes'}</div>
                    {f.tandas.map((x) => (
                      <div key={x.tanda.id} className="small text-secondary">
                        {nombreTanda(x.tanda)} · mandada el {fechaCorta(x.tanda.fechaEnvio)}{x.tanda.fechaEstimada && ` · estimado ${fechaCorta(x.tanda.fechaEstimada)}`}
                      </div>
                    ))}
                  </>
                )}
              </div></div>
            </div>
          )
        })}
      </div>
    </>
  )
}
