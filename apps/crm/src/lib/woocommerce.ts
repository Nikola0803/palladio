type WooKredencijali = {
  siteUrl: string;
  consumerKey: string;
  consumerSecret: string;
};

async function wooFetch(
  { siteUrl, consumerKey, consumerSecret }: WooKredencijali,
  putanja: string
) {
  const url = new URL(
    `${siteUrl.replace(/\/$/, "")}/wp-json/wc/v3/${putanja}`
  );
  url.searchParams.set("consumer_key", consumerKey);
  url.searchParams.set("consumer_secret", consumerSecret);

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    const tijelo = await res.text();
    throw new Error(`WooCommerce API ${res.status}: ${tijelo.slice(0, 200)}`);
  }

  return res.json();
}

export async function wooDohvatiProizvode(kred: WooKredencijali, perPage = 20) {
  return wooFetch(kred, `products?per_page=${perPage}&status=publish`);
}

export async function wooDohvatiNarudzbe(kred: WooKredencijali, perPage = 20) {
  return wooFetch(kred, `orders?per_page=${perPage}`);
}

export async function wooDohvatiKupce(kred: WooKredencijali, perPage = 20) {
  return wooFetch(kred, `customers?per_page=${perPage}`);
}
