# Modèle de données canonique — SiteFlow Pro

| Entité | Responsabilité | Données structurantes |
| --- | --- | --- |
| `workspace` | Périmètre de propriété et d’autorisation | `ownerId`, `name`, `slug` |
| `site` | Projet publiable dans un espace | `workspaceId`, `name`, `slug`, `status`, `theme`, `publishedAt` |
| `page` | Document rendu par le site | `siteId`, `name`, `slug`, `isHomepage`, `settings`, `elementTree`, `sortOrder` |
| `elementTree` | Source de vérité de l’éditeur et du rendu | nœuds normalisés avec `id`, `type`, `props`, `styles`, `responsive`, `children` |
| `asset` | Fichier réutilisable d’un espace | `workspaceId`, `name`, `kind`, `url`, `metadata` |
| `collection` / `item` | Contenu CMS structuré | `siteId`, `schema`, `values`, `slug` |
| `form` / `submission` | Formulaires et réponses | `siteId`, `fields`, `values`, `submittedAt` |
| `siteVersion` | Jalons restaurables | `siteId`, `snapshot`, `description`, `createdAt` |

> Les templates sont des objets `SiteBlueprint` qui produisent exactement le même tableau de pages et le même arbre d’éléments que les sites créés par les utilisateurs. L’éditeur et le renderer public ne connaissent donc aucun format de template spécial.

## Nœud d’élément normalisé

```ts
type ElementNode = {
  id: string;
  type: 'section' | 'heading' | 'text' | 'button' | 'image' | 'card' | 'navbar' | 'footer' | 'form' | 'grid' | 'divider';
  name: string;
  visible: boolean;
  locked: boolean;
  props: Record<string, unknown>;
  styles: Record<string, string | number>;
  responsive: { tablet?: Record<string, unknown>; mobile?: Record<string, unknown> };
  children: ElementNode[];
};
```

## Parcours prioritaire

1. Le tableau de bord crée un site vide ou à partir d’un `SiteBlueprint`.
2. Le site est créé dans le workspace actif et reçoit ses `pages` et leurs `elementTree`.
3. L’éditeur modifie un nœud identifié ; l’autosauvegarde persiste le document entier ou une mutation ciblée.
4. Le renderer public prend `page.elementTree` et le rend sans condition de démonstration.
5. La publication enregistre un snapshot de version et rend la même URL interne accessible.

