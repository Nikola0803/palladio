import PagePlaceholder from "@/components/PagePlaceholder";
import { Users } from "lucide-react";

export default function KupciPage() {
  return (
    <PagePlaceholder
      title="Kupci"
      description="Popis kupaca s WooCommerce narudžbama i vrijednosti kupca"
      icon={Users}
      nextSteps={[
        "Webhook na customer_created / order_completed puni tablicu kupci automatski",
        "Detalj kupca: povijest narudžbi, ukupno potrošeno, status prijave na newsletter",
        "Filter i izvoz liste za ciljane kampanje",
      ]}
    />
  );
}
