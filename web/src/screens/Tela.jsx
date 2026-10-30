import React, { useState } from 'react'
import { fraccionUsada, telaDisponible, usosDeTela, nombreTanda, soles, fechaCorta } from '../calc.js'
import Muestra from './Muestra.jsx'
import BotonBorrar from './BotonBorrar.jsx'

const redondear = (n) => Math.round(n * 10) / 10

// Almacén de tela: lo que se compró y todavía no se corta (o se cortó solo una parte)
export default function Tela({ datos, guardar, borrar, ir }) {
  const [verAcabadas, setVerAcabadas] = useState(false)
  const telas = [...(datos.telas || [])].sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)))
  const disponibles = telas.filter((t) => telaDisponible(t, datos))
  const acabadas = telas.filter((t) => !telaDisponible(t, datos))
  const kilosQuedan = (t) => redondear(Number(t.kilos || 0) * (1 - fraccionUsada(t, datos)))
  const totalKg = redondear(disponibles.reduce((s, t) => s + kilosQuedan(t), 0))

  const Tarjeta = ({ t }) => {
    const usado = fraccionUsada(t, datos)
    const usos = usosDeTela(t, datos)
    return (
      <div className="card border-0 shadow-sm h-100"><div className="card-body p-3">
        <div className="d-flex align-items-center gap-3 mb-2">
          <Muestra color={t.color} tam="2.4rem" />
          <div className="flex-grow-1">
            <div className="fs-5 fw-bold text-capitalize">{t.color}</div>
            <div className="small text-secondary">Comprada el {fechaCorta(t.fecha)} · {t.rollos} {Number(t.rollos) === 1 ? 'rollo' : 'rollos'} · {t.kilos} kg · {soles(t.costo)}</div>
          </div>
        </div>
        <div className="progress mb-1" style={{ height: '0.8rem' }}>
          <div className="progress-bar bg-warning" style={{ width: `${usado * 100}%` }} />
        </div>
        <div className="d-flex justify-content-between small mb-2">
          <span>Usado {Math.round(usado * 100)}%</span>
          {telaDisponible(t, datos) ? <b>Queda aprox. {kilosQuedan(t)} kg</b> : <b>Se acabó</b>}
        </div>
        {usos.length > 0 && (
          <div className="small text-secondary mb-2">
            {usos.map((u, i) => <div key={i}>✂️ {nombreTanda(u.tanda)} · {u.fraccion >= 0.999 ? 'toda' : u.fraccion === 0.5 ? 'la mitad' : `${Math.round(u.fraccion * 100)}%`}</div>)}
          </div>
        )}
        <div className="d-flex gap-2">
          {telaDisponible(t, datos) && (
            <BotonBorrar texto="Se acabó (bota el resto)" onConfirmar={() => guardar('telas', { id: t.id, acabada: true }, 'Tela marcada como acabada')} />
          )}
          {!telaDisponible(t, datos) && t.acabada && usado < 0.999 && (
            <button className="btn btn-sm btn-outline-secondary" onClick={() => guardar('telas', { id: t.id, acabada: false }, 'Tela de vuelta en el almacén')}>Todavía queda</button>
          )}
          {usos.length === 0 && <BotonBorrar texto="Borrar" onConfirmar={() => borrar('telas', t.id, 'Tela borrada')} />}
        </div>
      </div></div>
    )
  }

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="fw-bold mb-1">📦 Almacén de tela</h1>
          <p className="fs-5 text-secondary mb-0">{disponibles.length} telas disponibles · aprox. {totalKg} kg</p>
        </div>
        <button className="btn btn-warning btn-lg fw-bold px-4 py-3" onClick={() => ir('compra-tela')}>＋ Compré tela</button>
      </div>

      {disponibles.length === 0 && (
        <div className="card border-0 shadow-sm mb-4"><div className="card-body p-5 text-center fs-5 text-secondary">
          No hay tela en el almacén. Cuando compres, toca «Compré tela».
        </div></div>
      )}
      <div className="row g-3 mb-4">
        {disponibles.map((t) => <div className="col-md-6 col-xl-4" key={t.id}><Tarjeta t={t} /></div>)}
      </div>

      {acabadas.length > 0 && (
        <>
          <button className="btn btn-link px-0 fs-5" onClick={() => setVerAcabadas(!verAcabadas)}>
            {verAcabadas ? '▾' : '▸'} Telas que ya se acabaron ({acabadas.length})
          </button>
          {verAcabadas && (
            <div className="row g-3 mt-1 opacity-75">
              {acabadas.map((t) => <div className="col-md-6 col-xl-4" key={t.id}><Tarjeta t={t} /></div>)}
            </div>
          )}
        </>
      )}
    </>
  )
}
