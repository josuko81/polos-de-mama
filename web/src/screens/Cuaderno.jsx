import React, { useEffect, useRef, useState } from 'react'
import { soles, hoy, mesDe, fechaCorta, fotosDe, MESES, PRECIOS, COSTO_ESTIMADO, tallasDeDiseno } from '../calc.js'
import { moverMes } from './Resumen.jsx'
import BotonBorrar from './BotonBorrar.jsx'
import Ventana from './Ventana.jsx'
import NuevoDiseno from './NuevoDiseno.jsx'
import { FormMaterial } from './Materiales.jsx'
import { FotoMini } from './Fotos.jsx'

// Las 3 tablas del cuaderno de mamá, con sus mismas columnas, y el resumen del mes.
// La app sugiere lo ya anotado para que escriba lo mínimo.
export const CAT_MATERIAL = 'Compra de material'
const numero = (v) => Number(String(v ?? '').replace(',', '.')) || 0
const norm = (t) => String(t || '').trim().toLowerCase()
// Lo último anotado primero: reverse deja arriba lo más nuevo cuando la fecha es la misma
const delMes = (lista, mes) => lista.filter((x) => mesDe(x.fecha) === mes).reverse().sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)))
const nombreMes = (mes) => `${MESES[Number(mes.slice(5)) - 1]} ${mes.slice(0, 4)}`
// Fecha para anotar en un mes: hoy, o el día 1 si se está viendo otro mes
const fechaDeMes = (mes) => (mesDe(hoy()) === mes ? hoy() : `${mes}-01`)

// Última fila de cada nombre (sin importar mayúsculas), para sugerir sus datos
function ultimasPorNombre(lista, campo) {
  const orden = [...lista].sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)))
  const mapa = new Map()
  orden.forEach((x) => { if (norm(x[campo])) mapa.set(norm(x[campo]), x) })
  return mapa
}

const textoMonto = (n) => (numero(n) ? String(n) : '')
const redondear = (n) => Math.round(n * 100) / 100
// Las filas guardan totales; las anotadas antes de existir la cantidad cuentan como 1
const cantidadDe = (x) => numero(x.cantidad) || 1
const porUnidad = (x, campo) => textoMonto(redondear(numero(x[campo]) / cantidadDe(x)))

// Totales del mes: "Me quedó" no resta el material porque ya está en el costo de cada prenda
function cuentasMes(datos, mes) {
  const ventas = delMes(datos.cuaderno || [], mes)
  const gastos = delMes(datos.gastos || [], mes)
  const vendido = ventas.reduce((s, x) => s + numero(x.venta), 0)
  const ganancia = vendido - ventas.reduce((s, x) => s + numero(x.costo), 0)
  const suma = (lista) => lista.reduce((s, g) => s + numero(g.monto), 0)
  const material = suma(gastos.filter((g) => g.categoria === CAT_MATERIAL))
  const mensual = suma(gastos.filter((g) => g.categoria !== CAT_MATERIAL))
  return { vendido, ganancia, material, mensual, queda: ganancia - mensual }
}

function Encabezado({ titulo, mes, setMes }) {
  return (
    <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
      <h1 className="fw-bold mb-0">{titulo}</h1>
      <div className="btn-group btn-group-lg shadow-sm">
        <button className="btn btn-light border" aria-label="Mes anterior" onClick={() => setMes(moverMes(mes, -1))}>‹</button>
        <span className="btn btn-light border fw-bold px-4" style={{ minWidth: '13rem' }}>{nombreMes(mes)}</span>
        <button className="btn btn-light border" aria-label="Mes siguiente" onClick={() => setMes(moverMes(mes, 1))}>›</button>
      </div>
    </div>
  )
}

function Soles({ id, etiqueta, valor, onCambio }) {
  return (
    <>
      <label htmlFor={id} className="fw-bold mb-1">{etiqueta}</label>
      <div className="input-group input-group-lg">
        <span className="input-group-text">S/</span>
        <input id={id} className="form-control" inputMode="decimal" placeholder="0.00" value={valor} onChange={(e) => onCambio(e.target.value)} />
      </div>
    </>
  )
}

