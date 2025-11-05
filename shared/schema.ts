import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Export all types from both schemas
export * from './schema.mysql';
export type { products as sqliteProducts } from './schema.sqlite';

// Import for creating validation schemas
import { products, orders, orderItems, stockMovements, stockStats, returns, returnItems, discountCodes, accounts } from './schema.mysql';

/* ---------------------- VALIDATION SCHEMAS ---------------------- */
export const insertProductSchema = createInsertSchema(products, {
  productName: z.string().min(1, "Product name is required"),
  sku: z.string().min(1, "SKU is required"),
  category: z.string().min(1, "Category is required"),
  brand: z.string().min(1, "Brand is required"),
  color: z.string().min(1, "Color is required"),
  size: z.string().min(1, "Size is required"),
  gender: z.string().min(1, "Gender is required"),
  price: z.string().min(1, "Price is required"),
  stockQuantity: z.number().int().min(0, "Stock quantity must be 0 or greater"),
  productImage: z.string().optional(),
  galleryImages: z.array(z.string()).optional().transform(val => val && val.length > 0 ? JSON.stringify(val) : null).nullable(),
  rating: z.string().transform(val => val === "" ? null : val).nullable().optional(),
  costPrice: z.string().transform(val => val === "" ? null : val).nullable().optional(),
  warehouse: z.string().transform(val => val === "" ? null : val).nullable().optional(),
  fabric: z.string().transform(val => val === "" ? null : val).nullable().optional(),
  pattern: z.string().transform(val => val === "" ? null : val).nullable().optional(),
  description: z.string().transform(val => val === "" ? null : val).nullable().optional(),
  tags: z.array(z.string()).optional().transform(val => val && val.length > 0 ? JSON.stringify(val) : null).nullable(),
  launchDate: z.date().optional().transform(val => val || null).nullable(),
}).omit({ id: true, createdAt: true });

export const insertOrderSchema = createInsertSchema(orders, {
  customerName: z.string().min(1, "Customer name is required"),
  customerEmail: z.string().email().optional().or(z.literal("")),
  status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"]),
  totalAmount: z.string().min(1, "Total amount is required"),
}).omit({ id: true, createdAt: true, orderNumber: true });

export const insertOrderItemSchema = createInsertSchema(orderItems, {
  productId: z.string().min(1, "Product ID is required"),
  productName: z.string().min(1, "Product name is required"),
  sku: z.string().min(1, "SKU is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  unitPrice: z.string().min(1, "Unit price is required"),
  subtotal: z.string().min(1, "Subtotal is required"),
}).omit({ id: true, orderId: true });

export const insertStockMovementSchema = createInsertSchema(stockMovements, {
  productId: z.string().min(1, "Product ID is required"),
  productName: z.string().min(1, "Product name is required"),
  sku: z.string().min(1, "SKU is required"),
  type: z.enum(["in", "out", "adjustment"]),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  reason: z.string().min(1, "Reason is required"),
}).omit({ id: true, createdAt: true });

export const insertStockStatsSchema = createInsertSchema(stockStats, {
  productId: z.string().min(1, "Product ID is required"),
  productName: z.string().min(1, "Product name is required"),
  sku: z.string().min(1, "SKU is required"),
  category: z.string().min(1, "Category is required"),
}).omit({ id: true, updatedAt: true });

export const insertReturnSchema = createInsertSchema(returns, {
  customerName: z.string().min(1, "Customer name is required"),
  customerEmail: z.string().email().optional().or(z.literal("")),
  status: z.enum(["pending", "approved", "rejected", "completed"]),
  reason: z.string().min(1, "Return reason is required"),
  refundAmount: z.string().transform(val => val === "" ? null : val).nullable().optional(),
  creditAmount: z.string().transform(val => val === "" ? null : val).nullable().optional(),
  exchangeValue: z.string().transform(val => val === "" ? null : val).nullable().optional(),
  additionalPayment: z.string().transform(val => val === "" ? null : val).nullable().optional(),
  notes: z.string().transform(val => val === "" ? null : val).nullable().optional(),
}).omit({ id: true, createdAt: true, returnNumber: true });

export const insertReturnItemSchema = createInsertSchema(returnItems, {
  productId: z.string().min(1, "Product ID is required"),
  productName: z.string().min(1, "Product name is required"),
  sku: z.string().min(1, "SKU is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  unitPrice: z.string().min(1, "Unit price is required"),
  subtotal: z.string().min(1, "Subtotal is required"),
  exchangeProductId: z.string().transform(val => val === "" ? null : val).nullable().optional(),
  exchangeProductName: z.string().transform(val => val === "" ? null : val).nullable().optional(),
}).omit({ id: true, returnId: true });

export const insertDiscountCodeSchema = createInsertSchema(discountCodes, {
  code: z.string().min(1, "Code is required"),
  customerEmail: z.string().email("Valid email is required"),
  amount: z.string().min(1, "Amount is required"),
  expiresAt: z.date().optional(),
}).omit({ id: true, createdAt: true, isUsed: true, usedAt: true });

export const insertAccountSchema = createInsertSchema(accounts, {
  transactionType: z.enum(["sale", "purchase", "return", "refund", "adjustment"]),
  revenue: z.string().min(1, "Revenue is required"),
  cost: z.string().min(1, "Cost is required"),
  profit: z.string().min(1, "Profit is required"),
  taxAmount: z.string().transform(val => val === "" ? "0.00" : val).optional(),
  discountAmount: z.string().transform(val => val === "" ? "0.00" : val).optional(),
  shippingCost: z.string().transform(val => val === "" ? "0.00" : val).optional(),
  fiscalYear: z.number().int().optional(),
  fiscalMonth: z.number().int().min(1).max(12).optional(),
  fiscalQuarter: z.number().int().min(1).max(4).optional(),
  quantity: z.number().int().min(0).optional(),
  referenceId: z.string().optional(),
  referenceNumber: z.string().optional(),
  productId: z.string().optional(),
  productName: z.string().optional(),
  category: z.string().optional(),
  customerName: z.string().optional(),
  customerEmail: z.string().email().optional().or(z.literal("")),
  notes: z.string().transform(val => val === "" ? null : val).nullable().optional(),
}).omit({ id: true, createdAt: true });

/* ---------------------- TYPE EXPORTS ---------------------- */
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type OrderWithItems = Order & { items: OrderItem[] };
export type InsertStockMovement = z.infer<typeof insertStockMovementSchema>;
export type StockMovement = typeof stockMovements.$inferSelect;
export type InsertStockStats = z.infer<typeof insertStockStatsSchema>;
export type StockStats = typeof stockStats.$inferSelect;
export type InsertReturn = z.infer<typeof insertReturnSchema>;
export type Return = typeof returns.$inferSelect;
export type InsertReturnItem = z.infer<typeof insertReturnItemSchema>;
export type ReturnItem = typeof returnItems.$inferSelect;
export type ReturnWithItems = Return & { items: ReturnItem[] };
export type InsertDiscountCode = z.infer<typeof insertDiscountCodeSchema>;
export type DiscountCode = typeof discountCodes.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Account = typeof accounts.$inferSelect;