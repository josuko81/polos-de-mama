import React from 'react'
import { colorHex } from '../calc.js'

// Circulito con el color del polo, para reconocerlo sin leer
export default function Muestra({ color, tam = '1.4rem' }) {
  const hex = colorHex(color)
  if (!hex) return null
  return <span className="muestra" title={color} style={{ background: hex, width: tam, height: tam }} />
}
