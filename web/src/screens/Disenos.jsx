import React, { useState } from 'react'
import { TALLAS, productos, etapaDe, sumaTallas, fotosDe } from '../calc.js'
import Muestra from './Muestra.jsx'
import NuevoDiseno from './NuevoDiseno.jsx'
import BotonBorrar from './BotonBorrar.jsx'
import { FotoMini } from './Fotos.jsx'

// Catálogo de diseños: cada uno guarda sus colores y tallas, sumando el stock de todos sus lotes
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
          <p className="fs-5 text-secondary mb-0">Cada diseño junta sus colores y tallas de todos los lotes.</p>
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
          const colores = [...new Set(suyos.map((p) => p.color))]
          const total = suyos.reduce((s, p) => s + p.quedan, 0)
          const lotes = datos.lotes.filter((l) => String(l.disenoId) === String(d.id))
          const enTaller = lotes.filter((l) => etapaDe(l) === 2).reduce((s, l) => s + (sumaTallas(l.enviadosT) || Number(l.enviados) || 0), 0)
          const conFoto = lotes.find((l) => fotosDe(l).length)
          const celda = (color, talla) => suyos.filter((p) => p.color === color && p.talla === talla).reduce((s, p) => s + p.quedan, 0)
          return (
            <div className="col-lg-6" key={d.id}>
              <div className="card border-0 shadow-sm h-100"><div className="card-body p-4">
                {editando === d.id ? (
                  <NuevoDiseno datos={datos} guardar={guardar} diseno={d} onListo={() => setEditando(null)} onCancelar={() => setEditando(null)} />
                ) : (
                  <div className="d-flex align-items-center gap-3 mb-3">
                    {conFoto && <FotoMini lote={conFoto} />}
                    <div className="flex-grow-1">
                      <div className="fs-3 fw-bold text-marca">{d.nombre}</div>
                      <div className="text-secondary">{d.cuello} · {total} en stock{enTaller > 0 && ` · ${enTaller} en el taller`}</div>
                    </div>
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => setEditando(d.id)}>Editar</button>
                    {lotes.length === 0 && <BotonBorrar onConfirmar={() => borrar('disenos', d.id, 'Diseño borrado')} />}
                  </div>
                )}

                {colores.length === 0 ? (
                  <div className="text-secondary">Sin polos en stock todavía.</div>
                ) : (
                  <table className="table align-middle mb-0 text-center">
                    <thead><tr><th className="text-start">Color</th>{TALLAS.map((t) => <th key={t}>{t}</th>)}<th>Total</th></tr></thead>
                    <tbody>
                      {colores.map((c) => (
                        <tr key={c}>
                          <td className="text-start text-capitalize"><span className="d-inline-flex align-items-center gap-2"><Muestra color={c} />{c}</span></td>
                          {TALLAS.map((t) => <td key={t} className={'fs-5 ' + (celda(c, t) ? 'fw-bold' : 'text-secondary')}>{celda(c, t) || '–'}</td>)}
                          <td className="fw-bold">{suyos.filter((p) => p.color === c).reduce((s, p) => s + p.quedan, 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div></div>
            </div>
          )
        })}
      </div>
    </>
  )
}
