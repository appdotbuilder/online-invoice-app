
import { z } from 'zod';

// Invoice status enum
export const invoiceStatusSchema = z.enum(['Paid', 'Unpaid', 'Overdue', 'Partial']);
export type InvoiceStatus = z.infer<typeof invoiceStatusSchema>;

// Payment method enum
export const paymentMethodSchema = z.enum(['Bank Transfer', 'Cash', 'Credit Card', 'Check', 'Other']);
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;

// Customer schema
export const customerSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  city: z.string().nullable(),
  postal_code: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Customer = z.infer<typeof customerSchema>;

// Invoice item schema
export const invoiceItemSchema = z.object({
  id: z.number(),
  invoice_id: z.number(),
  description: z.string(),
  quantity: z.number().positive(),
  unit_price: z.number().positive(),
  total: z.number(),
  created_at: z.coerce.date()
});

export type InvoiceItem = z.infer<typeof invoiceItemSchema>;

// Invoice schema
export const invoiceSchema = z.object({
  id: z.number(),
  invoice_number: z.string(),
  customer_id: z.number(),
  invoice_date: z.coerce.date(),
  due_date: z.coerce.date(),
  subtotal: z.number(),
  tax_rate: z.number().min(0).max(100),
  tax_amount: z.number(),
  discount_rate: z.number().min(0).max(100),
  discount_amount: z.number(),
  total_amount: z.number(),
  payment_method: paymentMethodSchema,
  status: invoiceStatusSchema,
  notes: z.string().nullable(),
  seller_name: z.string(),
  seller_email: z.string().email().nullable(),
  seller_phone: z.string().nullable(),
  seller_address: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Invoice = z.infer<typeof invoiceSchema>;

// Payment tracking schema
export const paymentSchema = z.object({
  id: z.number(),
  invoice_id: z.number(),
  amount: z.number().positive(),
  payment_date: z.coerce.date(),
  payment_method: paymentMethodSchema,
  notes: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Payment = z.infer<typeof paymentSchema>;

// Input schemas for creating entities
export const createCustomerInputSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  city: z.string().nullable(),
  postal_code: z.string().nullable()
});

export type CreateCustomerInput = z.infer<typeof createCustomerInputSchema>;

export const createInvoiceItemInputSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unit_price: z.number().positive()
});

export type CreateInvoiceItemInput = z.infer<typeof createInvoiceItemInputSchema>;

export const createInvoiceInputSchema = z.object({
  customer_id: z.number(),
  due_date: z.coerce.date(),
  tax_rate: z.number().min(0).max(100).default(11),
  discount_rate: z.number().min(0).max(100).default(0),
  payment_method: paymentMethodSchema,
  notes: z.string().nullable(),
  seller_name: z.string().min(1),
  seller_email: z.string().email().nullable(),
  seller_phone: z.string().nullable(),
  seller_address: z.string().nullable(),
  items: z.array(createInvoiceItemInputSchema).min(1)
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceInputSchema>;

export const updateInvoiceStatusInputSchema = z.object({
  id: z.number(),
  status: invoiceStatusSchema
});

export type UpdateInvoiceStatusInput = z.infer<typeof updateInvoiceStatusInputSchema>;

export const createPaymentInputSchema = z.object({
  invoice_id: z.number(),
  amount: z.number().positive(),
  payment_date: z.coerce.date(),
  payment_method: paymentMethodSchema,
  notes: z.string().nullable()
});

export type CreatePaymentInput = z.infer<typeof createPaymentInputSchema>;

// Complete invoice with relations
export const invoiceWithDetailsSchema = z.object({
  invoice: invoiceSchema,
  customer: customerSchema,
  items: z.array(invoiceItemSchema),
  payments: z.array(paymentSchema)
});

export type InvoiceWithDetails = z.infer<typeof invoiceWithDetailsSchema>;
