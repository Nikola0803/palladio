<?php
/**
 * palladio-slike-export.php — one-off image + manifest exporter.
 *
 * Drop this file in your WordPress web root (public_html) via cPanel File
 * Manager, then open it in the browser with your secret key:
 *
 *     https://palladio.hr/palladio-slike-export.php?key=PROMENI_OVO
 *
 * It runs ON the server (full access to files + the WordPress/WooCommerce DB),
 * so it needs NO tokens, NO Vercel and NO external DB string. It produces:
 *
 *   wp-content/uploads/_export/slike.zip      — every file under uploads/
 *   wp-content/uploads/_export/manifest.json  — product -> image files map
 *
 * and prints direct download links to both.
 *
 * SECURITY: set $SECRET below to something only you know. DELETE this file (and
 * the _export folder) from the server once you've downloaded the zip — it
 * exposes your catalog image list to anyone who has the link.
 */

$SECRET = "PROMENI_OVO"; // <-- change this before uploading

if (!isset($_GET["key"]) || !hash_equals($SECRET, (string) $_GET["key"])) {
    http_response_code(403);
    exit("Forbidden");
}

@set_time_limit(0);
@ini_set("memory_limit", "512M");
header("Content-Type: text/plain; charset=utf-8");

// Load WordPress so we can read products from its own DB.
$wpLoad = $_SERVER["DOCUMENT_ROOT"] . "/wp-load.php";
if (!file_exists($wpLoad)) {
    // Fallback: walk up from this file's directory to find wp-load.php.
    $dir = __DIR__;
    for ($i = 0; $i < 5 && !file_exists($dir . "/wp-load.php"); $i++) {
        $dir = dirname($dir);
    }
    $wpLoad = $dir . "/wp-load.php";
}
require_once $wpLoad;

$uploadsDir = wp_get_upload_dir()["basedir"];     // .../wp-content/uploads
$exportDir  = $uploadsDir . "/_export";
if (!is_dir($exportDir)) {
    wp_mkdir_p($exportDir);
}

/* ---------- 1) manifest: product -> images ---------- */
$products = get_posts([
    "post_type"      => "product",
    "post_status"    => "publish",
    "numberposts"    => -1,
    "fields"         => "ids",
    "suppress_filters" => false,
]);

$manifest = [];
foreach ($products as $pid) {
    $imageIds = [];
    $thumb = get_post_thumbnail_id($pid);
    if ($thumb) {
        $imageIds[] = $thumb;
    }
    $gallery = get_post_meta($pid, "_product_image_gallery", true);
    if ($gallery) {
        foreach (explode(",", $gallery) as $gid) {
            $gid = trim($gid);
            if ($gid !== "") {
                $imageIds[] = (int) $gid;
            }
        }
    }

    $images = [];
    foreach (array_unique($imageIds) as $iid) {
        $url = wp_get_attachment_url($iid);
        if (!$url) {
            continue;
        }
        $images[] = [
            "url"  => $url,
            // path relative to the uploads/ dir — matches what's inside the zip
            "file" => ltrim(str_replace($uploadsDir, "", get_attached_file($iid)), "/"),
        ];
    }

    $manifest[] = [
        "id"     => $pid,
        "sku"    => get_post_meta($pid, "_sku", true),
        "name"   => get_the_title($pid),
        "slug"   => get_post_field("post_name", $pid),
        "images" => $images,
    ];
}

$manifestPath = $exportDir . "/manifest.json";
file_put_contents($manifestPath, json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));

/* ---------- 2) zip of all uploads ---------- */
$zipPath = $exportDir . "/slike.zip";
@unlink($zipPath);

$zip = new ZipArchive();
if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
    exit("Ne mogu da napravim zip (ZipArchive nedostupan).");
}

$fileCount = 0;
$it = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($uploadsDir, FilesystemIterator::SKIP_DOTS)
);
foreach ($it as $file) {
    $full = $file->getPathname();
    // Don't zip our own export output.
    if (strpos($full, $exportDir) === 0) {
        continue;
    }
    if ($file->isFile()) {
        $rel = ltrim(str_replace($uploadsDir, "", $full), "/");
        $zip->addFile($full, $rel);
        $fileCount++;
    }
}
// Include the manifest inside the zip too.
$zip->addFile($manifestPath, "manifest.json");
$zip->close();

/* ---------- 3) links ---------- */
$baseUrl = wp_get_upload_dir()["baseurl"] . "/_export";
echo "GOTOVO\n\n";
echo "Proizvoda u manifestu: " . count($manifest) . "\n";
echo "Fajlova u zip-u:       " . $fileCount . "\n\n";
echo "ZIP:       " . $baseUrl . "/slike.zip\n";
echo "Manifest:  " . $baseUrl . "/manifest.json\n\n";
echo "Kad skineš: obriši ovaj .php fajl i /wp-content/uploads/_export/ folder.\n";
