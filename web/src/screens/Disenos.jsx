import React, { useState } from 'react'
import { TALLAS, productos, etapaDe, etapaTanda, cortadosDeTanda, recibidosDeTanda, sumaTallas, fotosDe, tallasDeDiseno } from '../calc.js'
import NuevoDiseno from './NuevoDiseno.jsx'
import BotonBorrar from './BotonBorrar.jsx'
import Fotos, { FotoMini } from './Fotos.jsx'

// Catálogo de diseños: cada uno suma su stock por talla de todos sus lotes y tandas
export default function Disenos({ datos, guardar, borrar, ir }) {
  const [creando, setCreando] = useState(false)
  const [editando, setEditando] = useState(null)
  const disenos = [...(datos.disenos || [])].sort((a, b) => a.nombre.localeCompare(b.nombre))
  const prods = productos(datos)

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="fw-bold mb-1">👕 Diseños</h1>
          <p className="fs-5 text-secondary mb-0">Cada diseño suma por talla los polos de todas sus tandas.</p>
        </div>
        {!creando && <button className="btn btn-warning btn-lg fw-bold px-4 py-3" onClick={() => setCreando(true)}>＋ Nuevo diseño</button>}
      </div>

      {creando && (
        <div className="mb-4" style={{ maxWidth: '36rem' }}>
          <NuevoDiseno datos={datos} guardar={guardar} onListo={() => setCreando(false)} onCancelar={() => setCreando(false)} />
        </div>
      )}

      {disenos.length === 0 && !creando && (
        <div className="card border-0 shadow-sm"><div className="card-body p-5 text-center fs-5 text-secondary">
          Aún no tienes diseños. Toca «Nuevo diseño» y ponle un nombre, por ejemplo «Clásico».
        </div></div>
      )}

      <div className="row g-3">
        {disenos.map((d) => {
          const suyos = prods.filter((p) => String(p.disenoId) === String(d.id))
          const total = suyos.reduce((s, p) => s + p.quedan, 0)
          const lotes = datos.lotes.filter((l) => String(l.disenoId) === String(d.id))
          const tandas = (datos.tandas || []).filter((t) => String(t.disenoId) === String(d.id))
          const enTaller = lotes.filter((l) => etapaDe(l) === 2).reduce((s, l) => s + (sumaTallas(l.enviadosT) || Number(l.enviados) || 0), 0)
            + tandas.filter((t) => etapaTanda(t) <= 2).reduce((s, t) => s + cortadosDeTanda(t), 0)
          const empaquetando = lotes.filter((l) => etapaDe(l) === 3).reduce((s, l) => s + (sumaTallas(l.recibidosT) || Number(l.recibidos) || 0), 0)
            + tandas.filter((t) => etapaTanda(t) === 3).reduce((s, t) => s + recibidosDeTanda(t), 0)
          const conFoto = fotosDe(d).length ? d : lotes.find((l) => fotosDe(l).length)
          const celda = (talla) => suyos.filter((p) => p.talla === talla).reduce((s, p) => s + p.quedan, 0)
          const sinTalla = celda('')
          return (
            <div className="col-lg-6" key={d.id}>
              <div className="card border-0 shadow-sm h-100"><div className="card-body p-4">
                {editando === d.id ? (
                  <NuevoDiseno datos={datos} guardar={guardar} diseno={d} onListo={() => setEditando(null)} onCancelar={() => setEditando(null)} />
                ) : (
                  <div className="d-flex align-items-center gap-3 mb-3">
                    {conFoto && <FotoMini de={conFoto} tam="5rem" />}
                    <div className="flex-grow-1">
                      <div className="fs-3 fw-bold text-marca">{d.nombre}</div>
                      <div className="mb-1">
                        <span className={'badge me-1 ' + (d.tipo === 'Con estampado' ? 'text-bg-warning' : 'text-bg-light border')}>{d.tipo === 'Con estampado' ? '🎨 Con estampado' : '⬜ Liso'}</span>
                        <span className="badge text-bg-light border me-1">{d.cuello}</span>
                        {tallasDeDiseno(d).map((t) => <span key={t} className="badge text-bg-light border me-1">{t}</span>)}
                      </div>
                      <div className="text-secondary">
                        {total} en stock{enTaller > 0 && ` · ${enTaller} en el taller`}{empaquetando > 0 && ` · ${empaquetando} empaquetando`}
                      </div>
                    </div>
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => setEditando(d.id)}>Editar</button>
                    {lotes.length === 0 && tandas.length === 0 && <BotonBorrar onConfirmar={() => borrar('disenos', d.id, 'Diseño borrado')} />}
                  </div>
                )}

                {total === 0 ? (
                  <div className="text-secondary">Sin polos en stock todavía.</div>
                ) : (
                  <table className="table align-middle mb-0 text-center">
                    <thead><tr>{TALLAS.map((t) => <th key={t}>{t}</th>)}{sinTalla > 0 && <th>Sin talla</th>}<th>Total</th></tr></thead>
                    <tbody>
                      <tr>
                        {TALLAS.map((t) => <td key={t} className={'fs-4 ' + (celda(t) ? 'fw-bold' : 'text-secondary')}>{celda(t) || '–'}</td>)}
                        {sinTalla > 0 && <td className="fs-4 fw-bold">{sinTalla}</td>}
                        <td className="fs-4 fw-bold text-marca">{total}</td>
                      </tr>
                    </tbody>
                  </table>
                )}

                <Fotos registro={d} tipo="disenos" titulo={d.tipo === 'Con estampado' ? 'Fotos del estampado' : 'Fotos del diseño'} guardar={guardar} sinTarjeta />
              </div></div>
            </div>
          )
        })}
      </div>
    </>
  )
}
