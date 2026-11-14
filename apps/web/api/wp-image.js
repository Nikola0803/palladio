/**
 * Proxy for WordPress media files still on Hostinger (91.234.46.99).
 * Apache there uses name-based vhosts, so we must send Host: palladio.hr.
 * Usage: GET /api/wp-image?path=2023/08/image.jpg
 */

const HOSTINGER_IP = "91.234.46.99";
const WORDPRESS_HOST = "palladio.hr";

export default async function handler(req, res) {
  const rawPath = Array.isArray(req.query.path)
    ? req.query.path.join("/")
    : req.query.path || "";

  // Block path traversal
  if (!rawPath || rawPath.includes("..")) {
    res.status(400).end();
    return;
  }

  const url = `http://${HOSTINGER_IP}/wp-content/uploads/${rawPath}`;

  try {
    const upstream = await fetch(url, {
      headers: { Host: WORDPRESS_HOST },
    });

    if (!upstream.ok) {
      res.status(upstream.status).end();
      return;
    }

    const ct = upstream.headers.get("Content-Type") || "application/octet-stream";
    res.setHeader("Content-Type", ct);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader("Access-Control-Allow-Origin", "*");

    const buf = Buffer.from(await upstream.arrayBuffer());
    res.status(200).end(buf);
  } catch {
    res.status(502).end();
  }
}
