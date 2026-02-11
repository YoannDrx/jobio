import Stripe from "stripe";

const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  // eslint-disable-next-line no-console
  console.error("STRIPE_SECRET_KEY environment variable is not set");
  process.exit(1);
}

const stripe = new Stripe(stripeKey, { typescript: true });

async function main() {
  const programs = [
    { name: "Attirer des clients", slug: "attirer-clients" },
    { name: "Développer ton personal branding", slug: "personal-branding" },
    { name: "Exploser ta croissance LinkedIn", slug: "exploser-croissance" },
  ];

  const results = await Promise.all(
    programs.map(async (p) => {
      const product = await stripe.products.create({
        name: `LinkedIn Program: ${p.name}`,
        metadata: { slug: p.slug, type: "linkedin_program" },
      });

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: 3900,
        currency: "eur",
      });

      return `${p.slug}: product=${product.id} price=${price.id}`;
    }),
  );

  // eslint-disable-next-line no-console
  results.forEach((result) => console.log(result));
}

// eslint-disable-next-line no-console
main().catch(console.error);
