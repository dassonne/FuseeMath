# 🚀 Fusée Maths — CE1

Une application web ludique pour s'entraîner aux maths du CE1, sur téléphone, tablette ou ordinateur.

L'enfant pilote une fusée et explore 4 planètes, une par domaine du programme :

| Planète | Domaine | Exemples de notions |
|---|---|---|
| 🟠 **Numéris** | Nombres | centaines/dizaines/unités, comparer, ranger, droite graduée, nombres en lettres, doubles et moitiés |
| 🔵 **Calculo** | Calcul | calcul mental, compléments à 10 et à 100, ±10/±100, tables de 2, 3, 4, 5 et 10, opérations posées |
| 🟢 **Problémia** | Problèmes | ajout/retrait, parties d'un tout, comparaison, groupements, partages, deux étapes |
| 🟣 **Géomia** | Mesures & géométrie | monnaie, lecture de l'heure, durées, règle graduée, unités, figures, fractions simples |

## Fonctionnement

- **Missions de 5 questions.** Jusqu'à 3 étoiles par mission selon les réussites du premier coup.
- **Erreurs :** à la première erreur, un indice s'affiche ; à la deuxième, la correction est expliquée. La notion revient en priorité dans les missions suivantes.
- **Niveaux 1 à 5**, calqués sur les 5 périodes de l'année (nombres jusqu'à 100, 200, 500 puis 1 000). Le niveau d'une planète monte après 3 missions réussies (au moins 4/5 du premier coup).
- **Récompenses :** étoiles, fusées à débloquer, trophées.
- **Lecture audio** des consignes (bouton 🔊, ou lecture automatique activable dans l'espace parents).
- **Espace parents** protégé par un code à 4 chiffres : réussite par notion, notions à revoir, historique, réglage des niveaux.
- **Pas de compte, pas de serveur :** la progression reste dans le navigateur de l'appareil. Elle n'est pas partagée entre le téléphone et le PC.
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
