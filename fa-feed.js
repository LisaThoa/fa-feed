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
