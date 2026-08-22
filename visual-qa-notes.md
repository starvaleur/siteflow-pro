# Vérification visuelle — itération principale

Les captures desktop du 22 août 2026 confirment que le tableau de bord et la bibliothèque ne présentent plus la page exemple du starter. Le tableau de bord conserve un rail de travail, une hiérarchie éditoriale, une action primaire de création et un état vide explicite. La bibliothèque applique la même identité aux dix familles de templates, avec des aperçus visuels originaux cohérents.

| Écran | Vérifications observées | État |
| --- | --- | --- |
| `/` | Navigation persistante, marque SiteFlow Pro, recherche, filtres et état vide accessible | Conforme au style de référence |
| `/templates` | Dix templates, filtres de catégorie, recherche, actions Voir et Utiliser | Conforme au style de référence |

Les miniatures utilisées sont des actifs générés pour SiteFlow Pro ; leur chargement est visible dans les cartes. La prochaine vérification couvre l’éditeur, les vues mobiles et la compilation de production.

Les captures supplémentaires ont validé le preview complet d’un template, la page Analytics et le centre de ressources. La structure de l’aperçu met correctement en évidence le renderer unique (navigation, hero, cartes, visuel et footer). La page Analytics a révélé un graphe de trafic non visible ; les barres ont été rendues explicites avec une hauteur de conteneur et une couleur en style direct avant la validation suivante.

La vérification mobile a confirmé que les cartes Analytics sont lisibles et que les barres de trafic sont désormais visibles. Elle a également montré que la navigation et les titres du template avaient besoin de valeurs compactes par défaut ; le renderer applique désormais des valeurs spécifiques au mobile lorsque le projet ne possède pas encore de surcharge manuelle, tout en laissant les styles Desktop intacts.

Le contrôle explicite du journal navigateur ne remonte aucune erreur récente après les captures finales ; les seules lignes récentes sont les connexions de développement et une information React DevTools. Une vérification intégrée temporaire a exercé le parcours persistant de création, modification, publication, rendu public et restauration, puis a supprimé le site de contrôle. Le test de ces mêmes gestes par clic dans le navigateur demande néanmoins une session OAuth dans le navigateur d’automatisation, qui présente actuellement l’écran de connexion.

Une validation additionnelle a ensuite créé un projet Nexus temporaire via les procédures métier, affiché les routes `/editor/:id` et `/preview/:id` dans la prévisualisation authentifiée, publié le même projet puis affiché `/s/:slug`. Cette séquence confirme que l’éditeur, l’aperçu et le rendu public utilisent un jeu de données cohérent. Le projet temporaire a ensuite été supprimé. Enfin, l’état public « non disponible » a été contrôlé après suppression de la journalisation globale des erreurs tRPC : aucune erreur de console nouvelle n’est apparue après le correctif.

Le contrôle final a utilisé une session locale de test limitée dans le temps et un navigateur Chromium isolé. Il a réellement effectué les actions de création d’un site, sélection du template Nexus, édition d’un titre, autosauvegarde, rechargement avec conservation du texte, ouverture de l’aperçu, publication via checklist et chargement de la page publique. L’instrumentation de la console dans cette session n’a relevé aucune erreur. Le site de test, le jeton et les scripts temporaires ont été supprimés immédiatement après la vérification.

Le contrôle mobile séparé a utilisé le même principe avec un viewport de 390 × 844 px. Il a vérifié l’authentification, la création d’un site, la présence de la barre basse de l’éditeur (Ajouter, Pages, Calques, Design, Assets et Plus), l’ouverture de l’aperçu mobile et une console sans erreur. Ses données de test et artefacts de validation ont également été nettoyés.
