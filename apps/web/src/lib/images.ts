// WooCommerce serves "-1024x1024" style thumbnails; drop the suffix for the original.
export const fullSize = (url?: string | null) => url?.replace(/-\d+x\d+(?=\.\w+$)/, "");
