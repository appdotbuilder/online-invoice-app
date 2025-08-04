
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, invoicesTable, invoiceItemsTable } from '../db/schema';
import { type CreateInvoiceInput } from '../schema';
import { createInvoice } from '../handlers/create_invoice';
import { eq } from 'drizzle-orm';

describe('createInvoice', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let customerId: number;

  beforeEach(async () => {
    // Create a test customer first
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '123-456-7890',
        address: '123 Test St',
        city: 'Test City',
        postal_code: '12345'
      })
      .returning()
      .execute();
    
    customerId = customerResult[0].id;
  });

  const testInput: CreateInvoiceInput = {
    customer_id: 0, // Will be set in each test
    due_date: new Date('2024-02-01'),
    tax_rate: 11,
    discount_rate: 5,
    payment_method: 'Bank Transfer',
    notes: 'Test invoice notes',
    seller_name: 'Test Seller',
    seller_email: 'seller@example.com',
    seller_phone: '987-654-3210',
    seller_address: '456 Seller Ave',
    items: [
      {
        description: 'Item 1',
        quantity: 2,
        unit_price: 100
      },
      {
        description: 'Item 2',
        quantity: 1,
        unit_price: 50
      }
    ]
  };

  it('should create an invoice with correct calculations', async () => {
    const input = { ...testInput, customer_id: customerId };
    const result = await createInvoice(input);

    // Basic field validation
    expect(result.customer_id).toEqual(customerId);
    expect(result.due_date).toEqual(input.due_date);
    expect(result.tax_rate).toEqual(11);
    expect(result.discount_rate).toEqual(5);
    expect(result.payment_method).toEqual('Bank Transfer');
    expect(result.status).toEqual('Unpaid');
    expect(result.notes).toEqual(input.notes);
    expect(result.seller_name).toEqual(input.seller_name);
    expect(result.seller_email).toEqual(input.seller_email);
    expect(result.seller_phone).toEqual(input.seller_phone);
    expect(result.seller_address).toEqual(input.seller_address);

    // Auto-generated fields
    expect(result.id).toBeDefined();
    expect(result.invoice_number).toMatch(/^INV-\d{6}$/);
    expect(result.invoice_date).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Calculation validation (rounded to 2 decimal places)
    // Subtotal: (2 * 100) + (1 * 50) = 250
    expect(result.subtotal).toEqual(250);
    // Discount: 250 * 5% = 12.5
    expect(result.discount_amount).toEqual(12.5);
    // Tax: (250 - 12.5) * 11% = 26.125, rounded to 26.13
    expect(result.tax_amount).toEqual(26.13);
    // Total: 237.5 + 26.13 = 263.63
    expect(result.total_amount).toEqual(263.63);

    // Verify numeric types
    expect(typeof result.subtotal).toBe('number');
    expect(typeof result.tax_amount).toBe('number');
    expect(typeof result.discount_amount).toBe('number');
    expect(typeof result.total_amount).toBe('number');
  });

  it('should save invoice to database', async () => {
    const input = { ...testInput, customer_id: customerId };
    const result = await createInvoice(input);

    const invoices = await db.select()
      .from(invoicesTable)
      .where(eq(invoicesTable.id, result.id))
      .execute();

    expect(invoices).toHaveLength(1);
    const invoice = invoices[0];
    expect(invoice.customer_id).toEqual(customerId);
    expect(invoice.invoice_number).toMatch(/^INV-\d{6}$/);
    expect(parseFloat(invoice.subtotal)).toEqual(250);
    expect(parseFloat(invoice.tax_amount)).toEqual(26.13);
    expect(parseFloat(invoice.discount_amount)).toEqual(12.5);
    expect(parseFloat(invoice.total_amount)).toEqual(263.63);
  });

  it('should create invoice items', async () => {
    const input = { ...testInput, customer_id: customerId };
    const result = await createInvoice(input);

    const items = await db.select()
      .from(invoiceItemsTable)
      .where(eq(invoiceItemsTable.invoice_id, result.id))
      .execute();

    expect(items).toHaveLength(2);

    const item1 = items.find(item => item.description === 'Item 1');
    const item2 = items.find(item => item.description === 'Item 2');

    expect(item1).toBeDefined();
    expect(parseFloat(item1!.quantity)).toEqual(2);
    expect(parseFloat(item1!.unit_price)).toEqual(100);
    expect(parseFloat(item1!.total)).toEqual(200);

    expect(item2).toBeDefined();
    expect(parseFloat(item2!.quantity)).toEqual(1);
    expect(parseFloat(item2!.unit_price)).toEqual(50);
    expect(parseFloat(item2!.total)).toEqual(50);
  });

  it('should generate unique invoice numbers', async () => {
    const input1 = { ...testInput, customer_id: customerId };
    const input2 = { ...testInput, customer_id: customerId };

    const result1 = await createInvoice(input1);
    const result2 = await createInvoice(input2);

    expect(result1.invoice_number).not.toEqual(result2.invoice_number);
    expect(result1.invoice_number).toMatch(/^INV-\d{6}$/);
    expect(result2.invoice_number).toMatch(/^INV-\d{6}$/);
  });

  it('should handle zero discount rate', async () => {
    const input = { 
      ...testInput, 
      customer_id: customerId,
      discount_rate: 0
    };
    const result = await createInvoice(input);

    expect(result.discount_rate).toEqual(0);
    expect(result.discount_amount).toEqual(0);
    // Subtotal: 250, Tax: 250 * 11% = 27.5, Total: 250 + 27.5 = 277.5
    expect(result.subtotal).toEqual(250);
    expect(result.tax_amount).toEqual(27.5);
    expect(result.total_amount).toEqual(277.5);
  });

  it('should handle zero tax rate', async () => {
    const input = { 
      ...testInput, 
      customer_id: customerId,
      tax_rate: 0
    };
    const result = await createInvoice(input);

    expect(result.tax_rate).toEqual(0);
    expect(result.tax_amount).toEqual(0);
    // Subtotal: 250, Discount: 12.5, Total: 237.5
    expect(result.subtotal).toEqual(250);
    expect(result.discount_amount).toEqual(12.5);
    expect(result.total_amount).toEqual(237.5);
  });

  it('should throw error for non-existent customer', async () => {
    const input = { ...testInput, customer_id: 99999 };
    
    await expect(createInvoice(input)).rejects.toThrow(/Customer with id 99999 not found/i);
  });
});
