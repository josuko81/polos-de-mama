import React, { useState } from 'react'
import { MODELOS } from '../calc.js'

// Formulario corto para crear (o renombrar) un diseño. Devuelve el id con onListo.
export default function NuevoDiseno({ datos, guardar, onListo, onCancelar, diseno = null }) {
  const [nombre, setNombre] = useState(diseno ? diseno.nombre : '')
  const [cuello, setCuello] = useState(diseno ? diseno.cuello : '')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const enviar = async () => {
    setError('')
    const n = nombre.trim()
    if (!n) return setError('Escribe el nombre del diseño.')
    if (!cuello) return setError('Elige el cuello: redondo o V.')
    const repetido = (datos.disenos || []).find((d) => d.nombre.trim().toLowerCase() === n.toLowerCase() && (!diseno || String(d.id) !== String(diseno.id)))
    if (repetido) return setError(`Ya tienes un diseño llamado «${repetido.nombre}». Elige otro nombre.`)
    setGuardando(true)
    try {
      const id = await guardar('disenos', { ...(diseno ? { id: diseno.id } : {}), nombre: n, cuello }, diseno ? 'Diseño actualizado' : `Diseño «${n}» creado`)
      if (onListo) onListo(id)
    } catch (e) {
      setError('No se pudo guardar. Revisa el internet y vuelve a intentar.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="border border-2 border-warning rounded-3 p-3 bg-white">
      <label htmlFor="nombre-diseno" className="fw-bold mb-2">Nombre del diseño</label>
      <input id="nombre-diseno" className="form-control form-control-lg mb-3" placeholder="Ej: Clásico, Rayas, Oversize…" autoFocus
        value={nombre} onChange={(e) => setNombre(e.target.value)} />
      <div className="fw-bold mb-2">Cuello</div>
      <div className="d-flex flex-wrap gap-2 mb-3">
        {MODELOS.map((m) => (
          <button key={m} type="button" className={'btn btn-lg btn-outline-secondary opcion flex-fill ' + (cuello === m ? 'active' : '')} onClick={() => setCuello(m)}>
            <span className="me-2">{m === 'Cuello V' ? 'Ⅴ' : '◯'}</span>{m}
          </button>
        ))}
      </div>
      {error && <div className="alert alert-danger py-2">{error}</div>}
      <div className="d-flex gap-2">
        <button className="btn btn-marca btn-lg flex-fill" disabled={guardando} onClick={enviar}>
          {guardando ? <><span className="spinner-border spinner-border-sm me-2" />Guardando…</> : diseno ? 'Guardar cambios' : 'Crear diseño'}
        </button>
        {onCancelar && <button className="btn btn-light btn-lg border" disabled={guardando} onClick={onCancelar}>Cancelar</button>}
      </div>
    </div>
  )
}
