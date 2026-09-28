#!/usr/bin/env python3
"""Fabrique console-test.js : le plugin + les feuilles de style + le bout de
test, en un seul fichier à coller dans la console d'un forum.

    python build.py
    python build.py mon-test.js mon-console.js
    python build.py mon-test.js mon-console.js mes-reglages.css

Sans argument, le fichier se régénère à partir de fa-feed.js, fa-feed.css,
config.css et test-footer.js. Les arguments permettent d'utiliser un bout de
test réglé pour un forum précis, de l'écrire ailleurs, et d'y ajouter une
feuille de réglages propre à ce forum — celle-ci passe en dernier, donc elle
gagne sur config.css.

Rien n'est écrit à la main dans le fichier produit.
"""
import json
import pathlib
import sys

ici = pathlib.Path(__file__).parent
footer_arg = sys.argv[1] if len(sys.argv) > 1 else "test-footer.js"
sortie_arg = sys.argv[2] if len(sys.argv) > 2 else "console-test.js"
reglages_arg = sys.argv[3] if len(sys.argv) > 3 else None

js = (ici / "fa-feed.js").read_text(encoding="utf-8")
footer = pathlib.Path(footer_arg).read_text(encoding="utf-8")

# fa-feed.css, puis config.css, puis les réglages du forum s'il y en a : chaque
# feuille passe après la précédente, donc la dernière gagne — comme sur un forum.
morceaux = [(ici / nom).read_text(encoding="utf-8") for nom in ("fa-feed.css", "config.css")]
if reglages_arg:
    morceaux.append(pathlib.Path(reglages_arg).read_text(encoding="utf-8"))
feuilles = "\n".join(morceaux)

style = (
    "\n/* --- fa-feed.css + config.css, embarquées pour que le test se suffise\n"
    "   à lui-même. Régler l'apparence dans config.css, pas ici. --- */\n"
    "(function () {\n"
    "  var vieux = document.getElementById('faf-css');\n"
    "  if (vieux) vieux.remove();\n"
    "  var s = document.createElement('style');\n"
    "  s.id = 'faf-css';\n"
    "  s.textContent = %s;\n"
    "  document.head.appendChild(s);\n"
    "})();\n\n" % json.dumps(feuilles)
)

sortie = pathlib.Path(sortie_arg)
sortie.write_text(js + style + footer, encoding="utf-8")
print("%s régénéré — %d octets" % (sortie.name, sortie.stat().st_size))
