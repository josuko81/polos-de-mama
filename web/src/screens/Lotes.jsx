import React from 'react'
import { PASOS, etapaDe, nombreLote, costoTotalLote, costoPorPolo, stockDeLote, soles, fechaCorta } from '../calc.js'
import Muestra from './Muestra.jsx'
import { FotoMini } from './Fotos.jsx'

// Columnas del tablero: una por etapa, más los lotes ya vendidos por completo
const COLUMNAS = [
  ...PASOS.map((p) => ({ id: p.n, titulo: p.estado, icono: p.icono, color: p.color })),
  { id: 'agotado', titulo: 'Vendido todo', icono: '📦', color: 'dark' },
]

const columnaDe = (l, ventas) => {
  const e = etapaDe(l) || 1
  return e >= 3 && stockDeLote(l, ventas) <= 0 ? 'agotado' : e
}

function Tarjeta({ l, datos, ir }) {
  const e = etapaDe(l) || 1
  const sig = e < PASOS.length ? PASOS[e] : null
  const cu = costoPorPolo(l)
  const fila = (texto, valor) => <div className="d-flex justify-content-between"><span className="text-secondary">{texto}</span><b>{valor}</b></div>
  return (
    <div className="card border-0 shadow-sm cursor-pointer tarjeta-lote" onClick={() => ir('lote', l.id)}>
      <div className="card-body p-3">
        <div className="d-flex align-items-center gap-3 mb-2">
          <FotoMini lote={l} tam="3.5rem" />
          <div className="flex-grow-1">
            <div className="small text-secondary">Lote {l.id} · {fechaCorta(l.fecha)}</div>
            <div className="fs-5 fw-bold d-flex align-items-center gap-2"><Muestra color={l.color} />{nombreLote(l)}</div>
          </div>
        </div>
        {e === 1 && (l.rollos > 0 || l.kilos > 0) && fila('Tela', [l.rollos > 0 && `${l.rollos} ${l.rollos == 1 ? 'rollo' : 'rollos'}`, l.kilos > 0 && `${l.kilos} kg`].filter(Boolean).join(' · '))}
        {e === 1 && fila('Costó', soles(l.tela))}
        {e === 2 && fila('Polos en el taller', l.enviados)}
        {e === 2 && l.confeccion > 0 && fila('Al taller le pagas', soles(l.enviados * l.confeccion))}
        {e >= 3 && fila('Quedan', `${stockDeLote(l, datos.ventas)} de ${l.recibidos}`)}
        {e >= 3 && cu !== null && fila('Cada polo cuesta', soles(cu))}
        {e === 2 && fila('Gastado hasta ahora', soles(costoTotalLote(l)))}
        <button className={'btn w-100 mt-3 fw-bold ' + (sig ? 'btn-marca' : 'btn-outline-secondary')}>
          {sig ? `Actualizar: ${sig.icono} ${sig.titulo}` : 'Ver lote →'}
        </button>
      </div>
    </div>
  )
}

export default function Lotes({ datos, ir }) {
  const lotes = [...datos.lotes].sort((a, b) => Number(b.id) - Number(a.id))
  const grupos = Object.fromEntries(COLUMNAS.map((c) => [c.id, lotes.filter((l) => columnaDe(l, datos.ventas) === c.id)]))

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="fw-bold mb-1">🧵 Mis lotes</h1>
          <p className="fs-5 text-secondary mb-0">Mira en qué etapa está cada lote. Tócalo para actualizarlo.</p>
        </div>
        <button className="btn btn-warning btn-lg fw-bold px-4 py-3" onClick={() => ir('lote', 'nuevo')}>＋ Nuevo lote (compré tela)</button>
      </div>

      {lotes.length === 0 && (
        <div className="card border-0 shadow-sm"><div className="card-body p-5 text-center fs-5 text-secondary">
          Aún no tienes lotes. Cuando compres tela, toca «Nuevo lote».
        </div></div>
      )}

      {lotes.length > 0 && (
        <div className="row g-3">
          {COLUMNAS.map((c) => (
            <div className="col-md-6 col-xl-3" key={c.id}>
              <div className={`columna-lote border-top border-4 border-${c.color} rounded-3 p-3 h-100`}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h2 className="fs-5 fw-bold mb-0">{c.icono} {c.titulo}</h2>
                  <span className={`badge rounded-pill text-bg-${c.color} fs-6`}>{grupos[c.id].length}</span>
                </div>
                <div className="d-flex flex-column gap-3">
                  {grupos[c.id].map((l) => <Tarjeta key={l.id} l={l} datos={datos} ir={ir} />)}
                  {grupos[c.id].length === 0 && <div className="text-secondary small text-center py-3">Ninguno</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
