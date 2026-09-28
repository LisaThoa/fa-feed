/* =============================================================================
 *  fa-feed — CONFIGURATION
 *  -----------------------------------------------------------------------------
 *  C'est le SEUL fichier à modifier. Rien à toucher dans fa-feed.js.
 *  Les couleurs et la disposition se règlent de leur côté dans config.css.
 *
 *  À charger AVANT le plugin :
 *    <script src=".../config.js"></script>
 *    <script src=".../fa-feed.js"></script>
 * ========================================================================== */

window.FA_FEED_CONFIG = {

  /* ---------------------------------------------------------------------------
   *  1. OÙ placer le fil dans la page
   * -------------------------------------------------------------------------
   *  cible    : le sélecteur d'un élément qui existe déjà dans ton forum.
   *             Pour le trouver : clic droit sur l'endroit voulu → Inspecter.
   *             Ex. '#page-body', '.headerbar', '#mon-div-a-moi'
   *  position : où se pose le fil PAR RAPPORT à cette cible —
   *             'fin'   → dernier enfant de la cible   (défaut)
   *             'debut' → premier enfant de la cible
   *             'avant' → juste au-dessus de la cible
   *             'apres' → juste en dessous de la cible
   *
   *  Le fil ne remplace jamais le contenu de la cible : il s'ajoute.
   *  Raccourci : emplacement: '#mon-div'  équivaut à { cible: '#mon-div' }.
   */
  emplacement: {
    cible: '#fa-feed',
    position: 'fin'
  },

  /*  Thème : pose une classe sur le conteneur du fil.
   *  'colonne' → .faf-colonne, habillé par themes/colonne.css (à charger aussi) :
   *  une colonne étroite de vignettes, en-tête discret, image en pleine largeur.
   *  Plusieurs noms possibles, séparés par un espace.
   *  null = pas de thème, on habille tout depuis config.css.
   */
  classe: null,

  /*  Un titre au-dessus du fil. null = pas de titre. */
  titre: null,

  /* ---------------------------------------------------------------------------
   *  2. QUOI lire
   * -------------------------------------------------------------------------
   *  Une entrée par section à suivre. Toutes les sources se mélangent en UN
   *  seul fil, remis dans l'ordre chronologique.
   *
   *    titre : le nom affiché à côté du post (null = pas de provenance)
   *    forum : l'id numérique de la section
   *    url   : l'adresse de la section
   *
   *  Les deux se lisent dans le lien de la section. Pour une section dont
   *  l'adresse est  monforum.forumactif.com/f14-instagram  :
   *      forum : 14                le nombre qui suit le « f »
   *      url   : '/f14-instagram'  tout ce qui suit le nom de domaine
   */
  sources: [
    {
      titre: 'instagram',
      forum: 14,
      url: '/f14-instagram'
    }
    // { titre: 'twitter', forum: 15, url: '/f15-twitter' },

    /* Pour ne suivre que certains comptes plutôt que la section entière, on
     * donne leurs ids (ou leurs adresses) — ils doivent se trouver sur la
     * première page de la section :
     *   sujets: [1234, 5678, '/t91-le-compte-de-machin']
     *
     * "exclure" fait l'inverse : il écarte des sujets de la lecture.
     *   exclure: [1234]
     *
     * "sujets: 6" (un nombre) limite cette source-là aux 6 comptes les plus
     * actifs, sans toucher au réglage général ci-dessous.
     */
  ],

  /*  Combien de SUJETS parcourir — c'est-à-dire combien de pages le fil va
   *  chercher. Chaque sujet = une requête. Au-delà d'une quinzaine, le premier
   *  affichage se fait sentir : le cache plus bas prend ensuite le relais.
   */
  sujets: 12,

  /*  Combien de POSTS afficher en tout, une fois tout mélangé et retrié. */
  posts: 20,

  /*  Combien de posts au maximum garder par sujet. Empêche un compte très
   *  bavard de remplir le fil à lui seul. 0 = pas de plafond.
   */
  parSujet: 2,

  /*  CE QU'ON AFFICHE : les genres retenus, parmi ceux déclarés dans "balisage"
   *  plus bas. null = tous. Un fil qui ne montre que les stories, c'est
   *  afficher: ['story'] et rien d'autre à changer.
   *
   *  Ce réglage se change sans vider le cache : tout est lu une fois, le tri se
   *  fait à l'affichage.
   */
  afficher: ['post'],

  /*  Écrire le genre à côté du compte, dans l'en-tête de chaque post. Utile
   *  quand le fil en mélange plusieurs.
   */
  genre: false,

  /* ---------------------------------------------------------------------------
   *  3. LE BALISAGE — comment reconnaître un post
   * -------------------------------------------------------------------------
   *  C'est le cœur du réglage : les codes « instagram » diffèrent d'un forum à
   *  l'autre, et même d'un membre à l'autre au sein d'un forum. Rien n'est
   *  supposé ici, tout se dit en sélecteurs CSS.
   *
   *  CHAQUE LIGNE EST UNE LISTE. Un message est retenu s'il correspond à L'UN
   *  des sélecteurs donnés — c'est ce qui permet à deux versions d'un même
   *  modèle de cohabiter dans la même section.
   *
   *  Pour trouver ces sélecteurs : ouvrir un sujet du réseau, clic droit sur le
   *  post → Inspecter, et relever la classe du bloc qui entoure tout le post.
   */
  balisage: {

    /*  Le conteneur d'un message, tel que Forumactif le produit. À ne changer
     *  que si ton thème renomme ces blocs.
     */
    message: ['.post', '.post_row'],

    /*  LES GENRES : ce qu'un message peut être. Un nom de ton choix, et les
     *  sélecteurs qui le reconnaissent. Tu décides ensuite lesquels s'affichent,
     *  avec "afficher" plus bas.
     *
     *  Les noms sont libres : post, commentaire, story, reel, like, message
     *  privé, annonce… tout ce que ton réseau fictif sait faire. Chacun reçoit
     *  une classe dans le fil (genre « story » → .faf-post--story) et un
     *  attribut data-genre, de quoi l'habiller à part dans config.css.
     *
     *  Le joker [class*="..."] attrape d'un coup toutes les variantes d'un
     *  modèle dont les classes commencent pareil.
     *
     *  Quand un message correspond à PLUSIEURS genres — un commentaire qui cite
     *  un post, par exemple — c'est le bloc le plus englobant qui l'emporte, et
     *  à égalité le premier genre écrit ici. Pas besoin de se creuser la tête
     *  sur l'ordre dans le cas courant.
     */
    genres: {
      post: ['[class*="insta"]'],
      commentaire: ['[class*="comment"]']
      // story: ['[class*="story"]'],
      // annonce: ['.mon-modele-annonce']
    },

    /*  Ce qui est écarté d'office, quel que soit son genre : un message est
     *  laissé de côté s'il correspond lui-même à l'un de ces sélecteurs, ou si
     *  le bloc retenu se trouve à l'intérieur de l'un d'eux.
     *
     *  Avec les genres, on n'en a le plus souvent pas besoin — il suffit de ne
     *  pas mettre un genre dans "afficher".
     */
    ignorer: [],

    /*  Où lire l'identifiant du message. C'est une expression régulière
     *  appliquée à la classe puis à l'id du bloc ; le premier groupe entre
     *  parenthèses est le numéro. À défaut, il est lu dans l'ancre.
     */
    idMessage: 'post--(\\d+)',

    /*  Le lien qui mène au message (celui qui porte l'ancre #123456). */
    ancre: ['a.post_date', 'a[href*="#"]'],

    /*  Où lire la date du message. */
    date: ['a.post_date', '.postdetails .date', '.date'],

    /*  Le corps du message. Sert seulement quand "post" est vide. */
    corps: ['.post_message', '.postbody', '.content'],

    /*  Le bouton « j'aime » que le forum place dans chaque message, et son
     *  compteur. Utilisés seulement si aimer: true (plus bas).
     */
    like: ['.rep-button'],
    likeNombre: ['.rep-nb'],

    /*  Ce qui, sur ce bouton, indique que le visiteur a DÉJÀ aimé ce message —
     *  souvent une classe ajoutée par le forum. Laissé vide, le fil ne présume
     *  rien : le cœur part vide et se remplit après un clic réussi.
     *    likeActif: ['.rep-button.active'],
     */
    likeActif: [],

    /*  Les deux attributs où le forum range ses adresses de vote. Elles portent
     *  des jetons propres à chaque message : le fil les lit toujours dans le
     *  message, il ne les fabrique jamais.
     */
    likeAttribut: 'data-href',
    likeAttributRetirer: 'data-href-rm',

    /*  Pour commenter. {sujet} est remplacé par l'id du sujet, {message} par
     *  celui du message.
     */
    urlReponse: '/post?t={sujet}&mode=reply',
    formulaireReponse: ['form[action*="/post"]', 'form[name="post"]'],
    champMessage: ['textarea[name="message"]'],
    boutonEnvoi: ['input[name="post"]', 'button[name="post"]'],

    /*  Où lire le refus du forum dans la page qu'il renvoie après l'envoi —
     *  l'anti-flood, un sujet verrouillé, une permission manquante. Si un de ces
     *  blocs contient du texte, l'envoi est tenu pour refusé et le texte est
     *  remonté tel quel.
     */
    erreurForum: ['.error', '.errorwrap', '#message_error', '.panel .inner h2 + p']
  },

  /* ---------------------------------------------------------------------------
   *  4. COMMENT l'afficher
   * -------------------------------------------------------------------------
   *  'brut'  → le bloc du post est repris tel quel, et c'est le CSS de ton
   *            forum qui l'habille, exactement comme dans le sujet. Aucun
   *            réglage à faire, et les différentes versions du modèle
   *            s'affichent chacune correctement. C'est le choix conseillé.
   *
   *  'carte' → le fil rebâtit une vignette uniforme à partir des quatre champs
   *            décrits plus bas. Plus régulier à l'œil, mais il faut lui dire
   *            où trouver chaque morceau, pour chaque version du modèle.
   */
  rendu: 'brut',

  /*  Utilisé uniquement par rendu: 'carte'. Là encore, des listes : le premier
   *  sélecteur trouvé dans le post l'emporte.
   */
  champs: {
    avatar: ['.avatar img', 'img'],
    pseudo: ['.pseudo', '.nom', 'strong'],
    image: ['img'],
    legende: ['.legende', 'p']
  },

  /* ---------------------------------------------------------------------------
   *  5. RÉGLAGES
   * ------------------------------------------------------------------------- */

  compte: true,           // afficher le nom du sujet (= le compte) au-dessus du post
  source: true,           // afficher la provenance quand plusieurs sources sont lues
  datesRelatives: true,   // 'il y a 2 h' plutôt que 'Mar 22 Sep 2026 - 14:02'

  /*  Ce que fait un clic n'importe où sur un post :
   *
   *    'couche' → le post s'ouvre en grand par-dessus le fil, entier, sans la
   *               coupe ni la mise à l'échelle de la vignette. On ne quitte pas
   *               la page, et la couche se ferme par Échap, par le ×, ou en
   *               cliquant à côté. C'est le choix conseillé.
   *    'lien'   → la page va directement au message sur le forum.
   *    'onglet' → le message s'ouvre dans un nouvel onglet.
   *    false    → un clic ne fait rien ; seuls la date et le compte restent des
   *               liens.
   *
   *  Dans tous les cas, ce qui est déjà cliquable dans le post garde son rôle —
   *  les liens du modèle, le cœur, le champ de commentaire — et sélectionner du
   *  texte ne déclenche rien. Ctrl+clic (ou Cmd+clic) ouvre toujours dans un
   *  nouvel onglet. Le post est atteignable au clavier : Entrée ou Espace.
   */
  auClic: 'couche',

  /*  Ce que la fenêtre montre :
   *    false → le post seul, à sa taille, avec une croix pour fermer. Rien
   *            d'autre : ni en-tête, ni cœur, ni commentaire, ni cadre.
   *    true  → le post comme dans le fil — en-tête, cœur, champ de commentaire —
   *            plus un lien « voir sur le forum ».
   */
  coucheComplete: false,

  texteFermer: '×',
  texteVoirSurLeForum: 'voir sur le forum',

  cache: 300,             // secondes avant de réinterroger le forum (0 = jamais de cache)

  texteVide: 'rien de neuf par ici',
  texteChargement: null,  // affiché le temps que le fil se remplisse (null = rien)
  texteInterdit: null,    // texte si le visiteur n'a pas accès à la section
                          // null = le fil disparaît purement et simplement

  /* Feuille de style :
   *   true  → fa-feed.css est chargée automatiquement, depuis le même dossier
   *           que fa-feed.js (le cas normal)
   *   false → aucune feuille chargée, tu écris tout ton CSS toi-même
   *   '...' → l'adresse d'une feuille à toi
   */
  style: true,

  /* ---------------------------------------------------------------------------
   *  6. AIMER
   * -------------------------------------------------------------------------
   *  Ajoute sous chaque post le bouton « j'aime » du forum, avec son compteur.
   *  Le fil n'invente rien : au moment du clic, il recharge la page du message
   *  et y relit l'adresse de vote que le forum lui donne, jetons compris. Une
   *  adresse qui pointerait hors du forum est refusée.
   *
   *  Un visiteur non connecté ne voit pas le bouton : le forum ne lui donne pas
   *  d'adresse de vote.
   */
  aimer: false,

  /*  Ce qu'affiche le bouton, avant et après. Inséré tel quel : du texte, un
   *  emoji, ou une icône de la police du forum —
   *    texteAimer: '<i class="fa fa-heart-o"></i>',
   *    texteAime:  '<i class="fa fa-heart"></i>',
   */
  texteAimer: '♡',
  texteAime: '♥',

  /*  Le modèle de certains membres contient déjà le bouton du forum. Privé de
   *  son script, il ne ferait rien : le fil l'enlève et met le sien à la place.
   *  false pour le laisser où il est.
   */
  remplacerLikeOriginal: true,

  /*  Demander confirmation avant d'aimer. Aimer est réversible d'un second
   *  clic, donc c'est à false par défaut ; retirer n'est jamais confirmé.
   */
  confirmerAimer: false,
  texteConfirmerAimer: 'Aimer ce message ?',

  /*  Affiché à côté du bouton quand le forum refuse. Le détail exact est mis en
   *  infobulle et dans la console : rien n'est retenté tout seul.
   */
  texteErreurAimer: 'impossible pour le moment',

  /* ---------------------------------------------------------------------------
   *  7. COMMENTER
   * -------------------------------------------------------------------------
   *  Ajoute sous chaque post un bouton qui déplie un champ de réponse.
   *
   *  À lire avant d'activer : un commentaire envoyé d'ici est un VRAI message
   *  public sur le forum, posté sous le pseudo du visiteur, exactement comme
   *  s'il avait répondu au sujet. Ce n'est pas un brouillon.
   *
   *  Ce que le fil fait, et ne fait pas :
   *    — il n'invente aucun champ : il charge le formulaire de réponse du forum
   *      et le renvoie tel quel, en n'y remplaçant que le message. Les jetons
   *      sont donc toujours frais, et rien n'est reconstruit ;
   *    — il demande confirmation avant d'envoyer (réglage juste en dessous) ;
   *    — il n'envoie qu'une fois. Si le forum refuse — l'anti-flood, le plus
   *      souvent — le texte reste dans le champ et c'est au visiteur de décider
   *      de réessayer. Le fil ne renvoie jamais tout seul ;
   *    — il affiche le refus du forum tel quel, en infobulle et dans la console.
   */
  commenter: false,

  texteCommenter: 'commenter',
  texteEnvoyer: 'envoyer',
  texteAnnuler: 'annuler',
  invitecommentaire: 'votre commentaire…',

  /*  La confirmation. À laisser à true : c'est le dernier filet avant une
   *  publication publique.
   */
  confirmerCommentaire: true,
  texteConfirmerCommentaire: 'Publier ce commentaire sur le forum, sous votre pseudo ?',

  texteCommentaireEnvoye: 'commentaire publié',
  texteErreurCommentaire: 'le forum a refusé le commentaire',

  /*  En dessous de cette longueur, le fil n'envoie rien. */
  longueurMiniCommentaire: 2

  /* ---------------------------------------------------------------------------
   *  8. POUR ALLER PLUS LOIN (optionnel — supprimer la virgule ci-dessus si
   *     vous décommentez)
   * -------------------------------------------------------------------------
   *  Filtre maison. Reçoit chaque post, renvoie true pour le garder.
   *  Champs disponibles : id, sujet, compte, url, urlSujet, dateTxt, source, html.
   *
   *  ,filtre: function (post) {
   *     return post.compte.indexOf('[archivé]') === -1;
   *   }
   */
};
