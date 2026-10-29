import React, { useEffect, useState } from 'react'

// Pide confirmar con un segundo clic, para no borrar por accidente.
export default function BotonBorrar({ onConfirmar, texto = 'Borrar' }) {
  const [seguro, setSeguro] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  useEffect(() => {
    if (!seguro) return
    const t = setTimeout(() => setSeguro(false), 3000)
    return () => clearTimeout(t)
  }, [seguro])

  const click = async () => {
    if (!seguro) return setSeguro(true)
    setOcupado(true)
    try { await onConfirmar() } finally { setOcupado(false); setSeguro(false) }
  }
  return (
    <button className={'btn btn-sm text-nowrap ' + (seguro ? 'btn-danger' : 'btn-outline-secondary')} disabled={ocupado} onClick={click}>
      {ocupado ? '…' : seguro ? '¿Seguro?' : texto}
    </button>
  )
}
