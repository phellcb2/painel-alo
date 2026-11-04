/* Versão somente-leitura: os dados vêm de data.json, publicado 2x por dia. */
(function () {
  var dados = fetch('data.json?t=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.json(); }).catch(function () { return {}; });
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
