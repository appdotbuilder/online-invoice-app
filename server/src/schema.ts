
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

// Input schemas for updating entities
export const updateCustomerInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  postal_code: z.string().nullable().optional(),
});

export type UpdateCustomerInput = z.infer<typeof updateCustomerInputSchema>;

export const deleteCustomerInputSchema = z.object({
  id: z.number(),
});

export type DeleteCustomerInput = z.infer<typeof deleteCustomerInputSchema>;

export const updateInvoiceInputSchema = z.object({
  id: z.number(),
  customer_id: z.number().optional(),
  due_date: z.coerce.date().optional(),
  tax_rate: z.number().min(0).max(100).optional(),
  discount_rate: z.number().min(0).max(100).optional(),
  payment_method: paymentMethodSchema.optional(),
  status: invoiceStatusSchema.optional(),
  notes: z.string().nullable().optional(),
  seller_name: z.string().min(1).optional(),
  seller_email: z.string().email().nullable().optional(),
  seller_phone: z.string().nullable().optional(),
  seller_address: z.string().nullable().optional(),
  // When updating, items can be optional if not changing them, but if provided, must be valid
  items: z.array(z.object({
    id: z.number().optional(), // ID is optional for existing items if they are being updated, or not present for new ones within an update
    description: z.string().min(1),
    quantity: z.number().positive(),
    unit_price: z.number().positive()
  })).optional(),
});

export type UpdateInvoiceInput = z.infer<typeof updateInvoiceInputSchema>;

export const deleteInvoiceInputSchema = z.object({
  id: z.number(),
});

export type DeleteInvoiceInput = z.infer<typeof deleteInvoiceInputSchema>;

// Admin login schema
export const adminLoginInputSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type AdminLoginInput = z.infer<typeof adminLoginInputSchema>;

// Complete invoice with relations
export const invoiceWithDetailsSchema = z.object({
  invoice: invoiceSchema,
  customer: customerSchema,
  items: z.array(invoiceItemSchema),
  payments: z.array(paymentSchema)
});

export type InvoiceWithDetails = z.infer<typeof invoiceWithDetailsSchema>;
