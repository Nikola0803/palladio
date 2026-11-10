export interface BlogPost {
  id: number;
  slug: string;
  date: string;
  title: string;
  excerpt: string;
  content?: string;
  featuredImage: string | null;
  authorName: string | null;
}
