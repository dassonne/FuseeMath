# 🚀 Fusée Maths — CE1

Une application web ludique pour s'entraîner aux maths du CE1, sur téléphone, tablette ou ordinateur.

L'enfant pilote une fusée et explore 4 planètes, une par domaine du programme :

Inspiré de MathHero : chaque mission est un combat contre un alien, chaque bonne réponse le touche avec un laser.

| Planète | Domaine | Exemples de notions |
|---|---|---|
| 🟠 **Numéris** | Nombres | centaines/dizaines/unités, comparer, ranger, droite graduée, nombres en lettres, doubles et moitiés |
| 🔵 **Calculo** | Calcul | calcul mental, compléments à 10 et à 100, ±10/±100, tables de 0 à 10 dans les deux sens, opérations posées |
| 🟢 **Problémia** | Problèmes | ajout/retrait, parties d'un tout, comparaison, groupements, partages, deux étapes, corrigés avec schémas en barres |
| 🟣 **Géomia** | Mesures & géométrie | monnaie, heure, durées, calendrier, règle graduée, unités, figures, solides, quadrillage, angle droit, fractions unitaires |

Contenus alignés sur le programme de mathématiques 2025 du CE1 : nombres jusqu'à 1 000 dès la période 2, fractions unitaires (demi, tiers, quart… jusqu'au dixième) dès la période 2, tables de 0 à 10 en fin d'année, fluence de 12 calculs en 3 minutes ; pas de contenances (vues en CE2).

## Fonctionnement

- **Missions de 5 questions contre un alien.** Il est capturé (et rejoint l'album) si toutes les réponses sont trouvées. Jusqu'à 3 étoiles selon les réussites du premier coup.
- **Erreurs :** à la première erreur, un indice ; à la deuxième, la correction expliquée. La notion revient en priorité ensuite.
- **Niveaux 1 à 5**, calqués sur les 5 périodes de l'année. Après 3 missions réussies (au moins 4/5 du premier coup), **un boss apparaît** : le battre fait passer au niveau suivant.
  - Boss classique : 8 défis, 6 réussis du premier coup pour gagner.
  - Sur Calculo, **Défi éclair** : 12 calculs en 3 minutes, 10 réussis pour gagner (le chronomètre peut être désactivé).
- **Objectif du jour :** 3 missions (environ 10-15 minutes).
- **Récompenses :** étoiles, fusées à débloquer, album de 40 aliens et boss, trophées.
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
