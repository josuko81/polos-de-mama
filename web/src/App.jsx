import React, { useEffect, useState } from 'react'
import { api, modoPrueba } from './api.js'
import Inicio from './screens/Inicio.jsx'
import Vendi from './screens/Vendi.jsx'
import Gaste from './screens/Gaste.jsx'
import Lotes from './screens/Lotes.jsx'
import LoteDetalle from './screens/LoteDetalle.jsx'
import CompraTela from './screens/CompraTela.jsx'
import Disenos from './screens/Disenos.jsx'
import Produccion from './screens/Produccion.jsx'
import Tela from './screens/Tela.jsx'
import Clientes from './screens/Clientes.jsx'
import Cuaderno, { VentasCuaderno, ComprasCuaderno, GastosCuaderno, ResumenCuaderno } from './screens/Cuaderno.jsx'
import Materiales from './screens/Materiales.jsx'
import { registrarDisenos } from './calc.js'
import Resumen from './screens/Resumen.jsx'

// Menú en 4 grupos, en el orden en que trabaja el negocio: producir → vender → revisar cuentas.
// Cada grupo tiene pestañas; la primera es la que se abre al tocar el grupo.
// `otras`: pantallas que pertenecen a esa pestaña (por ejemplo, la compra de tela es parte de Tela).
const MENU = [
  { id: 'inicio', texto: 'Inicio', icono: '🏠', pestanas: [{ id: 'inicio' }] },
  { id: 'cuaderno', texto: 'Cuaderno', icono: '📒', pestanas: [{ id: 'cuaderno' }] },
  {
    id: 'produccion', texto: 'Producción', icono: '✂️', pestanas: [
      { id: 'produccion', texto: 'Tablero', icono: '📋', otras: ['nueva-tanda', 'tanda', 'lotes', 'lote'] },
      { id: 'tela', texto: 'Tela', icono: '📦', otras: ['compra-tela'] },
      { id: 'disenos', texto: 'Diseños', icono: '👕' },
      { id: 'materiales', texto: 'Materiales', icono: '🧵' },
    ],
  },
  {
    id: 'ventas', texto: 'Ventas', icono: '💰', pestanas: [
      { id: 'vendi', texto: 'Vendí', icono: '💰' },
      { id: 'clientes', texto: 'Clientes', icono: '👥' },
    ],
  },
  {
    id: 'cuentas', texto: 'Mis cuentas', icono: '📊', pestanas: [
      { id: 'resumen', texto: '¿Cómo me va?', icono: '📊' },
      { id: 'gaste', texto: 'Gasté', icono: '🧾' },
    ],
  },
]
// Menú para mamá: las 3 tablas de su cuaderno y el resumen. Lo demás queda en «opciones completas».
const MENU_SIMPLE = [
  { id: 'cuaderno', texto: 'Cuaderno', icono: '📒', pestanas: [{ id: 'cuaderno' }] },
  // En el celular se esconden: las 3 tablas ya se abren desde las tarjetas del Cuaderno
  { id: 'c-ventas', texto: 'Ventas', icono: '💰', soloPc: true, pestanas: [{ id: 'c-ventas' }] },
  { id: 'c-material', texto: 'Material', icono: '🧵', soloPc: true, pestanas: [{ id: 'c-material' }] },
  { id: 'c-gastos', texto: 'Gastos', icono: '🧾', soloPc: true, pestanas: [{ id: 'c-gastos' }] },
  { id: 'c-resumen', texto: 'Resumen', icono: '📊', pestanas: [{ id: 'c-resumen' }] },
  {
    id: 'c-disenos', texto: 'Diseños', icono: '👕', pestanas: [
      { id: 'disenos', texto: 'Diseños', icono: '👕' },
      { id: 'materiales', texto: 'Materiales', icono: '🧵' },
    ],
  },
]
const CLAVE_COMPLETO = 'polos-de-mama-opciones-completas'
const leerCompleto = () => { try { return localStorage.getItem(CLAVE_COMPLETO) === '1' } catch (e) { return false } }
const esDe = (pestana, p) => pestana.id === p || (pestana.otras || []).includes(p)
const grupoDe = (menu, p) => menu.find((g) => g.pestanas.some((t) => esDe(t, p))) || menu[0]

