export type PublishedSnapshot<TSite, TPage> = {
  site: TSite;
  pages: TPage[];
  publishedAt: string;
};

export function createPublishedSnapshot<TSite, TPage>(site: TSite, pages: TPage[], publishedAt: Date): PublishedSnapshot<TSite, TPage> {
  return {
    site,
    pages,
    publishedAt: publishedAt.toISOString(),
  };
}
