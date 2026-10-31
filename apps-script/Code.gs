/**
 * Polos de Mamá — backend en Google Apps Script.
 * La hoja de cálculo a la que está vinculado este script es la base de datos.
 * Cada tabla es una pestaña; la fila 1 tiene los encabezados.
 */

const TABLAS = {
  lotes: {
    hoja: 'Lotes',
    cols: [
      ['id', 'N° lote'], ['fecha', 'Fecha'], ['modelo', 'Modelo'], ['color', 'Color'], ['paso', 'Paso (1-5)'],
      ['enviados', 'Polos enviados'], ['recibidos', 'Polos recibidos'], ['tela', 'Tela S/'], ['corte', 'Corte S/'],
      ['confeccion', 'Confección por polo S/'], ['etiquetas', 'Etiquetas y bolsas S/'], ['otros', 'Pasajes y otros S/'], ['fotos', 'Fotos (ids en Drive)'],
      ['rollos', 'Rollos'], ['kilos', 'Kilos de tela'], ['precioKilo', 'Precio por kilo S/'],
      ['disenoId', 'Diseño (id)'], ['enviadosT', 'Enviados por talla'], ['recibidosT', 'Recibidos por talla'],
    ],
  },
  ventas: {
    hoja: 'Ventas',
    cols: [
      ['id', 'ID'], ['fecha', 'Fecha'], ['loteId', 'N° lote'], ['talla', 'Talla'], ['cantidad', 'Cantidad'],
      ['precio', 'Precio por polo S/'], ['pagado', '¿Ya pagó?'], ['cliente', 'Cliente / nota'],
      ['disenoId', 'Diseño (id)'], ['color', 'Color'],
      // Una venta con varios productos son varias filas con el mismo pedido
      ['pedidoId', 'Pedido'], ['clienteId', 'Cliente (id)'], ['canal', 'Canal'],
    ],
  },
  // Tabla 1 del cuaderno de mamá: cada prenda vendida con su costo y su venta
  cuaderno: {
    hoja: 'Cuaderno',
    // costo y venta son el total de la fila (cantidad × precio por unidad)
    cols: [['id', 'ID'], ['fecha', 'Fecha'], ['prenda', 'Prenda'], ['costo', 'Costo total S/'], ['venta', 'Venta total S/'], ['cantidad', 'Cantidad'], ['disenoId', 'Diseño (id)']],
  },
  clientes: {
    hoja: 'Clientes',
    cols: [['id', 'ID'], ['nombre', 'Nombre'], ['telefono', 'Teléfono (WhatsApp)'], ['nota', 'Nota']],
  },
  disenos: {
    hoja: 'Diseños',
    cols: [['id', 'ID'], ['nombre', 'Nombre del diseño'], ['cuello', 'Cuello'], ['tipo', 'Liso o estampado'], ['fotos', 'Fotos (ids en Drive)']],
  },
  gastos: {
    hoja: 'Gastos',
    cols: [['id', 'ID'], ['fecha', 'Fecha'], ['concepto', '¿En qué gasté?'], ['categoria', 'Categoría'], ['monto', 'Monto S/']],
  },
  // Almacén de tela: cada compra de un color. Lo usado se calcula desde las tandas.
  telas: {
    hoja: 'Telas',
    cols: [
      ['id', 'ID'], ['fecha', 'Fecha de compra'], ['color', 'Color'], ['rollos', 'Rollos'], ['kilos', 'Kilos'],
      ['precioKilo', 'Precio por kilo S/'], ['costo', 'Costo S/'], ['acabada', '¿Se acabó?'],
    ],
  },
  talleres: {
    hoja: 'Talleres',
    cols: [['id', 'ID'], ['nombre', 'Nombre'], ['telefono', 'Teléfono'], ['precio', 'Precio por polo S/']],
  },
  // Una tanda = un diseño cortado en varios colores. `colores` guarda, por color, las telas usadas y las tallas (JSON).
  tandas: {
    hoja: 'Tandas',
    cols: [
      ['id', 'N° tanda'], ['fecha', 'Fecha de corte'], ['disenoId', 'Diseño (id)'], ['etapa', 'Etapa (1-4)'],
      ['tallerId', 'Taller (id)'], ['precioTaller', 'Taller cobra por polo S/'], ['fechaEnvio', 'Mandado al taller'],
      ['fechaEstimada', 'Fecha estimada'], ['fechaRecojo', 'Recogido'], ['otros', 'Pasajes y otros S/'],
      ['pagado', '¿Se pagó al taller?'], ['colores', 'Colores, telas y tallas (JSON)'],
    ],
  },
};

