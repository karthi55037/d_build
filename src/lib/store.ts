import "server-only";

import {
  ObjectId,
  type Collection,
  type Document,
  type WithId,
} from "mongodb";
import { getDatabase } from "@/lib/db";

export type ProductInput = {
  name: string;
  slug: string;
  category: string;
  description: string;
  price: number;
  stock: number;
  image: string;
};

export type Product = ProductInput & {
  id: string;
};

type ProductRecord = ProductInput & {
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type CartRecord = {
  _id: string;
  items: Record<string, number>;
  updatedAt: Date;
};

export type CartLine = {
  product: Product;
  quantity: number;
};

export type OrderLine = {
  productId: string;
  name: string;
  slug: string;
  image: string;
  unitPrice: number;
  quantity: number;
};

export type OrderRecord = {
  customer: {
    name: string;
    email: string;
    address: string;
  };
  items: OrderLine[];
  subtotal: number;
  status: "placed";
  createdAt: Date;
};

type StoreSettingsRecord = {
  _id: string;
  createdAt: Date;
};

const starterProducts: ProductInput[] = [
  { name: "Essential White Tee", slug: "essential-white-tee", category: "T-Shirts", price: 599, stock: 20, image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80", description: "A soft, everyday white tee with a clean modern fit." },
  { name: "Classic Black Tee", slug: "classic-black-tee", category: "T-Shirts", price: 649, stock: 20, image: "https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=600&q=80", description: "A versatile black tee designed for easy everyday wear." },
  { name: "Everyday Denim", slug: "everyday-denim", category: "Jeans", price: 1299, stock: 15, image: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=600&q=80", description: "Comfortable denim with a timeless, easy-to-style wash." },
  { name: "Relaxed Hoodie", slug: "relaxed-hoodie", category: "Hoodies", price: 1499, stock: 12, image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=600&q=80", description: "A relaxed layer made for cool mornings and quiet weekends." },
  { name: "Urban Jacket", slug: "urban-jacket", category: "Jackets", price: 2199, stock: 10, image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=600&q=80", description: "A clean outer layer that works across seasons." },
  { name: "Casual Shirt", slug: "casual-shirt", category: "Shirts", price: 999, stock: 15, image: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=600&q=80", description: "An effortless shirt for workdays, weekends, and everything between." },
  { name: "Cargo Trousers", slug: "cargo-trousers", category: "Trousers", price: 1199, stock: 12, image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=600&q=80", description: "Everyday trousers with a comfortable fit and functional details." },
  { name: "Premium Sweatshirt", slug: "premium-sweatshirt", category: "Hoodies", price: 1399, stock: 12, image: "https://images.unsplash.com/photo-1578681994506-b8f463449011?auto=format&fit=crop&w=600&q=80", description: "A soft sweatshirt that makes layering simple." },
];

export function getPreviewProducts(): Product[] {
  return starterProducts.map((product) => ({ ...product, id: product.slug }));
}

let initialization: Promise<void> | undefined;

async function getCollections() {
  const database = await getDatabase();
  return {
    products: database.collection<ProductRecord>("products"),
    carts: database.collection<CartRecord>("carts"),
    orders: database.collection<OrderRecord>("orders"),
    settings: database.collection<StoreSettingsRecord>("store_settings"),
  };
}

async function initializeCatalog(
  collection: Collection<ProductRecord>,
  settings: Collection<StoreSettingsRecord>,
) {
  if (!initialization) {
    initialization = (async () => {
      await collection.createIndex({ slug: 1 }, { unique: true });
      await collection.createIndex({ active: 1, category: 1 });
      if (!(await settings.findOne({ _id: "starter_catalog_v1" }))) {
        if (await collection.countDocuments() === 0) {
          const now = new Date();
          try {
            await collection.bulkWrite(
              starterProducts.map((product) => ({
                updateOne: {
                  filter: { slug: product.slug },
                  update: {
                    $setOnInsert: {
                      ...product,
                      active: true,
                      createdAt: now,
                      updatedAt: now,
                    },
                  },
                  upsert: true,
                },
              })),
              { ordered: false },
            );
          } catch (error) {
            if (!(typeof error === "object" && error !== null && "code" in error && error.code === 11000)) {
              throw error;
            }
          }
        }
        try {
          await settings.updateOne(
            { _id: "starter_catalog_v1" },
            { $setOnInsert: { createdAt: new Date() } },
            { upsert: true },
          );
        } catch (error) {
          if (!(typeof error === "object" && error !== null && "code" in error && error.code === 11000)) {
            throw error;
          }
        }
      }
    })().catch((error: unknown) => {
      initialization = undefined;
      throw error;
    });
  }
  await initialization;
}

function toProduct(record: WithId<ProductRecord>): Product {
  return {
    id: record._id.toString(),
    name: record.name,
    slug: record.slug,
    category: record.category,
    description: record.description,
    price: record.price,
    stock: record.stock,
    image: record.image,
  };
}

export async function listProducts(filters: { category?: string; search?: string } = {}) {
  const { products, settings } = await getCollections();
  await initializeCatalog(products, settings);

  const query: Document = { active: true };
  if (filters.category && filters.category !== "All") {
    query.category = filters.category;
  }
  if (filters.search?.trim()) {
    const escapedSearch = filters.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    query.name = { $regex: escapedSearch, $options: "i" };
  }

  const records = await products.find(query).sort({ category: 1, name: 1 }).toArray();
  return records.map(toProduct);
}

export async function findProductBySlug(slug: string) {
  const { products, settings } = await getCollections();
  await initializeCatalog(products, settings);
  const product = await products.findOne({ slug, active: true });
  return product ? toProduct(product) : null;
}

export async function listAdminProducts() {
  const { products, settings } = await getCollections();
  await initializeCatalog(products, settings);
  const records = await products.find({}).sort({ updatedAt: -1 }).toArray();
  return records.map((record) => ({ ...toProduct(record), active: record.active }));
}

export async function createProduct(input: ProductInput) {
  const { products, settings } = await getCollections();
  await initializeCatalog(products, settings);
  const now = new Date();
  const result = await products.insertOne({
    ...input,
    active: true,
    createdAt: now,
    updatedAt: now,
  });
  return { id: result.insertedId.toString(), ...input };
}

export async function updateProduct(id: string, input: ProductInput) {
  if (!ObjectId.isValid(id)) return false;
  const { products, settings } = await getCollections();
  await initializeCatalog(products, settings);
  const result = await products.updateOne(
    { _id: new ObjectId(id) },
    { $set: { ...input, updatedAt: new Date() } },
  );
  return result.matchedCount > 0;
}

export async function deleteProduct(id: string) {
  if (!ObjectId.isValid(id)) return false;
  const { products, settings } = await getCollections();
  await initializeCatalog(products, settings);
  const result = await products.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}

export async function getCart(cartId: string) {
  const { carts, products } = await getCollections();
  const cart = await carts.findOne({ _id: cartId });
  if (!cart) return { items: [] as CartLine[], subtotal: 0 };

  const entries = Object.entries(cart.items);
  const ids = entries.filter(([id]) => ObjectId.isValid(id)).map(([id]) => new ObjectId(id));
  const productRecords = await products.find({ _id: { $in: ids }, active: true }).toArray();
  const byId = new Map(productRecords.map((record) => [record._id.toString(), toProduct(record)]));
  const items = entries.flatMap(([id, quantity]) => {
    const product = byId.get(id);
    return product ? [{ product, quantity }] : [];
  });

  return {
    items,
    subtotal: items.reduce((total, item) => total + item.product.price * item.quantity, 0),
  };
}

export async function setCartQuantity(cartId: string, productId: string, quantity: number) {
  if (!ObjectId.isValid(productId)) {
    return { ok: false as const, message: "That product is no longer available." };
  }

  const { carts, products } = await getCollections();
  const product = await products.findOne({
    _id: new ObjectId(productId),
    active: true,
  });

  if (!product) return { ok: false as const, message: "That product is no longer available." };
  if (quantity > product.stock) {
    return { ok: false as const, message: "The requested quantity is not in stock." };
  }

  const update = await carts.updateOne(
    { _id: cartId },
    {
      $set: { [`items.${productId}`]: quantity, updatedAt: new Date() },
    },
    { upsert: true },
  );
  if (quantity === 0) {
    await carts.updateOne(
      { _id: cartId },
      { $unset: { [`items.${productId}`]: "" }, $set: { updatedAt: new Date() } },
    );
  }
  return { ok: true as const, product: toProduct(product), quantity, updated: update.modifiedCount > 0 || update.upsertedCount > 0 };
}

export async function createOrder(
  cartId: string,
  customer: OrderRecord["customer"],
) {
  const database = await getDatabase();
  const carts = database.collection<CartRecord>("carts");
  const products = database.collection<ProductRecord>("products");
  const orders = database.collection<OrderRecord>("orders");
  const cart = await carts.findOne({ _id: cartId });
  if (!cart || Object.keys(cart.items).length === 0) {
    return { ok: false as const, status: 400, message: "Your cart is empty." };
  }

  const entries = Object.entries(cart.items);
  const validEntries = entries.filter(([id]) => ObjectId.isValid(id));
  if (validEntries.length !== entries.length) {
    return { ok: false as const, status: 409, message: "Your cart contains an unavailable item. Refresh it and try again." };
  }

  const ids = validEntries.map(([id]) => new ObjectId(id));
  const records = await products.find({ _id: { $in: ids }, active: true }).toArray();
  if (records.length !== entries.length) {
    return { ok: false as const, status: 409, message: "A product in your cart is no longer available." };
  }

  const recordById = new Map(records.map((record) => [record._id.toString(), record]));
  const orderItems: OrderLine[] = [];
  for (const [id, quantity] of validEntries) {
    const product = recordById.get(id);
    if (!product || !Number.isInteger(quantity) || quantity < 1 || product.stock < quantity) {
      return { ok: false as const, status: 409, message: "Stock changed for an item in your cart. Update your cart and try again." };
    }
    orderItems.push({
      productId: id,
      name: product.name,
      slug: product.slug,
      image: product.image,
      unitPrice: product.price,
      quantity,
    });
  }

  const subtotal = orderItems.reduce((total, item) => total + item.unitPrice * item.quantity, 0);
  const orderId = new ObjectId();
  const session = database.client.startSession();

  try {
    await session.withTransaction(async () => {
      for (const item of orderItems) {
        const result = await products.updateOne(
          { _id: new ObjectId(item.productId), active: true, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity }, $set: { updatedAt: new Date() } },
          { session },
        );
        if (result.modifiedCount !== 1) {
          throw new Error("STOCK_CHANGED");
        }
      }

      await orders.insertOne(
        {
          _id: orderId,
          customer,
          items: orderItems,
          subtotal,
          status: "placed",
          createdAt: new Date(),
        },
        { session },
      );

      await carts.updateOne(
        { _id: cartId },
        { $set: { items: {}, updatedAt: new Date() } },
        { session },
      );
    });
  } catch (error) {
    if (error instanceof Error && error.message === "STOCK_CHANGED") {
      return { ok: false as const, status: 409, message: "Stock changed during checkout. Please refresh your cart and try again." };
    }
    throw error;
  } finally {
    await session.endSession();
  }

  return {
    ok: true as const,
    order: {
      id: orderId.toString(),
      items: orderItems,
      subtotal,
      status: "placed" as const,
    },
  };
}

export async function findOrderById(id: string) {
  if (!ObjectId.isValid(id)) return null;
  const database = await getDatabase();
  const orders = database.collection<OrderRecord>("orders");
  const order = await orders.findOne(
    { _id: new ObjectId(id) },
    { projection: { items: 1, subtotal: 1, status: 1, createdAt: 1 } },
  );
  if (!order) return null;
  return {
    id: order._id.toString(),
    items: order.items,
    subtotal: order.subtotal,
    status: order.status,
    createdAt: order.createdAt,
  };
}
