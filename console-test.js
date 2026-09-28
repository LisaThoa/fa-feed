/*!
 * fa-feed — fil d'actualité des posts d'une section, pour Forumactif.
 *
 * Rien à régler ici : la configuration est dans config.js, les styles dans
 * config.css. Documentation complète : README.md.
 *
 * Licence MIT.
 */

(function (window, document) {
  'use strict';

  var VERSION = '0.1.0';

  var MON_URL = (document.currentScript && document.currentScript.src) || '';

  var DEFAUTS = {
    emplacement: { cible: '#fa-feed', position: 'fin' },
    classe: null,
    titre: null,

    sources: [],
    sujets: 12,
    posts: 20,
    parSujet: 2,
    afficher: null,
    genre: false,

    balisage: {
      message: ['.post', '.post_row'],
      genres: null,
      post: [],
      ignorer: [],
      idMessage: 'post--(\\d+)',
      ancre: ['a.post_date', 'a[href*="#"]'],
      date: ['a.post_date', '.postdetails .date', '.date'],
      corps: ['.post_message', '.postbody', '.content'],

      like: ['.rep-button'],
      likeNombre: ['.rep-nb'],
      likeActif: [],
      likeAttribut: 'data-href',
      likeAttributRetirer: 'data-href-rm',

      urlReponse: '/post?t={sujet}&mode=reply',
      formulaireReponse: ['form[action*="/post"]', 'form[name="post"]'],
      champMessage: ['textarea[name="message"]'],
      boutonEnvoi: ['input[name="post"]', 'button[name="post"]'],
      erreurForum: ['.error', '.errorwrap', '#message_error', '.panel .inner h2 + p']
    },

    rendu: 'brut',
    champs: {
      avatar: ['img'],
      pseudo: ['.nom', 'strong', 'b'],
      image: ['img'],
      legende: ['p']
    },

    compte: true,
    source: true,
    auClic: 'couche',
    coucheComplete: false,
    texteFermer: '×',
    texteVoirSurLeForum: 'voir sur le forum',
    datesRelatives: true,
    cache: 300,

    texteVide: 'rien de neuf par ici',
    texteChargement: null,
    texteInterdit: null,

    style: true,
    filtre: null,
    chargeur: null,

    aimer: false,
    remplacerLikeOriginal: true,
    texteAimer: '♡',
    texteAime: '♥',
    confirmerAimer: false,
    texteConfirmerAimer: 'Aimer ce message ?',
    texteErreurAimer: 'impossible pour le moment',

    commenter: false,
    texteCommenter: 'commenter',
    texteEnvoyer: 'envoyer',
    texteAnnuler: 'annuler',
    invitecommentaire: 'votre commentaire…',
    confirmerCommentaire: true,
    texteConfirmerCommentaire: 'Publier ce commentaire sur le forum, sous votre pseudo ?',
    texteCommentaireEnvoye: 'commentaire publié',
    texteErreurCommentaire: 'le forum a refusé le commentaire',
    longueurMiniCommentaire: 2
  };

  function fusion() {
    var out = {}, i, k;
    for (i = 0; i < arguments.length; i++) {
      var src = arguments[i] || {};
      for (k in src) if (Object.prototype.hasOwnProperty.call(src, k)) out[k] = src[k];
    }
    return out;
  }

  function liste(v) {
    if (v == null || v === '') return [];
    return (v instanceof Array ? v : [v]).filter(function (x) { return !!x; });
  }

  function selecteur(v) {
    return liste(v).join(', ');
  }

  function el(tag, cls, texte) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (texte != null) n.textContent = texte;
    return n;
  }

  function texteDe(node) {
    return node ? node.textContent.replace(/\s+/g, ' ').trim() : '';
  }

  function premier(racine, sels) {
    var s = selecteur(sels);
    if (!s || !racine) return null;
    try { return racine.querySelector(s); } catch (e) { return null; }
  }

  function correspond(node, sels) {
    var s = selecteur(sels);
    if (!s || !node) return false;
    try { return node.matches(s); } catch (e) { return false; }
  }

  function presentDans(node, sels) {
    var s = selecteur(sels);
    if (!s || !node) return false;
    try { return node.matches(s) || !!node.querySelector(s); } catch (e) { return false; }
  }

  function dansUn(node, sels, limite) {
    var s = selecteur(sels);
    if (!s || !node) return false;
    try {
      var haut = node.closest(s);
      return !!haut && (!limite || limite.contains(haut) || haut === limite);
    } catch (e) { return false; }
  }

  var MOIS = {
    jan: 0, fév: 1, fev: 1, mar: 2, avr: 3, mai: 4, juin: 5,
    juil: 6, aoû: 7, aou: 7, sep: 8, oct: 9, nov: 10, déc: 11, dec: 11
  };

  function dateFr(txt) {
    if (!txt) return null;
    var s = txt.replace(/\s+/g, ' ').trim();
    var hm = s.match(/(\d{1,2})\s*:\s*(\d{2})/);
    var h = hm ? +hm[1] : 0, mn = hm ? +hm[2] : 0;

    if (/aujourd/i.test(s)) { var a = new Date(); a.setHours(h, mn, 0, 0); return a; }
    if (/hier/i.test(s))    { var b = new Date(); b.setDate(b.getDate() - 1); b.setHours(h, mn, 0, 0); return b; }

    var m = s.match(/(\d{1,2})\s+([A-Za-zÀ-ÿ]+)\.?\s+(\d{4})/);
    if (!m) return null;
    var mois = MOIS[m[2].slice(0, 4).toLowerCase()];
    if (mois == null) mois = MOIS[m[2].slice(0, 3).toLowerCase()];
    if (mois == null) return null;
    return new Date(+m[3], mois, +m[1], h, mn);
  }

  function relatif(date, brut) {
    if (!date || isNaN(+date)) return brut || '';
    var sec = (Date.now() - date.getTime()) / 1000;
    if (sec < 60) return 'à l’instant';
    if (sec < 3600) return 'il y a ' + Math.floor(sec / 60) + ' min';
    if (sec < 86400) return 'il y a ' + Math.floor(sec / 3600) + ' h';
    var minuit = new Date(); minuit.setHours(0, 0, 0, 0);
    var d0 = new Date(date.getTime()); d0.setHours(0, 0, 0, 0);
    var j = Math.round((minuit - d0) / 86400000);
    if (j <= 1) return 'hier';
    if (j < 30) return 'il y a ' + j + ' jours';
    if (j < 365) return 'il y a ' + Math.floor(j / 30) + ' mois';
    return 'il y a ' + Math.floor(j / 365) + ' an' + (j >= 730 ? 's' : '');
  }

  function charger(url, cfg) {
    if (cfg.chargeur) return Promise.resolve(cfg.chargeur(url));
    return fetch(url, { credentials: 'same-origin' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status + ' sur ' + url);
      return r.text();
    });
  }

  function cacheLire(cle, cfg) {
    if (!cfg.cache) return null;
    try {
      var brut = sessionStorage.getItem('faf:' + cle);
      if (!brut) return null;
      var o = JSON.parse(brut);
      if (Date.now() - o.t > cfg.cache * 1000) return null;
      return o.d;
    } catch (e) { return null; }
  }

  function cacheEcrire(cle, data, cfg) {
    if (!cfg.cache) return;
    try { sessionStorage.setItem('faf:' + cle, JSON.stringify({ t: Date.now(), d: data })); } catch (e) {}
  }

  function estInterdit(doc) {
    if (/^\s*connexion\s*$/i.test(doc.title || '')) return true;
    return !!doc.querySelector('input[name="password"], input[type="password"]');
  }

  function lireListeSujets(html) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    if (estInterdit(doc)) return { interdit: true, sujets: [] };

    var liens = [].slice.call(doc.querySelectorAll('a.topictitle, a[href*="/t"]'))
      .filter(function (a) {
        var h = a.getAttribute('href') || '';
        return /\/t\d+(p\d+)?-/.test(h) && h.indexOf('#') === -1 && texteDe(a).length > 1;
      });

    var vus = {}, sujets = [];
    liens.forEach(function (a) {
      var href = a.getAttribute('href').split('#')[0];
      var id = (href.match(/\/t(\d+)/) || [])[1];
      if (!id || vus[id]) return;
      vus[id] = 1;

      var ligne = a.closest('tr, li, .topic, .topics, [class*="row"]') || a.parentElement;

      var dernierId = 0, urlDernier = '';
      [].forEach.call(ligne.querySelectorAll('a[href*="#"]'), function (l) {
        var h = l.getAttribute('href') || '';
        var m = h.match(/#(\d+)\s*$/);
        if (m && +m[1] > dernierId) { dernierId = +m[1]; urlDernier = h; }
      });

      var noeudDate = ligne.querySelector('.timeposte, .lastpost-date, .topicdetails.date');
      var blocDernier = ligne.querySelector('.topicslist-lastpost, .lastpost, .lastpost-avatar');
      var txtDate = texteDe(noeudDate);
      if (!txtDate && blocDernier) {
        txtDate = (texteDe(blocDernier).match(/.*\d{1,2}\s*:\s*\d{2}/) || [''])[0];
      }

      sujets.push({
        id: id,
        titre: texteDe(a),
        url: href,
        urlDernier: urlDernier || href,
        dateTxt: txtDate,
        ordre: dernierId
      });
    });

    sujets.sort(function (a, b) { return b.ordre - a.ordre; });
    return { interdit: false, nom: (doc.title || '').trim(), sujets: sujets };
  }

  /* Les genres déclarés, ou à défaut le seul « post » de l'ancienne forme. */
  function genresDe(cfg) {
    var g = cfg.balisage.genres;
    if (g && Object.keys(g).length) return g;
    return { post: cfg.balisage.post };
  }

  /* Un message peut correspondre à plusieurs genres — un commentaire qui cite
     un post, par exemple. C'est alors le bloc le plus englobant qui dit ce que
     le message est ; à égalité, l'ordre de déclaration tranche. */
  function classer(msg, cfg) {
    var genres = genresDe(cfg);
    var gagnant = null;

    Object.keys(genres).forEach(function (nom) {
      var s = selecteur(genres[nom]);
      if (!s) return;
      var bloc = null;
      try { bloc = msg.matches(s) ? msg : msg.querySelector(s); } catch (e) { return; }
      if (!bloc) return;
      if (!gagnant) gagnant = { genre: nom, bloc: bloc };
      else if (bloc !== gagnant.bloc && bloc.contains(gagnant.bloc)) gagnant = { genre: nom, bloc: bloc };
    });

    return gagnant;
  }

  function retenu(genre, cfg) {
    if (!cfg.afficher) return true;
    return liste(cfg.afficher).indexOf(genre) !== -1;
  }

  function lireLike(msg, cfg) {
    var b = cfg.balisage;
    var bouton = premier(msg, b.like);
    if (!bouton) return null;
    var compteur = premier(bouton, b.likeNombre) || premier(msg, b.likeNombre);
    return {
      bouton: bouton,
      href: bouton.getAttribute(b.likeAttribut) || '',
      hrefRetirer: bouton.getAttribute(b.likeAttributRetirer) || '',
      nombre: parseInt(texteDe(compteur), 10) || 0,
      actif: presentDans(bouton, b.likeActif)
    };
  }

  function memeOrigine(url) {
    try { return new URL(url, location.href).origin === location.origin; }
    catch (e) { return false; }
  }

  function oublierSujet(id, cfg) {
    if (!cfg.cache) return;
    try {
      Object.keys(sessionStorage).forEach(function (k) {
        if (k.indexOf('faf:sujet:' + id + ':') === 0) sessionStorage.removeItem(k);
      });
    } catch (e) {}
  }

  /* Les jetons de l'URL sont propres à chaque message et à chaque session : on
     recharge la page du message au moment du clic pour les lire frais, au lieu
     de garder ceux du premier chargement — et on ne reconstruit jamais l'URL. */
  function urlDuLike(p, cfg, retirer) {
    return charger(p.url, cfg).then(function (html) {
      var doc = new DOMParser().parseFromString(html, 'text/html');
      if (estInterdit(doc)) throw new Error('page Connexion servie à la place du message');

      var messages = [];
      var selMessage = selecteur(cfg.balisage.message);
      try { messages = [].slice.call(doc.querySelectorAll(selMessage)); } catch (e) {}

      var motif = cfg.balisage.idMessage ? new RegExp(cfg.balisage.idMessage) : null;
      var msg = null;
      messages.some(function (m) {
        var id = 0;
        if (motif) {
          var t = (m.className || '').match(motif) || (m.id || '').match(motif);
          if (t) id = +t[1];
        }
        if (id === p.id) { msg = m; return true; }
        return false;
      });
      if (!msg) throw new Error('message ' + p.id + ' introuvable sur ' + p.url);

      var like = lireLike(msg, cfg);
      if (!like) throw new Error('aucun bouton dans le message ' + p.id);

      var url = retirer ? like.hrefRetirer : like.href;
      if (!url) throw new Error(retirer ? 'le forum ne propose pas de retirer' : 'le forum ne propose pas d’aimer (invité ?)');
      if (!memeOrigine(url)) throw new Error('adresse hors du forum, ignorée : ' + url);

      return { url: url, nombre: like.nombre };
    });
  }

  /* Poster un commentaire, c'est écrire publiquement sur le forum. On n'invente
     donc aucun champ : on récolte le formulaire de réponse tel que le forum le
     sert, on n'y remplace que le message, et on envoie une seule fois. */
  function envoyerCommentaire(p, texte, cfg) {
    var b = cfg.balisage;
    var url = String(b.urlReponse).replace('{sujet}', p.sujet).replace('{message}', p.id);

    return charger(url, cfg).then(function (html) {
      var doc = new DOMParser().parseFromString(html, 'text/html');
      if (estInterdit(doc)) throw new Error('page Connexion servie à la place du formulaire');

      var form = premier(doc, b.formulaireReponse);
      if (!form) throw new Error('formulaire de réponse introuvable sur ' + url);

      var champ = premier(form, b.champMessage);
      if (!champ) throw new Error('champ du message introuvable dans le formulaire');

      var action = form.getAttribute('action') || url;
      if (!memeOrigine(action)) throw new Error('formulaire pointant hors du forum, ignoré : ' + action);

      champ.value = texte;
      champ.textContent = texte;

      var donnees = new FormData(form);
      var bouton = premier(form, b.boutonEnvoi);
      if (bouton && bouton.name && !donnees.has(bouton.name)) {
        donnees.append(bouton.name, bouton.value || 'Envoyer');
      }

      return fetch(action, { method: 'POST', body: donnees, credentials: 'same-origin' });
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status + ' à l’envoi');
      return r.text();
    }).then(function (html) {
      /* Le forum répond par une page : l'anti-flood et les autres refus s'y
         lisent. On remonte son texte tel quel plutôt qu'un message à nous. */
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var souci = premier(doc, b.erreurForum);
      var txt = texteDe(souci);
      if (txt) throw new Error(txt);
      return true;
    });
  }

  function nettoyer(node, cfg) {
    [].forEach.call(node.querySelectorAll('script'), function (n) {
      n.parentNode.removeChild(n);
    });
    /* Le bouton du forum, privé de son script, ne ferait rien : le nôtre le
       remplace. */
    if (cfg.aimer && cfg.remplacerLikeOriginal) {
      var s = selecteur(cfg.balisage.like);
      if (s) {
        try {
          [].forEach.call(node.querySelectorAll(s), function (n) { n.parentNode.removeChild(n); });
        } catch (e) {}
      }
    }
    return node;
  }

  function lirePostsDuSujet(html, sujet, cfg) {
    var b = cfg.balisage;
    var doc = new DOMParser().parseFromString(html, 'text/html');
    if (estInterdit(doc)) return { interdit: true, posts: [] };

    var messages = [];
    var selMessage = selecteur(b.message);
    if (selMessage) {
      try { messages = [].slice.call(doc.querySelectorAll(selMessage)); } catch (e) { messages = []; }
    }

    var motif = b.idMessage ? new RegExp(b.idMessage) : null;
    var genres = genresDe(cfg);
    var aDesGenres = Object.keys(genres).some(function (n) { return !!selecteur(genres[n]); });
    var posts = [];

    messages.forEach(function (msg) {
      if (correspond(msg, b.ignorer)) return;

      var trouve = classer(msg, cfg);
      var bloc, genre;
      if (trouve) {
        bloc = trouve.bloc;
        genre = trouve.genre;
      } else if (aDesGenres) {
        return;
      } else {
        bloc = premier(msg, b.corps) || msg;
        genre = '';
      }

      if (dansUn(bloc, b.ignorer, msg)) return;

      var id = 0;
      if (motif) {
        var m = (msg.className || '').match(motif) || (msg.id || '').match(motif);
        if (m) id = +m[1];
      }

      var lien = premier(msg, b.ancre);
      var href = lien ? (lien.getAttribute('href') || '') : '';
      if (!id) id = +((href.match(/#(\d+)/) || [])[1] || 0);
      if (!href) href = sujet.url + (id ? '#' + id : '');

      var txtDate = texteDe(premier(msg, b.date));
      var d = dateFr(txtDate);

      /* Les jetons ne sont pas retenus : seulement de quoi dessiner le bouton.
         Ils seront relus dans le message au moment du clic. */
      var like = cfg.aimer ? lireLike(msg, cfg) : null;

      posts.push({
        id: id,
        genre: genre,
        sujet: sujet.id,
        compte: sujet.titre,
        urlSujet: sujet.url,
        url: href,
        dateTxt: txtDate,
        quand: d ? d.getTime() : 0,
        like: like ? { aimable: !!like.href || !!like.hrefRetirer, nombre: like.nombre, actif: like.actif } : null,
        html: nettoyer(bloc.cloneNode(true), cfg).outerHTML
      });
    });

    /* Tous les genres sont conservés ici : le tri de ce qu'on affiche se fait
       après, pour qu'un changement de "afficher" n'oblige pas à vider le cache. */
    posts.sort(function (x, y) { return y.id - x.id; });
    return { interdit: false, posts: posts };
  }

  function chargerAvecCache(url, cle, cfg, lecture) {
    var vu = cacheLire(cle, cfg);
    if (vu) return Promise.resolve(vu);
    return charger(url, cfg).then(function (html) {
      var r = lecture(html);
      if (!r.interdit) cacheEcrire(cle, r, cfg);
      return r;
    });
  }

  function idsDe(v) {
    return liste(v).map(function (x) { return String(x).replace(/^.*\/t(\d+).*$/, '$1'); });
  }

  function chargerSource(src, cfg) {
    var url = src.url || ('/f' + src.forum + '-');

    return chargerAvecCache(url, 'liste:' + (src.forum || url), cfg, lireListeSujets)
      .then(function (r) {
        if (r.interdit) return { interdit: true, posts: [] };

        var sujets = r.sujets;
        if (src.sujets instanceof Array) {
          var gardes = idsDe(src.sujets);
          sujets = sujets.filter(function (s) { return gardes.indexOf(s.id) !== -1; });
          sujets.sort(function (a, b) { return gardes.indexOf(a.id) - gardes.indexOf(b.id); });
        }
        if (src.exclure) {
          var horsJeu = idsDe(src.exclure);
          sujets = sujets.filter(function (s) { return horsJeu.indexOf(s.id) === -1; });
        }
        var combien = typeof src.sujets === 'number' ? src.sujets : cfg.sujets;
        if (combien > 0) sujets = sujets.slice(0, combien);

        return Promise.all(sujets.map(function (s) {
          return chargerAvecCache(s.urlDernier, 'sujet:' + s.id + ':' + s.ordre, cfg, function (html) {
            return lirePostsDuSujet(html, s, cfg);
          }).catch(function (e) {
            if (window.console) console.warn('[fa-feed] sujet ' + s.id, e);
            return { posts: [] };
          });
        })).then(function (parts) {
          var posts = [];
          parts.forEach(function (p) {
            var gardes = (p.posts || []).filter(function (po) { return retenu(po.genre, cfg); });
            if (cfg.parSujet > 0) gardes = gardes.slice(0, cfg.parSujet);
            gardes.forEach(function (po) {
              po.source = src.titre || '';
              posts.push(po);
            });
          });
          return { interdit: false, posts: posts };
        });
      })
      .catch(function (e) {
        if (window.console) console.warn('[fa-feed]', src.titre || src.forum, e);
        return { interdit: false, erreur: true, posts: [] };
      });
  }

  function parDate(a, b) {
    if (a.quand && b.quand) return b.quand - a.quand;
    if (a.quand) return -1;
    if (b.quand) return 1;
    return b.id - a.id;
  }

  function chargerFil(cfg) {
    return Promise.all(cfg.sources.map(function (src) {
      return chargerSource(src, cfg);
    })).then(function (parts) {
      var posts = [];
      parts.forEach(function (p) { posts = posts.concat(p.posts); });
      if (cfg.filtre) posts = posts.filter(function (p) { return cfg.filtre(p, cfg); });
      posts.sort(parDate);
      if (cfg.posts > 0) posts = posts.slice(0, cfg.posts);
      return {
        interdit: parts.length > 0 && parts.every(function (p) { return p.interdit; }),
        posts: posts
      };
    });
  }

  function imageDe(node) {
    if (!node) return '';
    if (node.tagName === 'IMG') return node.getAttribute('src') || '';
    var fond = (node.getAttribute('style') || '').match(/background(?:-image)?\s*:[^;]*url\((['"]?)(.*?)\1\)/i);
    if (fond) return fond[2];
    var img = node.querySelector('img');
    return img ? (img.getAttribute('src') || '') : '';
  }

  function carte(p, cfg) {
    var hote = document.createElement('div');
    hote.innerHTML = p.html;
    var bloc = hote.firstElementChild || hote;

    var corps = el('div', 'faf-post-corps faf-post-corps--carte');

    var ava = premier(bloc, cfg.champs.avatar);
    var srcAva = imageDe(ava);
    if (srcAva) {
      var i = el('img', 'faf-post-avatar');
      i.src = srcAva;
      i.alt = '';
      corps.appendChild(i);
    }

    var pseudo = texteDe(premier(bloc, cfg.champs.pseudo));
    if (pseudo) corps.appendChild(el('div', 'faf-post-pseudo', pseudo));

    var srcImage = '';
    [].slice.call(bloc.querySelectorAll(selecteur(cfg.champs.image) || 'img')).some(function (n) {
      if (n === ava || (ava && ava.contains(n))) return false;
      srcImage = imageDe(n);
      return !!srcImage;
    });
    if (srcImage && srcImage !== srcAva) {
      var g = el('img', 'faf-post-image');
      g.src = srcImage;
      g.alt = '';
      corps.appendChild(g);
    }

    var legende = texteDe(premier(bloc, cfg.champs.legende));
    if (legende) corps.appendChild(el('div', 'faf-post-legende', legende));

    return corps;
  }

  function boutonAimer(p, cfg, pied) {
    var etat = { actif: !!p.like.actif, nombre: p.like.nombre, enCours: false };

    var btn = el('button', 'faf-like');
    btn.type = 'button';
    var nb = el('span', 'faf-like-nb');
    var erreur = el('span', 'faf-like-erreur');

    function dessiner() {
      btn.className = 'faf-like'
        + (etat.actif ? ' faf-like--actif' : '')
        + (etat.enCours ? ' faf-like--attente' : '');
      btn.innerHTML = etat.actif ? cfg.texteAime : cfg.texteAimer;
      btn.disabled = etat.enCours;
      btn.setAttribute('aria-pressed', etat.actif ? 'true' : 'false');
      nb.textContent = etat.nombre ? String(etat.nombre) : '';
    }

    function echouer(e) {
      etat.enCours = false;
      dessiner();
      btn.classList.add('faf-like--erreur');
      erreur.textContent = cfg.texteErreurAimer;
      erreur.title = String(e && e.message || e);
      if (window.console) console.warn('[fa-feed] like du message ' + p.id, e);
    }

    btn.addEventListener('click', function () {
      if (etat.enCours) return;
      var retirer = etat.actif;
      if (cfg.confirmerAimer && !retirer && !window.confirm(cfg.texteConfirmerAimer)) return;

      etat.enCours = true;
      erreur.textContent = '';
      btn.classList.remove('faf-like--erreur');
      dessiner();

      urlDuLike(p, cfg, retirer)
        .then(function (r) {
          return charger(r.url, cfg).then(function () { return r; });
        })
        .then(function (r) {
          etat.actif = !retirer;
          etat.nombre = Math.max(0, r.nombre + (retirer ? -1 : 1));
          etat.enCours = false;
          oublierSujet(p.sujet, cfg);
          dessiner();
        })
        .catch(echouer);
    });

    dessiner();
    pied.appendChild(btn);
    pied.appendChild(nb);
    pied.appendChild(erreur);
  }

  function blocCommenter(p, cfg, art) {
    var zone = el('div', 'faf-commentaire');
    var btn = el('button', 'faf-commenter');
    btn.type = 'button';
    btn.innerHTML = cfg.texteCommenter;

    var forme = el('form', 'faf-commentaire-forme');
    forme.hidden = true;
    var champ = el('textarea', 'faf-commentaire-champ');
    champ.placeholder = cfg.invitecommentaire;
    champ.rows = 3;
    var envoyer = el('button', 'faf-commentaire-envoyer');
    envoyer.type = 'submit';
    envoyer.innerHTML = cfg.texteEnvoyer;
    var annuler = el('button', 'faf-commentaire-annuler');
    annuler.type = 'button';
    annuler.innerHTML = cfg.texteAnnuler;
    var dire = el('p', 'faf-commentaire-mot');

    var etat = { enCours: false };

    function ouvrir(ouvert) {
      forme.hidden = !ouvert;
      btn.hidden = ouvert;
      if (ouvert) champ.focus();
    }

    annuler.addEventListener('click', function () {
      dire.textContent = '';
      dire.className = 'faf-commentaire-mot';
      ouvrir(false);
    });

    btn.addEventListener('click', function () { ouvrir(true); });

    forme.addEventListener('submit', function (e) {
      e.preventDefault();
      if (etat.enCours) return;

      var texte = champ.value.trim();
      if (texte.length < cfg.longueurMiniCommentaire) {
        dire.className = 'faf-commentaire-mot faf-commentaire-mot--souci';
        dire.textContent = 'commentaire trop court';
        return;
      }
      if (cfg.confirmerCommentaire && !window.confirm(cfg.texteConfirmerCommentaire)) return;

      etat.enCours = true;
      envoyer.disabled = true;
      champ.disabled = true;
      dire.className = 'faf-commentaire-mot';
      dire.textContent = '…';

      envoyerCommentaire(p, texte, cfg)
        .then(function () {
          etat.enCours = false;
          champ.disabled = false;
          champ.value = '';
          dire.className = 'faf-commentaire-mot faf-commentaire-mot--fait';
          dire.textContent = cfg.texteCommentaireEnvoye;
          oublierSujet(p.sujet, cfg);
          ouvrir(false);
        })
        .catch(function (e2) {
          /* Rien n'est renvoyé tout seul : le texte reste dans le champ, et
             c'est au visiteur de décider de réessayer. */
          etat.enCours = false;
          envoyer.disabled = false;
          champ.disabled = false;
          dire.className = 'faf-commentaire-mot faf-commentaire-mot--souci';
          dire.textContent = cfg.texteErreurCommentaire;
          dire.title = String(e2 && e2.message || e2);
          if (window.console) console.warn('[fa-feed] commentaire sur le sujet ' + p.sujet, e2);
        });
    });

    var boutons = el('div', 'faf-commentaire-boutons');
    boutons.appendChild(envoyer);
    boutons.appendChild(annuler);
    forme.appendChild(champ);
    forme.appendChild(boutons);
    zone.appendChild(btn);
    zone.appendChild(forme);
    zone.appendChild(dire);
    art.appendChild(zone);
  }

  function pied(p, cfg) {
    var avecLike = cfg.aimer && p.like && p.like.aimable;
    if (!avecLike) return null;

    var pied = el('div', 'faf-post-pied');
    boutonAimer(p, cfg, pied);
    return pied;
  }

  var couche = null;

  function fermerCouche() {
    if (!couche) return;
    var boite = couche;
    couche = null;
    var rendre = boite.focusAvant;
    if (boite.close && boite.open) { try { boite.close(); } catch (e) {} }
    if (boite.parentNode) boite.parentNode.removeChild(boite);
    document.removeEventListener('keydown', surToucheCouche, true);
    /* Le navigateur rend lui-même le focus en refermant un dialog : on repasse
       après lui, une fois la fenêtre retirée du document. */
    if (rendre && rendre.focus) {
      setTimeout(function () { try { rendre.focus(); } catch (e) {} }, 0);
    }
  }

  function surToucheCouche(e) {
    if (e.key === 'Escape') { e.stopPropagation(); fermerCouche(); }
  }

  function classesDuTheme(cfg) {
    if (!cfg.classe) return '';
    return ' ' + String(cfg.classe).trim().split(/\s+/).map(function (c) { return 'faf-' + c; }).join(' ');
  }

  /* Le post s'ouvre dans une petite fenêtre au-dessus du fil. C'est un <dialog>
     ouvert en modal : le navigateur le pose dans sa couche du dessus, hors de
     portée des styles du forum — un ancêtre transformé n'a donc aucune prise
     dessus, contrairement à un simple bloc en position fixe. */
  function ouvrirCouche(p, cfg) {
    fermerCouche();

    var boite = document.createElement(window.HTMLDialogElement ? 'dialog' : 'div');
    boite.className = 'faf faf-couche' + classesDuTheme(cfg);
    boite.focusAvant = document.activeElement;
    if (!window.HTMLDialogElement) {
      boite.setAttribute('role', 'dialog');
      boite.classList.add('faf-couche--simple');
    }

    var cadre = el('div', 'faf-couche-boite');

    var fermer = el('button', 'faf-couche-fermer');
    fermer.type = 'button';
    fermer.innerHTML = cfg.texteFermer;
    fermer.setAttribute('aria-label', 'fermer');
    fermer.addEventListener('click', fermerCouche);

    var corps = el('div', 'faf-couche-corps');
    if (cfg.coucheComplete) {
      corps.appendChild(post(p, fusion(cfg, { auClic: false })));
      var lien = el('a', 'faf-couche-lien', cfg.texteVoirSurLeForum);
      lien.href = p.url;
      corps.appendChild(lien);
    } else {
      /* Le post seul, à sa taille, sans en-tête ni pied. */
      var nu = el('div', 'faf-post-corps faf-post-corps--brut');
      nu.innerHTML = p.html;
      corps.appendChild(nu);
    }

    cadre.appendChild(fermer);
    cadre.appendChild(corps);
    boite.appendChild(cadre);

    /* Un clic sur le voile atteint le dialog lui-même, jamais le cadre. */
    boite.addEventListener('click', function (e) {
      if (e.target === boite) fermerCouche();
    });
    boite.addEventListener('cancel', function (e) {
      e.preventDefault();
      fermerCouche();
    });

    document.body.appendChild(boite);
    couche = boite;
    if (boite.showModal) {
      try { boite.showModal(); } catch (e) { boite.classList.add('faf-couche--simple'); }
    } else {
      document.addEventListener('keydown', surToucheCouche, true);
    }
    fermer.focus();
  }

  /* Le post entier mène au message, sans pour autant avaler ce qui est déjà
     cliquable dedans, ni gêner qui veut simplement sélectionner du texte. */
  function rendreCliquable(art, p, cfg) {
    art.classList.add('faf-post--cliquable');
    art.tabIndex = 0;

    function agir(forcerOnglet) {
      if (forcerOnglet || cfg.auClic === 'onglet') window.open(p.url, '_blank', 'noopener');
      else if (cfg.auClic === 'couche') ouvrirCouche(p, cfg);
      else location.href = p.url;
    }

    art.addEventListener('click', function (e) {
      var cible = e.target;
      if (cible && cible.closest && cible.closest('a, button, input, textarea, select, label, [contenteditable]')) return;
      var choix = window.getSelection && window.getSelection();
      if (choix && String(choix).trim().length > 2) return;
      agir(e.ctrlKey || e.metaKey);
    });

    art.addEventListener('keydown', function (e) {
      if (e.target !== art) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        agir(false);
      }
    });
  }

  function post(p, cfg) {
    var art = el('article', 'faf-post faf-post--' + cfg.rendu
      + (p.genre ? ' faf-post--' + p.genre : ''));
    art.setAttribute('data-message', p.id);
    art.setAttribute('data-sujet', p.sujet);
    if (p.genre) art.setAttribute('data-genre', p.genre);

    var tete = el('div', 'faf-post-tete');
    if (cfg.compte && p.compte) {
      var a = el('a', 'faf-post-compte', p.compte);
      a.href = p.urlSujet;
      tete.appendChild(a);
    }
    if (cfg.genre && p.genre) tete.appendChild(el('span', 'faf-post-genre', p.genre));
    if (cfg.source && p.source) tete.appendChild(el('span', 'faf-post-source', p.source));
    if (p.dateTxt) {
      var d = el('a', 'faf-post-date',
        cfg.datesRelatives ? relatif(p.quand ? new Date(p.quand) : null, p.dateTxt) : p.dateTxt);
      d.href = p.url;
      d.title = p.dateTxt;
      tete.appendChild(d);
    }
    if (tete.childNodes.length) art.appendChild(tete);

    if (cfg.rendu === 'carte') {
      art.appendChild(carte(p, cfg));
    } else {
      var corps = el('div', 'faf-post-corps faf-post-corps--brut');
      corps.innerHTML = p.html;
      art.appendChild(corps);
    }

    var bas = pied(p, cfg);
    if (bas) art.appendChild(bas);

    if (cfg.commenter) blocCommenter(p, cfg, art);
    if (cfg.auClic) rendreCliquable(art, p, cfg);

    return art;
  }

  function remplir(fil, res, cfg) {
    fil.innerHTML = '';

    if (res.interdit) {
      if (cfg.texteInterdit) fil.appendChild(el('p', 'faf-vide', cfg.texteInterdit));
      return;
    }
    if (!res.posts.length) {
      fil.appendChild(el('p', 'faf-vide', cfg.texteVide));
      return;
    }
    res.posts.forEach(function (p) { fil.appendChild(post(p, cfg)); });
  }

  function poserStyle(cfg) {
    if (cfg.style === false) return;
    var href = typeof cfg.style === 'string'
      ? cfg.style
      : (MON_URL ? MON_URL.replace(/[^/]*$/, 'fa-feed.css') : '');
    if (!href) {
      if (window.console) console.warn('[fa-feed] feuille de style introuvable : ajouter fa-feed.css à la main, ou renseigner style: "<adresse>" dans config.js.');
      return;
    }
    if (document.querySelector('link[href="' + href + '"]')) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = href;
    document.head.appendChild(l);
  }

  var POSITIONS = {
    avant: 'beforebegin',
    debut: 'afterbegin',
    fin: 'beforeend',
    apres: 'afterend'
  };

  function ancrer(cfg) {
    var e = cfg.emplacement;
    if (typeof e === 'string' || (e && e.nodeType)) e = { cible: e };
    e = e || {};

    var cible = typeof e.cible === 'string' ? document.querySelector(e.cible) : e.cible;
    if (!cible) {
      if (window.console) console.warn('[fa-feed] emplacement introuvable :', e.cible, '— rien n’a été affiché.');
      return null;
    }

    var ancien = cible.fafRacine;
    if (ancien && ancien.parentNode) ancien.parentNode.removeChild(ancien);

    var classes = 'faf';
    if (cfg.classe) {
      classes += ' ' + String(cfg.classe).trim().split(/\s+/).map(function (c) { return 'faf-' + c; }).join(' ');
    }
    var racine = el('div', classes);

    cible.insertAdjacentElement(POSITIONS[e.position] || 'beforeend', racine);
    cible.fafRacine = racine;
    return racine;
  }

  function reglages(config) {
    var brut = config || {};
    var cfg = fusion(DEFAUTS, brut);
    cfg.balisage = fusion(DEFAUTS.balisage, brut.balisage);
    cfg.champs = fusion(DEFAUTS.champs, brut.champs);
    return cfg;
  }

  function init(config) {
    var cfg = reglages(config);
    if (!cfg.sources.length) {
      if (window.console) console.warn('[fa-feed] aucune source dans la configuration — rien à lire.');
      return Promise.resolve({ posts: [] });
    }

    poserStyle(cfg);

    var racine = ancrer(cfg);
    if (!racine) return Promise.resolve({ posts: [] });

    if (cfg.titre) racine.appendChild(el('div', 'faf-titre', cfg.titre));

    var fil = el('div', 'faf-fil');
    racine.appendChild(fil);
    if (cfg.texteChargement) fil.appendChild(el('p', 'faf-chargement', cfg.texteChargement));

    return chargerFil(cfg).then(function (res) {
      remplir(fil, res, cfg);
      return res;
    });
  }

  function viderCache() {
    try {
      Object.keys(sessionStorage).forEach(function (k) {
        if (k.indexOf('faf:') === 0) sessionStorage.removeItem(k);
      });
    } catch (e) {}
  }

  window.FAFeed = {
    version: VERSION,
    init: init,
    rafraichir: function (cfg) { viderCache(); return init(cfg || window.FA_FEED_CONFIG); },
    viderCache: viderCache,
    fermerCouche: fermerCouche,
    _reglages: reglages,
    _lireListeSujets: lireListeSujets,
    _lirePostsDuSujet: lirePostsDuSujet,
    _dateFr: dateFr
  };

  if (window.FA_FEED_CONFIG && !window.FA_FEED_CONFIG.manuel) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { init(window.FA_FEED_CONFIG); });
    } else {
      init(window.FA_FEED_CONFIG);
    }
  }
})(window, document);

/* --- fa-feed.css + config.css, embarquées pour que le test se suffise
   à lui-même. Régler l'apparence dans config.css, pas ici. --- */
(function () {
  var vieux = document.getElementById('faf-css');
  if (vieux) vieux.remove();
  var s = document.createElement('style');
  s.id = 'faf-css';
  s.textContent = "/*!\n * fa-feed \u2014 structure du fil.\n *\n * Cette feuille ne d\u00e9crit que l'agencement : toutes les valeurs se r\u00e8glent\n * dans config.css. Il n'y a normalement rien \u00e0 modifier ici.\n *\n * Licence MIT.\n */\n\n.faf {\n  width: var(--faf-largeur, auto);\n  max-width: 100%;\n  margin: 0;\n  box-sizing: border-box;\n  color: inherit;\n}\n\n.faf *,\n.faf *::before,\n.faf *::after {\n  box-sizing: border-box;\n}\n\n.faf-titre {\n  font-size: var(--faf-titre-taille, 12px);\n  font-weight: var(--faf-titre-graisse, 700);\n  text-transform: var(--faf-titre-casse, uppercase);\n  letter-spacing: var(--faf-titre-interligne, .4px);\n  color: var(--faf-titre-couleur, currentColor);\n  padding: var(--faf-titre-padding, 0 0 6px);\n  margin: 0;\n}\n\n.faf-fil {\n  display: grid;\n  grid-template-columns: repeat(var(--faf-colonnes, 1), minmax(0, 1fr));\n  gap: var(--faf-espacement, 10px);\n  align-items: start;\n}\n\n/* --- un post ---------------------------------------------------------------- */\n\n.faf-post {\n  min-width: 0;\n  overflow: hidden;\n  background: var(--faf-post-fond, transparent);\n  border: var(--faf-post-bordure-epaisseur, 1px) solid var(--faf-post-bordure, color-mix(in srgb, currentColor 14%, transparent));\n  border-radius: var(--faf-post-arrondi, 8px);\n  padding: var(--faf-post-padding, 8px);\n  transition: border-color var(--faf-transition, .18s), background var(--faf-transition, .18s), transform var(--faf-transition, .18s);\n}\n\n.faf-post--cliquable {\n  cursor: var(--faf-post-curseur, pointer);\n}\n\n.faf-post--cliquable:focus-visible {\n  outline: var(--faf-post-focus-epaisseur, 2px) solid var(--faf-post-focus, currentColor);\n  outline-offset: 2px;\n}\n\n.faf-post:hover {\n  background: var(--faf-post-fond-survol, transparent);\n  border-color: var(--faf-post-bordure-survol, color-mix(in srgb, currentColor 35%, transparent));\n  transform: translateY(calc(var(--faf-glissement, 0px) * -1));\n}\n\n/* --- l'en-t\u00eate d'un post ---------------------------------------------------- */\n\n.faf-post-tete {\n  display: flex;\n  align-items: baseline;\n  gap: var(--faf-tete-espacement, 6px);\n  font-size: var(--faf-tete-taille, 10px);\n  line-height: 1.4;\n  padding: var(--faf-tete-padding, 0 0 6px);\n  min-width: 0;\n}\n\n.faf-post-compte {\n  font-weight: var(--faf-compte-graisse, 700);\n  text-transform: var(--faf-compte-casse, none);\n  color: var(--faf-compte-couleur, currentColor);\n  text-decoration: none;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  min-width: 0;\n}\n\n.faf-post-compte:hover {\n  color: var(--faf-compte-couleur-survol, currentColor);\n  text-decoration: var(--faf-compte-soulignement, underline);\n}\n\n.faf-post-source {\n  color: var(--faf-source-couleur, color-mix(in srgb, currentColor 55%, transparent));\n  font-size: var(--faf-source-taille, .9em);\n  text-transform: var(--faf-source-casse, uppercase);\n  letter-spacing: .3px;\n  white-space: nowrap;\n}\n\n.faf-post-date {\n  margin-inline-start: auto;\n  color: var(--faf-date-couleur, color-mix(in srgb, currentColor 55%, transparent));\n  text-decoration: none;\n  white-space: nowrap;\n  flex: none;\n}\n\n.faf-post-date:hover {\n  color: var(--faf-date-couleur-survol, currentColor);\n}\n\n/* --- le corps, rendu \u00ab brut \u00bb ------------------------------------------------ */\n\n.faf-post-corps {\n  min-width: 0;\n}\n\n/* Le post garde son propre habillage : on se contente de le contenir, sans\n   jamais lui imposer de dimensions \u2014 le mod\u00e8le du forum fixe souvent les\n   siennes, et les \u00e9craser le d\u00e9forme. */\n.faf-post-corps--brut > *,\n.faf-post-corps--brut img,\n.faf-post-corps--brut table {\n  max-width: var(--faf-brut-largeur-max, 100%);\n}\n\n/* Un mod\u00e8le fait pour une page enti\u00e8re tient rarement dans une colonne : il se\n   met \u00e0 l'\u00e9chelle, et sa hauteur se plafonne. Les deux sont sans effet tant\n   qu'ils ne sont pas r\u00e9gl\u00e9s dans config.css. */\n.faf-post-corps--brut {\n  max-height: var(--faf-brut-hauteur-max, none);\n  overflow: hidden;\n  -webkit-mask-image: var(--faf-brut-masque, none);\n  mask-image: var(--faf-brut-masque, none);\n}\n\n.faf-post-corps--brut > * {\n  zoom: var(--faf-brut-echelle, 1);\n}\n\n/* --- le corps, rendu \u00ab carte \u00bb ----------------------------------------------- */\n\n.faf-post-corps--carte {\n  display: grid;\n  grid-template-columns: auto minmax(0, 1fr);\n  grid-template-areas:\n    'avatar pseudo'\n    'image  image'\n    'legende legende';\n  align-items: center;\n  gap: var(--faf-carte-espacement, 6px);\n}\n\n.faf-post-avatar {\n  grid-area: avatar;\n  width: var(--faf-avatar-taille, 28px);\n  height: var(--faf-avatar-taille, 28px);\n  object-fit: cover;\n  border-radius: var(--faf-avatar-arrondi, 50%);\n  background: var(--faf-avatar-fond, color-mix(in srgb, currentColor 10%, transparent));\n}\n\n.faf-post-pseudo {\n  grid-area: pseudo;\n  font-weight: var(--faf-pseudo-graisse, 600);\n  font-size: var(--faf-pseudo-taille, 11px);\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.faf-post-image {\n  grid-area: image;\n  width: 100%;\n  aspect-ratio: var(--faf-image-proportion, 1);\n  object-fit: cover;\n  border-radius: var(--faf-image-arrondi, 4px);\n  display: block;\n}\n\n.faf-post-legende {\n  grid-area: legende;\n  font-size: var(--faf-legende-taille, 11px);\n  line-height: var(--faf-legende-interligne, 1.5);\n  color: var(--faf-legende-couleur, color-mix(in srgb, currentColor 80%, transparent));\n  display: -webkit-box;\n  -webkit-line-clamp: var(--faf-legende-lignes, 3);\n  -webkit-box-orient: vertical;\n  overflow: hidden;\n}\n\n/* --- le pied d'un post : aimer ----------------------------------------------- */\n\n.faf-post-pied {\n  display: flex;\n  align-items: center;\n  gap: var(--faf-pied-espacement, 5px);\n  padding: var(--faf-pied-padding, 6px 0 0);\n  font-size: var(--faf-pied-taille, 11px);\n  min-width: 0;\n}\n\n.faf-like {\n  font: inherit;\n  font-size: var(--faf-like-taille, inherit);\n  line-height: 1;\n  cursor: pointer;\n  background: var(--faf-like-fond, transparent);\n  color: var(--faf-like-couleur, color-mix(in srgb, currentColor 60%, transparent));\n  border: var(--faf-like-bordure-epaisseur, 0px) solid var(--faf-like-bordure, transparent);\n  border-radius: var(--faf-like-arrondi, 4px);\n  padding: var(--faf-like-padding, 2px 4px);\n  transition: color var(--faf-transition, .18s), background var(--faf-transition, .18s), transform var(--faf-transition, .18s);\n}\n\n.faf-like:hover:not(:disabled) {\n  color: var(--faf-like-couleur-survol, currentColor);\n  background: var(--faf-like-fond-survol, transparent);\n  transform: scale(var(--faf-like-grossissement, 1));\n}\n\n.faf-like--actif {\n  color: var(--faf-like-couleur-actif, currentColor);\n  background: var(--faf-like-fond-actif, transparent);\n}\n\n.faf-like--attente {\n  opacity: var(--faf-like-opacite-attente, .45);\n  cursor: progress;\n}\n\n.faf-like--erreur {\n  color: var(--faf-like-couleur-erreur, currentColor);\n}\n\n.faf-like-nb {\n  color: var(--faf-like-nb-couleur, color-mix(in srgb, currentColor 55%, transparent));\n  font-variant-numeric: tabular-nums;\n}\n\n.faf-like-erreur:not(:empty) {\n  margin-inline-start: auto;\n  color: var(--faf-like-couleur-erreur, currentColor);\n  font-size: var(--faf-like-erreur-taille, .9em);\n  font-style: italic;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  min-width: 0;\n  cursor: help;\n}\n\n/* --- commenter ---------------------------------------------------------------- */\n\n.faf-commentaire {\n  padding: var(--faf-commentaire-padding, 6px 0 0);\n  font-size: var(--faf-commentaire-taille, 11px);\n  min-width: 0;\n}\n\n.faf-commenter,\n.faf-commentaire-envoyer,\n.faf-commentaire-annuler {\n  font: inherit;\n  line-height: 1;\n  cursor: pointer;\n  color: var(--faf-commenter-couleur, color-mix(in srgb, currentColor 60%, transparent));\n  background: var(--faf-commenter-fond, transparent);\n  border: var(--faf-commenter-bordure-epaisseur, 1px) solid var(--faf-commenter-bordure, color-mix(in srgb, currentColor 20%, transparent));\n  border-radius: var(--faf-commenter-arrondi, 4px);\n  padding: var(--faf-commenter-padding, 4px 8px);\n  transition: color var(--faf-transition, .18s), border-color var(--faf-transition, .18s), background var(--faf-transition, .18s);\n}\n\n.faf-commenter:hover:not(:disabled),\n.faf-commentaire-envoyer:hover:not(:disabled),\n.faf-commentaire-annuler:hover:not(:disabled) {\n  color: var(--faf-commenter-couleur-survol, currentColor);\n  border-color: var(--faf-commenter-bordure-survol, color-mix(in srgb, currentColor 45%, transparent));\n  background: var(--faf-commenter-fond-survol, transparent);\n}\n\n.faf-commenter:disabled,\n.faf-commentaire-envoyer:disabled,\n.faf-commentaire-annuler:disabled {\n  opacity: var(--faf-commenter-opacite-attente, .45);\n  cursor: progress;\n}\n\n.faf-commentaire-forme[hidden] {\n  display: none;\n}\n\n.faf-commentaire-champ {\n  display: block;\n  width: 100%;\n  font: inherit;\n  resize: vertical;\n  color: inherit;\n  background: var(--faf-champ-fond, color-mix(in srgb, currentColor 6%, transparent));\n  border: var(--faf-champ-bordure-epaisseur, 1px) solid var(--faf-champ-bordure, color-mix(in srgb, currentColor 20%, transparent));\n  border-radius: var(--faf-champ-arrondi, 4px);\n  padding: var(--faf-champ-padding, 6px 8px);\n  margin-bottom: var(--faf-champ-marge, 6px);\n}\n\n.faf-commentaire-champ:focus {\n  outline: none;\n  border-color: var(--faf-champ-bordure-active, color-mix(in srgb, currentColor 50%, transparent));\n}\n\n.faf-commentaire-boutons {\n  display: flex;\n  gap: var(--faf-commentaire-espacement, 6px);\n}\n\n.faf-commentaire-mot:empty {\n  display: none;\n}\n\n.faf-commentaire-mot {\n  margin: var(--faf-mot-marge, 6px 0 0);\n  font-size: var(--faf-mot-taille, .95em);\n  font-style: italic;\n  color: var(--faf-mot-couleur, color-mix(in srgb, currentColor 55%, transparent));\n}\n\n.faf-commentaire-mot--fait {\n  color: var(--faf-mot-couleur-fait, currentColor);\n}\n\n.faf-commentaire-mot--souci {\n  color: var(--faf-mot-couleur-souci, currentColor);\n  cursor: help;\n}\n\n/* --- le post ouvert en grand par-dessus le fil -------------------------------- */\n\n/* Le <dialog> lui-m\u00eame ne porte aucun d\u00e9cor : il ne sert qu'\u00e0 centrer la\n   fen\u00eatre et \u00e0 recevoir le clic \u00ab \u00e0 c\u00f4t\u00e9 \u00bb. */\n.faf-couche {\n  width: fit-content;\n  height: fit-content;\n  max-width: 100%;\n  max-height: 100%;\n  margin: auto;\n  padding: 0;\n  border: 0;\n  background: transparent;\n  color: inherit;\n  overflow: visible;\n}\n\n.faf-couche::backdrop {\n  background: var(--faf-couche-voile, rgba(0, 0, 0, .3));\n  backdrop-filter: blur(var(--faf-couche-flou, 0px));\n}\n\n/* Repli pour un navigateur sans <dialog> */\n.faf-couche--simple {\n  position: fixed;\n  inset: 0;\n  z-index: var(--faf-couche-plan, 9999);\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  margin: 0;\n  background: var(--faf-couche-voile, rgba(0, 0, 0, .3));\n}\n\n/* La fen\u00eatre fait la taille du post, et rien de plus : pas de cadre, pas de\n   fond, pas de marge. Ce qu'on voit, c'est le post tel que le forum l'habille.\n   Tout se rajoute au besoin depuis config.css. */\n.faf-couche-boite {\n  position: relative;\n  display: flex;\n  flex-direction: column;\n  width: var(--faf-couche-largeur, fit-content);\n  max-width: calc(100vw - var(--faf-couche-marge, 24px) * 2);\n  max-height: var(--faf-couche-hauteur-max, 88vh);\n  background: var(--faf-couche-fond, transparent);\n  -webkit-backdrop-filter: blur(var(--faf-couche-verre, 0px));\n  backdrop-filter: blur(var(--faf-couche-verre, 0px));\n  color: var(--faf-couche-couleur, inherit);\n  border: var(--faf-couche-bordure-epaisseur, 0px) solid var(--faf-couche-bordure, transparent);\n  border-radius: var(--faf-couche-arrondi, 0px);\n  padding: var(--faf-couche-padding, 0px);\n  box-shadow: var(--faf-couche-ombre, none);\n}\n\n.faf-couche-corps {\n  overflow: auto;\n  min-height: 0;\n}\n\n@media (prefers-reduced-motion: no-preference) {\n  .faf-couche-boite {\n    animation: faf-apparition var(--faf-couche-apparition, .16s) ease-out;\n  }\n}\n\n@keyframes faf-apparition {\n  from { opacity: 0; transform: scale(.97); }\n}\n\n/* Ici le post est montr\u00e9 en entier : ni coupe, ni mise \u00e0 l'\u00e9chelle. */\n.faf-couche .faf-post {\n  border: 0;\n  padding: 0;\n  background: transparent;\n}\n\n.faf-couche .faf-post:hover {\n  transform: none;\n  background: transparent;\n}\n\n.faf-couche .faf-post-corps--brut {\n  max-height: none;\n  -webkit-mask-image: none;\n  mask-image: none;\n}\n\n.faf-couche .faf-post-corps--brut > * {\n  zoom: var(--faf-couche-echelle, 1);\n}\n\n/* Une pastille, pour rester lisible m\u00eame pos\u00e9e sur une photo. */\n.faf-couche-fermer {\n  position: absolute;\n  top: var(--faf-couche-fermer-haut, 8px);\n  right: var(--faf-couche-fermer-droite, 8px);\n  z-index: 2;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: var(--faf-couche-fermer-taille, 24px);\n  height: var(--faf-couche-fermer-taille, 24px);\n  font: inherit;\n  font-size: calc(var(--faf-couche-fermer-taille, 24px) * .7);\n  line-height: 1;\n  cursor: pointer;\n  color: var(--faf-couche-fermer-couleur, currentColor);\n  background: var(--faf-couche-fermer-fond, color-mix(in srgb, currentColor 14%, transparent));\n  -webkit-backdrop-filter: blur(6px);\n  backdrop-filter: blur(6px);\n  border: 0;\n  border-radius: 50%;\n}\n\n.faf-couche-fermer:hover {\n  color: var(--faf-couche-fermer-couleur-survol, currentColor);\n}\n\n.faf-couche-lien {\n  display: inline-block;\n  margin-top: var(--faf-couche-lien-marge, 10px);\n  font-size: var(--faf-couche-lien-taille, 11px);\n  color: var(--faf-couche-lien-couleur, color-mix(in srgb, currentColor 60%, transparent));\n  text-decoration: none;\n}\n\n.faf-couche-lien:hover {\n  color: var(--faf-couche-lien-couleur-survol, currentColor);\n  text-decoration: underline;\n}\n\n/* --- \u00e9tats ------------------------------------------------------------------- */\n\n.faf-vide,\n.faf-chargement {\n  grid-column: 1 / -1;\n  margin: 0;\n  padding: var(--faf-vide-padding, 10px 2px);\n  font-size: var(--faf-vide-taille, 11px);\n  font-style: var(--faf-vide-style, italic);\n  color: var(--faf-vide-couleur, color-mix(in srgb, currentColor 50%, transparent));\n  text-align: var(--faf-vide-alignement, left);\n}\n\n/* =============================================================================\n *  fa-feed \u2014 CONFIGURATION DES STYLES\n *  -----------------------------------------------------------------------------\n *  Tous les r\u00e9glages d'apparence sont ici. Deux fa\u00e7ons de s'en servir :\n *\n *   a) coller ce fichier dans PA \u2192 Affichage \u2192 Couleurs \u2192 Feuille de style CSS\n *      (il passe APR\u00c8S fa-feed.css, donc il gagne) ;\n *   b) ou le charger comme feuille \u00e0 part, apr\u00e8s fa-feed.css.\n *\n *  fa-feed.css n'a normalement pas besoin d'\u00eatre touch\u00e9e : elle ne fait que\n *  d\u00e9crire la structure, et lit toutes les valeurs ci-dessous.\n *\n *  Par d\u00e9faut, le fil emprunte la couleur du texte autour de lui\n *  (currentColor) : il se fond dans n'importe quel design sans rien r\u00e9gler.\n *  Pour reprendre les couleurs du forum, mettre ses propres variables \u00e0 la\n *  place des valeurs :  --faf-post-fond: var(--ma-couleur-de-bloc);\n * ========================================================================== */\n\n:root {\n\n  /* --- disposition ---------------------------------------------------------- */\n  --faf-largeur: auto;          /* largeur du fil entier : 280px, 100%, auto\u2026 */\n  --faf-colonnes: 1;            /* nb de colonnes de posts */\n  --faf-espacement: 10px;       /* entre deux posts */\n\n  /* --- le titre du fil ------------------------------------------------------ */\n  --faf-titre-taille: 12px;\n  --faf-titre-graisse: 700;\n  --faf-titre-casse: uppercase; /* none pour laisser la casse d'origine */\n  --faf-titre-interligne: .4px;\n  --faf-titre-couleur: currentColor;\n  --faf-titre-padding: 0 0 6px;\n\n  /* --- le cadre d'un post --------------------------------------------------- */\n  --faf-post-fond: transparent;\n  --faf-post-fond-survol: transparent;\n  --faf-post-bordure: color-mix(in srgb, currentColor 14%, transparent);\n  --faf-post-bordure-survol: color-mix(in srgb, currentColor 35%, transparent);\n  --faf-post-bordure-epaisseur: 1px;\n  --faf-post-arrondi: 8px;\n  --faf-post-padding: 8px;\n  --faf-glissement: 0px;        /* remont\u00e9e au survol (0 = immobile) */\n  --faf-transition: .18s;\n\n  /*  Quand le post entier m\u00e8ne au message (cliquable: true dans config.js) */\n  --faf-post-curseur: pointer;\n  --faf-post-focus: currentColor;       /* le liser\u00e9 au clavier */\n  --faf-post-focus-epaisseur: 2px;\n\n  /* --- l'en-t\u00eate d'un post -------------------------------------------------- */\n  --faf-tete-taille: 10px;\n  --faf-tete-espacement: 6px;\n  --faf-tete-padding: 0 0 6px;\n\n  --faf-compte-graisse: 700;\n  --faf-compte-casse: none;     /* uppercase / lowercase si besoin */\n  --faf-compte-couleur: currentColor;\n  --faf-compte-couleur-survol: currentColor;\n  --faf-compte-soulignement: underline; /* none pour ne rien souligner */\n\n  --faf-source-couleur: color-mix(in srgb, currentColor 55%, transparent);\n  --faf-source-taille: .9em;\n  --faf-source-casse: uppercase;\n\n  --faf-date-couleur: color-mix(in srgb, currentColor 55%, transparent);\n  --faf-date-couleur-survol: currentColor;\n\n  /* --- rendu \u00ab carte \u00bb seulement -------------------------------------------- */\n  --faf-carte-espacement: 6px;\n  --faf-avatar-taille: 28px;\n  --faf-avatar-arrondi: 50%;    /* 50% = rond, 4px = carr\u00e9 adouci */\n  --faf-avatar-fond: color-mix(in srgb, currentColor 10%, transparent);\n  --faf-pseudo-taille: 11px;\n  --faf-pseudo-graisse: 600;\n  --faf-image-proportion: 1;    /* 1 = carr\u00e9, 4/5 = portrait, 16/9 = paysage */\n  --faf-image-arrondi: 4px;\n  --faf-legende-taille: 11px;\n  --faf-legende-interligne: 1.5;\n  --faf-legende-lignes: 3;      /* au-del\u00e0, la l\u00e9gende est coup\u00e9e */\n  --faf-legende-couleur: color-mix(in srgb, currentColor 80%, transparent);\n\n  /* --- rendu \u00ab brut \u00bb seulement --------------------------------------------- */\n  /*  Le post est repris tel quel : son habillage vient du forum, pas d'ici. La\n   *  seule contrainte pos\u00e9e est de ne pas d\u00e9passer la largeur du fil. Mettre\n   *  \"none\" pour ne rien contraindre du tout \u2014 \u00e0 r\u00e9server aux mod\u00e8les qui\n   *  tiennent d\u00e9j\u00e0 dans l'emplacement, sinon ils d\u00e9bordent.\n   */\n  --faf-brut-largeur-max: 100%;\n\n  /*  Un mod\u00e8le de post est dessin\u00e9 pour une page enti\u00e8re : dans une colonne, il\n   *  devient vite tr\u00e8s haut. Les trois r\u00e9glages suivants n'ont aucun effet tant\n   *  qu'on ne les change pas. Un jeu qui marche bien :\n   *\n   *    --faf-brut-echelle: .8;\n   *    --faf-brut-hauteur-max: 420px;\n   *    --faf-brut-masque: linear-gradient(to bottom, #000 calc(100% - var(--faf-brut-fondu)), transparent);\n   *\n   *  L'\u00e9chelle r\u00e9duit le post en entier, texte et images ensemble, sans le\n   *  d\u00e9former : .8 = quatre cinqui\u00e8mes de sa taille.\n   */\n  --faf-brut-echelle: 1;\n\n  /*  La hauteur maximale coupe ce qui d\u00e9passe \u2014 le post entier reste \u00e0 un clic,\n   *  dans sa fen\u00eatre.\n   */\n  --faf-brut-hauteur-max: none;\n\n  /*  Avec le masque ci-dessus, la coupe se fond sur cette hauteur au lieu d'\u00eatre\n   *  nette.\n   */\n  --faf-brut-fondu: 70px;\n  --faf-brut-masque: none;\n\n  /* --- la fen\u00eatre du post (auClic: 'couche') --------------------------------- */\n  /*  Par d\u00e9faut elle ne montre rien d'autre que le post, \u00e0 sa taille, avec une\n   *  croix pour fermer : pas de cadre, pas de fond, pas de marge. Ce qu'on voit\n   *  est le post tel que le forum l'habille.\n   *\n   *  Pour lui donner un cadre, remplir ces trois-l\u00e0 :\n   *    --faf-couche-fond: rgb(from var(--ma-couleur-de-bloc) r g b / .8);\n   *    --faf-couche-padding: 10px;\n   *    --faf-couche-arrondi: 12px;\n   */\n  --faf-couche-largeur: fit-content;  /* un nombre de px pour forcer une largeur */\n  --faf-couche-fond: transparent;\n  --faf-couche-verre: 0px;       /* flou derri\u00e8re la fen\u00eatre \u2014 n'a d'effet\n                                    qu'avec un fond translucide */\n  --faf-couche-couleur: inherit;\n  --faf-couche-padding: 0px;\n  --faf-couche-arrondi: 0px;\n  --faf-couche-bordure: transparent;\n  --faf-couche-bordure-epaisseur: 0px;\n  --faf-couche-ombre: none;\n\n  /*  Le voile sur le reste de la page. Volontairement l\u00e9ger : la fen\u00eatre doit\n   *  flotter, pas \u00e9teindre le forum. rgba(0,0,0,0) pour aucun voile du tout.\n   */\n  --faf-couche-voile: rgba(0, 0, 0, .3);\n  --faf-couche-flou: 0px;        /* 2-3px pour estomper la page derri\u00e8re */\n\n  --faf-couche-hauteur-max: 88vh; /* au-del\u00e0, le contenu d\u00e9file dans la fen\u00eatre */\n  --faf-couche-marge: 24px;      /* l'air minimum sur les c\u00f4t\u00e9s, petit \u00e9cran */\n  --faf-couche-apparition: .16s; /* 0s pour qu'elle apparaisse sans animation */\n  --faf-couche-plan: 9999;       /* seulement pour les navigateurs sans <dialog> */\n  --faf-couche-echelle: 1;       /* le post y est montr\u00e9 en entier, non coup\u00e9 */\n\n  --faf-couche-fermer-taille: 24px;\n  --faf-couche-fermer-couleur: currentColor;\n  --faf-couche-fermer-couleur-survol: currentColor;\n  --faf-couche-fermer-fond: color-mix(in srgb, currentColor 14%, transparent);\n  --faf-couche-fermer-haut: 8px;\n  --faf-couche-fermer-droite: 8px;\n\n  --faf-couche-lien-taille: 11px;\n  --faf-couche-lien-couleur: color-mix(in srgb, currentColor 60%, transparent);\n  --faf-couche-lien-couleur-survol: currentColor;\n  --faf-couche-lien-marge: 10px;\n\n  /* --- le pied d'un post : aimer -------------------------------------------- */\n  --faf-pied-taille: 11px;\n  --faf-pied-espacement: 5px;\n  --faf-pied-padding: 6px 0 0;\n\n  /*  La taille du c\u0153ur, ind\u00e9pendante du reste du pied. Le monter \u00e0 16-18px le\n   *  rend nettement plus pr\u00e9sent sous le post.\n   */\n  --faf-like-taille: inherit;\n\n  --faf-like-couleur: color-mix(in srgb, currentColor 60%, transparent);\n  --faf-like-couleur-survol: currentColor;\n  --faf-like-couleur-actif: currentColor;   /* la couleur du c\u0153ur une fois aim\u00e9 */\n  --faf-like-couleur-erreur: currentColor;\n  --faf-like-fond: transparent;\n  --faf-like-fond-survol: transparent;\n  --faf-like-fond-actif: transparent;\n  --faf-like-bordure: transparent;\n  --faf-like-bordure-epaisseur: 0px;\n  --faf-like-arrondi: 4px;\n  --faf-like-padding: 2px 4px;\n  --faf-like-grossissement: 1;    /* 1.25 pour que le c\u0153ur grossisse au survol */\n  --faf-like-opacite-attente: .45;\n  --faf-like-nb-couleur: color-mix(in srgb, currentColor 55%, transparent);\n  --faf-like-erreur-taille: .9em;\n\n  /* --- commenter ------------------------------------------------------------ */\n  --faf-commentaire-taille: 11px;\n  --faf-commentaire-padding: 6px 0 0;\n  --faf-commentaire-espacement: 6px;\n\n  --faf-commenter-couleur: color-mix(in srgb, currentColor 60%, transparent);\n  --faf-commenter-couleur-survol: currentColor;\n  --faf-commenter-fond: transparent;\n  --faf-commenter-fond-survol: transparent;\n  --faf-commenter-bordure: color-mix(in srgb, currentColor 20%, transparent);\n  --faf-commenter-bordure-survol: color-mix(in srgb, currentColor 45%, transparent);\n  --faf-commenter-bordure-epaisseur: 1px;\n  --faf-commenter-arrondi: 4px;\n  --faf-commenter-padding: 4px 8px;\n  --faf-commenter-opacite-attente: .45;\n\n  --faf-champ-fond: color-mix(in srgb, currentColor 6%, transparent);\n  --faf-champ-bordure: color-mix(in srgb, currentColor 20%, transparent);\n  --faf-champ-bordure-active: color-mix(in srgb, currentColor 50%, transparent);\n  --faf-champ-bordure-epaisseur: 1px;\n  --faf-champ-arrondi: 4px;\n  --faf-champ-padding: 6px 8px;\n  --faf-champ-marge: 6px;\n\n  /*  Le mot sous le formulaire : \u00ab commentaire publi\u00e9 \u00bb, ou le refus du forum.\n   *  Mettre une vraie couleur ici aide \u00e0 distinguer les deux.\n   */\n  --faf-mot-couleur: color-mix(in srgb, currentColor 55%, transparent);\n  --faf-mot-couleur-fait: currentColor;\n  --faf-mot-couleur-souci: currentColor;\n  --faf-mot-taille: .95em;\n  --faf-mot-marge: 6px 0 0;\n\n  /* --- \u00ab rien de neuf \u00bb / chargement ---------------------------------------- */\n  --faf-vide-taille: 11px;\n  --faf-vide-style: italic;\n  --faf-vide-couleur: color-mix(in srgb, currentColor 50%, transparent);\n  --faf-vide-alignement: left;\n  --faf-vide-padding: 10px 2px;\n}\n\n/* -----------------------------------------------------------------------------\n *  R\u00e9glages \u00e0 la carte\n *  ---------------------------------------------------------------------------\n *  Le fil porte la classe .faf, et chaque post .faf-post. Le nom du th\u00e8me\n *  donn\u00e9 dans config.js ajoute une classe : classe: 'colonne' \u2192 .faf-colonne.\n *\n *  Deux colonnes seulement sur grand \u00e9cran :\n *\n *    @media (min-width: 900px) {\n *      .faf { --faf-colonnes: 2; }\n *    }\n *\n *  Le fil ne d\u00e9passe jamais une certaine hauteur, et d\u00e9file :\n *\n *    .faf-fil {\n *      max-height: 60vh;\n *      overflow-y: auto;\n *      padding-right: 4px;\n *    }\n *\n *  En rendu \u00ab brut \u00bb, le post garde l'habillage qu'il a dans le sujet. Si ce\n *  mod\u00e8le est plus large que l'emplacement du fil, le mettre \u00e0 l'\u00e9chelle plut\u00f4t\n *  que de le retailler :\n *\n *    .faf-post-corps--brut {\n *      zoom: .8;\n *    }\n * -------------------------------------------------------------------------- */\n";
  document.head.appendChild(s);
})();

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
