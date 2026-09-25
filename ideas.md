# Direction de conception — SiteFlow Pro

## Référence de vérité

Le projet Stitch fourni est la **référence UI/UX de vérité**. Les maquettes observées établissent un environnement applicatif clair et professionnel : fond blanc chaud, traits bleu indigo précis, panneaux latéraux structurés, typographie d’affichage éditoriale pour les éléments de marque et interfaces de travail aérées. L’application à construire transforme cette direction en produit réellement interactif, et non en succession de captures statiques.

> Références examinées : `professional_dashboard_my_sites` et `project_editor_main_workspace`.

## Approche retenue — Atelier de précision

### Mouvement de design

Une synthèse de **l’édition numérique contemporaine** et du **logiciel de conception professionnel** : une interface calme, nette et méthodique, où l’indigo signale les gestes de création plutôt que de décorer la surface.

### Principes directeurs

1. Les zones fonctionnelles sont lisibles au premier regard : navigation verticale, panneau d’outils, canevas, inspecteur.
2. Chaque action de création possède un état visible : sélection indigo, aperçu de contenu, retour par notification, statut de sauvegarde.
3. Le canevas conserve une sensation de surface physique grâce au fond pointillé, au cadre document et aux commandes de zoom.
4. Les données partagent une même structure : les templates, le canevas et l’aperçu public rendent le même arbre de pages et d’éléments.

### Philosophie de couleur

Un blanc cassé `#F7F7FB` laisse respirer les contenus. Le bleu encre `#2925D8` est la couleur propriétaire de SiteFlow Pro : il matérialise sélection, publication, écran actif et objets manipulables. Le bleu nuit `#10152B` ancre les titres et les CTA. Les gris lilas restent réservés aux limites fonctionnelles, jamais aux contenus essentiels.

### Paradigme de mise en page

Une **table de montage** plutôt qu’un tableau de bord générique : rail d’outils à gauche, panneaux contextuels, canevas central non centré dans l’écran mais dominant, puis inspecteur de propriétés à droite. Les vues de gestion adoptent le même rail et des cartes documentaires denses.

### Éléments signatures

1. Une grille de points discrète derrière le canevas.
2. Des cadres de sélection indigo avec poignées circulaires et étiquette d’objet.
3. La marque “SiteFlow Pro” en sérif éditorial bleu indigo, accompagnée d’un monogramme en losange.

### Philosophie d’interaction

Les interactions sont directes : cliquer sélectionne, les commandes contextuelles apparaissent près de l’objet, et l’inspecteur modifie la donnée sélectionnée en temps réel. Les actions de produit utilisent des panneaux ou modales courts afin de préserver le contexte.

### Animation

Les panneaux, menus et modales entrent en moins de 250 ms avec `cubic-bezier(0.23, 1, 0.32, 1)`. Les cartes et composants réagissent avec une montée très légère et une ombre fine. Les commandes fréquentes restent instantanées. La réduction de mouvement est respectée.

### Système typographique

`DM Serif Display` porte le mot-symbole et les titres éditoriaux du contenu construit. `Plus Jakarta Sans` structure les commandes, libellés, métriques et interfaces. Les libellés de navigation sont courts, semi-gras et espacés ; les textes de propriétés restent compacts.

### Essence de marque

**SiteFlow Pro est l’atelier no-code des équipes qui veulent composer et publier des sites exigeants sans perdre la maîtrise du détail.**

Personnalité : **méthodique, créative, précise**.

### Voix de marque

Une voix sûre, utile et concrète ; elle décrit l’action et son bénéfice sans promesse générique.

> « Composez une présence qui tient la route. »

> « Un site publié, sans compromis sur le détail. »

### Mot-symbole et logo

Le mot-symbole compose `SiteFlow` en bleu encre avec `Pro` en bleu indigo, en sérif éditorial. Le symbole est un losange segmenté : deux chemins qui se rencontrent pour évoquer construction et flux. L’icône conserve une lisibilité pleine à 24 px.

### Décision de conception

Les décisions d’implémentation doivent renforcer l’idée d’un **atelier de précision** : ne pas diluer l’interface avec des gradients décoratifs, des rayons excessifs ou une esthétique SaaS générique.
