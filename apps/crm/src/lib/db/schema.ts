import {
  pgTable, serial, text, integer, real, boolean, timestamp, jsonb,
} from "drizzle-orm/pg-core";

export const sirovine = pgTable("sirovine", {
  id: serial("id").primaryKey(),
  datum: text("datum").notNull(),
  brojDokumenta: text("broj_dokumenta"),
  dobavljac: text("dobavljac"),
  vrstaMetala: text("vrsta_metala").notNull(),
  cistoca: integer("cistoca").notNull(),
  kolicinaG: real("kolicina_g").notNull(),
  cijenaPoG: real("cijena_po_g"),
  ukupno: real("ukupno"),
  smjer: text("smjer").notNull(),
  napomena: text("napomena"),
  status: text("status").default("na_stanju"),
});

export const kamenje = pgTable("kamenje", {
  id: serial("id").primaryKey(),
  datum: text("datum").notNull(),
  brojDokumenta: text("broj_dokumenta"),
  dobavljac: text("dobavljac"),
  vrsta: text("vrsta").notNull(),
  velicinaKarat: text("velicina_karat"),
  kolicinaKom: real("kolicina_kom").notNull(),
  cijenaPoKom: real("cijena_po_kom"),
  ukupno: real("ukupno"),
  smjer: text("smjer").notNull(),
  napomena: text("napomena"),
  status: text("status").default("na_stanju"),
});

export const potrosniMaterijal = pgTable("potrosni_materijal", {
  id: serial("id").primaryKey(),
  datum: text("datum").notNull(),
  brojDokumenta: text("broj_dokumenta"),
  dobavljac: text("dobavljac"),
  nazivMaterijala: text("naziv_materijala").notNull(),
  jedinica: text("jedinica"),
  kolicina: real("kolicina").notNull(),
  cijenaPoJed: real("cijena_po_jed"),
  ukupno: real("ukupno"),
  smjer: text("smjer").notNull(),
  napomena: text("napomena"),
  status: text("status").default("na_stanju"),
});

export const radniNalozi = pgTable("radni_nalozi", {
  id: serial("id").primaryKey(),
  brojNaloga: text("broj_naloga").notNull().unique(),
  datumPocetka: text("datum_pocetka").notNull(),
  datumZavrsetka: text("datum_zavrsetka"),
  opisProizvoda: text("opis_proizvoda").notNull(),
  metal: text("metal"),
  utrosenoG: real("utroseno_g"),
  kamenjeOpis: text("kamenje_opis"),
  potrosniMaterijalOpis: text("potrosni_materijal_opis"),
  otpadG: real("otpad_g"),
  tezinaGotovogG: real("tezina_gotovog_g"),
  sifraGotovog: text("sifra_gotovog"),
  napomena: text("napomena"),
  status: text("status").default("u_izradi"),
  izvorNarudzbaId: integer("izvor_narudzba_id"),
  potrebniMaterijali: text("potrebni_materijali"),
});

export const gotoviProizvodi = pgTable("gotovi_proizvodi", {
  id: serial("id").primaryKey(),
  sifra: text("sifra").notNull().unique(),
  opis: text("opis").notNull(),
  metalCistoca: text("metal_cistoca"),
  tezinaG: real("tezina_g"),
  kamenjeOpis: text("kamenje_opis"),
  datumZavrsetka: text("datum_zavrsetka"),
  nabavnaVrijednost: real("nabavna_vrijednost"),
  prodajnaCijena: real("prodajna_cijena"),
  status: text("status").default("na_zalihi"),
  datumProdaje: text("datum_prodaje"),
  brojRacuna: text("broj_racuna"),
  napomena: text("napomena"),
  wooProductId: integer("woo_product_id"),
  wooSyncedAt: text("woo_synced_at"),
  wooSirovoJson: text("woo_sirovo_json"),
});

export const proizvodMaterijali = pgTable("proizvod_materijali", {
  id: serial("id").primaryKey(),
  proizvodId: integer("proizvod_id").notNull().references(() => gotoviProizvodi.id),
  tip: text("tip").notNull(),
  naziv: text("naziv").notNull(),
  potrebnaKolicina: real("potrebna_kolicina").notNull(),
  jedinica: text("jedinica").notNull(),
});

