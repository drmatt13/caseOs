import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Stripe from "stripe";
import {
  catalog,
  toStripePriceMetadata,
  toStripeProductMetadata,
  type CatalogPrice,
  type CatalogProduct,
} from "@repo/billing-catalog";

type Mode = "dry-run" | "apply";
type Metadata = Record<string, string>;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(packageRoot, "..");
const envPath = path.join(repoRoot, "cdk-app", ".env");

function parseArgs(argv: string[]): Mode {
  const dryRun = argv.includes("--dry-run");
  const apply = argv.includes("--apply");
  const help = argv.includes("--help") || argv.includes("-h");

  if (help) {
    printUsage();
    process.exit(0);
  }

  if (dryRun === apply) {
    printUsage();
    throw new Error("Pass exactly one of --dry-run or --apply.");
  }

  return apply ? "apply" : "dry-run";
}

function printUsage() {
  console.log("Usage:");
  console.log("  npm run dry-run --workspace stripe-catalog-sync");
  console.log("  npm run apply --workspace stripe-catalog-sync");
}

function parseDotEnv(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing env file: ${filePath}`);
  }

  const values: Record<string, string> = {};
  const file = fs.readFileSync(filePath, "utf8");

  for (const line of file.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
}

function getStripeSecretKey() {
  const env = parseDotEnv(envPath);
  const secretKey = env.STRIPE_SECRET_KEY?.trim();

  if (!secretKey) {
    throw new Error(`STRIPE_SECRET_KEY is missing from ${envPath}`);
  }

  if (!secretKey.startsWith("sk_test_") && !secretKey.startsWith("rk_test_")) {
    throw new Error("Refusing to run against a non-test Stripe key.");
  }

  return secretKey;
}

function metadataDiff(
  current: Stripe.Metadata | null | undefined,
  desired: Metadata,
) {
  const changedKeys = Object.keys(desired).filter(
    (key) => current?.[key] !== desired[key],
  );

  return {
    changedKeys,
    hasChanges: changedKeys.length > 0,
  };
}

function productNeedsUpdate(product: Stripe.Product, desired: CatalogProduct) {
  const metadata = metadataDiff(product.metadata, toStripeProductMetadata(desired));
  const changes = [
    product.name !== desired.name ? "name" : null,
    product.description !== desired.description ? "description" : null,
    !product.active ? "active" : null,
    ...metadata.changedKeys.map((key) => `metadata.${key}`),
  ].filter((change): change is string => Boolean(change));

  return {
    changes,
    hasChanges: changes.length > 0,
  };
}

function getProductIdFromPrice(price: Stripe.Price) {
  return typeof price.product === "string" ? price.product : price.product.id;
}

function priceMatches(
  price: Stripe.Price,
  desired: CatalogPrice,
  productId: string,
) {
  return (
    price.active &&
    getProductIdFromPrice(price) === productId &&
    price.unit_amount === desired.unitAmount &&
    price.currency === desired.currency &&
    price.recurring?.interval === desired.interval
  );
}

async function listAllProducts(stripe: Stripe) {
  const products: Stripe.Product[] = [];
  let startingAfter: string | undefined;

  do {
    const page = await stripe.products.list({
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });

    products.push(...page.data);
    startingAfter = page.has_more ? page.data.at(-1)?.id : undefined;
  } while (startingAfter);

  return products;
}

async function listPricesByLookupKey(stripe: Stripe, lookupKey: string) {
  const prices: Stripe.Price[] = [];
  let startingAfter: string | undefined;

  do {
    const page = await stripe.prices.list({
      lookup_keys: [lookupKey],
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });

    prices.push(...page.data);
    startingAfter = page.has_more ? page.data.at(-1)?.id : undefined;
  } while (startingAfter);

  return prices;
}

async function ensureProduct(
  stripe: Stripe,
  desired: CatalogProduct,
  productsByTier: Map<string, Stripe.Product[]>,
  mode: Mode,
) {
  const matches = productsByTier.get(desired.tier) ?? [];

  if (matches.length > 1) {
    console.log(
      `[WARN] Product ${desired.tier}: found ${matches.length} products with metadata.tier=${desired.tier}; using ${matches[0].id}`,
    );
  }

  const existingProduct = matches[0];

  if (!existingProduct) {
    console.log(`[CREATE] Product ${desired.tier}: ${desired.name}`);

    if (mode === "dry-run") return null;

    return stripe.products.create({
      name: desired.name,
      description: desired.description,
      active: true,
      metadata: toStripeProductMetadata(desired),
    });
  }

  const update = productNeedsUpdate(existingProduct, desired);

  if (!update.hasChanges) {
    console.log(
      `[SKIP] Product ${desired.tier}: already up to date (${existingProduct.id})`,
    );
    return existingProduct;
  }

  console.log(
    `[UPDATE] Product ${desired.tier}: ${existingProduct.id} (${update.changes.join(", ")})`,
  );

  if (mode === "dry-run") return existingProduct;

  return stripe.products.update(existingProduct.id, {
    name: desired.name,
    description: desired.description,
    active: true,
    metadata: toStripeProductMetadata(desired),
  });
}

async function ensurePrice(
  stripe: Stripe,
  product: Stripe.Product | null,
  catalogProduct: CatalogProduct,
  desired: CatalogPrice,
  mode: Mode,
) {
  if (!product) {
    console.log(
      `[CREATE] Price ${desired.lookupKey}: ${formatAmount(desired)} after product is created`,
    );
    return;
  }

  const desiredMetadata = toStripePriceMetadata(desired, catalogProduct);
  const prices = await listPricesByLookupKey(stripe, desired.lookupKey);
  const activePrice = prices.find((price) => price.active);

  if (!activePrice) {
    console.log(
      `[CREATE] Price ${desired.lookupKey}: ${formatAmount(desired)} for product ${product.id}`,
    );

    if (mode === "dry-run") return;

    const createdPrice = await stripe.prices.create({
      product: product.id,
      currency: desired.currency,
      unit_amount: desired.unitAmount,
      recurring: {
        interval: desired.interval,
      },
      lookup_key: desired.lookupKey,
      metadata: desiredMetadata,
    });

    if (desired.defaultForProduct) {
      await stripe.products.update(product.id, {
        default_price: createdPrice.id,
      });
    }
    return;
  }

  if (!priceMatches(activePrice, desired, product.id)) {
    console.log(
      `[CREATE] Price ${desired.lookupKey}: ${formatAmount(desired)} replacing ${activePrice.id}`,
    );
    console.log(
      `[DEACTIVATE] Price ${activePrice.id}: superseded by new amount/product`,
    );

    if (mode === "dry-run") return;

    const createdPrice = await stripe.prices.create({
      product: product.id,
      currency: desired.currency,
      unit_amount: desired.unitAmount,
      recurring: {
        interval: desired.interval,
      },
      lookup_key: desired.lookupKey,
      transfer_lookup_key: true,
      metadata: desiredMetadata,
    });

    if (desired.defaultForProduct) {
      await stripe.products.update(product.id, {
        default_price: createdPrice.id,
      });
    }

    try {
      await stripe.prices.update(activePrice.id, {
        active: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(
        `[WARN] Price ${activePrice.id}: could not deactivate (${message})`,
      );
    }
    return;
  }

  const metadata = metadataDiff(activePrice.metadata, desiredMetadata);

  if (!metadata.hasChanges) {
    console.log(
      `[SKIP] Price ${desired.lookupKey}: already up to date (${activePrice.id})`,
    );
    return;
  }

  console.log(
    `[UPDATE] Price ${desired.lookupKey}: ${activePrice.id} (${metadata.changedKeys
      .map((key) => `metadata.${key}`)
      .join(", ")})`,
  );

  if (mode === "dry-run") return;

  await stripe.prices.update(activePrice.id, {
    metadata: desiredMetadata,
  });
}

function formatAmount(price: CatalogPrice) {
  return `${(price.unitAmount / 100).toFixed(2)} ${price.currency.toUpperCase()} / ${price.interval}`;
}

async function main() {
  const mode = parseArgs(process.argv.slice(2));
  const secretKey = getStripeSecretKey();
  const stripe = new Stripe(secretKey);

  console.log(
    `Loaded Stripe test key from ${path.relative(repoRoot, envPath)}.`,
  );
  console.log(mode === "apply" ? "Mode: APPLY" : "Mode: DRY RUN (no writes)");

  const products = await listAllProducts(stripe);
  const productsByTier = new Map<string, Stripe.Product[]>();

  for (const product of products) {
    const tier = product.metadata?.tier;
    if (!tier) continue;

    productsByTier.set(tier, [...(productsByTier.get(tier) ?? []), product]);
  }

  for (const desired of catalog) {
    console.log("");
    console.log(`Syncing ${desired.tier}`);

    const product = await ensureProduct(stripe, desired, productsByTier, mode);
    for (const price of desired.prices) {
      await ensurePrice(stripe, product, desired, price, mode);
    }
  }

  console.log("");
  console.log(
    mode === "apply"
      ? "Catalog sync complete."
      : "Dry run complete. No Stripe writes were made.",
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
