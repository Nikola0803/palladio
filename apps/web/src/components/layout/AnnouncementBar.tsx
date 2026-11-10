import { useEffect, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from "../ui/icons";

/**
 * Slim rotating announcement strip above the header — matches the taupe
 * carousel bar seen on the Bulgari reference (free shipping / promo /
 * store info messages, auto-rotating with manual prev/next + dismiss).
 * No CMS-backed source for these yet, so the messages are simple, honest
 * Palladio-relevant copy rather than fabricated claims (no fake promo %,
 * no fake "as seen in" claims).
 */
const MESSAGES = [
  "Free shipping on all orders over €150",
  "Custom pieces made to order — chains, grillz, pendants & more",
  "Questions about sizing or materials? Contact us anytime",
];

export default function AnnouncementBar() {
  const [index, setIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed || MESSAGES.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % MESSAGES.length);
    }, 5000);
    return () => clearInterval(id);
  }, [dismissed]);

  if (dismissed) return null;

  const prev = () => setIndex((i) => (i - 1 + MESSAGES.length) % MESSAGES.length);
  const next = () => setIndex((i) => (i + 1) % MESSAGES.length);

  return (
    <div className="relative flex items-center justify-center bg-[#efe9e1] text-palladio-black text-xs tracking-wide px-10 py-2">
      {MESSAGES.length > 1 && (
        <button
          aria-label="Previous message"
          onClick={prev}
          className="absolute left-3 md:left-6 flex items-center justify-center opacity-70 hover:opacity-100"
        >
          <ChevronLeftIcon className="w-3.5 h-3.5" />
        </button>
      )}

      <span className="text-center px-2">{MESSAGES[index]}</span>

      {MESSAGES.length > 1 && (
        <button
          aria-label="Next message"
          onClick={next}
          className="absolute right-9 md:right-12 flex items-center justify-center opacity-70 hover:opacity-100"
        >
          <ChevronRightIcon className="w-3.5 h-3.5" />
        </button>
      )}

      <button
        aria-label="Dismiss announcement"
        onClick={() => setDismissed(true)}
        className="absolute right-3 md:right-6 flex items-center justify-center opacity-70 hover:opacity-100"
      >
        <CloseIcon className="w-3 h-3" />
      </button>
    </div>
  );
}
