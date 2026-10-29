import React, { useEffect, useRef, useState } from 'react'
import { api } from '../api.js'
import { fotosDe } from '../calc.js'
import BotonBorrar from './BotonBorrar.jsx'

// Achica la foto del celular (que pesa varios MB) a un JPG liviano
function achicar(archivo, lado = 1000) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(archivo)
    img.onload = () => {
      const k = Math.min(1, lado / Math.max(img.width, img.height))
      const c = document.createElement('canvas')
      c.width = Math.round(img.width * k)
      c.height = Math.round(img.height * k)
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(url)
      resolve(c.toDataURL('image/jpeg', 0.75))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No pude abrir esa foto.')) }
    img.src = url
  })
}

// Una foto guardada (se pide por su id)
export function Foto({ id, className = '', style }) {
  const [src, setSrc] = useState(null)
  useEffect(() => {
    let vivo = true
    api.verFoto(id).then((s) => { if (vivo) setSrc(s) })
    return () => { vivo = false }
  }, [id])
  if (!src) return <div className={'foto foto-cargando ' + className} style={style} />
  return <img src={src} alt="Foto del polo" className={'foto ' + className} style={style} />
}

// Primera foto del lote, chiquita, para las listas
export function FotoMini({ lote, tam = '4rem' }) {
  const ids = fotosDe(lote)
  if (!ids.length) return null
  return <Foto id={ids[0]} style={{ width: tam, height: tam }} />
}

// Sección de fotos dentro del lote
export default function Fotos({ lote, guardar }) {
  const ids = fotosDe(lote)
  const entrada = useRef(null)
  const [subiendo, setSubiendo] = useState(false)
  const [grande, setGrande] = useState(null)
  const [error, setError] = useState('')

  const subir = async (e) => {
    const archivos = [...e.target.files]
    e.target.value = ''
    if (!archivos.length) return
    setError('')
    setSubiendo(true)
    try {
      const nuevos = []
      for (const a of archivos) nuevos.push(await api.subirFoto(await achicar(a)))
      await guardar('lotes', { id: lote.id, fotos: [...ids, ...nuevos].join(',') }, nuevos.length > 1 ? 'Fotos guardadas' : 'Foto guardada')
    } catch (err) {
      setError(err && err.message ? err.message : 'No se pudo subir la foto. Revisa el internet y vuelve a intentar.')
    } finally {
      setSubiendo(false)
    }
  }

  const quitar = async (id) => {
    await guardar('lotes', { id: lote.id, fotos: ids.filter((x) => x !== id).join(',') }, 'Foto borrada')
    api.borrarFoto(id).catch(() => {})
    setGrande(null)
  }

  return (
    <div className="card border-0 shadow-sm mt-4"><div className="card-body p-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <h2 className="fw-bold fs-3 mb-0">📷 Fotos del lote</h2>
        <button className="btn btn-warning btn-lg fw-bold" disabled={subiendo} onClick={() => entrada.current.click()}>
          {subiendo ? <><span className="spinner-border spinner-border-sm me-2" />Subiendo…</> : '＋ Subir foto'}
        </button>
        <input ref={entrada} type="file" accept="image/*" multiple hidden onChange={subir} />
      </div>
      {ids.length === 0 && <p className="text-secondary fs-5 mb-0">Sube una foto del polo para reconocerlo fácil al vender.</p>}
      <div className="d-flex flex-wrap gap-3">
        {ids.map((id) => (
          <button key={id} type="button" className="btn p-0 border-0" onClick={() => setGrande(id)}>
            <Foto id={id} style={{ width: '8rem', height: '8rem' }} />
          </button>
        ))}
      </div>
      {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}

      {grande && (
        <div className="foto-grande" onClick={() => setGrande(null)}>
          <div className="text-center" onClick={(e) => e.stopPropagation()}>
            <Foto id={grande} className="mw-100" style={{ maxHeight: '75vh', objectFit: 'contain', background: '#fff' }} />
            <div className="d-flex justify-content-center gap-3 mt-3">
              <button className="btn btn-light btn-lg" onClick={() => setGrande(null)}>Cerrar</button>
              <div className="bg-light rounded p-1"><BotonBorrar texto="Borrar foto" onConfirmar={() => quitar(grande)} /></div>
            </div>
          </div>
        </div>
      )}
    </div></div>
  )
}
