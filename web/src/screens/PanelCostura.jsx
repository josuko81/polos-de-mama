import React from 'react'
import { etapaTanda, cortadosDeTanda, recibidosDeTanda, disenoPorId, nombreTanda, diasEntre, hoy } from '../calc.js'
import { FotoMini } from './Fotos.jsx'

// Para Inicio: las tandas que están en costura (lo que el taller todavía debe entregar) y lo demás en proceso
export default function PanelCostura({ datos, ir }) {
  const tandas = datos.tandas || []
  const enCostura = tandas.filter((t) => etapaTanda(t) === 2)
    .map((t) => ({ t, dias: t.fechaEnvio ? diasEntre(t.fechaEnvio, hoy()) : null }))
    .sort((a, b) => (b.dias || 0) - (a.dias || 0))
  const estampando = tandas.filter((t) => etapaTanda(t) === 1)
  const empaquetando = tandas.filter((t) => etapaTanda(t) === 3)
  if (!enCostura.length && !estampando.length && !empaquetando.length) return null

  return (
    <div className="card border-0 shadow-sm mb-4"><div className="card-body p-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <h2 className="fs-4 fw-bold mb-0">🏭 En costura: {enCostura.reduce((s, x) => s + cortadosDeTanda(x.t), 0)} polos</h2>
        <button className="btn btn-sm btn-outline-secondary" onClick={() => ir('produccion')}>Ver producción →</button>
      </div>
      {enCostura.length === 0 && <div className="text-secondary mb-2">No hay tandas en el taller.</div>}
      <div className="row g-2">
        {enCostura.map(({ t, dias }) => {
          const d = disenoPorId(t.disenoId)
          return (
            <div className="col-md-6 col-xl-4" key={t.id}>
              <button className="btn btn-light border w-100 text-start d-flex align-items-center gap-2" onClick={() => ir('tanda', t.id)}>
                {d && <FotoMini de={d} tam="2.4rem" />}
                <span className="flex-grow-1">
                  <span className="d-block fw-bold">{nombreTanda(t)}</span>
                  <span className="d-block small text-secondary">{cortadosDeTanda(t)} polos</span>
                </span>
                {dias !== null && <span className={'badge ' + (dias >= 7 ? 'text-bg-danger' : 'text-bg-light border')}>hace {dias} {dias === 1 ? 'día' : 'días'}</span>}
              </button>
            </div>
          )
        })}
      </div>
      {(estampando.length > 0 || empaquetando.length > 0) && (
        <div className="small text-secondary mt-3">
          {estampando.length > 0 && <span className="me-3">🎨 Estampando: {estampando.reduce((s, t) => s + cortadosDeTanda(t), 0)} polos</span>}
          {empaquetando.length > 0 && <span>🧼 Por empaquetar: {empaquetando.reduce((s, t) => s + recibidosDeTanda(t), 0)} polos</span>}
        </div>
      )}
    </div></div>
  )
}