function Sugerencias({ id, nombres }) {
  return <datalist id={id}>{nombres.map((n) => <option key={n} value={n} />)}</datalist>
}

// Opción de un catálogo (material) con su foto y nombre
function BotonCatalogo({ item, activo, icono, onClick }) {
  return (
    <button type="button" aria-pressed={activo} className={'btn btn-outline-secondary opcion text-start p-2 opcion-prenda ' + (activo ? 'active' : '')} onClick={onClick}>
      <span className="d-flex align-items-center gap-2">
        {fotosDe(item).length ? <FotoMini de={item} tam="3.5rem" /> : <span className="foto-vacia">{icono}</span>}
        <span className="fw-bold">{item.nombre}</span>
      </span>
    </button>
  )
}

function BotonesForm({ editando, guardando, onCancelar }) {
  return (
    <>
      <button type="submit" className="btn btn-marca btn-lg w-100" disabled={guardando}>{guardando ? 'Guardando…' : editando ? 'Guardar' : 'Anotar'}</button>
      {editando && <button type="button" className="btn btn-link btn-sm w-100" onClick={onCancelar}>Cancelar</button>}
    </>
  )
}

// Tabla 1: Fecha | Prenda | Costo | Venta | Ganancia
export function VentasCuaderno({ datos, guardar, borrar, mesFijo }) {
  const [mesPropio, setMes] = useState(mesDe(hoy()))
  const mes = mesFijo || mesPropio
  const vacio = () => ({ id: '', fecha: fechaDeMes(mes), disenoId: '', prenda: '', talla: '', cantidad: '1', costo: '', venta: '' })
  const [form, setForm] = useState(vacio)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const auto = useRef(false) // costo y venta los puso la sugerencia, no ella
  const campo = useRef(null)
  const lista = datos.cuaderno || []
  const [creandoDiseno, setCreandoDiseno] = useState(false)
  const disenos = [...(datos.disenos || [])].sort((a, b) => a.nombre.localeCompare(b.nombre))
  const previasPorDiseno = ultimasPorNombre(lista, 'disenoId')
  const previas = ultimasPorNombre(lista, 'prenda')
  const filas = delMes(lista, mes)

  useEffect(() => { setForm((f) => (f.id ? f : { ...f, fecha: fechaDeMes(mes) })) }, [mes])

  const previasPorTalla = ultimasPorNombre(lista.map((x) => ({ ...x, clave: `${x.disenoId || x.prenda}|${x.talla || ''}` })), 'clave')

  // Sugiere precios: los de ese diseño y talla; si es la primera vez, el costo del
  // diseño y el precio por mayor de la talla. Nunca pisa lo que ella escribió.
  const conPrecios = (f, cambios) => {
    const n = { ...f, ...cambios }
    if (!n.talla || f.id || !(auto.current || (!f.costo && !f.venta))) return n
    const exacta = previasPorTalla.get(norm(`${n.disenoId}|${n.talla}`))
    const delDiseno = exacta || previasPorDiseno.get(norm(n.disenoId)) || previas.get(norm(n.prenda))
    auto.current = true
    return {
      ...n,
      costo: (delDiseno && porUnidad(delDiseno, 'costo')) || String(COSTO_ESTIMADO),
      venta: exacta ? porUnidad(exacta, 'venta') : String(PRECIOS[n.talla]),
    }
  }
  // Si el diseño tiene una sola talla se elige sola; si no maneja la marcada, se quita
  const elegirDiseno = (d) => {
    const tallas = tallasDeDiseno(d)
    setForm((f) => conPrecios(f, { disenoId: d.id, prenda: d.nombre, talla: tallas.length === 1 ? tallas[0] : tallas.includes(f.talla) ? f.talla : '' }))
  }
  // Al tocar la talla el cursor pasa a Cantidad
  const elegirTalla = (t) => {
    setForm((f) => conPrecios(f, { talla: t }))
    campo.current.focus()
    campo.current.select()
  }
  const escribirMonto = (k) => (v) => { auto.current = false; setForm((f) => ({ ...f, [k]: v })) }
  const limpiar = () => { auto.current = false; setForm(vacio()) }
  const cant = numero(form.cantidad)
  const totalCosto = redondear(cant * numero(form.costo))
  const totalVenta = redondear(cant * numero(form.venta))
  const editar = (x) => {
    setError('')
    auto.current = false
    setForm({ id: x.id, fecha: x.fecha, disenoId: x.disenoId || '', prenda: x.prenda, talla: x.talla || '', cantidad: String(cantidadDe(x)), costo: porUnidad(x, 'costo'), venta: porUnidad(x, 'venta') })
    campo.current.scrollIntoView({ block: 'center' })
    campo.current.focus()
  }

  const anotar = async (e) => {
    e.preventDefault()
    setError('')
    // El nombre sale del diseño; las filas antiguas sin diseño conservan el que tenían
    const diseno = disenos.find((d) => String(d.id) === String(form.disenoId))
    const prenda = diseno ? diseno.nombre : form.prenda
    if (!prenda) return setError('Elige la prenda.')
    if (diseno && !form.talla) return setError('Elige la talla.')
    if (!cant) return setError('Escribe la cantidad.')
    if (!numero(form.venta)) return setError('Escribe la venta.')
    setGuardando(true)
    try {
      await guardar('cuaderno', {
        ...(form.id ? { id: form.id } : {}), fecha: form.fecha,
        disenoId: form.disenoId, prenda, talla: form.talla, cantidad: cant, costo: totalCosto, venta: totalVenta,
      }, form.id ? 'Cambios guardados' : 'Venta anotada')
      limpiar()
      campo.current.focus()
    } catch (err) {
      setError('No se pudo guardar. Revisa el internet y vuelve a intentar.')
    } finally {
      setGuardando(false)
    }
  }

  const costo = filas.reduce((s, x) => s + numero(x.costo), 0)
  const venta = filas.reduce((s, x) => s + numero(x.venta), 0)
  return (
    <>
      {!mesFijo && <Encabezado titulo="💰 Ventas" mes={mes} setMes={setMes} />}
      {/* Va fuera del formulario de la venta: un form no puede ir dentro de otro */}
      {creandoDiseno && (
        <div className="mb-3">
          <NuevoDiseno datos={datos} guardar={guardar} onCancelar={() => setCreandoDiseno(false)}
            onListo={(id) => { setCreandoDiseno(false); setForm((f) => ({ ...f, disenoId: id })); campo.current.focus() }} />
        </div>
      )}
      <form className="card border-0 shadow-sm mb-4" onSubmit={anotar}><div className="card-body p-4">
        {form.id && <div className="fw-bold text-marca mb-2">✏️ Corrigiendo esta venta</div>}
        <div className="fw-bold mb-2">Prenda</div>
        <div className="d-flex flex-wrap gap-2 mb-3">
          {disenos.map((d) => (
            <button key={d.id} type="button" aria-pressed={String(form.disenoId) === String(d.id)}
              className={'btn btn-outline-secondary opcion text-start p-2 opcion-prenda ' + (String(form.disenoId) === String(d.id) ? 'active' : '')} onClick={() => elegirDiseno(d)}>
              <span className="d-flex align-items-center gap-2">
                {fotosDe(d).length ? <FotoMini de={d} tam="3.5rem" /> : <span className="foto-vacia">👕</span>}
                <span>
                  <span className="d-block fw-bold">{d.nombre}</span>
                  <span className="d-block small">{d.cuello} · {tallasDeDiseno(d).join(', ')}</span>
                </span>
              </span>
            </button>
          ))}
          {!creandoDiseno && <button type="button" className="btn btn-outline-warning border-2 border-dashed" onClick={() => setCreandoDiseno(true)}>＋ Nuevo diseño</button>}
        </div>
        {form.disenoId && (
          <>
            <div className="fw-bold mb-2">Talla</div>
            <div className="d-flex flex-wrap gap-2 mb-3">
              {tallasDeDiseno(disenos.find((d) => String(d.id) === String(form.disenoId))).map((t) => (
                <button key={t} type="button" aria-pressed={form.talla === t} className={'btn btn-lg btn-outline-secondary opcion px-4 ' + (form.talla === t ? 'active' : '')} onClick={() => elegirTalla(t)}>{t}</button>
              ))}
            </div>
          </>
        )}
        {form.id && !form.disenoId && <div className="small text-secondary mb-3">Anotada antes como «{form.prenda}». Si eliges un diseño, se cambia.</div>}
        <div className="row g-3 align-items-end">
          <div className="col-md-3 order-md-1">
            <label htmlFor="v-fecha" className="fw-bold mb-1">Fecha</label>
            <input id="v-fecha" type="date" className="form-control form-control-lg" value={form.fecha} onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))} />
          </div>
          <div className="col-md-3 order-md-3">
            <label htmlFor="v-cantidad" className="fw-bold mb-1">Cantidad</label>
            <input ref={campo} id="v-cantidad" className="form-control form-control-lg text-center fw-bold" inputMode="numeric" value={form.cantidad}
              onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); setForm((f) => ({ ...f, cantidad: v })) }} />
          </div>
          <div className="col-6 col-md-3 order-md-4"><Soles id="v-costo" etiqueta="Costo de cada una" valor={form.costo} onCambio={escribirMonto('costo')} /></div>
          <div className="col-6 col-md-3 order-md-5"><Soles id="v-venta" etiqueta="Venta de cada una" valor={form.venta} onCambio={escribirMonto('venta')} /></div>
        </div>
        {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}
        <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mt-3">
          <div className="text-secondary" id="v-totales">
            <span className="me-3">Costo total <b>{soles(totalCosto)}</b></span>
            <span className="me-3">Venta total <b>{soles(totalVenta)}</b></span>
            <span className="text-success">Ganancia <b>{soles(totalVenta - totalCosto)}</b></span>
          </div>
          <div className="boton-anotar"><BotonesForm editando={!!form.id} guardando={guardando} onCancelar={limpiar} /></div>
        </div>
      </div></form>

      <div className="card border-0 shadow-sm"><div className="card-body p-3 p-md-4 table-responsive">
        <table className="table align-middle mb-0">
          <thead><tr><th>Fecha</th><th>Prenda</th><th className="text-center">Talla</th><th className="text-center">Cant.</th><th className="text-end">Costo</th><th className="text-end">Venta</th><th className="text-end">Ganancia</th><th /></tr></thead>
          <tbody>
            {filas.length === 0 && <tr><td colSpan={8} className="text-secondary text-center py-4">No hay ventas en este mes.</td></tr>}
            {filas.map((x) => (
              <tr key={x.id} className={String(form.id) === String(x.id) ? 'table-warning' : ''}>
                <td className="text-nowrap">{fechaCorta(x.fecha)}</td>
                <td>{x.prenda}</td>
                <td className="text-center">{x.talla || '–'}</td>
                <td className="text-center">{cantidadDe(x)}</td>
                <td className="text-end text-nowrap">{soles(x.costo)}</td>
                <td className="text-end text-nowrap">{soles(x.venta)}</td>
                <td className="text-end text-nowrap fw-bold text-success">{soles(numero(x.venta) - numero(x.costo))}</td>
                <td className="text-end text-nowrap">
                  <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => editar(x)}>Editar</button>
                  <BotonBorrar onConfirmar={() => borrar('cuaderno', x.id, 'Venta borrada')} />
                </td>
              </tr>
            ))}
          </tbody>
          {filas.length > 0 && (
            <tfoot><tr className="fw-bold"><td colSpan={3}>Total</td><td className="text-center">{filas.reduce((s, x) => s + cantidadDe(x), 0)}</td><td className="text-end text-nowrap">{soles(costo)}</td><td className="text-end text-nowrap">{soles(venta)}</td><td className="text-end text-nowrap text-success">{soles(venta - costo)}</td><td /></tr></tfoot>
          )}
        </table>
      </div></div>
    </>
  )
}