// Columnas que se guardan como Sí / No
const SI_NO = ['pagado', 'acabada'];

const NUMERICOS = ['paso', 'enviados', 'recibidos', 'tela', 'corte', 'confeccion', 'etiquetas', 'otros', 'loteId', 'cantidad', 'precio', 'monto', 'rollos', 'kilos', 'precioKilo',
  'costo', 'etapa', 'precioTaller', 'venta'];

function doGet() {
  prepararHojas_();
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Polos de Mamá')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
}

/** Crea las pestañas y encabezados si no existen. Puedes ejecutarla a mano la primera vez. */
function prepararHojas_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(TABLAS).forEach(function (k) {
    const t = TABLAS[k];
    let sh = ss.getSheetByName(t.hoja);
    if (!sh) sh = ss.insertSheet(t.hoja);
    if (sh.getLastRow() === 0) {
      sh.appendRow(t.cols.map(function (c) { return c[1]; }));
      sh.getRange(1, 1, 1, t.cols.length).setFontWeight('bold').setBackground('#1f5f5b').setFontColor('#ffffff');
      sh.setFrozenRows(1);
    } else if (sh.getLastColumn() < t.cols.length) {
      // Columnas nuevas en una hoja que ya tenía datos: solo se agrega el encabezado
      const desde = sh.getLastColumn() + 1;
      const nuevas = t.cols.slice(desde - 1).map(function (c) { return c[1]; });
      sh.getRange(1, desde, 1, nuevas.length).setValues([nuevas])
        .setFontWeight('bold').setBackground('#1f5f5b').setFontColor('#ffffff');
    }
  });
}
function prepararHojas() { prepararHojas_(); }

function hoja_(tipo) {
  const t = TABLAS[tipo];
  if (!t) throw new Error('Tabla desconocida: ' + tipo);
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(t.hoja);
}

function leer_(tipo) {
  const t = TABLAS[tipo];
  const sh = hoja_(tipo);
  const n = sh.getLastRow() - 1;
  if (n <= 0) return [];
  const tz = Session.getScriptTimeZone();
  const filas = sh.getRange(2, 1, n, t.cols.length).getValues();
  return filas
    .filter(function (f) { return f[0] !== '' && f[0] !== null; })
    .map(function (f) {
      const o = {};
      t.cols.forEach(function (c, i) {
        let v = f[i];
        if (v instanceof Date) v = Utilities.formatDate(v, tz, 'yyyy-MM-dd');
        if (SI_NO.indexOf(c[0]) >= 0) v = v === true || String(v).toLowerCase() === 'sí' || String(v).toLowerCase() === 'si';
        else if (NUMERICOS.indexOf(c[0]) >= 0) v = v === '' ? 0 : Number(v);
        o[c[0]] = v;
      });
      return o;
    });
}

function getData() {
  prepararHojas_();
  return {
    lotes: leer_('lotes'), ventas: leer_('ventas'), gastos: leer_('gastos'), disenos: leer_('disenos'),
    telas: leer_('telas'), talleres: leer_('talleres'), tandas: leer_('tandas'), clientes: leer_('clientes'), cuaderno: leer_('cuaderno'),
  };
}

function aFila_(tipo, obj) {
  return TABLAS[tipo].cols.map(function (c) {
    const v = obj[c[0]];
    if (SI_NO.indexOf(c[0]) >= 0) return v ? 'Sí' : 'No';
    return v === undefined || v === null ? '' : v;
  });
}

