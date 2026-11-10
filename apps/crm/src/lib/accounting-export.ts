import ExcelJS from "exceljs";
import { db } from "@/lib/db";
import {
  sirovine,
  kamenje,
  potrosniMaterijal,
  radniNalozi,
  gotoviProizvodi,
  inventura,
} from "@/lib/db/schema";

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF1D1A16" },
};
const HEADER_FONT = { color: { argb: "FFC9A24B" }, bold: true };

function styleHeaderRow(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
  });
}

/**
 * Rebuilds the accountant's workbook in the exact shape of the source
 * template (Sirovine / Kamenje / Potrošni materijal / Radni nalozi /
 * Gotovi proizvodi / Inventura) so nothing changes on the accounting side —
 * only the data is now generated from the CRM instead of typed by hand.
 */
export async function generateAccountingWorkbook(): Promise<ExcelJS.Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Zlatarnica CRM";
  workbook.created = new Date();

  // Sirovine
  const wsSirovine = workbook.addWorksheet("Sirovine");
  wsSirovine.columns = [
    { header: "Datum", key: "datum", width: 12 },
    { header: "Broj dokumenta", key: "brojDokumenta", width: 16 },
    { header: "Dobavljač", key: "dobavljac", width: 18 },
    { header: "Vrsta metala", key: "vrstaMetala", width: 12 },
    { header: "Čistoća", key: "cistoca", width: 10 },
    { header: "Količina (g)", key: "kolicinaG", width: 12 },
    { header: "Cijena/g (€)", key: "cijenaPoG", width: 12 },
    { header: "Ukupno (€)", key: "ukupno", width: 12 },
    { header: "Ulaz / Izlaz", key: "smjer", width: 12 },
    { header: "Napomena", key: "napomena", width: 24 },
  ];
  styleHeaderRow(wsSirovine.getRow(1));
  const sirovineRows = await db.select().from(sirovine);
  sirovineRows.forEach((r) =>
    wsSirovine.addRow({
      ...r,
      smjer: r.smjer === "ulaz" ? "Ulaz" : "Izlaz",
    })
  );

  // Kamenje
  const wsKamenje = workbook.addWorksheet("Kamenje");
  wsKamenje.columns = [
    { header: "Datum", key: "datum", width: 12 },
    { header: "Broj dokumenta", key: "brojDokumenta", width: 16 },
    { header: "Dobavljač", key: "dobavljac", width: 18 },
    { header: "Vrsta", key: "vrsta", width: 14 },
    { header: "Veličina / karat", key: "velicinaKarat", width: 14 },
    { header: "Količina (kom)", key: "kolicinaKom", width: 14 },
    { header: "Cijena/kom (€)", key: "cijenaPoKom", width: 14 },
    { header: "Ukupno (€)", key: "ukupno", width: 12 },
    { header: "Ulaz / Izlaz", key: "smjer", width: 12 },
    { header: "Napomena", key: "napomena", width: 24 },
  ];
  styleHeaderRow(wsKamenje.getRow(1));
  const kamenjeRows = await db.select().from(kamenje);
  kamenjeRows.forEach((r) =>
    wsKamenje.addRow({ ...r, smjer: r.smjer === "ulaz" ? "Ulaz" : "Izlaz" })
  );

  // Potrošni materijal
  const wsPotrosni = workbook.addWorksheet("Potrošni materijal");
  wsPotrosni.columns = [
    { header: "Datum", key: "datum", width: 12 },
    { header: "Broj dokumenta", key: "brojDokumenta", width: 16 },
    { header: "Dobavljač", key: "dobavljac", width: 18 },
    { header: "Naziv materijala", key: "nazivMaterijala", width: 22 },
    { header: "Jedinica", key: "jedinica", width: 10 },
    { header: "Količina", key: "kolicina", width: 10 },
    { header: "Cijena/jed (€)", key: "cijenaPoJed", width: 14 },
    { header: "Ukupno (€)", key: "ukupno", width: 12 },
    { header: "Ulaz / Izlaz", key: "smjer", width: 12 },
    { header: "Napomena", key: "napomena", width: 24 },
  ];
  styleHeaderRow(wsPotrosni.getRow(1));
  const potrosniRows = await db.select().from(potrosniMaterijal);
  potrosniRows.forEach((r) =>
    wsPotrosni.addRow({ ...r, smjer: r.smjer === "ulaz" ? "Ulaz" : "Izlaz" })
  );

  // Radni nalozi
  const wsNalozi = workbook.addWorksheet("Radni nalozi");
  wsNalozi.columns = [
    { header: "Broj naloga", key: "brojNaloga", width: 14 },
    { header: "Datum početka", key: "datumPocetka", width: 14 },
    { header: "Datum završetka", key: "datumZavrsetka", width: 14 },
    { header: "Opis proizvoda", key: "opisProizvoda", width: 24 },
    { header: "Metal (vrsta+čistoća)", key: "metal", width: 16 },
    { header: "Utrošeno (g)", key: "utrosenoG", width: 12 },
    { header: "Kamenje", key: "kamenjeOpis", width: 18 },
    { header: "Potrošni materijal", key: "potrosniMaterijalOpis", width: 18 },
    { header: "Otpad (g)", key: "otpadG", width: 10 },
    { header: "Težina gotovog (g)", key: "tezinaGotovogG", width: 16 },
    { header: "Šifra gotovog", key: "sifraGotovog", width: 14 },
    { header: "Napomena", key: "napomena", width: 24 },
  ];
  styleHeaderRow(wsNalozi.getRow(1));
  const naloziRows = await db.select().from(radniNalozi);
  naloziRows.forEach((r) => wsNalozi.addRow(r));

  // Gotovi proizvodi
  const wsGotovi = workbook.addWorksheet("Gotovi proizvodi");
  wsGotovi.columns = [
    { header: "Šifra / ID", key: "sifra", width: 12 },
    { header: "Opis", key: "opis", width: 24 },
    { header: "Metal + čistoća", key: "metalCistoca", width: 16 },
    { header: "Težina (g)", key: "tezinaG", width: 10 },
    { header: "Kamenje", key: "kamenjeOpis", width: 18 },
    { header: "Datum završetka", key: "datumZavrsetka", width: 14 },
    { header: "Nabavna vrijednost (€)", key: "nabavnaVrijednost", width: 18 },
    { header: "Status", key: "status", width: 14 },
    { header: "Datum prodaje", key: "datumProdaje", width: 14 },
    { header: "Broj računa", key: "brojRacuna", width: 14 },
    { header: "Napomena", key: "napomena", width: 24 },
  ];
  styleHeaderRow(wsGotovi.getRow(1));
  const gotoviRows = await db.select().from(gotoviProizvodi);
  const statusLabel: Record<string, string> = {
    na_zalihi: "Na zalihi",
    prodano: "Prodano",
    rezervirano: "Rezervirano",
  };
  gotoviRows.forEach((r) =>
    wsGotovi.addRow({
      sifra: r.sifra,
      opis: r.opis,
      metalCistoca: r.metalCistoca,
      tezinaG: r.tezinaG,
      kamenjeOpis: r.kamenjeOpis,
      datumZavrsetka: r.datumZavrsetka,
      nabavnaVrijednost: r.nabavnaVrijednost,
      status: statusLabel[r.status ?? "na_zalihi"],
      datumProdaje: r.datumProdaje,
      brojRacuna: r.brojRacuna,
      napomena: r.napomena,
    })
  );

  // Inventura
  const wsInventura = workbook.addWorksheet("Inventura");
  wsInventura.columns = [
    { header: "Vrsta", key: "vrsta", width: 16 },
    { header: "Opis / šifra", key: "opisSifra", width: 20 },
    { header: "Knjigovodstveno stanje", key: "knjigovodstvenoStanje", width: 18 },
    { header: "Stvarno izmjereno", key: "stvarnoIzmjereno", width: 16 },
    { header: "Razlika", key: "razlika", width: 10 },
    { header: "Jedinica", key: "jedinica", width: 10 },
    { header: "Napomena / odluka", key: "napomenaOdluka", width: 24 },
  ];
  styleHeaderRow(wsInventura.getRow(1));
  const inventuraRows = await db.select().from(inventura);
  inventuraRows.forEach((r) => wsInventura.addRow(r));

  return workbook.xlsx.writeBuffer();
}
