import React, { useState } from 'react'
import BotonBorrar from './BotonBorrar.jsx'
import Fotos, { FotoMini } from './Fotos.jsx'

// Formulario corto para crear o renombrar un material. onListo recibe el id.
export function FormMaterial({ datos, guardar, material = null, onListo, onCancelar }) {
  const [nombre, setNombre] = useState(material ? material.nombre : '')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const enviar = async (e) => {
    e.preventDefault()
    setError('')
    const n = nombre.trim()
    if (!n) return setError('Escribe el nombre del material.')
    if ((datos.materiales || []).some((x) => x.nombre.trim().toLowerCase() === n.toLowerCase() && (!material || String(x.id) !== String(material.id)))) {
      return setError('Ya tienes un material con ese nombre.')
    }
    setGuardando(true)
    try {
      const id = await guardar('materiales', { ...(material ? { id: material.id } : {}), nombre: n }, material ? 'Material actualizado' : `Material «${n}» creado`)
      onListo(id)
    } catch (err) {
      setError('No se pudo guardar. Revisa el internet y vuelve a intentar.')
    } finally {
      setGuardando(false)
    }
  }
  return (
    <form className="border border-2 border-warning rounded-3 p-3 bg-white" onSubmit={enviar}>
      <label htmlFor="nombre-material" className="fw-bold mb-2">Nombre del material</label>
      <input id="nombre-material" className="form-control form-control-lg mb-3" placeholder="Ej: Tela, Hilo, Etiquetas, Bolsas…" autoFocus value={nombre} onChange={(e) => setNombre(e.target.value)} />
      {error && <div className="alert alert-danger py-2">{error}</div>}
      <div className="d-flex gap-2">
        <button type="submit" className="btn btn-marca btn-lg flex-fill" disabled={guardando}>{guardando ? 'Guardando…' : material ? 'Guardar cambios' : 'Crear material'}</button>
        <button type="button" className="btn btn-light btn-lg border" disabled={guardando} onClick={onCancelar}>Cancelar</button>
      </div>
    </form>
  )
}

// Catálogo de materiales: nombre y foto, como los diseños
export default function Materiales({ datos, guardar, borrar }) {
  const [creando, setCreando] = useState(false)
  const [editando, setEditando] = useState(null)
  const materiales = [...(datos.materiales || [])].sort((a, b) => a.nombre.localeCompare(b.nombre))
  const usado = (m) => (datos.gastos || []).some((g) => String(g.materialId) === String(m.id))

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="fw-bold mb-1">🧵 Materiales</h1>
          <p className="fs-5 text-secondary mb-0">Lo que compras seguido. Al anotar una compra solo lo eliges.</p>
        </div>
        {!creando && <button className="btn btn-warning btn-lg fw-bold px-4 py-3" onClick={() => setCreando(true)}>＋ Nuevo material</button>}
      </div>
      {creando && <div className="mb-4" style={{ maxWidth: '36rem' }}><FormMaterial datos={datos} guardar={guardar} onListo={() => setCreando(false)} onCancelar={() => setCreando(false)} /></div>}
      {materiales.length === 0 && !creando && (
        <div className="card border-0 shadow-sm"><div className="card-body p-5 text-center fs-5 text-secondary">Aún no tienes materiales. Toca «Nuevo material», por ejemplo «Tela».</div></div>
      )}
      <div className="row g-3">
        {materiales.map((m) => (
          <div className="col-lg-6" key={m.id}>
            <div className="card border-0 shadow-sm h-100"><div className="card-body p-4">
              {editando === m.id ? (
                <FormMaterial datos={datos} guardar={guardar} material={m} onListo={() => setEditando(null)} onCancelar={() => setEditando(null)} />
              ) : (
                <div className="d-flex align-items-center gap-3">
                  <FotoMini de={m} tam="5rem" />
                  <div className="fs-3 fw-bold text-marca flex-grow-1">{m.nombre}</div>
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => setEditando(m.id)}>Editar</button>
                  {!usado(m) && <BotonBorrar onConfirmar={() => borrar('materiales', m.id, 'Material borrado')} />}
                </div>
              )}
              <Fotos registro={m} tipo="materiales" titulo="Fotos del material" guardar={guardar} sinTarjeta />
            </div></div>
          </div>
        ))}
      </div>
    </>
  )
}
