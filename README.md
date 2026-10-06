# 🚀 Fusée Maths — CE1

Une application web ludique pour s'entraîner aux maths du CE1, sur téléphone, tablette ou ordinateur.

L'enfant pilote une fusée et explore 5 planètes, une par domaine du programme :

Inspiré de MathHero :
- **Carte d'aventure** pour chaque planète : un chemin de 20 étapes (5 niveaux de 3 étapes + 1 boss), avec jusqu'à 3 étoiles par étape. On peut rejouer une étape pour améliorer ses étoiles.
- **Écran de combat** : un héros astronaute avec son blaster affronte un monstre dans un décor propre à chaque planète. Chaque bonne réponse le touche ; les calculs s'affichent en grand et se répondent avec 4 tuiles (ou au pavé numérique, au choix des parents).

| Planète | Domaine | Exemples de notions |
|---|---|---|
| 🟠 **Numéris** | Nombres | centaines/dizaines/unités, comparer, ranger, droite graduée, nombres en lettres, doubles et moitiés, fractions |
| 🔵 **Calculo** | Calcul | calcul mental, compléments à 10 et à 100, ±10/±100, tables de 0 à 10 dans les deux sens, opérations posées |
| 🟢 **Problémia** | Problèmes | ajout/retrait, parties d'un tout, comparaison, groupements, partages, deux étapes, corrigés avec schémas en barres |
| 🟣 **Géomia** | Mesures & géométrie | monnaie, règle graduée, unités (m, cm, kg, g), figures, solides, quadrillage, angle droit |
| 🩵 **Chronos** | Le temps | lire l'heure, trouver la bonne horloge, durées, estimer des durées, jours et mois, lire un calendrier, 1 h = 60 min… |

### Programme 2025 et livret d'accompagnement CE1 (éduscol)

Les contenus suivent le programme de mathématiques 2025 et les quatre séquences du livret d'accompagnement CE1 :

- **Fractions** : moitié, demi et quart en période 1 ; fractions unitaires (demi → dixième) et **écriture chiffrée** en période 2 ; fractions non unitaires en période 3 ; comparaison et addition de fractions de même dénominateur en période 4. Les fractions se lisent « un cinquième », jamais « un sur cinq » (la lecture vocale le respecte). Pièges de partages en parts inégales, et **memory des fractions** comme dans le livret.
- **Calcul mental** : ajouter 9, 19, 29 (« ajouter 20 puis enlever 1 », sauf si le nombre finit par 0 ou 1), soustraire 9. Fluence : **12 calculs en 3 minutes** (Défi éclair).
- **Tables** : tables de 1 à 6 et 10 en périodes 1-2, table de 7 en période 3, table de 8 en période 4, toutes en période 5 ; multiplier par 10 ; 11 à 19 × un petit nombre. Indices par stratégie (commutativité, double, 10 fois moins 1 fois). Le résultat est dit à voix haute (« 3 fois 7, 21 »). **Défi tables : 8 résultats en 1 minute**, avec récupération espacée des faits fragiles.
- **Problèmes parties-tout** : recherche du tout ou d'une partie, de l'état final, de la transformation ou de l'état initial ; schéma en barres dans les corrections ; question « Quel calcul permet de répondre ? » pour l'étape de modélisation.
- Pas de contenances (vues en CE2).

## Fonctionnement

- **Étapes de 5 questions contre un alien.** Il est capturé (et l'étape réussie) avec au moins 3 bonnes réponses du premier coup. Jusqu'à 3 étoiles par étape.
- **Erreurs :** à la première erreur, un indice ; à la deuxième, la correction expliquée. La notion revient en priorité ensuite.
- **Niveaux 1 à 5**, calqués sur les 5 périodes de l'année. Après les 3 étapes d'un niveau, **un boss** garde le passage : le battre fait passer au niveau suivant.
  - Boss classique : 8 défis, 6 réussis du premier coup pour gagner.
  - Sur Calculo, **Défi éclair** : 12 calculs en 3 minutes, 10 réussis pour gagner (le chronomètre peut être désactivé).
- **Objectif du jour :** 3 missions (environ 10-15 minutes).
- **Défis & jeux** (entraînement libre, sans changer de niveau) : Défi éclair, Défi tables, Memory des fractions, avec records.
- **Récompenses :** étoiles, fusées à débloquer, album de 50 aliens et boss, trophées.
- **Lecture audio** des consignes (bouton 🔊, ou lecture automatique dans l'espace parents).
- **Espace parents** protégé par un code à 4 chiffres : réussite par notion, notions à revoir, historique, niveaux, choix des tables de multiplication, chronomètre.
- **Pas de compte, pas de serveur :** la progression reste dans le navigateur de l'appareil (non partagée entre téléphone et PC).
- **Hors ligne :** une fois ouverte, l'application fonctionne sans internet et peut être ajoutée à l'écran d'accueil.

## Mise en ligne (GitHub Pages)

1. Sur GitHub : **Settings → Pages**.
2. *Source* : **Deploy from a branch**, branche `master`, dossier `/ (root)`.
3. Après une minute, le site est disponible sur `https://<utilisateur>.github.io/TestClaudecode/`.
4. Sur le téléphone, ouvrir ce lien puis « Ajouter à l'écran d'accueil ».

## Développement

Aucune dépendance ni étape de compilation : HTML, CSS et JavaScript (modules ES).

```bash
python3 -m http.server 8000   # puis ouvrir http://localhost:8000
npm test                      # vérifie la cohérence des exercices générés
```

- `js/skills.js` : générateurs d'exercices (pour ajouter une notion, ajouter un objet dans la liste de la planète)
- `js/store.js` : progression, étoiles, trophées
- `js/app.js` : écrans et interactions
- `js/visuals.js` : illustrations SVG
- `sw.js` : cache hors ligne (incrémenter `VERSION` après une modification)
