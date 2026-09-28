# fa-feed

Un fil d'actualité pour Forumactif : il rassemble les messages d'une section —
typiquement les comptes d'un réseau social fictif — et les affiche ensemble, du
plus récent au plus ancien, n'importe où dans le forum.

Le fil lit le forum avec la session du visiteur : chacun voit ce à quoi il a
accès, et rien d'autre. Une section fermée ne s'affiche pas.

Un message n'est pas forcément un post : selon les forums c'est une story, un
commentaire, une annonce. Le fil ne connaît aucun de ces mots d'avance — on lui
décrit les **genres** qui existent chez soi, et on choisit lesquels s'affichent.

**Lire** et **aimer** sont en place. **Commenter** est écrit et couvert par des
essais, mais n'a pas encore été éprouvé sur un forum en conditions réelles : il
est à `false` par défaut, et les sélecteurs du formulaire de réponse
(`balisage.urlReponse`, `formulaireReponse`, `champMessage`, `boutonEnvoi`,
`erreurForum`) sont à vérifier sur son propre forum avant de l'activer. Le
premier essai est à faire sur un sujet à soi : ce qui part est un vrai message
public.

---

## Les fichiers

| fichier | à quoi il sert |
|---|---|
| `fa-feed.js` | le plugin. Rien à y modifier. |
| `fa-feed.css` | la structure du fil. Rien à y modifier non plus. |
| `config.js` | **le seul fichier à remplir** : ce qu'on lit, et comment on le reconnaît. |
| `config.css` | l'apparence : une variable par réglage. |
| `themes/colonne.css` | un habillage tout fait, à charger en plus si on le veut. |
| `demo.html` | un aperçu hors ligne, avec des données inventées. |
| `build.py` · `test-footer.js` | de quoi fabriquer `console-test.js`. |
| `console-test.js` | le plugin entier, à coller dans la console d'un forum pour l'essayer. |

---

## Installation

