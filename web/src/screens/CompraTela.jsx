import React, { useState } from 'react'
import { COLORES, colorHex, soles, hoy } from '../calc.js'
import Muestra from './Muestra.jsx'

const numero = (v) => Number(String(v ?? '').replace(',', '.')) || 0
const redondear = (n) => Math.round(n * 100) / 100

// Una compra de tela puede traer varios colores: cada color agregado se vuelve un lote
export default function CompraTela({ datos, guardarVarios, ir }) {
  const ultimo = [...datos.lotes, ...(datos.telas || [])].sort((a, b) => String(a.fecha).localeCompare(String(b.fecha))).reverse().find((l) => Number(l.precioKilo) > 0)
  const [precioKilo, setPrecioKilo] = useState(ultimo ? String(ultimo.precioKilo) : '')
  const [fecha, setFecha] = useState(hoy())
  const [color, setColor] = useState('')
  const [rollos, setRollos] = useState(1)
  const [kilos, setKilos] = useState('')
  const [lineas, setLineas] = useState([])
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const pk = numero(precioKilo)
  const kg = numero(kilos)
  const totalKilos = lineas.reduce((s, x) => s + x.kilos, 0)
  const totalRollos = lineas.reduce((s, x) => s + x.rollos, 0)

  const agregar = () => {
    setError('')
    if (!color.trim()) return setError('Elige el color de la tela.')
    if (!rollos || rollos < 1) return setError('Pon cuántos rollos son (al menos 1).')
    if (!kg) return setError('Pon cuántos kilos pesa cada rollo.')
    // Los kilos se anotan por rollo: cada rollo es un paquete aparte
    setLineas([...lineas, { color: color.trim().toLowerCase(), rollos, kilosRollo: kg, kilos: redondear(rollos * kg) }])
    setColor(''); setRollos(1); setKilos('')
  }

  const guardarCompra = async () => {
    setError('')
    if (!pk) return setError('Escribe a cuánto te vendieron el kilo.')
    if (!lineas.length) return setError('Agrega al menos un color a la compra.')
    setGuardando(true)
    try {
      const telas = lineas.map((x) => ({
        fecha, color: x.color, rollos: x.rollos, kilos: x.kilos, precioKilo: pk, costo: redondear(x.kilos * pk), acabada: false,
      }))
      await guardarVarios('telas', telas, telas.length === 1 ? 'Compra guardada: 1 tela al almacén' : `Compra guardada: ${telas.length} telas al almacén`)
      ir('tela')
    } catch (e) {
      setError('No se pudo guardar. Revisa el internet y vuelve a intentar.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <>
      <button className="btn btn-link px-0 mb-2 fs-5" onClick={() => ir('tela')}>← Almacén de tela</button>
      <h1 className="fw-bold mb-1">🧶 Compré tela</h1>
      <p className="fs-5 text-secondary mb-4">Agrega cada color que compraste. Todo queda en el almacén hasta que lo cortes.</p>

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm mb-3"><div className="card-body p-4">
            <div className="row g-3">
              <div className="col-md-6">
                <label htmlFor="precioKilo" className="fs-5 fw-bold mb-2">1. ¿A cuánto el kilo?</label>
                <div className="input-group input-group-lg">
                  <span className="input-group-text">S/</span>
                  <input id="precioKilo" className="form-control fs-4" inputMode="decimal" placeholder="0.00"
                    value={precioKilo} onChange={(e) => setPrecioKilo(e.target.value)} />
                </div>
                {ultimo && <div className="form-text">La última vez pagaste {soles(ultimo.precioKilo)} el kilo.</div>}
              </div>
              <div className="col-md-6">
                <label htmlFor="fecha" className="fs-5 fw-bold mb-2">Fecha de compra</label>
                <input id="fecha" type="date" className="form-control form-control-lg" value={fecha} onChange={(e) => setFecha(e.target.value)} />
              </div>
            </div>
          </div></div>

          <div className="card border-0 shadow-sm"><div className="card-body p-4">
            <div className="fs-5 fw-bold mb-3">2. Agrega cada color</div>
            <div className="d-flex flex-wrap gap-2">
              {COLORES.map((c) => (
                <button key={c.nombre} type="button" title={c.nombre}
                  className={'btn btn-outline-secondary opcion opcion-color d-flex flex-column align-items-center gap-1 p-2 ' + (color === c.nombre ? 'active' : '')}
                  onClick={() => setColor(c.nombre)}>
                  <Muestra color={c.nombre} tam="2.4rem" />
                  <span className="small">{c.nombre}</span>
                </button>
              ))}
            </div>
            <input className="form-control mt-3" placeholder="¿Otro color? Escríbelo aquí"
              value={colorHex(color) ? '' : color} onChange={(e) => setColor(e.target.value)} />

            <div className="row g-3 mt-1">
              <div className="col-md-6">
                <div className="fw-bold mb-2">¿Cuántos rollos de este color?</div>
                <div className="input-group input-group-lg">
                  <button className="btn btn-outline-secondary px-4 fw-bold" onClick={() => setRollos(Math.max(1, rollos - 1))}>−</button>
                  <input id="rollos" className="form-control text-center fw-bold fs-4" inputMode="numeric" value={rollos}
                    onChange={(e) => setRollos(parseInt(e.target.value.replace(/\D/g, ''), 10) || 0)} />
                  <button className="btn btn-outline-secondary px-4 fw-bold" onClick={() => setRollos(rollos + 1)}>+</button>
                </div>
              </div>
              <div className="col-md-6">
                <label htmlFor="kilos" className="fw-bold mb-2">¿Cuántos kilos pesa cada rollo?</label>
                <div className="input-group input-group-lg">
                  <input id="kilos" className="form-control fs-4" inputMode="decimal" placeholder="0" value={kilos} onChange={(e) => setKilos(e.target.value)} />
                  <span className="input-group-text">kg</span>
                </div>
              </div>
            </div>
            {kg > 0 && (
              <div className="mt-3 fs-5">
                {rollos} {rollos === 1 ? 'rollo' : 'rollos'} × {kg} kg = <b>{redondear(rollos * kg)} kg</b>
                {pk > 0 && <> · cuesta <b>{soles(rollos * kg * pk)}</b></>}
              </div>
            )}
            <button className="btn btn-warning btn-lg fw-bold w-100 mt-3 py-3" onClick={agregar}>＋ Agregar a la compra</button>
          </div></div>
        </div>

        <div className="col-lg-5">
          <div className="card border-0 shadow sticky-top" style={{ top: '1rem' }}>
            <div className="card-body p-4">
              <div className="fw-bold text-secondary mb-2">Tu compra</div>
              {lineas.length === 0 && <p className="text-secondary mb-0">Todavía no agregas colores.</p>}
              <div className="d-flex flex-column gap-2">
                {lineas.map((x, i) => (
                  <div key={i} className="d-flex align-items-center gap-2 border rounded-3 p-2">
                    <Muestra color={x.color} tam="1.8rem" />
                    <div className="flex-grow-1">
                      <div className="fw-bold text-capitalize">{x.color}</div>
                      <div className="small text-secondary">{x.rollos} {x.rollos === 1 ? 'rollo' : 'rollos'} × {x.kilosRollo} kg = {x.kilos} kg</div>
                    </div>
                    {pk > 0 && <b>{soles(x.kilos * pk)}</b>}
                    <button className="btn btn-sm btn-outline-secondary" title="Quitar" onClick={() => setLineas(lineas.filter((_, j) => j !== i))}>✕</button>
                  </div>
                ))}
              </div>
              {lineas.length > 0 && (
                <div className="border-top mt-3 pt-3">
                  <div className="d-flex justify-content-between"><span>Rollos</span><b>{totalRollos}</b></div>
                  <div className="d-flex justify-content-between"><span>Kilos</span><b>{redondear(totalKilos)} kg</b></div>
                  {pk > 0 && <div className="d-flex justify-content-between fs-5"><span>Total</span><b>{soles(totalKilos * pk)}</b></div>}
                </div>
              )}
              {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}
              <button className="btn btn-marca btn-lg w-100 mt-4 py-3 fs-4" disabled={guardando} onClick={guardarCompra}>
                {guardando ? <><span className="spinner-border spinner-border-sm me-2" />Guardando…</>
                  : lineas.length > 1 ? `Guardar compra (${lineas.length} telas)` : 'Guardar compra'}
              </button>
              <div className="form-text mt-2">Si agregas el mismo color dos veces, quedan como dos telas separadas en el almacén.</div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
