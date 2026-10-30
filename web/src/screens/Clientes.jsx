import React, { useState } from 'react'
import { pedidos, textoPedido, enlaceWhatsApp, CANALES, soles, fechaCorta } from '../calc.js'
import BotonBorrar from './BotonBorrar.jsx'

// Formulario corto para crear o editar un cliente. onCreado recibe el id nuevo.
export function FormCliente({ datos, guardar, cliente = null, onListo, onCreado }) {
  const [nombre, setNombre] = useState(cliente ? cliente.nombre : '')
  const [telefono, setTelefono] = useState(cliente ? cliente.telefono || '' : '')
  const [nota, setNota] = useState(cliente ? cliente.nota || '' : '')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const enviar = async () => {
    setError('')
    const n = nombre.trim()
    if (!n) return setError('Escribe el nombre del cliente.')
    if ((datos.clientes || []).some((c) => c.nombre.trim().toLowerCase() === n.toLowerCase() && (!cliente || String(c.id) !== String(cliente.id)))) {
      return setError('Ya tienes un cliente con ese nombre.')
    }
    setGuardando(true)
    try {
      const id = await guardar('clientes', { ...(cliente ? { id: cliente.id } : {}), nombre: n, telefono: telefono.trim(), nota: nota.trim() }, cliente ? 'Cliente actualizado' : `Cliente «${n}» agregado`)
      if (onCreado) onCreado(id)
      onListo()
    } catch (e) {
      setError('No se pudo guardar. Revisa el internet y vuelve a intentar.')
    } finally {
      setGuardando(false)
    }
  }
  return (
    <div className="border border-2 border-warning rounded-3 p-3 bg-white">
      <div className="row g-2">
        <div className="col-md-6">
          <label className="fw-bold mb-1" htmlFor="cliente-nombre">Nombre</label>
          <input id="cliente-nombre" className="form-control form-control-lg" placeholder="Ej: Sra. Rosa" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </div>
        <div className="col-md-6">
          <label className="fw-bold mb-1" htmlFor="cliente-telefono">Celular (WhatsApp)</label>
          <input id="cliente-telefono" className="form-control form-control-lg" inputMode="tel" placeholder="9xx xxx xxx" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
        </div>
        <div className="col-12">
          <label className="fw-bold mb-1" htmlFor="cliente-nota">Nota <span className="text-secondary fw-normal">(opcional)</span></label>
          <input id="cliente-nota" className="form-control" placeholder="Ej: mayorista, puesto 120" value={nota} onChange={(e) => setNota(e.target.value)} />
        </div>
      </div>
      {error && <div className="alert alert-danger py-2 mt-2 mb-0">{error}</div>}
      <div className="d-flex gap-2 mt-3">
        <button className="btn btn-marca btn-lg" disabled={guardando} onClick={enviar}>{guardando ? 'Guardando…' : cliente ? 'Guardar cambios' : 'Agregar cliente'}</button>
        <button className="btn btn-light btn-lg border" onClick={onListo}>Cancelar</button>
      </div>
    </div>
  )
}

// Botón que marca todas las filas de un pedido como pagadas
export function BotonYaPago({ pedido, guardarVarios }) {
  const [ocupado, setOcupado] = useState(false)
  return (
    <button className="btn btn-success btn-sm text-nowrap" disabled={ocupado}
      onClick={async () => { setOcupado(true); try { await guardarVarios('ventas', pedido.lineas.map((v) => ({ id: v.id, pagado: true })), 'Marcado como pagado') } finally { setOcupado(false) } }}>
      Ya me pagó
    </button>
  )
}

