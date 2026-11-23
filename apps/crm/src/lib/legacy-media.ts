import { request } from "https";

const HOSTINGER_IP = "91.234.46.99";
const WORDPRESS_HOST = "palladio.hr";

/**
 * Read an old WordPress upload directly from the Hostinger virtual host.
 * The public domain now resolves to Vercel, so the request uses the original
 * TLS host name with a pinned DNS lookup to the Hostinger origin. This keeps
 * SNI/Host correct without relying on a custom Host header being forwarded.
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
        hostname: WORDPRESS_HOST,
        port: 443,
        method: "GET",
        path: `/wp-content/uploads/${safePath}`,
        servername: WORDPRESS_HOST,
        lookup: (_hostname, options, callback) => {
          // Modern Node requests with `all: true`; in that mode the callback
          // must receive an address array rather than a single address.
          if (options.all) return callback(null, [{ address: HOSTINGER_IP, family: 4 }]);
          return callback(null, HOSTINGER_IP, 4);
        },
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
