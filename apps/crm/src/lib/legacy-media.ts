import { request } from "http";

const HOSTINGER_IP = "91.234.46.99";
const WORDPRESS_HOST = "palladio.hr";

/**
 * Read an old WordPress upload directly from the Hostinger virtual host.
 * Node's fetch does not reliably preserve a custom Host header on Vercel;
 * http.request does, which lets this keep working after the public domain
 * is pointed at the storefront.
 */
export function readLegacyUpload(uploadPath: string): Promise<{
  body: Buffer;
  contentType: string | undefined;
  status: number;
}> {
  const safePath = uploadPath
    .split("/")
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join("/");

  return new Promise((resolve, reject) => {
    const upstream = request(
      {
        hostname: HOSTINGER_IP,
        port: 80,
        method: "GET",
        path: `/wp-content/uploads/${safePath}`,
        headers: { Host: WORDPRESS_HOST },
      },
      (response) => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
        response.on("end", () =>
          resolve({
            body: Buffer.concat(chunks),
            contentType: Array.isArray(response.headers["content-type"])
              ? response.headers["content-type"][0]
              : response.headers["content-type"],
            status: response.statusCode || 502,
          })
        );
      }
    );
    upstream.on("error", reject);
    upstream.end();
  });
}
