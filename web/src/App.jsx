import React, { useEffect, useState } from 'react'
import { api, modoPrueba } from './api.js'
import Inicio from './screens/Inicio.jsx'
import Vendi from './screens/Vendi.jsx'
import Gaste from './screens/Gaste.jsx'
import Lotes from './screens/Lotes.jsx'
import LoteDetalle from './screens/LoteDetalle.jsx'
import Resumen from './screens/Resumen.jsx'

const MENU = [
  { id: 'inicio', texto: 'Inicio', icono: '🏠' },
  { id: 'vendi', texto: 'Vendí', icono: '💰' },
  { id: 'gaste', texto: 'Gasté', icono: '🧾' },
  { id: 'lotes', texto: 'Mis lotes', icono: '🧵' },
  { id: 'resumen', texto: '¿Cómo me va?', icono: '📊' },
]

export default function App() {
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState('')
  const [pantalla, setPantalla] = useState('inicio')
  const [loteId, setLoteId] = useState(null)
  const [aviso, setAviso] = useState('')

  useEffect(() => {
    api.getData().then(setDatos).catch((e) => setError(String(e && e.message ? e.message : e)))
  }, [])

  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(''), 3500)
    return () => clearTimeout(t)
  }, [aviso])

  const ir = (p, id = null) => {
    setPantalla(p)
    setLoteId(id)
    window.scrollTo(0, 0)
  }

  // Guarda y avisa. Devuelve el id guardado.
  const guardar = async (tipo, obj, mensaje) => {
    const r = await api.guardar(tipo, obj)
    setDatos(r.datos)
    if (mensaje) setAviso(mensaje)
    return r.id
  }
  const borrar = async (tipo, id, mensaje) => {
    const r = await api.borrar(tipo, id)
    setDatos(r.datos)
    if (mensaje) setAviso(mensaje)
  }

  const props = { datos, ir, guardar, borrar }

  return (
    <>
      <nav className="navbar navbar-dark navbar-marca shadow-sm">
        <div className="container-xl">
          <span className="navbar-brand fw-bold fs-3 cursor-pointer" onClick={() => ir('inicio')}>
            👕 Polos de Mamá
          </span>
          <div className="d-flex flex-wrap gap-2">
            {MENU.map((m) => (
              <button
                key={m.id}
                className={'btn btn-lg ' + (pantalla === m.id || (m.id === 'lotes' && pantalla === 'lote') ? 'btn-light fw-bold' : 'btn-outline-light')}
                onClick={() => ir(m.id)}
              >
                {m.icono} {m.texto}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {modoPrueba && (
        <div className="bg-warning-subtle text-warning-emphasis text-center small py-1">
          Modo de prueba: los datos son de ejemplo y se guardan solo en este navegador.
        </div>
      )}

      <main className="container-xl py-4">
        {error && <div className="alert alert-danger fs-5">No se pudieron cargar los datos. {error}</div>}
        {!datos && !error && (
          <div className="text-center py-5">
            <div className="spinner-border text-success" style={{ width: '3rem', height: '3rem' }} />
            <p className="mt-3 fs-5">Cargando tus cuentas…</p>
          </div>
        )}
        {datos && pantalla === 'inicio' && <Inicio {...props} />}
        {datos && pantalla === 'vendi' && <Vendi {...props} />}
        {datos && pantalla === 'gaste' && <Gaste {...props} />}
        {datos && pantalla === 'lotes' && <Lotes {...props} />}
        {datos && pantalla === 'lote' && <LoteDetalle key={loteId} {...props} loteId={loteId} />}
        {datos && pantalla === 'resumen' && <Resumen {...props} />}
      </main>

      {aviso && <div className="alert alert-success shadow aviso fs-5 text-center">✅ {aviso}</div>}
    </>
  )
}