// Tabla 2: Fecha | Compras material | Cant. | Costo. El material se elige del catálogo, como las prendas.
export function ComprasCuaderno({ datos, guardar, borrar, mesFijo }) {
  const [mesPropio, setMes] = useState(mesDe(hoy()))
  const mes = mesFijo || mesPropio
  const vacio = () => ({ id: '', fecha: fechaDeMes(mes), materialId: '', concepto: '', cantidad: '1', costo: '' })
  const [form, setForm] = useState(vacio)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [creando, setCreando] = useState(false)
  const auto = useRef(false)
  const campo = useRef(null)
  const materiales = [...(datos.materiales || [])].sort((a, b) => a.nombre.localeCompare(b.nombre))
  const lista = (datos.gastos || []).filter((g) => g.categoria === CAT_MATERIAL)
  const previasPorId = ultimasPorNombre(lista, 'materialId')
  const previas = ultimasPorNombre(lista, 'concepto')
  const filas = delMes(lista, mes)
  const cant = numero(form.cantidad)
  const total = redondear(cant * numero(form.costo))

  useEffect(() => { setForm((f) => (f.id ? f : { ...f, fecha: fechaDeMes(mes) })) }, [mes])

  // Al tocar un material se llena su último costo y el cursor pasa a Cantidad
  const elegir = (m) => {
    const p = previasPorId.get(norm(m.id)) || previas.get(norm(m.nombre))
    setForm((f) => {
      const n = { ...f, materialId: m.id, concepto: m.nombre }
      if (f.id || !(auto.current || !f.costo)) return n
      auto.current = true
      return { ...n, costo: p ? porUnidad(p, 'monto') : '' }
    })
    campo.current.focus()
    campo.current.select()
  }
  const limpiar = () => { auto.current = false; setForm(vacio()) }
  const editar = (g) => {
    setError('')
    auto.current = false
    setForm({ id: g.id, fecha: g.fecha, materialId: g.materialId || '', concepto: g.concepto, cantidad: String(cantidadDe(g)), costo: porUnidad(g, 'monto') })
    campo.current.scrollIntoView({ block: 'center' })
    campo.current.focus()
  }

  const anotar = async (e) => {
    e.preventDefault()
    setError('')
    // El nombre sale del catálogo; las filas antiguas conservan el que tenían
    const material = materiales.find((m) => String(m.id) === String(form.materialId))
    const concepto = material ? material.nombre : form.concepto
    if (!concepto) return setError('Elige el material.')
    if (!cant) return setError('Escribe la cantidad.')
    if (!numero(form.costo)) return setError('Escribe el costo de cada uno.')
    setGuardando(true)
    try {
      await guardar('gastos', {
        ...(form.id ? { id: form.id } : {}), fecha: form.fecha, concepto, materialId: form.materialId,
        categoria: CAT_MATERIAL, cantidad: cant, monto: total,
      }, form.id ? 'Cambios guardados' : 'Compra anotada')
      limpiar()
      campo.current.focus()
    } catch (err) {
      setError('No se pudo guardar. Revisa el internet y vuelve a intentar.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <>
      {!mesFijo && <Encabezado titulo="🧵 Compra de material" mes={mes} setMes={setMes} />}
      {creando && (
        <div className="mb-3">
          <FormMaterial datos={datos} guardar={guardar} onCancelar={() => setCreando(false)}
            onListo={(id) => { setCreando(false); setForm((f) => ({ ...f, materialId: id })); campo.current.focus() }} />
        </div>
      )}
      <form className="card border-0 shadow-sm mb-4" onSubmit={anotar}><div className="card-body p-4">
        {form.id && <div className="fw-bold text-marca mb-2">✏️ Corrigiendo esta compra</div>}
        <div className="fw-bold mb-2">Material</div>
        <div className="d-flex flex-wrap gap-2 mb-3">
          {materiales.map((m) => <BotonCatalogo key={m.id} item={m} activo={String(form.materialId) === String(m.id)} icono="🧵" onClick={() => elegir(m)} />)}
          {!creando && <button type="button" className="btn btn-outline-warning border-2 border-dashed" onClick={() => setCreando(true)}>＋ Nuevo material</button>}
        </div>
        {form.id && !form.materialId && <div className="small text-secondary mb-3">Anotada antes como «{form.concepto}». Si eliges un material, se cambia.</div>}
        <div className="row g-3 align-items-end">
          <div className="col-md-4">
            <label htmlFor="m-fecha" className="fw-bold mb-1">Fecha</label>
            <input id="m-fecha" type="date" className="form-control form-control-lg" value={form.fecha} onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))} />
          </div>
          <div className="col-md-4">
            <label htmlFor="m-cantidad" className="fw-bold mb-1">Cantidad</label>
            <input ref={campo} id="m-cantidad" className="form-control form-control-lg text-center fw-bold" inputMode="decimal" value={form.cantidad} onChange={(e) => { const v = e.target.value; setForm((f) => ({ ...f, cantidad: v })) }} />
          </div>
          <div className="col-md-4"><Soles id="m-costo" etiqueta="Costo de cada uno" valor={form.costo} onCambio={(v) => { auto.current = false; setForm((f) => ({ ...f, costo: v })) }} /></div>
        </div>
        {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}
        <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mt-3">
          <div className="text-secondary" id="m-total">Costo total <b>{soles(total)}</b></div>
          <div className="boton-anotar"><BotonesForm editando={!!form.id} guardando={guardando} onCancelar={limpiar} /></div>
        </div>
      </div></form>

      <div className="card border-0 shadow-sm"><div className="card-body p-3 p-md-4 table-responsive">
        <table className="table align-middle mb-0">
          <thead><tr><th>Fecha</th><th>Compras material</th><th className="text-center">Cant.</th><th className="text-end">Costo</th><th /></tr></thead>
          <tbody>
            {filas.length === 0 && <tr><td colSpan={5} className="text-secondary text-center py-4">No hay nada anotado en este mes.</td></tr>}
            {filas.map((g) => (
              <tr key={g.id} className={String(form.id) === String(g.id) ? 'table-warning' : ''}>
                <td className="text-nowrap">{fechaCorta(g.fecha)}</td>
                <td>{g.concepto}</td>
                <td className="text-center">{cantidadDe(g)}</td>
                <td className="text-end text-nowrap">{soles(g.monto)}</td>
                <td className="text-end text-nowrap">
                  <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => editar(g)}>Editar</button>
                  <BotonBorrar onConfirmar={() => borrar('gastos', g.id, 'Borrado')} />
                </td>
              </tr>
            ))}
          </tbody>
          {filas.length > 0 && (
            <tfoot><tr className="fw-bold"><td colSpan={3}>Total</td><td className="text-end text-nowrap">{soles(filas.reduce((s, g) => s + numero(g.monto), 0))}</td><td /></tr></tfoot>
          )}
        </table>
      </div></div>
    </>
  )
}

