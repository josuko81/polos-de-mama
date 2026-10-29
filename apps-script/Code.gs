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
      ['confeccion', 'Confección por polo S/'], ['etiquetas', 'Etiquetas y bolsas S/'], ['otros', 'Pasajes y otros S/'],
    ],
  },
  ventas: {
    hoja: 'Ventas',
    cols: [
      ['id', 'ID'], ['fecha', 'Fecha'], ['loteId', 'N° lote'], ['talla', 'Talla'], ['cantidad', 'Cantidad'],
      ['precio', 'Precio por polo S/'], ['pagado', '¿Ya pagó?'], ['cliente', 'Cliente / nota'],
    ],
  },
  gastos: {
    hoja: 'Gastos',
    cols: [['id', 'ID'], ['fecha', 'Fecha'], ['concepto', '¿En qué gasté?'], ['categoria', 'Categoría'], ['monto', 'Monto S/']],
  },
};

const NUMERICOS = ['paso', 'enviados', 'recibidos', 'tela', 'corte', 'confeccion', 'etiquetas', 'otros', 'loteId', 'cantidad', 'precio', 'monto'];

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
        if (c[0] === 'pagado') v = v === true || String(v).toLowerCase() === 'sí' || String(v).toLowerCase() === 'si';
        else if (NUMERICOS.indexOf(c[0]) >= 0) v = v === '' ? 0 : Number(v);
        o[c[0]] = v;
      });
      return o;
    });
}

function getData() {
  prepararHojas_();
  return { lotes: leer_('lotes'), ventas: leer_('ventas'), gastos: leer_('gastos') };
}

function aFila_(tipo, obj) {
  return TABLAS[tipo].cols.map(function (c) {
    const v = obj[c[0]];
    if (c[0] === 'pagado') return v ? 'Sí' : 'No';
    return v === undefined || v === null ? '' : v;
  });
}

/** Crea o actualiza un registro. Devuelve todos los datos actualizados y el id. */
function guardar(tipo, obj) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = hoja_(tipo);
    const actuales = leer_(tipo);
    if (obj.id === undefined || obj.id === null || obj.id === '') {
      obj.id = tipo === 'lotes'
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
    SpreadsheetApp.flush();
    return { datos: getData(), id: obj.id };
  } finally {
    lock.releaseLock();
  }
}

function borrar(tipo, id) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = hoja_(tipo);
    const n = sh.getLastRow() - 1;
    if (n > 0) {
      const ids = sh.getRange(2, 1, n, 1).getValues().map(function (r) { return String(r[0]); });
      const i = ids.indexOf(String(id));
      if (i >= 0) sh.deleteRow(i + 2);
    }
    SpreadsheetApp.flush();
    return { datos: getData() };
  } finally {
    lock.releaseLock();
  }
}
