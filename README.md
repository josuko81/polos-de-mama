# Polos de Mamá

Sistema para llevar las cuentas del negocio de polos: lotes de producción (tela → corte → taller → recojo → etiquetado), ventas, gastos, stock y resumen del mes.

- **Interfaz:** React 18 + Bootstrap 5.3 (tema Bootswatch *Cerulean*), compilada con Vite en **un solo `index.html`**.
- **Backend:** Google Apps Script (`apps-script/Code.gs`).
- **Base de datos:** la hoja de Google Sheets a la que está vinculado el script (pestañas `Lotes`, `Ventas`, `Gastos`).

```
polos-de-mama/
├─ web/                  ← la app React (aquí trabajas)
│  ├─ src/
│  │  ├─ App.jsx         ← menú y navegación entre pantallas
│  │  ├─ api.js          ← conexión con Apps Script (o modo de prueba)
│  │  ├─ calc.js         ← todos los cálculos (costo por polo, stock, resumen)
│  │  └─ screens/        ← Inicio, Vendi, Gaste, Lotes, LoteDetalle, Resumen
│  └─ scripts/copy-to-gas.js
└─ apps-script/          ← lo que se sube a Google
   ├─ Code.gs            ← getData(), guardar(), borrar()
   ├─ appsscript.json
   └─ index.html         ← la app ya compilada (se regenera con npm run build:gas)
```

## 1. Probar en tu PC (modo de prueba)

```bash
cd web
npm install
npm run dev
```

Abre http://localhost:5173. Fuera de Apps Script la app entra en **modo de prueba**: usa datos de ejemplo y guarda en el navegador (localStorage). Para volver a los ejemplos, borra la clave `polos-de-mama-demo` desde las DevTools.

## 2. Conectarlo con Google Sheets

1. Instala clasp e inicia sesión con la cuenta de Google que usará tu mamá:
   ```bash
   npm install -g @google/clasp
   clasp login
   ```
   Activa la API de Apps Script en https://script.google.com/home/usersettings (solo la primera vez).
2. Crea la hoja y el script vinculado:
   ```bash
   cd apps-script
   clasp create --type sheets --title "Polos de Mamá" --rootDir .
   ```
   Esto crea `.clasp.json` (hay un ejemplo en `.clasp.json.ejemplo`).
3. Compila y sube:
   ```bash
   cd ../web
   npm run push        # = build + copiar a apps-script/index.html + clasp push
   ```
4. Abre el script (`clasp open`), ejecuta una vez la función **`prepararHojas`** y acepta los permisos.
   Google mostrará “Google no verificó esta app” → *Configuración avanzada* → *Ir a Polos de Mamá*. Es normal porque la app es tuya.
5. **Implementar → Nueva implementación → Aplicación web**
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Solo yo** (si tu mamá usa tu misma cuenta) o **Cualquier usuario con cuenta de Google** si ella entra con la suya. En ese caso, comparte la hoja con ella.
   Copia la URL que termina en `/exec`.

> Sin npm: `apps-script/index.html` ya viene compilado (carga React desde cdnjs), así que puedes saltarte el paso 3 y hacer solo `clasp push` desde `apps-script/`.

## 3. Dejarla como programa en la laptop

Abre la URL `/exec` en Chrome o Edge → menú ⋮ → **Transmitir, guardar y compartir → Crear acceso directo…** → marca **Abrir como ventana**.
Queda un ícono en el escritorio que abre la app sin barra del navegador.

## Actualizar la app más adelante

```bash
cd web
npm run push
```

Luego, en Apps Script: **Implementar → Administrar implementaciones → editar → Versión: nueva**. La URL `/exec` no cambia.

## Dónde cambiar cosas comunes

| Quiero cambiar… | Archivo |
|---|---|
| Tallas, categorías de gasto, nombres de los pasos | `web/src/calc.js` (`TALLAS`, `CATEGORIAS`, `PASOS`) |
| Cómo se calcula el costo por polo | `web/src/calc.js` → `costoTotalLote()` |
| Colores de marca y tamaños de letra | `web/src/styles.css` |
| Tema de Bootstrap | `web/src/main.jsx` (por ejemplo, cambia `cerulean` por `flatly`, o usa `bootstrap` clásico) |
| Columnas de las hojas de Google | `apps-script/Code.gs` → `TABLAS` (mantén el mismo orden que en `calc.js`/`api.js`) |

## Notas

- El **costo por polo** de un lote = (tela + corte + confección por polo × polos recibidos + etiquetas y bolsas + pasajes y otros) ÷ polos recibidos.
- **Me quedó** del mes = lo vendido − costo de los polos vendidos − gastos del mes.
- Las ventas “Me debe” se suman en *Me deben* hasta que se marcan con **Ya me pagó**.
- Cada guardado en Apps Script tarda 1–2 s; la app muestra “Guardando…”.