// Tabla 3: Fecha | Gasto mensual | Total
export function GastosCuaderno({ datos, guardar, guardarVarios, borrar, mesFijo }) {
  const [mesPropio, setMes] = useState(mesDe(hoy()))
  const mes = mesFijo || mesPropio
  const vacio = () => ({ id: '', fecha: fechaDeMes(mes), concepto: '', monto: '' })
  const [form, setForm] = useState(vacio)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const auto = useRef(false)
  const campo = useRef(null)
  const lista = (datos.gastos || []).filter((g) => g.categoria !== CAT_MATERIAL)
  const previas = ultimasPorNombre(lista, 'concepto')
  const filas = delMes(lista, mes)
  const mesPasado = moverMes(mes, -1)
  const delMesPasado = delMes(lista, mesPasado)

  useEffect(() => { setForm((f) => (f.id ? f : { ...f, fecha: fechaDeMes(mes) })) }, [mes])

  const escribirConcepto = (v) => setForm((f) => {
    const p = previas.get(norm(v))
    if (!p || f.id || !(auto.current || !f.monto)) return { ...f, concepto: v }
    auto.current = true
    return { ...f, concepto: v, monto: textoMonto(p.monto) }
  })
  const limpiar = () => { auto.current = false; setForm(vacio()) }
  const editar = (g) => {
    setError('')
    auto.current = false
    setForm({ id: g.id, fecha: g.fecha, concepto: g.concepto, monto: textoMonto(g.monto) })
    campo.current.scrollIntoView({ block: 'center' })
    campo.current.focus()
  }

  const anotar = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.concepto.trim()) return setError('Escribe el gasto.')
    if (!numero(form.monto)) return setError('Escribe el total.')
    const previa = previas.get(norm(form.concepto))
    setGuardando(true)
    try {
      await guardar('gastos', {
        ...(form.id ? { id: form.id } : {}), fecha: form.fecha, concepto: previa ? previa.concepto : form.concepto.trim(),
        categoria: 'Gasto mensual', monto: numero(form.monto),
      }, form.id ? 'Cambios guardados' : 'Anotado')
      limpiar()
      campo.current.focus()
    } catch (err) {
      setError('No se pudo guardar. Revisa el internet y vuelve a intentar.')
    } finally {
      setGuardando(false)
    }
  }

  // Gastos fijos: el mes nuevo empieza con los del mes pasado, con un solo toque
  const copiarMesPasado = async () => {
    setError('')
    setGuardando(true)
    try {
      await guardarVarios('gastos', delMesPasado.map((g) => ({ fecha: `${mes}-01`, concepto: g.concepto, categoria: g.categoria, monto: g.monto })), 'Gastos copiados')
    } catch (err) {
      setError('No se pudo guardar. Revisa el internet y vuelve a intentar.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <>
      {!mesFijo && <Encabezado titulo="🧾 Gastos del mes" mes={mes} setMes={setMes} />}
      {filas.length === 0 && delMesPasado.length > 0 && (
        <button className="btn btn-warning btn-lg fw-bold w-100 mb-3" disabled={guardando} onClick={copiarMesPasado}>
          Copiar los {delMesPasado.length} gastos de {MESES[Number(mesPasado.slice(5)) - 1]}
        </button>
      )}
      <form className="card border-0 shadow-sm mb-4" onSubmit={anotar}><div className="card-body p-4">
        {form.id && <div className="fw-bold text-marca mb-2">✏️ Corrigiendo esta fila</div>}
        <div className="row g-3 align-items-end">
          <div className="col-md-3">
            <label htmlFor="g-fecha" className="fw-bold mb-1">Fecha</label>
            <input id="g-fecha" type="date" className="form-control form-control-lg" value={form.fecha} onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))} />
          </div>
          <div className="col-md-4">
            <label htmlFor="g-concepto" className="fw-bold mb-1">Gasto mensual</label>
            <input ref={campo} id="g-concepto" list="g-conceptos" autoComplete="off" className="form-control form-control-lg" placeholder="Ej: Luz" value={form.concepto} onChange={(e) => escribirConcepto(e.target.value)} />
            <Sugerencias id="g-conceptos" nombres={[...previas.values()].reverse().map((x) => x.concepto)} />
          </div>
          <div className="col-md-5"><Soles id="g-monto" etiqueta="Total" valor={form.monto} onCambio={(v) => { auto.current = false; setForm((f) => ({ ...f, monto: v })) }} /></div>
        </div>
        {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}
        <div className="d-flex justify-content-end mt-3">
          <div className="boton-anotar"><BotonesForm editando={!!form.id} guardando={guardando} onCancelar={limpiar} /></div>
        </div>
      </div></form>

      <div className="card border-0 shadow-sm"><div className="card-body p-3 p-md-4 table-responsive">
        <table className="table align-middle mb-0">
          <thead><tr><th>Fecha</th><th>Gasto mensual</th><th className="text-end">Total</th><th /></tr></thead>
          <tbody>
            {filas.length === 0 && <tr><td colSpan={4} className="text-secondary text-center py-4">No hay nada anotado en este mes.</td></tr>}
            {filas.map((g) => (
              <tr key={g.id} className={String(form.id) === String(g.id) ? 'table-warning' : ''}>
                <td className="text-nowrap">{fechaCorta(g.fecha)}</td>
                <td>{g.concepto}</td>
                <td className="text-end text-nowrap">{soles(g.monto)}</td>
                <td className="text-end text-nowrap">
                  <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => editar(g)}>Editar</button>
                  <BotonBorrar onConfirmar={() => borrar('gastos', g.id, 'Borrado')} />
                </td>
              </tr>
            ))}
          </tbody>
          {filas.length > 0 && (
            <tfoot><tr className="fw-bold"><td colSpan={2}>Total</td><td className="text-end text-nowrap">{soles(filas.reduce((s, g) => s + numero(g.monto), 0))}</td><td /></tr></tfoot>
          )}
        </table>
      </div></div>
    </>
  )
}

