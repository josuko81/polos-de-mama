// Copia el build a la carpeta de Apps Script como index.html
import { copyFileSync } from 'node:fs'
copyFileSync('dist/index.html', '../apps-script/index.html')
console.log('Listo: apps-script/index.html actualizado')