export const inventura = pgTable("inventura", {
  id: serial("id").primaryKey(),
  datumInventure: text("datum_inventure").notNull(),
  vrsta: text("vrsta").notNull(),
  opisSifra: text("opis_sifra").notNull(),
  knjigovodstvenoStanje: real("knjigovodstveno_stanje"),
  stvarnoIzmjereno: real("stvarno_izmjereno"),
  razlika: real("razlika"),
  jedinica: text("jedinica"),
  napomenaOdluka: text("napomena_odluka"),
});

export const kupci = pgTable("kupci", {
  id: serial("id").primaryKey(),
  wooCustomerId: integer("woo_customer_id").unique(),
  ime: text("ime").notNull(),
  email: text("email").notNull().unique(),
  telefon: text("telefon"),
  grad: text("grad"),
  ukupnoPotroseno: real("ukupno_potroseno").default(0),
  brojNarudzbi: integer("broj_narudzbi").default(0),
  prijavljenNaNewsletter: boolean("prijavljen_na_newsletter").default(false),
  napomena: text("napomena"),
  kreiran: text("kreiran"),
});

export const newsletterKampanje = pgTable("newsletter_kampanje", {
  id: serial("id").primaryKey(),
  naslov: text("naslov").notNull(),
  sadrzaj: text("sadrzaj"),
  status: text("status").default("nacrt"),
  datumSlanja: text("datum_slanja"),
  brojPrimatelja: integer("broj_primatelja"),
  brojOtvaranja: integer("broj_otvaranja"),
});

export const affiliatePartneri = pgTable("affiliate_partneri", {
  id: serial("id").primaryKey(),
  ime: text("ime").notNull(),
  email: text("email").notNull().unique(),
  kodZaPracenje: text("kod_za_pracenje").notNull().unique(),
  provizijaPosto: real("provizija_posto").default(10),
  status: text("status").notNull().default("na_cekanju"),
  ukupnoZaraceno: real("ukupno_zaraceno").default(0),
  brojNarudzbi: integer("broj_narudzbi").default(0),
  kreiran: text("kreiran"),
});

export const affiliateNarudzbe = pgTable("affiliate_narudzbe", {
  id: serial("id").primaryKey(),
  affiliateId: integer("affiliate_id").notNull().references(() => affiliatePartneri.id),
  wooOrderId: integer("woo_order_id").notNull(),
  iznosNarudzbe: real("iznos_narudzbe").notNull(),
  provizija: real("provizija").notNull(),
  datum: text("datum").notNull(),
});

export const upiti = pgTable("upiti", {
  id: serial("id").primaryKey(),
  ime: text("ime").notNull(),
  email: text("email").notNull(),
  telefon: text("telefon"),
  poruka: text("poruka"),
  izvor: text("izvor").default("kontakt_forma"),
  status: text("status").default("novo"),
  kreiran: text("kreiran").notNull(),
});

export const narudzbe = pgTable("narudzbe", {
  id: serial("id").primaryKey(),
  wooOrderId: integer("woo_order_id").notNull().unique(),
  kupacIme: text("kupac_ime"),
  kupacEmail: text("kupac_email"),
  iznos: real("iznos").notNull(),
  status: text("status").notNull(),
  datum: text("datum").notNull(),
  napomena: text("napomena"),
});

export const narudzbaStavke = pgTable("narudzba_stavke", {
  id: serial("id").primaryKey(),
  narudzbaId: integer("narudzba_id").notNull().references(() => narudzbe.id),
  wooProductId: integer("woo_product_id"),
  proizvodId: integer("proizvod_id").references(() => gotoviProizvodi.id),
  naziv: text("naziv").notNull(),
  kolicina: integer("kolicina").notNull(),
});