export default function App() {
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState('')
  const [completo, setCompleto] = useState(leerCompleto)
  const [pantalla, setPantalla] = useState(() => (leerCompleto() ? 'inicio' : 'cuaderno'))
  const [loteId, setLoteId] = useState(null)
  const [aviso, setAviso] = useState('')

  useEffect(() => {
    api.getData().then(setDatos).catch((e) => setError(String(e && e.message ? e.message : e)))
  }, [])

  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(''), 3500)
    return () => clearTimeout(t)
  }, [aviso])

  const ir = (p, id = null) => {
    setPantalla(p)
    setLoteId(id)
    window.scrollTo(0, 0)
  }

  // Guarda y avisa. Devuelve el id guardado.
  const guardar = async (tipo, obj, mensaje) => {
    const r = await api.guardar(tipo, obj)
    setDatos(r.datos)
    if (mensaje) setAviso(mensaje)
    return r.id
  }
  const guardarVarios = async (tipo, objs, mensaje) => {
    const r = await api.guardarVarios(tipo, objs)
    setDatos(r.datos)
    if (mensaje) setAviso(mensaje)
    return r.ids
  }
  const borrar = async (tipo, id, mensaje) => {
    const r = await api.borrar(tipo, id)
    setDatos(r.datos)
    if (mensaje) setAviso(mensaje)
  }
  const borrarVarios = async (tipo, ids, mensaje) => {
    const r = await api.borrarVarios(tipo, ids)
    setDatos(r.datos)
    if (mensaje) setAviso(mensaje)
  }

  if (datos) registrarDisenos(datos.disenos)
  const props = { datos, ir, guardar, guardarVarios, borrar, borrarVarios }
  const menu = completo ? MENU : MENU_SIMPLE
  const grupo = grupoDe(menu, pantalla)
  const cambiarMenu = () => {
    const nuevo = !completo
    try { localStorage.setItem(CLAVE_COMPLETO, nuevo ? '1' : '0') } catch (e) {}
    setCompleto(nuevo)
    ir(nuevo ? 'inicio' : 'cuaderno')
  }

  return (
    <>
      <nav className="navbar navbar-dark navbar-marca shadow-sm">
        <div className="container-fluid contenedor">
          <span className="navbar-brand fw-bold fs-3 cursor-pointer" onClick={() => ir(menu[0].pestanas[0].id)}>
            👕 Polos de Mamá
          </span>
          <div className="d-flex flex-wrap gap-2 menu-grupos">
            {menu.map((m) => (
              <button
                key={m.id}
                className={'btn btn-lg boton-menu ' + (m.soloPc ? 'd-none d-sm-inline-block ' : '') + (m === grupo ? 'btn-light fw-bold' : 'btn-outline-light')}
                onClick={() => ir(m.pestanas[0].id)}
              >
                <span className="d-block d-sm-inline">{m.icono}</span> {m.texto}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {grupo.pestanas.length > 1 && (
        <div className="barra-pestanas shadow-sm">
          <div className="container-fluid contenedor d-flex gap-2 py-2">
            {grupo.pestanas.map((t) => (
              <button key={t.id} className={'btn btn-lg rounded-pill text-nowrap pestana ' + (esDe(t, pantalla) ? 'btn-marca fw-bold' : 'btn-light')} onClick={() => ir(t.id)}>
                {t.icono} {t.texto}
              </button>
            ))}
          </div>
        </div>
      )}

      {modoPrueba && (
        <div className="bg-warning-subtle text-warning-emphasis text-center small py-1">
          Modo de prueba: los datos son de ejemplo y se guardan solo en este navegador.
        </div>
      )}

      <main className="container-fluid contenedor py-4">
        {error && <div className="alert alert-danger fs-5">No se pudieron cargar los datos. {error}</div>}
        {!datos && !error && (
          <div className="text-center py-5">
            <div className="spinner-border text-success" style={{ width: '3rem', height: '3rem' }} />
            <p className="mt-3 fs-5">Cargando tus cuentas…</p>
          </div>
        )}
        {datos && pantalla === 'cuaderno' && <Cuaderno {...props} />}
        {datos && pantalla === 'c-ventas' && <VentasCuaderno {...props} />}
        {datos && pantalla === 'c-material' && <ComprasCuaderno {...props} />}
        {datos && pantalla === 'c-gastos' && <GastosCuaderno {...props} />}
        {datos && pantalla === 'materiales' && <Materiales {...props} />}
        {datos && pantalla === 'c-resumen' && <ResumenCuaderno {...props} />}
        {datos && pantalla === 'inicio' && <Inicio {...props} />}
        {datos && pantalla === 'vendi' && <Vendi {...props} />}
        {datos && pantalla === 'gaste' && <Gaste {...props} />}
        {datos && pantalla === 'lotes' && <Lotes {...props} />}
        {datos && pantalla === 'lote' && loteId === 'nuevo' && <CompraTela {...props} />}
        {datos && pantalla === 'lote' && loteId !== 'nuevo' && <LoteDetalle key={loteId} {...props} loteId={loteId} />}
        {datos && pantalla === 'resumen' && <Resumen {...props} />}
        {datos && pantalla === 'disenos' && <Disenos {...props} />}
        {datos && pantalla === 'produccion' && <Produccion key="produccion" {...props} />}
        {/* Nueva tanda y cada tanda se abren como ventana encima de Producción */}
        {datos && pantalla === 'nueva-tanda' && <Produccion key="nueva" {...props} abrir={{ tipo: 'nueva' }} />}
        {datos && pantalla === 'tanda' && <Produccion key={'tanda' + loteId} {...props} abrir={{ tipo: 'tanda', id: loteId }} />}
        {datos && pantalla === 'tela' && <Tela {...props} />}
        {datos && pantalla === 'clientes' && <Clientes {...props} />}
        {datos && pantalla === 'compra-tela' && <CompraTela {...props} />}
        <div className="text-center mt-4">
          <button className="btn btn-link btn-sm text-secondary" onClick={cambiarMenu}>{completo ? 'Volver al cuaderno simple' : 'Ver opciones completas'}</button>
        </div>
      </main>

      {aviso && <div className="alert alert-success shadow aviso fs-5 text-center">✅ {aviso}</div>}
    </>
  )
}