1. Héberger `fa-feed.js`, `fa-feed.css` et `config.js` (PA → Affichage →
   Images et fichiers, ou n'importe quel hébergeur qui sert du JavaScript).

2. Dans PA → Affichage → Templates, ou dans un widget, poser l'endroit où le
   fil doit apparaître :

   ```html
   <div id="fa-feed"></div>
   ```

3. Charger les scripts, la configuration **avant** le plugin :

   ```html
   <script src="…/config.js"></script>
   <script src="…/fa-feed.js"></script>
   ```

4. Coller le contenu de `config.css` dans PA → Affichage → Couleurs → Feuille
   de style CSS.

Sans étape 4, le fil s'affiche quand même : il emprunte la couleur du texte
autour de lui.

---

## `config.js` — ce qu'on lit

### Les sources

Une entrée par section. Toutes se mélangent en un seul fil, retrié par date.

```js
sources: [
  { titre: 'instagram', forum: 14, url: '/f14-instagram' },
  { titre: 'twitter',   forum: 15, url: '/f15-twitter' }
]
```

`forum` et `url` se lisent dans l'adresse de la section :
`monforum.forumactif.com/f14-instagram` → `forum: 14`, `url: '/f14-instagram'`.

Une source peut se limiter à certains sujets (`sujets: [1234, 5678]`), en écarter
(`exclure: [1234]`), ou plafonner le nombre de comptes lus (`sujets: 6`).

### Combien

```js
sujets: 12,     // combien de comptes parcourir — c'est le nombre de requêtes
posts: 20,      // combien de posts afficher en tout
parSujet: 2     // plafond par compte, pour qu'un bavard ne remplisse pas le fil
```

### Les genres — la partie qui compte

Les codes d'un réseau fictif diffèrent d'un forum à l'autre, et souvent d'un
membre à l'autre dans le même forum : plusieurs versions d'un modèle cohabitent.
Le plugin ne suppose donc rien, et **chaque réglage est une liste** : un bloc est
reconnu s'il correspond à *l'un* des sélecteurs.

Un message peut être bien des choses. On les nomme soi-même :

```js
balisage: {
  message: ['.post', '.post_row'],     // le conteneur d'un message
  genres: {
    post:        ['[class*="insta"]', '.mon-modele-a-moi'],
    commentaire: ['[class*="comment"]'],
    story:       ['[class*="story"]'],
    annonce:     ['.mon-modele-annonce']
  },
  idMessage: 'post--(\\d+)',           // où lire le numéro du message
  ancre:   ['a.post_date'],            // le lien qui mène au message
  date:    ['a.post_date', '.date'],   // où lire la date
  corps:   ['.post_message']           // le corps, si aucun genre n'est déclaré
}
```

Les noms sont libres — ce sont les tiens. Chacun donne au post une classe
(`story` → `.faf-post--story`) et un attribut `data-genre`, de quoi l'habiller à
part dans `config.css`.

On choisit ensuite ce qu'on montre :

```js
afficher: ['post', 'story'],   // null = tout
genre: false                   // true pour écrire le genre dans l'en-tête
```

Un fil qui ne montre que les stories, c'est `afficher: ['story']` et rien
d'autre à changer. Ce réglage se change **sans vider le cache** : tout est lu une
fois, le tri se fait à l'affichage.

Pour trouver les sélecteurs : ouvrir un sujet du réseau, clic droit sur un post →
Inspecter, et relever la classe du bloc qui entoure tout le post. Le joker
`[class*="…"]` attrape d'un coup toutes les variantes d'un modèle dont les
classes commencent pareil.

**Quand un message correspond à plusieurs genres** — un commentaire qui cite un
post, par exemple — c'est le bloc le plus englobant qui dit ce que le message
est, et à égalité le premier genre déclaré. Dans le cas courant, il n'y a donc
pas à se creuser la tête sur l'ordre.

Cela règle au passage un piège : sur beaucoup de forums, le **dernier** message
d'un sujet est un commentaire, pas un post. Le fil parcourt toute la page et
classe chaque message, au lieu de prendre le dernier.

Reste `balisage.ignorer`, pour ce qu'on veut écarter quel que soit son genre.
Avec les genres on n'en a le plus souvent pas besoin : il suffit de ne pas
mettre un genre dans `afficher`.

### Le rendu

```js
rendu: 'brut'   // ou 'carte'
```

**`brut`** reprend le bloc du post tel quel : c'est le CSS du forum qui
l'habille, exactement comme dans le sujet. Rien à régler, et les différentes
versions du modèle s'affichent chacune correctement. C'est le choix conseillé.

**`carte`** rebâtit une vignette uniforme à partir de quatre champs — avatar,
pseudo, image, légende — que l'on désigne dans `champs`, là encore par des
listes de sélecteurs. Plus régulier à l'œil, mais il faut lui dire où trouver
chaque morceau, pour chaque version du modèle.

### Aimer

```js
aimer: true,
texteAimer: '♡',
texteAime: '♥'
```

Le bouton apparaît sous chaque post, avec le compteur du forum. Le balisage se
règle comme le reste — `balisage.like`, `likeNombre`, `likeActif`, et les deux
attributs `likeAttribut` / `likeAttributRetirer`.

Ce que le fil ne fait pas, volontairement :

- **il ne fabrique jamais l'adresse de vote.** Elle porte des jetons propres à
  chaque message et à chaque session. Au moment du clic, le fil recharge la page
  du message et y relit l'adresse que le forum lui donne. Les jetons ne sont donc
  jamais mis en cache, et ne peuvent pas être périmés au moment de servir ;
- **il n'appelle pas une adresse qui sortirait du forum.** Elle est vérifiée
  avant tout appel — un message ne peut pas faire cliquer ailleurs ;
- **il ne réessaie jamais tout seul.** En cas de refus, le compte reste inchangé,
  le texte de `texteErreurAimer` s'affiche à côté du bouton, le détail exact est
  en infobulle et dans la console. C'est au visiteur de recliquer s'il le veut.

Un visiteur non connecté ne voit pas de bouton : le forum ne lui donne pas
d'adresse de vote, et le fil n'en invente pas.

`balisage.likeActif` mérite un mot : rien ne dit de façon universelle qu'un
message est *déjà* aimé. Laissé vide, le fil ne présume rien — le cœur part vide
et se remplit après un clic réussi. Si ton forum ajoute une classe au bouton
quand on a voté, la mettre là rend l'état juste dès le chargement.

### Commenter

```js
commenter: true,
confirmerCommentaire: true
```

Un bouton sous chaque post déplie un champ de réponse. **Ce qui part d'ici est un
vrai message public**, posté sous le pseudo du visiteur, exactement comme s'il
avait répondu au sujet. Ce n'est pas un brouillon, et le plugin est écrit en
conséquence :

- **il n'invente aucun champ.** Il charge le formulaire de réponse du forum et le
  renvoie tel quel, en n'y remplaçant que le message — jetons, `auth[]`, `tid`,
  `lt` et tout ce que le forum y met sont récoltés au moment de l'envoi, donc
  toujours frais ;
- **il ne poste pas vers l'extérieur.** L'action du formulaire est vérifiée avant
  l'envoi ;
- **il demande confirmation**, et c'est `true` par défaut ;
- **il n'envoie qu'une fois.** Le bouton se verrouille pendant l'envoi ;
- **il ne réessaie jamais tout seul.** Si le forum refuse — l'anti-flood, le plus
  souvent — le texte reste dans le champ, le refus du forum est affiché tel quel
  en infobulle et dans la console, et c'est au visiteur de décider.

Les libellés sont réglables : `texteCommenter`, `texteEnvoyer`, `texteAnnuler`,
`invitecommentaire`, `texteConfirmerCommentaire`, `texteCommentaireEnvoye`,
`texteErreurCommentaire`, `longueurMiniCommentaire`. Le balisage aussi :
`urlReponse`, `formulaireReponse`, `champMessage`, `boutonEnvoi`, et
`erreurForum` — là où se lit le refus dans la page de réponse.

### Aller au message

```js
auClic: 'couche'   // 'couche' | 'lien' | 'onglet' | false
```

- **`'couche'`** — le post s'ouvre au-dessus du fil, **entier**, sans la coupe ni
  la mise à l'échelle de la vignette. Par défaut la fenêtre ne montre rien
  d'autre que le post, à sa taille, avec une croix pour fermer : ni cadre, ni
  fond, ni marge. Elle se ferme par Échap, par le ×, ou en cliquant à côté, et
  le focus revient au post d'où l'on vient.

  `coucheComplete: true` y remet le post tel qu'il est dans le fil — en-tête,
  cœur, champ de commentaire — plus un lien « voir sur le forum ».

  C'est un `<dialog>` ouvert en modal : le navigateur le place dans sa couche du
  dessus, hors de portée du CSS du forum. Un simple bloc en `position: fixed`
  serait à la merci du premier ancêtre transformé — ce qui arrive vite sur un
  thème Forumactif, et donne une fenêtre mal placée ou mal voilée. Échap et le
  piège à focus viennent du navigateur.
- **`'lien'`** — la page va directement au message.
- **`'onglet'`** — le message s'ouvre dans un nouvel onglet.
- **`false`** — un clic ne fait rien ; seuls la date et le compte restent des
  liens.

Dans tous les cas, ce qui est déjà cliquable dans le post garde son rôle — les
liens du modèle, le lien du compte, le cœur, le champ de commentaire — et
sélectionner du texte ne déclenche rien. Ctrl+clic (ou Cmd+clic) ouvre toujours
dans un nouvel onglet. Le post est atteignable au clavier : Entrée ou Espace.

Aimer et commenter marchent depuis la couche comme depuis le fil.

Une vraie fenêtre popup n'est volontairement pas proposée : les navigateurs les
bloquent par défaut, et elles sortent du forum.

Le curseur et le liseré de focus se règlent par `--faf-post-curseur`,
`--faf-post-focus` et `--faf-post-focus-epaisseur` ; la fenêtre par les
variables `--faf-couche-*` : `--faf-couche-voile` (le voile sur le reste de la
page, volontairement léger — la fenêtre doit flotter, pas éteindre le forum),
`--faf-couche-hauteur-max` (au-delà, le contenu défile dans la fenêtre),
`--faf-couche-largeur` pour forcer une largeur au lieu de celle du post.

Pour lui donner un cadre — elle n'en a aucun par défaut :

```css
--faf-couche-fond: rgb(from var(--ma-couleur-de-bloc) r g b / .8);
--faf-couche-padding: 10px;
--faf-couche-arrondi: 12px;
--faf-couche-verre: 16px;   /* flou derrière, avec un fond translucide */
```

### Le reste

`compte`, `source`, `datesRelatives`, `cache`, `texteVide`, `texteChargement`,
`texteInterdit`, `style`, et un `filtre` maison qui reçoit chaque post et
renvoie `true` pour le garder. Tout est commenté dans `config.js`.

---

## `config.css` — l'apparence

Une variable par réglage, toutes sur `:root`, toutes préfixées `--faf-`.
Largeur, nombre de colonnes, cadre d'un post, en-tête, avatar, proportions de
l'image, coupe de la légende.

Par défaut, aucune couleur n'est imposée : le fil emprunte celle du texte autour
de lui (`currentColor`), et les nuances sont calculées à partir d'elle
(`color-mix`). Pour reprendre les couleurs du forum, remplacer une valeur par la
variable correspondante :

```css
:root {
  --faf-post-fond: var(--ma-couleur-de-bloc);
  --faf-post-bordure: var(--ma-couleur-de-trait);
}
```

Le thème `colonne` ne fait rien d'autre que redéfinir ces mêmes variables : tout
reste réglable par-dessus.

### Un post trop haut pour la colonne

En rendu brut, le post arrive avec l'habillage que lui donne le forum — or ce
modèle est dessiné pour une page entière, pas pour une colonne. Trois variables
répondent à ça, sans effet tant qu'on ne les change pas :

```css
:root {
  --faf-brut-echelle: .8;          /* réduit le post entier, sans le déformer */
  --faf-brut-hauteur-max: 420px;   /* coupe ce qui dépasse */
  --faf-brut-masque: linear-gradient(to bottom, #000 calc(100% - var(--faf-brut-fondu)), transparent);
}
```

Sans la troisième, la coupe est nette ; avec elle, elle se fond sur
`--faf-brut-fondu` (70px par défaut). Dans tous les cas, le lien de la date
mène au message entier sur le forum.

---

## Comment ça marche

La recherche de Forumactif ne rend pas de flux de messages. Le fil procède donc
en deux temps :

1. il lit la page de la section, et en tire la liste des sujets, triés par
   dernier message ;
2. pour chacun des `sujets` premiers d'entre eux, il charge la page de son
   dernier message, parcourt **tous** les messages de la page, et retient ceux
   qui correspondent au balisage.

Soit `1 + N` requêtes. Elles sont mises en cache dans le `sessionStorage` du
visiteur pendant `cache` secondes (5 minutes par défaut) : la deuxième page
visitée n'interroge plus rien. La clé d'un sujet contient le numéro de son
dernier message, donc un nouveau post invalide le cache de lui-même.

Tout passe par `fetch(url, { credentials: 'same-origin' })` : aucune requête
vers un autre domaine, aucune donnée qui sort du forum. Si le forum sert la page
Connexion à la place de ce qui est demandé, le fil le reconnaît et s'efface
plutôt que d'afficher n'importe quoi.

---

## Essayer / développer

`demo.html` s'ouvre dans un navigateur et montre les quatre configurations
courantes, sans toucher à aucun forum : les pages sont simulées par l'option
`chargeur`.

Sur un vrai forum, `console-test.js` se colle dans la console du navigateur
(connecté, sur n'importe quelle page du forum). Il affiche le fil dans un
panneau flottant, et surtout il **liste les classes rencontrées dans les
messages** : c'est ce qui permet de remplir `balisage.post` sans deviner.

Il se régénère à partir des sources, on n'y écrit jamais à la main :

```bash
python build.py
```

---

## Compatibilité

Navigateurs courants à jour. Le plugin est écrit en JavaScript ancien (ES5) avec
`fetch` et `Promise` ; `color-mix` dans les styles demande un navigateur de 2023
ou plus récent, et n'est utilisé que pour des nuances — à défaut, les valeurs se
fixent en dur dans `config.css`.

---

## Licence

MIT.