export const dolazneFakture = pgTable("dolazne_fakture", {
  id: serial("id").primaryKey(),
  brojFakture: text("broj_fakture").notNull(),
  dobavljac: text("dobavljac").notNull(),
  kategorija: text("kategorija").notNull(),
  iznos: real("iznos").notNull(),
  valuta: text("valuta").default("EUR"),
  datumIzdavanja: text("datum_izdavanja").notNull(),
  rokPlacanja: text("rok_placanja").notNull(),
  status: text("status").default("neplaceno"),
  datumPlacanja: text("datum_placanja"),
  napomena: text("napomena"),
});

export const obaveze = pgTable("obaveze", {
  id: serial("id").primaryKey(),
  naslov: text("naslov").notNull(),
  opis: text("opis"),
  datum: text("datum").notNull(),
  tip: text("tip").default("ostalo"),
  povezanaFakturaId: integer("povezana_faktura_id").references(() => dolazneFakture.id),
  zavrseno: boolean("zavrseno").default(false),
});

export const postavke = pgTable("postavke", {
  kljuc: text("kljuc").primaryKey(),
  vrijednost: text("vrijednost").notNull(),
  azurirano: text("azurirano").notNull(),
});

export const dnevnikZapisi = pgTable("dnevnik_zapisi", {
  id: serial("id").primaryKey(),
  datum: text("datum").notNull().unique(),
  sadrzaj: text("sadrzaj").notNull(),
  azuriran: text("azuriran").notNull(),
});

export const cijenaZlataPovijest = pgTable("cijena_zlata_povijest", {
  id: serial("id").primaryKey(),
  vrijeme: text("vrijeme").notNull(),
  cijenaEurPoUnci: real("cijena_eur_po_unci").notNull(),
  cijenaEurPoGramu925: real("cijena_eur_po_gramu_925"),
  cijenaEurPoGramu750: real("cijena_eur_po_gramu_750"),
  cijenaEurPoGramu585: real("cijena_eur_po_gramu_585"),
});

/* ── PAYMENT LINKS — migracija iz WordPress PHP plugin-a ── */
export const paymentLinks = pgTable("payment_links", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  kupacId: integer("kupac_id").references(() => kupci.id),
  kupacIme: text("kupac_ime"),
  opis: text("opis"),
  iznos: real("iznos").notNull(),
  valuta: text("valuta").default("EUR"),
  status: text("status").notNull().default("aktivan"),
  heroImage: text("hero_image"),
  napomena: text("napomena"),
  kreirano: timestamp("kreirano").defaultNow(),
  azurirano: timestamp("azurirano").defaultNow(),
  placenoAt: timestamp("placeno_at"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
});

/* ── BLOG POSTS — journal objave ── */
export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt"),
  content: text("content"),
  featuredImage: text("featured_image"),
  authorName: text("author_name").default("Palladio"),
  published: boolean("published").notNull().default(false),
  publishedAt: timestamp("published_at"),
  kreirano: timestamp("kreirano").defaultNow(),
  azurirano: timestamp("azurirano").defaultNow(),
});

/* ── CRM USERS — vlastiti korisnici, nema veze s WP ── */
export const crmUsers = pgTable("crm_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  ime: text("ime"),
  uloga: text("uloga").notNull().default("admin"),
  aktivan: boolean("aktivan").notNull().default(true),
  kreiran: timestamp("kreiran").defaultNow(),
  zadnjiLogin: timestamp("zadnji_login"),
});

/* ── PRODUCTS — uvezeni iz WooCommerce ── */
export const products = pgTable("products", {
  id: integer("id").primaryKey(),
  type: text("type").notNull().default("simple"),
  sku: text("sku"),
  name: text("name").notNull(),
  slug: text("slug"),
  published: boolean("published").default(true),
  shortDescription: text("short_description"),
  description: text("description"),
  regularPrice: real("regular_price"),
  salePrice: real("sale_price"),
  categories: text("categories"),
  tags: text("tags"),
  images: text("images"),
  parentId: integer("parent_id"),
  attributes: jsonb("attributes"),
  metalPurity: text("metal_purity"),
  totalWeight: text("total_weight"),
  position: integer("position").default(0),
  kreirano: timestamp("kreirano").defaultNow(),
});
