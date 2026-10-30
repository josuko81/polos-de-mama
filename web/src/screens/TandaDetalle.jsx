import React, { useState } from 'react'
import {
  TALLAS, ETAPAS_TANDA, etapaTanda, coloresDeTanda, cortadosDeTanda, piezasDeTanda, costoPorPolo, stockPorTallaDeLote, stockDeLote,
  tallerPorId, telaPorId, fraccionUsada, disenoPorId, nombreTanda, leerTallas, sumaTallas, diasEntre, hoy, soles, fechaCorta,
} from '../calc.js'
import Muestra from './Muestra.jsx'
import BotonBorrar from './BotonBorrar.jsx'
import { FotoMini } from './Fotos.jsx'
import { CamposTaller, validarTaller } from './NuevaTanda.jsx'

const numero = (v) => Number(String(v ?? '').replace(',', '.')) || 0
const aTexto = (o) => Object.fromEntries(TALLAS.map((t) => [t, leerTallas(o)[t] ? String(leerTallas(o)[t]) : '']))
const aNumeros = (o) => leerTallas(Object.fromEntries(TALLAS.map((t) => [t, numero((o || {})[t])])))

// Tabla color × talla editable
function TablaTallas({ colores, valores, onCambio, prefijo }) {
  const totalColor = (c) => TALLAS.reduce((s, t) => s + numero((valores[c] || {})[t]), 0)
  return (
    <div className="table-responsive">
      <table className="table align-middle mb-0 tabla-tallas">
        <thead><tr><th>Color</th>{TALLAS.map((t) => <th key={t} className="text-center">{t}</th>)}<th className="text-end">Total</th></tr></thead>
        <tbody>
          {colores.map((c) => (
            <tr key={c}>
              <td className="text-capitalize"><span className="d-inline-flex align-items-center gap-2"><Muestra color={c} />{c}</span></td>
              {TALLAS.map((t) => (
                <td key={t}>
                  <input id={`${prefijo}-${c}-${t}`} className="form-control form-control-lg text-center" inputMode="numeric" placeholder="0"
                    value={(valores[c] || {})[t] ?? ''}
                    onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); onCambio({ ...valores, [c]: { ...(valores[c] || {}), [t]: v } }) }} />
                </td>
              ))}
              <td className="text-end fw-bold fs-5">{totalColor(c)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot><tr><td colSpan={TALLAS.length + 1} className="fw-bold">Total</td><td className="text-end fw-bold fs-4">{colores.reduce((s, c) => s + totalColor(c), 0)}</td></tr></tfoot>
      </table>
    </div>
  )
}

export default function TandaDetalle({ datos, tandaId, guardar, guardarVarios, borrar, ir, enVentana = false }) {
  const tanda = (datos.tandas || []).find((t) => String(t.id) === String(tandaId))
  const lineas = coloresDeTanda(tanda)
  const colores = lineas.map((x) => x.color)
  const [taller, setTaller] = useState({})
  const [recibidos, setRecibidos] = useState(() => Object.fromEntries(lineas.map((x) => [x.color, aTexto(sumaTallas(x.recibidosT) ? x.recibidosT : x.cortadosT)])))
  const [corrigiendo, setCorrigiendo] = useState(false)
  const [cortados, setCortados] = useState(() => Object.fromEntries(lineas.map((x) => [x.color, aTexto(x.cortadosT)])))
  const [otros, setOtros] = useState('')
  const [fechaRecojo, setFechaRecojo] = useState(hoy())
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  if (!tanda) return <div className="alert alert-warning">No encontré esa tanda.</div>

  const etapa = etapaTanda(tanda)
  const diseno = disenoPorId(tanda.disenoId)
  const tl = tallerPorId(datos, tanda.tallerId)
  const piezas = piezasDeTanda(tanda, datos)
  const totalCortado = cortadosDeTanda(tanda)
  const totalRecibido = colores.reduce((s, c) => s + sumaTallas(aNumeros(recibidos[c])), 0)
  const dias = tanda.fechaEnvio ? diasEntre(tanda.fechaEnvio, etapa >= 3 ? tanda.fechaRecojo : hoy()) : null
  const atraso = etapa === 2 && tanda.fechaEstimada ? Math.max(0, diasEntre(tanda.fechaEstimada, hoy())) : 0
  const pasos = ETAPAS_TANDA.filter((e) => e.n > 1 || (diseno && diseno.tipo === 'Con estampado') || etapa === 1)

  const accion = async (obj, msg) => {
    setError('')
    setGuardando(true)
    try { await guardar('tandas', { id: tanda.id, ...obj }, msg) } catch (e) { setError('No se pudo guardar. Revisa el internet y vuelve a intentar.') } finally { setGuardando(false) }
  }
  const mandarAlTaller = () => {
    const e = validarTaller(taller)
    if (e) return setError(e)
    accion({ etapa: 2, tallerId: taller.tallerId, precioTaller: numero(taller.precioTaller), fechaEnvio: hoy(), fechaEstimada: taller.fechaEstimada || '' }, 'Tanda mandada al taller')
  }
  const recoger = () => {
    const vacio = colores.find((c) => !sumaTallas(aNumeros(recibidos[c])))
    if (vacio) return setError(`Pon cuántos llegaron de ${vacio}.`)
    const nuevas = lineas.map((x) => ({ ...x, recibidosT: aNumeros(recibidos[x.color]) }))
    accion({ etapa: 3, fechaRecojo, otros: numero(otros), pagado: true, colores: JSON.stringify(nuevas) }, `Recogido: ${totalRecibido} polos`)
  }
  const guardarCorte = async () => {
    const vacio = colores.find((c) => !sumaTallas(aNumeros(cortados[c])))
    if (vacio) return setError(`Pon cuántos cortaste de ${vacio}.`)
    const nuevas = lineas.map((x) => ({ ...x, cortadosT: aNumeros(cortados[x.color]) }))
    await accion({ colores: JSON.stringify(nuevas) }, 'Cantidades corregidas')
    setCorrigiendo(false)
  }
  const borrarTanda = async () => {
    // Las telas que esta tanda dejó "acabadas" vuelven al almacén
    const telas = lineas.flatMap((x) => x.telas || []).map((u) => ({ tela: telaPorId(datos, u.telaId), fraccion: Number(u.fraccion) || 0 }))
      .filter((u) => u.tela && u.tela.acabada && fraccionUsada(u.tela, datos) - u.fraccion < 0.999)
      .map((u) => ({ id: u.tela.id, acabada: false }))
    await borrar('tandas', tanda.id, 'Tanda borrada')
    if (telas.length) await guardarVarios('telas', telas)
    ir('produccion')
  }

  return (
    <>
      {!enVentana && <button className="btn btn-link px-0 mb-2 fs-5" onClick={() => ir('produccion')}>← Producción</button>}
      <div className="d-flex flex-wrap align-items-center gap-3 mb-4">
        {diseno && <FotoMini de={diseno} tam="4.5rem" />}
        <div className="flex-grow-1">
          {!enVentana && <h1 className="fw-bold mb-1">{nombreTanda(tanda)}</h1>}
          <div className="d-flex flex-wrap align-items-center gap-2 fs-5 text-secondary">
            <span className={`badge text-bg-${ETAPAS_TANDA[etapa - 1].color} fs-6`}>{ETAPAS_TANDA[etapa - 1].icono} {ETAPAS_TANDA[etapa - 1].estado}</span>
            <span className="d-flex gap-1">{colores.map((c) => <Muestra key={c} color={c} />)}</span>
            <span>{totalCortado} polos · cortada el {fechaCorta(tanda.fecha)}</span>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* En pantallas angostas va primero la acción (columna derecha) y después las etapas */}
        <div className="col-lg-4 d-flex flex-column gap-3 order-2 order-lg-1">
          <div className="d-flex flex-column gap-2">
            {pasos.map((p) => (
              <div key={p.n} className={'d-flex align-items-center gap-3 p-3 rounded-3 border border-2 bg-white ' + (p.n === etapa ? 'border-warning shadow-sm' : p.n < etapa ? 'border-success-subtle' : 'border-light-subtle')}>
                <span className={'paso-circulo rounded-circle d-flex align-items-center justify-content-center fw-bold ' + (p.n < etapa ? 'text-bg-success' : p.n === etapa ? 'text-bg-warning' : 'text-bg-light border')}>{p.n < etapa ? '✓' : p.icono}</span>
                <span className="fs-5">{p.estado}</span>
              </div>
            ))}
          </div>

          <div className="card border-0 shadow-sm"><div className="card-body">
            {tl && <div className="d-flex justify-content-between"><span>Taller</span><b>{tl.nombre}</b></div>}
            {tanda.fechaEnvio && <div className="d-flex justify-content-between"><span>Mandada</span><b>{fechaCorta(tanda.fechaEnvio)}</b></div>}
            {tanda.fechaEstimada && etapa === 2 && <div className="d-flex justify-content-between"><span>Estimado</span><b>{fechaCorta(tanda.fechaEstimada)}</b></div>}
            {tanda.fechaRecojo && etapa >= 3 && <div className="d-flex justify-content-between"><span>Recogida</span><b>{fechaCorta(tanda.fechaRecojo)}</b></div>}
            {dias !== null && <div className="d-flex justify-content-between"><span>{etapa >= 3 ? 'Demoró' : 'Lleva'}</span><b>{dias} {dias === 1 ? 'día' : 'días'}</b></div>}
            {atraso > 0 && <div className="alert alert-danger py-1 px-2 mt-2 mb-0">⚠️ {atraso} {atraso === 1 ? 'día' : 'días'} de atraso</div>}
            {Number(tanda.precioTaller) > 0 && (
              <div className="d-flex justify-content-between mt-2"><span>{tanda.pagado ? 'Se pagó al taller' : 'Al recoger pagas'}</span>
                <b>{soles((etapa >= 3 ? piezas.reduce((s, p) => s + p.recibidos, 0) : totalCortado) * Number(tanda.precioTaller))}</b></div>
            )}
          </div></div>

          <div className="card border-0 shadow-sm"><div className="card-body">
            <div className="fw-bold mb-2">Telas usadas</div>
            {lineas.flatMap((x) => (x.telas || []).map((u, i) => {
              const te = telaPorId(datos, u.telaId)
              return (
                <div key={x.color + i} className="d-flex justify-content-between small">
                  <span className="d-inline-flex align-items-center gap-1"><Muestra color={x.color} tam="0.9rem" /><span className="text-capitalize">{x.color}</span> · {u.fraccion >= 0.999 ? 'toda' : u.fraccion === 0.5 ? 'la mitad' : `${Math.round(u.fraccion * 100)}%`}</span>
                  <span>{te ? `${te.kilos} kg · ${fechaCorta(te.fecha)}` : '—'}</span>
                </div>
              )
            }))}
          </div></div>
        </div>

        <div className="col-lg-8 d-flex flex-column gap-3 order-1 order-lg-2">
          {etapa === 1 && (
            <div className="card border-0 shadow-sm"><div className="card-body p-4">
              <h2 className="fw-bold mb-2">🎨 Estampando</h2>
              <p className="fs-5">Cuando terminen de estampar, elige el taller y mándala.</p>
              <CamposTaller datos={datos} valor={taller} onCambio={setTaller} ir={ir} />
              {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}
              <button className="btn btn-marca btn-lg py-3 px-5 fs-4 mt-4" disabled={guardando} onClick={mandarAlTaller}>Listo: estampé y mandé al taller</button>
            </div></div>
          )}

          {etapa === 2 && (
            <div className="card border-0 shadow-sm"><div className="card-body p-4">
              <h2 className="fw-bold mb-2">🧼 ¿Ya la recogiste?</h2>
              <p className="fs-5">La tabla ya tiene lo que mandaste. Si algo llegó distinto, corrígelo.</p>
              <TablaTallas colores={colores} valores={recibidos} onCambio={setRecibidos} prefijo="recibido" />
              <div className="row g-3 mt-1">
                <div className="col-md-6">
                  <label htmlFor="otros" className="fw-bold mb-2">Pasajes u otros gastos</label>
                  <div className="input-group input-group-lg"><span className="input-group-text">S/</span>
                    <input id="otros" className="form-control" inputMode="decimal" placeholder="0" value={otros} onChange={(e) => setOtros(e.target.value)} /></div>
                </div>
                <div className="col-md-6">
                  <label htmlFor="fechaRecojo" className="fw-bold mb-2">Fecha de recojo</label>
                  <input id="fechaRecojo" type="date" className="form-control form-control-lg" value={fechaRecojo} onChange={(e) => setFechaRecojo(e.target.value)} />
                </div>
              </div>
              {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}
              <button className="btn btn-marca btn-lg py-3 px-5 fs-4 mt-4" disabled={guardando} onClick={recoger}>
                Listo: recogí y pagué {soles(totalRecibido * Number(tanda.precioTaller || 0))}
              </button>
            </div></div>
          )}

          {etapa === 3 && (
            <div className="card border-0 shadow-sm"><div className="card-body p-4">
              <h2 className="fw-bold mb-2">🧼 Empaquetando</h2>
              <p className="fs-5">Cuando terminen de <b>limpiar y empaquetar</b> los {piezas.reduce((s, p) => s + p.recibidos, 0)} polos, toca el botón. Recién ahí aparecerán en «Vendí».</p>
              {error && <div className="alert alert-danger mb-3">{error}</div>}
              <button className="btn btn-marca btn-lg py-3 px-5 fs-4" disabled={guardando} onClick={() => accion({ etapa: 4 }, 'Tanda lista para vender 🎉')}>Listo: limpié y empaqueté</button>
            </div></div>
          )}

          <div className="card border-0 shadow-sm"><div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="fs-4 fw-bold mb-0">{etapa >= 4 ? 'Lo que queda de esta tanda' : etapa === 3 ? 'Lo que llegó del taller' : 'Lo que se cortó'}</h2>
              {etapa <= 2 && !corrigiendo && <button className="btn btn-sm btn-outline-secondary" onClick={() => setCorrigiendo(true)}>Corregir cantidades</button>}
            </div>
            {corrigiendo ? (
              <>
                <TablaTallas colores={colores} valores={cortados} onCambio={setCortados} prefijo="cortado" />
                <div className="d-flex gap-2 mt-3">
                  <button className="btn btn-marca" disabled={guardando} onClick={guardarCorte}>Guardar cantidades</button>
                  <button className="btn btn-light border" onClick={() => setCorrigiendo(false)}>Cancelar</button>
                </div>
              </>
            ) : (
              <table className="table align-middle mb-0 text-center">
                <thead><tr><th className="text-start">Color</th>{TALLAS.map((t) => <th key={t}>{t}</th>)}<th>Total</th>{etapa >= 3 && <th>Cada polo</th>}</tr></thead>
                <tbody>
                  {lineas.map((x, i) => {
                    const cant = etapa >= 4 ? stockPorTallaDeLote(piezas[i], datos) : leerTallas(etapa >= 3 ? x.recibidosT : x.cortadosT)
                    const tot = etapa >= 4 ? stockDeLote(piezas[i], datos) : sumaTallas(cant)
                    return (
                      <tr key={x.color}>
                        <td className="text-start text-capitalize"><span className="d-inline-flex align-items-center gap-2"><Muestra color={x.color} />{x.color}</span></td>
                        {TALLAS.map((t) => <td key={t} className="fs-5">{cant[t] || '–'}</td>)}
                        <td className="fw-bold fs-5">{tot}</td>
                        {etapa >= 3 && <td>{costoPorPolo(piezas[i]) !== null ? soles(costoPorPolo(piezas[i])) : '—'}</td>}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div></div>

          {etapa < 4 && (
            <div><BotonBorrar texto="Borrar esta tanda" onConfirmar={borrarTanda} /></div>
          )}
        </div>
      </div>
    </>
  )
}
