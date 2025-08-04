
import { serial, text, pgTable, timestamp, numeric, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const invoiceStatusEnum = pgEnum('invoice_status', ['Paid', 'Unpaid', 'Overdue', 'Partial']);
export const paymentMethodEnum = pgEnum('payment_method', ['Bank Transfer', 'Cash', 'Credit Card', 'Check', 'Other']);

// Customers table
export const customersTable = pgTable('customers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  city: text('city'),
  postal_code: text('postal_code'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Invoices table
export const invoicesTable = pgTable('invoices', {
  id: serial('id').primaryKey(),
  invoice_number: text('invoice_number').notNull().unique(),
  customer_id: integer('customer_id').notNull().references(() => customersTable.id),
  invoice_date: timestamp('invoice_date').defaultNow().notNull(),
  due_date: timestamp('due_date').notNull(),
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull(),
  tax_rate: numeric('tax_rate', { precision: 5, scale: 2 }).notNull(),
  tax_amount: numeric('tax_amount', { precision: 12, scale: 2 }).notNull(),
  discount_rate: numeric('discount_rate', { precision: 5, scale: 2 }).notNull(),
  discount_amount: numeric('discount_amount', { precision: 12, scale: 2 }).notNull(),
  total_amount: numeric('total_amount', { precision: 12, scale: 2 }).notNull(),
  payment_method: paymentMethodEnum('payment_method').notNull(),
  status: invoiceStatusEnum('status').notNull().default('Unpaid'),
  notes: text('notes'),
  seller_name: text('seller_name').notNull(),
  seller_email: text('seller_email'),
  seller_phone: text('seller_phone'),
  seller_address: text('seller_address'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Invoice items table
export const invoiceItemsTable = pgTable('invoice_items', {
  id: serial('id').primaryKey(),
  invoice_id: integer('invoice_id').notNull().references(() => invoicesTable.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull(),
  unit_price: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
  total: numeric('total', { precision: 12, scale: 2 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Payments table
export const paymentsTable = pgTable('payments', {
  id: serial('id').primaryKey(),
  invoice_id: integer('invoice_id').notNull().references(() => invoicesTable.id, { onDelete: 'cascade' }),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  payment_date: timestamp('payment_date').notNull(),
  payment_method: paymentMethodEnum('payment_method').notNull(),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const customersRelations = relations(customersTable, ({ many }) => ({
  invoices: many(invoicesTable),
}));

export const invoicesRelations = relations(invoicesTable, ({ one, many }) => ({
  customer: one(customersTable, {
    fields: [invoicesTable.customer_id],
    references: [customersTable.id],
  }),
  items: many(invoiceItemsTable),
  payments: many(paymentsTable),
}));

export const invoiceItemsRelations = relations(invoiceItemsTable, ({ one }) => ({
  invoice: one(invoicesTable, {
    fields: [invoiceItemsTable.invoice_id],
    references: [invoicesTable.id],
  }),
}));

export const paymentsRelations = relations(paymentsTable, ({ one }) => ({
  invoice: one(invoicesTable, {
    fields: [paymentsTable.invoice_id],
    references: [invoicesTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Customer = typeof customersTable.$inferSelect;
export type NewCustomer = typeof customersTable.$inferInsert;
export type Invoice = typeof invoicesTable.$inferSelect;
export type NewInvoice = typeof invoicesTable.$inferInsert;
export type InvoiceItem = typeof invoiceItemsTable.$inferSelect;
export type NewInvoiceItem = typeof invoiceItemsTable.$inferInsert;
export type Payment = typeof paymentsTable.$inferSelect;
export type NewPayment = typeof paymentsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = {
  customers: customersTable,
  invoices: invoicesTable,
  invoiceItems: invoiceItemsTable,
  payments: paymentsTable
};
