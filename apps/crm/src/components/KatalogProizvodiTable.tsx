import { products } from "@/lib/db/schema";

type KatalogProizvod = typeof products.$inferSelect;

function firstImage(images: string | null) {
  try {
    const value = images ? JSON.parse(images) : [];
    const url = Array.isArray(value) ? value.find((image) => typeof image === "string") : null;
    const match = url?.match(/\/wp-content\/uploads\/(.+)$/i);
    return match ? `/api/wp-image?path=${encodeURIComponent(match[1])}` : url || null;
  } catch {
    return null;
  }
}

export default function KatalogProizvodiTable({ proizvodi }: { proizvodi: KatalogProizvod[] }) {
  return (
    <div className="rounded-md border border-ink-700 bg-ink-800 shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] text-sm">
          <thead>
            <tr className="text-left text-ink-400 text-xs uppercase tracking-wide">
              <th className="px-5 py-3 font-normal w-20">Slika</th>
              <th className="px-5 py-3 font-normal">Proizvod</th>
              <th className="px-5 py-3 font-normal">Kategorije</th>
              <th className="px-5 py-3 font-normal">Cijena</th>
              <th className="px-5 py-3 font-normal">Status</th>
            </tr>
          </thead>
          <tbody>
            {proizvodi.map((proizvod) => {
              const image = firstImage(proizvod.images);
              const price = proizvod.salePrice || proizvod.regularPrice;
              return (
                <tr key={proizvod.id} className="border-t border-ink-700">
                  <td className="px-5 py-3">
                    {image ? <img src={image} alt="" className="h-12 w-12 rounded object-cover bg-ink-900" /> : <span className="text-ink-400">—</span>}
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-ink-100">{proizvod.name}</p>
                    <p className="text-xs text-ink-400 mt-0.5">{proizvod.sku || proizvod.slug || `#${proizvod.id}`}</p>
                  </td>
                  <td className="px-5 py-3 text-ink-400">{proizvod.categories || "—"}</td>
                  <td className="px-5 py-3 text-ink-100">{price ? `€${price.toFixed(2)}` : "—"}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-stamp border ${proizvod.published ? "border-moss/40 text-moss bg-moss/10" : "border-silver/40 text-silver"}`}>
                      {proizvod.published ? "Objavljeno" : "Skriveno"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
