import React, { useState } from 'react'
import { ETAPAS_TANDA, etapaTanda, coloresDeTanda, cortadosDeTanda, recibidosDeTanda, stockDeTanda, tallerPorId, disenoPorId, nombreTanda, diasEntre, hoy, fechaCorta } from '../calc.js'
import Muestra from './Muestra.jsx'
import { FotoMini } from './Fotos.jsx'
import Ventana from './Ventana.jsx'
import NuevaTanda from './NuevaTanda.jsx'
import TandaDetalle from './TandaDetalle.jsx'

// Las tandas ya vendidas por completo no se muestran: eso se ve en «¿Cómo me va?»
const COLUMNAS = ETAPAS_TANDA.map((e) => ({ id: e.n, titulo: e.estado, icono: e.icono, color: e.color }))
const SIGUIENTE = { 1: '🏭 Mandar al taller', 2: '🧼 Recogí', 3: '✅ Empaqueté' }

function Tarjeta({ t, datos, ir }) {
  const e = etapaTanda(t)
  const tl = tallerPorId(datos, t.tallerId)
  const dias = t.fechaEnvio ? diasEntre(t.fechaEnvio, hoy()) : null
  const atraso = e === 2 && t.fechaEstimada ? Math.max(0, diasEntre(t.fechaEstimada, hoy())) : 0
  const fila = (texto, valor) => <div className="d-flex justify-content-between"><span className="text-secondary">{texto}</span><b>{valor}</b></div>
  const d = disenoPorId(t.disenoId)
  return (
    <div className={'card border-0 shadow-sm cursor-pointer tarjeta-lote ' + (atraso ? 'border border-2 border-danger' : '')} onClick={() => ir('tanda', t.id)}>
      <div className="card-body p-3">
        <div className="d-flex align-items-center gap-3 mb-2">
          {d && <FotoMini de={d} tam="3.2rem" />}
          <div className="flex-grow-1">
            <div className="small text-secondary">Cortada el {fechaCorta(t.fecha)}</div>
            <div className="fs-5 fw-bold">{nombreTanda(t)}</div>
            <div className="d-flex flex-wrap gap-1 mt-1">{coloresDeTanda(t).map((c, i) => <Muestra key={i} color={c.color} tam="1rem" />)}</div>
          </div>
        </div>
        {e <= 2 && fila('Polos', cortadosDeTanda(t))}
        {e === 2 && tl && fila('Taller', tl.nombre)}
        {e === 2 && dias !== null && fila('Lleva', `${dias} ${dias === 1 ? 'día' : 'días'}`)}
        {atraso > 0 && <div className="badge text-bg-danger w-100 mt-1">⚠️ {atraso} {atraso === 1 ? 'día' : 'días'} de atraso</div>}
        {e === 3 && fila('Por empaquetar', recibidosDeTanda(t))}
        {e >= 4 && fila('Quedan', `${stockDeTanda(t, datos)} de ${recibidosDeTanda(t)}`)}
        <button className={'btn w-100 mt-3 fw-bold ' + (SIGUIENTE[e] ? 'btn-marca' : 'btn-outline-secondary')}>{SIGUIENTE[e] ? `Actualizar: ${SIGUIENTE[e]}` : 'Ver tanda →'}</button>
      </div>
    </div>
  )
}

// Tablero de producción: cada tanda en la columna de su etapa.
// Crear y actualizar tandas se hace en una ventana encima del tablero (`abrir` llega de otras pantallas).
export default function Produccion(props) {
  const { datos, ir: irApp, abrir = null } = props
  const [ventana, setVentana] = useState(abrir) // null | { tipo: 'nueva' } | { tipo: 'tanda', id }
  // Dentro de la ventana, "ir" a producción la cierra y "ir" a una tanda la cambia
  const ir = (p, id = null) => {
    if (p === 'nueva-tanda') setVentana({ tipo: 'nueva' })
    else if (p === 'tanda') setVentana({ tipo: 'tanda', id })
    else if (p === 'produccion') setVentana(null)
    else { setVentana(null); irApp(p, id) }
  }
  const tandaAbierta = ventana && ventana.tipo === 'tanda' ? (datos.tandas || []).find((t) => String(t.id) === String(ventana.id)) : null
  const tandas = [...(datos.tandas || [])].sort((a, b) => Number(b.id) - Number(a.id))
  const columna = (t) => (etapaTanda(t) >= 4 && stockDeTanda(t, datos) <= 0 ? 'agotada' : etapaTanda(t))
  const grupos = Object.fromEntries(COLUMNAS.map((c) => [c.id, tandas.filter((t) => columna(t) === c.id)]))
  const lotesAntiguos = datos.lotes.length

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="fw-bold mb-1">✂️ Producción</h1>
          <p className="fs-5 text-secondary mb-0">Cada tanda en su etapa. Tócala para actualizarla.</p>
        </div>
        <button className="btn btn-warning btn-lg fw-bold px-4" onClick={() => ir('nueva-tanda')}>＋ Nueva tanda (corté)</button>
      </div>

      {tandas.length === 0 && (
        <div className="card border-0 shadow-sm mb-3"><div className="card-body p-5 text-center fs-5 text-secondary">
          Aún no hay tandas. Cuando cortes, toca «Nueva tanda».
        </div></div>
      )}

      {tandas.length > 0 && (
        <div className="row g-3">
          {COLUMNAS.map((c) => (
            <div className="col-md-6 col-xl" key={c.id}>
              <div className={`columna-lote border-top border-4 border-${c.color} rounded-3 p-3 h-100`}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h2 className="fs-5 fw-bold mb-0">{c.icono} {c.titulo}</h2>
                  <span className={`badge rounded-pill text-bg-${c.color} fs-6`}>{grupos[c.id].length}</span>
                </div>
                <div className="d-flex flex-column gap-3">
                  {grupos[c.id].map((t) => <Tarjeta key={t.id} t={t} datos={datos} ir={ir} />)}
                  {grupos[c.id].length === 0 && <div className="text-secondary small text-center py-3">Ninguna</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {lotesAntiguos > 0 && (
        <button className="btn btn-link px-0 mt-3 fs-5" onClick={() => ir('lotes')}>Ver lotes anteriores ({lotesAntiguos}) →</button>
      )}

      {ventana && ventana.tipo === 'nueva' && (
        <Ventana titulo="✂️ Nueva tanda" onCerrar={() => setVentana(null)}>
          <NuevaTanda {...props} ir={ir} enVentana />
        </Ventana>
      )}
      {ventana && ventana.tipo === 'tanda' && (
        <Ventana titulo={tandaAbierta ? nombreTanda(tandaAbierta) : 'Tanda'} onCerrar={() => setVentana(null)}>
          <TandaDetalle key={ventana.id} {...props} tandaId={ventana.id} ir={ir} enVentana />
        </Ventana>
      )}
    </>
  )
}
