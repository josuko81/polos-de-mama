import React, { useEffect } from 'react'

// Ventana encima de la página (modal de Bootstrap sin su JavaScript).
// Solo se cierra con la ✕, para no perder lo escrito si se toca afuera por accidente.
export default function Ventana({ titulo, onCerrar, children }) {
  useEffect(() => {
    document.body.classList.add('modal-open')
    return () => document.body.classList.remove('modal-open')
  }, [])
  return (
    <>
      <div className="modal d-block" tabIndex="-1" role="dialog" aria-modal="true" aria-label={titulo}>
        <div className="modal-dialog modal-xl modal-dialog-scrollable modal-fullscreen-lg-down ventana">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title fs-3 fw-bold">{titulo}</h2>
              <button type="button" className="btn-close fs-4" aria-label="Cerrar" onClick={onCerrar} />
            </div>
            <div className="modal-body bg-body-tertiary p-3 p-lg-4">{children}</div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop show" />
    </>
  )
}