// Las cuentas del mes
function CuentasDelMes({ datos, mes }) {
  const c = cuentasMes(datos, mes)
  const fila = (texto, valor, clase = '') => (
    <div className={'d-flex justify-content-between py-2 border-bottom fs-5 ' + clase}><span>{texto}</span><b>{soles(valor)}</b></div>
  )
  return (
    <div className="card border-0 shadow-sm" style={{ maxWidth: '36rem' }}><div className="card-body p-4">
      {fila('Vendí', c.vendido)}
      {fila('Ganancia de las prendas', c.ganancia, 'text-success')}
      {fila('Compra de material', c.material)}
      {fila('Gastos del mes', c.mensual)}
      <div className="d-flex justify-content-between pt-3"><span className="fs-4 fw-bold">Me quedó</span><span className={'fs-3 fw-bold ' + (c.queda < 0 ? 'text-danger' : 'text-success')}>{soles(c.queda)}</span></div>
      <div className="small text-secondary">Ganancia de las prendas menos gastos del mes. La compra de material no se resta porque ya está en el costo de cada prenda.</div>
    </div></div>
  )
}

// El cuaderno: una tarjeta por tabla con su total del mes; al tocarla se abre para anotar
export default function Cuaderno(props) {
  const { datos } = props
  const [mes, setMes] = useState(mesDe(hoy()))
  const [abierta, setAbierta] = useState(null) // id de la tarjeta abierta
  const c = cuentasMes(datos, mes)
  const TARJETAS = [
    { id: 'ventas', icono: '💰', titulo: 'Ventas', total: c.vendido },
    { id: 'material', icono: '🧵', titulo: 'Compra de material', total: c.material },
    { id: 'gastos', icono: '🧾', titulo: 'Gasto mensual', total: c.mensual },
    { id: 'queda', icono: '📊', titulo: 'Me quedó', total: c.queda },
  ]
  const tarjeta = TARJETAS.find((t) => t.id === abierta)
  return (
    <>
      <Encabezado titulo="📒 Cuaderno" mes={mes} setMes={setMes} />
      <div className="row g-3">
        {TARJETAS.map((t) => (
          <div className="col-sm-6 col-xl-3" key={t.id}>
            <button className={'btn border-0 shadow-sm tarjeta-lote w-100 h-100 text-start p-4 ' + (t.id === 'queda' ? (t.total < 0 ? 'btn-danger' : 'btn-success') : 'btn-light')} onClick={() => setAbierta(t.id)}>
              <span className="d-block mb-2" style={{ fontSize: '2.6rem' }}>{t.icono}</span>
              <span className={'d-block fs-4 fw-bold ' + (t.id === 'queda' ? '' : 'text-marca')}>{t.titulo}</span>
              <span className={'d-block small ' + (t.id === 'queda' ? '' : 'text-secondary')}>Total de {MESES[Number(mes.slice(5)) - 1]}</span>
              <span className="d-block numero-grande">{soles(t.total)}</span>
            </button>
          </div>
        ))}
      </div>
      {tarjeta && (
        <Ventana titulo={`${tarjeta.icono} ${tarjeta.titulo} · ${nombreMes(mes)}`} onCerrar={() => setAbierta(null)}>
          {tarjeta.id === 'ventas' && <VentasCuaderno {...props} mesFijo={mes} />}
          {tarjeta.id === 'material' && <ComprasCuaderno {...props} mesFijo={mes} />}
          {tarjeta.id === 'gastos' && <GastosCuaderno {...props} mesFijo={mes} />}
          {tarjeta.id === 'queda' && <CuentasDelMes datos={datos} mes={mes} />}
        </Ventana>
      )}
    </>
  )
}

// Resumen del mes con los totales de las 3 tablas
export function ResumenCuaderno({ datos }) {
  const [mes, setMes] = useState(mesDe(hoy()))
  return (
    <>
      <Encabezado titulo="📊 Resumen" mes={mes} setMes={setMes} />
      <CuentasDelMes datos={datos} mes={mes} />
    </>
  )
}