/** Crea o actualiza un registro (sin lock; lo usan guardar y guardarVarios). */
function guardarUno_(tipo, obj) {
  const sh = hoja_(tipo);
  const actuales = leer_(tipo);
  if (obj.id === undefined || obj.id === null || obj.id === '') {
    obj.id = tipo === 'lotes' || tipo === 'tandas'
      ? actuales.reduce(function (m, x) { return Math.max(m, Number(x.id) || 0); }, 0) + 1
      : Utilities.getUuid().slice(0, 8);
    sh.appendRow(aFila_(tipo, obj));
  } else {
    const ids = sh.getRange(2, 1, Math.max(sh.getLastRow() - 1, 1), 1).getValues().map(function (r) { return String(r[0]); });
    const i = ids.indexOf(String(obj.id));
    if (i < 0) {
      sh.appendRow(aFila_(tipo, obj));
    } else {
      const previo = actuales.filter(function (x) { return String(x.id) === String(obj.id); })[0] || {};
      const unido = Object.assign({}, previo, obj);
      sh.getRange(i + 2, 1, 1, TABLAS[tipo].cols.length).setValues([aFila_(tipo, unido)]);
    }
  }
  return obj.id;
}

/** Crea o actualiza un registro. Devuelve todos los datos actualizados y el id. */
function guardar(tipo, obj) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const id = guardarUno_(tipo, obj);
    SpreadsheetApp.flush();
    return { datos: getData(), id: id };
  } finally {
    lock.releaseLock();
  }
}

/** Crea o actualiza varios registros de una vez (por ejemplo, una compra de tela de varios colores). */
function guardarVarios(tipo, lista) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const ids = lista.map(function (obj) { return guardarUno_(tipo, obj); });
    SpreadsheetApp.flush();
    return { datos: getData(), ids: ids };
  } finally {
    lock.releaseLock();
  }
}

/** Carpeta de Drive donde se guardan las fotos (se crea la primera vez). */
function carpetaFotos_() {
  const nombre = 'Polos de Mamá - Fotos';
  const it = DriveApp.getFoldersByName(nombre);
  return it.hasNext() ? it.next() : DriveApp.createFolder(nombre);
}

/** Recibe la foto ya achicada (data URL JPG) y devuelve su id en Drive. */
function subirFoto(dataUrl) {
  const m = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(String(dataUrl));
  if (!m) throw new Error('Formato de foto no válido');
  const nombre = 'polo-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss') + '.jpg';
  const blob = Utilities.newBlob(Utilities.base64Decode(m[2]), m[1], nombre);
  return carpetaFotos_().createFile(blob).getId();
}

/** Solo deja tocar archivos que estén en la carpeta de fotos, no cualquier archivo del Drive. */
function fotoDeLaCarpeta_(id) {
  const archivo = DriveApp.getFileById(id);
  const carpeta = carpetaFotos_().getId();
  const padres = archivo.getParents();
  while (padres.hasNext()) if (padres.next().getId() === carpeta) return archivo;
  throw new Error('Esa foto no es del sistema');
}

/** Devuelve la foto como data URL para mostrarla (las fotos siguen siendo privadas en Drive). */
function verFoto(id) {
  const blob = fotoDeLaCarpeta_(id).getBlob();
  return 'data:' + blob.getContentType() + ';base64,' + Utilities.base64Encode(blob.getBytes());
}

/** Manda la foto a la papelera de Drive (se puede recuperar desde ahí). */
function borrarFoto(id) {
  fotoDeLaCarpeta_(id).setTrashed(true);
}

function borrar(tipo, id) {
  return borrarVarios(tipo, [id]);
}

/** Borra varios registros de una vez (por ejemplo, todas las filas de un pedido). */
function borrarVarios(tipo, lista) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = hoja_(tipo);
    const n = sh.getLastRow() - 1;
    if (n > 0) {
      const ids = sh.getRange(2, 1, n, 1).getValues().map(function (r) { return String(r[0]); });
      const buscados = lista.map(String);
      // De abajo hacia arriba para que no se muevan las filas que faltan borrar
      for (let i = ids.length - 1; i >= 0; i--) {
        if (buscados.indexOf(ids[i]) >= 0) sh.deleteRow(i + 2);
      }
    }
    SpreadsheetApp.flush();
    return { datos: getData() };
  } finally {
    lock.releaseLock();
  }
}
