import type { ProductInput } from "@/lib/store";

const categories = new Set(["T-Shirts", "Jeans", "Hoodies", "Jackets", "Shirts", "Trousers"]);

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function parseProductInput(value: unknown): ProductInput | null {
  if (!isRecord(value)) return null;
  const name = typeof value.name === "string" ? value.name.trim() : "";
  const category = typeof value.category === "string" ? value.category.trim() : "";
  const description = typeof value.description === "string" ? value.description.trim() : "";
  const image = typeof value.image === "string" ? value.image.trim() : "";
  const suppliedSlug = typeof value.slug === "string" ? value.slug.trim() : "";
  const slug = slugify(suppliedSlug || name);
  const price = value.price;
  const stock = value.stock;

  if (
    name.length < 2 || name.length > 120 ||
    !categories.has(category) ||
    description.length > 2000 ||
    !slug || slug.length > 140 ||
    typeof price !== "number" || !Number.isSafeInteger(price) || price < 0 ||
    typeof stock !== "number" || !Number.isSafeInteger(stock) || stock < 0 || stock > 100_000 ||
    image.length > 1000
  ) {
    return null;
  }

  try {
    const parsedImage = new URL(image);
    if (parsedImage.protocol !== "https:" || parsedImage.hostname !== "images.unsplash.com") return null;
  } catch {
    return null;
  }

  return { name, slug, category, description, image, price, stock };
}

export function parseCartUpdate(value: unknown) {
  if (!isRecord(value)) return null;
  if (
    typeof value.productId !== "string" ||
    !/^[a-f0-9]{24}$/i.test(value.productId) ||
    typeof value.quantity !== "number" ||
    !Number.isInteger(value.quantity) ||
    value.quantity < 0 ||
    value.quantity > 99
  ) {
    return null;
  }
  return { productId: value.productId, quantity: value.quantity };
}

export function parseCheckoutCustomer(value: unknown) {
  if (!isRecord(value)) return null;
  const name = typeof value.name === "string" ? value.name.trim() : "";
  const email = typeof value.email === "string" ? value.email.trim().toLowerCase() : "";
  const address = typeof value.address === "string" ? value.address.trim() : "";
  if (
    name.length < 2 || name.length > 120 ||
    email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    address.length < 8 || address.length > 1000
  ) {
    return null;
  }
  return { name, email, address };
}

export async function readJson(request: Request): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
