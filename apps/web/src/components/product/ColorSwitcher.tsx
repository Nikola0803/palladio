export interface ColorOption {
  value: string;
  slug: string;
  hex: string;
}

const COLOR_HEX: Record<string, string> = {
  "gold": "#D4AF37",
  "yellow gold": "#D4AF37",
  "žuto zlato": "#D4AF37",
  "rose gold": "#C47C5A",
  "ružičasto zlato": "#C47C5A",
  "pink gold": "#C47C5A",
  "white gold": "#D8D8D8",
  "bijelo zlato": "#D8D8D8",
  "silver": "#C0C0C0",
  "srebro": "#C0C0C0",
  "platinum": "#E5E4E2",
};

export function getColorHex(optionName: string): string {
  return COLOR_HEX[optionName.toLowerCase()] ?? "#888888";
}

export function isColorAttribute(name: string): boolean {
  const lc = name.toLowerCase();
  return ["color", "boja", "colour", "metal", "finish", "material"].some((kw) => lc.includes(kw));
}

export default function ColorSwitcher({
  attributeName,
  options,
  selected,
  onSelect,
}: {
  attributeName: string;
  options: ColorOption[];
  selected: string | null;
  onSelect: (slug: string) => void;
}) {
  return (
    <div className="mb-5">
      <p className="tracked-label text-xs mb-3">
        {attributeName}
        {selected && (
          <span className="ml-2 normal-case font-normal text-palladio-grey">
            — {options.find((o) => o.slug === selected)?.value}
          </span>
        )}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.slug}
            aria-label={opt.value}
            title={opt.value}
            onClick={() => onSelect(opt.slug)}
            className={`w-8 h-8 rounded-full border-2 transition-all ${
              selected === opt.slug
                ? "border-palladio-black scale-110"
                : "border-palladio-border hover:border-palladio-grey"
            }`}
            style={{ backgroundColor: opt.hex }}
          />
        ))}
      </div>
    </div>
  );
}
