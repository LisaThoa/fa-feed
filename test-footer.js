/* ===========================================================================
 * Bout de test, ajouté à la suite du plugin pour produire console-test.js.
 * Ne fait pas partie du plugin : à coller dans la console d'un forum, connecté.
 * Adapter SOURCES et BALISAGE à son propre forum.
 * =========================================================================== */
(function () {
  var SOURCES = [
    { titre: 'instagram', forum: 14, url: '/f14-instagram' }
  ];

  /* Les genres tels qu'ils existent sur ton forum. Les noms sont les tiens. */
  var BALISAGE = {
    genres: {
      commentaire: ['[class*="comment"]'],
      post: ['[class*="insta"]']
    }
  };

  /* Ce qu'on montre parmi eux. null = tout. */
  var AFFICHER = ['post'];

  var vieux = document.getElementById('test-faf');
  if (vieux) vieux.remove();

  var panneau = document.createElement('div');
  panneau.id = 'test-faf';
  panneau.style.cssText = 'position:fixed;top:10px;right:10px;width:340px;max-height:90vh;overflow:auto;'
    + 'z-index:99999;background:#14141c;color:#ddd;padding:14px;border-radius:10px;'
    + 'box-shadow:0 8px 30px rgba(0,0,0,.5);font-family:Trebuchet MS,sans-serif';
  var fermer = document.createElement('div');
  fermer.textContent = '× fermer le test';
  fermer.style.cssText = 'cursor:pointer;font-size:10px;opacity:.5;text-align:right;margin-bottom:8px';
  fermer.onclick = function () { panneau.remove(); };
  panneau.appendChild(fermer);
  document.body.appendChild(panneau);

  FAFeed.init({
    emplacement: panneau,
    cache: 0,
    style: false,
    titre: 'fil',
    texteChargement: '…',
    texteInterdit: '⛔ section inaccessible (ou template non lu)',
    genre: true,
    afficher: AFFICHER,
    sources: SOURCES,
    balisage: BALISAGE
  }).then(function (res) {
    console.log('%c[fa-feed] résultat', 'font-weight:bold', res);
    if (res.interdit) return console.warn('[fa-feed] section inaccessible — connecté ?');
    console.log('— ' + res.posts.length + ' posts retenus');
    if (res.posts.length) console.table(res.posts.map(function (p) {
      return { compte: p.compte, message: p.id, date: p.dateTxt, source: p.source, taille: p.html.length };
    }));
  });

  /* Diagnostic : ce que le forum renvoie vraiment, pour régler "balisage". */
  fetch(SOURCES[0].url, { credentials: 'same-origin' })
    .then(function (r) { return r.text(); })
    .then(function (html) {
      var d = new DOMParser().parseFromString(html, 'text/html');
      var a = d.querySelector('a.topictitle');
      if (!a) return console.warn('[fa-feed] aucune ligne de sujet lisible (page Connexion ?) — titre :', d.title);

      var liste = FAFeed._lireListeSujets(html);
      console.log('%c[fa-feed] ' + liste.sujets.length + ' sujets dans la section', 'font-weight:bold');
      console.table(liste.sujets.slice(0, 10).map(function (s) {
        return { id: s.id, titre: s.titre, dernier: s.ordre, page: s.urlDernier };
      }));

      var premier = liste.sujets[0];
      if (!premier) return;
      return fetch(premier.urlDernier, { credentials: 'same-origin' })
        .then(function (r) { return r.text(); })
        .then(function (page) {
          var dd = new DOMParser().parseFromString(page, 'text/html');
          var messages = [].slice.call(dd.querySelectorAll('.post, .post_row'));
          console.log('%c[fa-feed] ' + messages.length + ' messages sur ' + premier.urlDernier, 'font-weight:bold');

          var classes = {};
          messages.forEach(function (m) {
            [].forEach.call(m.querySelectorAll('[class]'), function (n) {
              String(n.className).split(/\s+/).forEach(function (c) {
                if (c) classes[c] = (classes[c] || 0) + 1;
              });
            });
          });
          var tri = Object.keys(classes).sort(function (x, y) { return classes[y] - classes[x]; });
          console.log('%c[fa-feed] classes rencontrées dans les messages — y repérer celle du post :', 'font-weight:bold');
          console.table(tri.slice(0, 40).map(function (c) { return { classe: c, occurrences: classes[c] }; }));

          var lu = FAFeed._lirePostsDuSujet(page, premier, FAFeed._reglages({ balisage: BALISAGE }));
          console.log('%c[fa-feed] classement des messages :', 'font-weight:bold');
          console.table((lu.posts || []).map(function (p) {
            return { message: p.id, genre: p.genre || '(aucun)', date: p.dateTxt,
              affiché: !AFFICHER || AFFICHER.indexOf(p.genre) !== -1 };
          }));
        });
    });
})();
