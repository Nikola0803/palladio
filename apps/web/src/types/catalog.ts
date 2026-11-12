export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  count: number;
  image: string | null;
  parent: number;
}

export interface ProductImage {
  id: number;
  src: string;
  alt: string;
}

export interface ProductCategoryRef {
  id: number;
  name: string;
  slug: string;
}

export interface ProductAttribute {
  name: string;
  value: string;
  options?: string[];
}

export interface StoreAttributeTerm {
  id: number;
  name: string;
  slug: string;
}

export interface StoreProductAttribute {
  id: number;
  name: string;
  taxonomy: string;
  has_variations: boolean;
  terms: StoreAttributeTerm[];
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  stock_status: "instock" | "outofstock" | "onbackorder";
  short_description: string;
  description?: string;
  type?: string;
  attributes?: ProductAttribute[];
  images: ProductImage[];
  categories: ProductCategoryRef[];
}

export interface ProductListResponse {
  items: Product[];
  total: number;
  page: number;
  per_page: number;
}
