/* Versão somente-leitura: os dados vêm do Apps Script (ou de data.json, se ele falhar). */
(function () {
  var FONTE = 'https://script.google.com/macros/s/AKfycbxsgplsRdtMlxWTCpeHRtFLfepOnMfjkqfJanhyvinVssSyp_yg-eU0KXor3gXyc0Q/exec';
  function local() { return fetch('data.json?t=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.json(); }).catch(function () { return {}; }); }
  /* Dados ao vivo do Apps Script (atualizados às 9h05, 17h05 e no botão "Atualizar agora"); data.json fica de reserva. */
  var dados = fetch(FONTE + '?t=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.json(); })
    .then(function (d) { return d && d.sync ? d : local(); }).catch(local);
  function snap(id, d) { return { id: id, exists: !!d, data: function () { return d; }, metadata: { fromCache: false, hasPendingWrites: false } }; }
  function erro() { return Promise.reject({ code: 'not_granted', message: 'Somente leitura' }); }
  function docRef(path) {
    var p = path.split('/');
    return {
      onSnapshot: function (fn) { dados.then(function (D) { fn(snap(p[1], (D[p[0]] || {})[p[1]])); }); return function () {}; },
      get: function () { return dados.then(function (D) { return snap(p[1], (D[p[0]] || {})[p[1]]); }); },
      set: erro, update: erro, delete: erro
    };
  }
  function colRef(name) {
    var q = {
      onSnapshot: function (fn) { dados.then(function (D) { var m = D[name] || {}; var docs = Object.keys(m).map(function (k) { return snap(k, m[k]); }); fn({ docs: docs, size: docs.length, empty: !docs.length, docChanges: function () { return []; }, metadata: {} }); }); return function () {}; },
      limit: function () { return q; }, orderBy: function () { return q; }, where: function () { return q; },
      doc: function (id) { return docRef(name + '/' + id); }, add: erro
    };
    return q;
  }
  var db = { doc: docRef, collection: colRef };
  var user = { canEdit: function () { return Promise.resolve(false); }, isOwner: function () { return false; } };
  window.claude = { use: function (n) { return Promise.resolve(n === 'db' ? db : n === 'user' ? user : null); } };
})();