// Cartera de clientes: quién compra, cuánto y quién debe
export default function Clientes({ datos, guardar, guardarVarios, borrar }) {
  const [buscar, setBuscar] = useState('')
  const [creando, setCreando] = useState(false)
  const [editando, setEditando] = useState(null)
  const [abierto, setAbierto] = useState(null)
  const todos = pedidos(datos.ventas, datos)
  const filas = (datos.clientes || [])
    .filter((c) => !buscar.trim() || c.nombre.toLowerCase().includes(buscar.trim().toLowerCase()))
    .map((c) => {
      const suyos = todos.filter((p) => String(p.clienteId) === String(c.id))
      return {
        c, suyos,
        total: suyos.reduce((s, p) => s + p.total, 0),
        polos: suyos.reduce((s, p) => s + p.cantidad, 0),
        debe: suyos.filter((p) => !p.pagado),
      }
    })
    .sort((a, b) => b.debe.length - a.debe.length || b.total - a.total)

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="fw-bold mb-1">👥 Clientes</h1>
          <p className="fs-5 text-secondary mb-0">Tu cartera: lo que compra cada uno y quién te debe.</p>
        </div>
        {!creando && <button className="btn btn-warning btn-lg fw-bold px-4" onClick={() => setCreando(true)}>＋ Nuevo cliente</button>}
      </div>
      {creando && <div className="mb-4" style={{ maxWidth: '44rem' }}><FormCliente datos={datos} guardar={guardar} onListo={() => setCreando(false)} /></div>}

      {(datos.clientes || []).length > 4 && (
        <input className="form-control form-control-lg mb-3" style={{ maxWidth: '28rem' }} placeholder="🔎 Buscar cliente" value={buscar} onChange={(e) => setBuscar(e.target.value)} />
      )}
      {(datos.clientes || []).length === 0 && !creando && (
        <div className="card border-0 shadow-sm"><div className="card-body p-5 text-center fs-5 text-secondary">Agrega a tus clientes fijos para saber cuánto compra y cuánto debe cada uno.</div></div>
      )}

      <div className="row g-3">
        {filas.map(({ c, suyos, total, polos, debe }) => (
          <div className="col-md-6 col-xl-4" key={c.id}>
            <div className={'card border-0 shadow-sm h-100 ' + (debe.length ? 'border border-2 border-danger' : '')}><div className="card-body p-4">
              {editando === c.id ? (
                <FormCliente datos={datos} guardar={guardar} cliente={c} onListo={() => setEditando(null)} />
              ) : (
                <>
                  <div className="d-flex align-items-start gap-2">
                    <div className="flex-grow-1">
                      <div className="fs-4 fw-bold text-marca">{c.nombre}</div>
                      {c.nota && <div className="text-secondary small">{c.nota}</div>}
                    </div>
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => setEditando(c.id)}>Editar</button>
                    {suyos.length === 0 && <BotonBorrar onConfirmar={() => borrar('clientes', c.id, 'Cliente borrado')} />}
                  </div>
                  {c.telefono && <a className="btn btn-success btn-sm mt-2" href={enlaceWhatsApp(c.telefono)} target="_blank" rel="noreferrer">💬 WhatsApp</a>}
                  <div className="d-flex justify-content-between mt-3"><span className="text-secondary">Compró</span><b>{soles(total)} · {polos} polos</b></div>
                  <div className="d-flex justify-content-between"><span className="text-secondary">Ventas</span><b>{suyos.length}{suyos[0] && ` · última ${fechaCorta(suyos[0].fecha)}`}</b></div>
                  {debe.length > 0 && (
                    <div className="mt-3">
                      <div className="fw-bold text-danger mb-1">Te debe {soles(debe.reduce((s, p) => s + p.total, 0))}</div>
                      {debe.map((p) => (
                        <div key={p.id} className="d-flex align-items-center gap-2 small mb-1">
                          <span className="flex-grow-1">{fechaCorta(p.fecha)} · {p.cantidad} polos · {soles(p.total)}</span>
                          <BotonYaPago pedido={p} guardarVarios={guardarVarios} />
                        </div>
                      ))}
                    </div>
                  )}
                  {suyos.length > 0 && (
                    <button className="btn btn-link px-0 mt-2" onClick={() => setAbierto(abierto === c.id ? null : c.id)}>{abierto === c.id ? '▾' : '▸'} Ver sus compras</button>
                  )}
                  {abierto === c.id && suyos.map((p) => (
                    <div key={p.id} className="border-top py-2 small">
                      <div className="d-flex justify-content-between"><b>{fechaCorta(p.fecha)}{p.canal && ` · ${(CANALES.find((x) => x.id === p.canal) || {}).icono || ''} ${p.canal}`}</b><b>{soles(p.total)}</b></div>
                      <div className="text-secondary">{textoPedido(p, datos.lotes)}</div>
                    </div>
                  ))}
                </>
              )}
            </div></div>
          </div>
        ))}
      </div>
    </>
  )
}
