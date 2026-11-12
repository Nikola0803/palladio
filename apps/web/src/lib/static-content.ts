export interface StaticSection {
  heading?: string;
  body: string;
}

export interface StaticContent {
  title: string;
  intro?: string;
  sections: StaticSection[];
}

// Fallback copy used when no WordPress page with the same slug exists.
// Create a WP page with the matching slug (key below) and it takes over.
export const STATIC_CONTENT: Record<string, StaticContent> = {
  about: {
    title: "Our Story",
    intro: "Palladio makes jewellery to order: chains, grillz, pendants and rings, built around the person wearing them.",
    sections: [
      {
        heading: "Made to order",
        body: "Every piece starts as a request, not a stock item. We cast, set and finish each one by hand, in the metal and stones you choose.",
      },
      {
        heading: "Gold and silver, one standard",
        body: "Solid gold and sterling silver are held to the same standard of finish, fit and durability.",
      },
      {
        heading: "Work with us",
        body: "Have a design in mind or want to adapt an existing piece? Get in touch and we will take it from there.",
      },
    ],
  },
  faq: {
    title: "FAQ",
    sections: [
      { heading: "How long does an order take?", body: "Pieces are made to order and ship within 5 to 10 business days." },
      { heading: "Can I request a custom design?", body: "Yes. Use the Contact page and choose Custom Order / Design Request." },
      { heading: "Which metals do you work with?", body: "Yellow gold, white gold, rose gold and sterling silver, depending on the piece." },
      { heading: "How do I find my size?", body: "Contact us with your measurements or a reference piece and we will confirm the right fit before we start." },
      { heading: "Can I return or exchange an item?", body: "Contact us within 14 days of delivery. Made-to-order and personalised pieces are assessed case by case." },
    ],
  },
  "shipping-returns": {
    title: "Shipping & Returns",
    sections: [
      { heading: "Shipping", body: "Orders are made to order and ship within 5 to 10 business days. Free shipping on orders over €150." },
      { heading: "Returns", body: "Contact us within 14 days of delivery to arrange a return or exchange. Items must be unworn and in their original packaging." },
      { heading: "Damaged or incorrect items", body: "If something arrives damaged or not as ordered, contact us right away and we will put it right." },
    ],
  },
  services: {
    title: "Services",
    intro: "Beyond the collection, we can help with:",
    sections: [
      { heading: "Custom design", body: "Bring us an idea or a reference and we will design and make it." },
      { heading: "Resizing and repairs", body: "Adjustments and repairs to Palladio pieces. Contact us to arrange." },
      { heading: "Engagement and wedding", body: "Rings made to order, from first sketch to final polish." },
    ],
  },
  "store-locator": {
    title: "Find a Store",
    intro: "Palladio is available online. To see pieces in person or arrange a fitting, contact us and we will arrange a time.",
    sections: [],
  },
  "privacy-policy": {
    title: "Privacy Policy",
    sections: [
      { heading: "What we collect", body: "Details you give us when you order or contact us: name, email, phone, delivery address and order history." },
      { heading: "How we use it", body: "To fulfil orders, reply to enquiries and, if you opt in, send newsletters. We do not sell your data." },
      { heading: "Your rights", body: "You can ask to access, correct or delete your data at any time by contacting us." },
    ],
  },
  "cookies-policy": {
    title: "Cookies Policy",
    sections: [
      { heading: "Cookies", body: "We use cookies that are needed for the shopping bag and checkout to work, and to understand how the site is used." },
    ],
  },
  "terms-of-use": {
    title: "Terms of Use",
    sections: [
      { heading: "Using this site", body: "By using this site you agree to these terms. Content and images are the property of Palladio." },
      { heading: "Orders", body: "Orders are confirmed once payment is received. Made-to-order lead times are estimates." },
    ],
  },
  newsletter: {
    title: "Newsletter",
    intro: "Subscribe using the form at the bottom of any page to hear about new pieces and launches.",
    sections: [],
  },
  "cad-design": {
    title: "CAD Design",
    intro: "We design every custom piece digitally before it's cast, so you can see and approve the exact form before production begins.",
    sections: [
      {
        heading: "What is CAD design?",
        body: "Computer-aided design (CAD) lets us build a precise 3D model of your piece — exact dimensions, stone placement and metal weight — before a single gram of gold is used.",
      },
      {
        heading: "How the process works",
        body: "You share your reference or idea. We produce a CAD render for your review. Once approved, we move to casting and finishing. Changes at the render stage cost nothing.",
      },
      {
        heading: "Request a CAD consultation",
        body: "Get in touch through the Contact page, choose Custom Order / Design Request, and describe what you have in mind. We'll come back with a timeline and quote.",
      },
    ],
  },
};
