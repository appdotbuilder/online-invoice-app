import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, invoicesTable, invoiceItemsTable } from '../db/schema';
import { type CreateInvoiceInput, type UpdateInvoiceInput } from '../schema';
import { createInvoice } from '../handlers/create_invoice';
import { updateInvoice } from '../handlers/update_invoice';
import { eq } from 'drizzle-orm';

describe('updateInvoice', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let customerId: number;
  let secondCustomerId: number;
  let invoiceId: number;

  beforeEach(async () => {
    // Create test customers
    const customerResult1 = await db.insert(customersTable)
      .values({
        name: 'Test Customer 1',
        email: 'test1@example.com',
        phone: '123-456-7890',
        address: '123 Test St',
        city: 'Test City',
        postal_code: '12345'
      })
      .returning()
      .execute();
    
    const customerResult2 = await db.insert(customersTable)
      .values({
        name: 'Test Customer 2',
        email: 'test2@example.com',
        phone: '098-765-4321',
        address: '456 Test Ave',
        city: 'Test City',
        postal_code: '54321'
      })
      .returning()
      .execute();
    
    customerId = customerResult1[0].id;
    secondCustomerId = customerResult2[0].id;

    // Create initial invoice
    const invoiceInput: CreateInvoiceInput = {
      customer_id: customerId,
      due_date: new Date('2024-02-01'),
      tax_rate: 11,
      discount_rate: 5,
      payment_method: 'Bank Transfer',
      notes: 'Original invoice notes',
      seller_name: 'Original Seller',
      seller_email: 'original@example.com',
      seller_phone: '111-222-3333',
      seller_address: '123 Original Ave',
      items: [
        {
          description: 'Original Item 1',
          quantity: 2,
          unit_price: 100
        },
        {
          description: 'Original Item 2',
          quantity: 1,
          unit_price: 50
        }
      ]
    };

    const createdInvoice = await createInvoice(invoiceInput);
    invoiceId = createdInvoice.id;
  });

  it('should update basic invoice fields', async () => {
    const updateInput: UpdateInvoiceInput = {
      id: invoiceId,
      due_date: new Date('2024-03-01'),
      status: 'Paid',
      notes: 'Updated invoice notes',
      seller_name: 'Updated Seller'
    };

    const result = await updateInvoice(updateInput);

    expect(result.id).toEqual(invoiceId);
    expect(result.due_date).toEqual(new Date('2024-03-01'));
    expect(result.status).toEqual('Paid');
    expect(result.notes).toEqual('Updated invoice notes');
    expect(result.seller_name).toEqual('Updated Seller');
    // Unchanged fields should remain the same
    expect(result.customer_id).toEqual(customerId);
    expect(result.payment_method).toEqual('Bank Transfer');
  });

  it('should update customer and recalculate totals', async () => {
    const updateInput: UpdateInvoiceInput = {
      id: invoiceId,
      customer_id: secondCustomerId,
      tax_rate: 10,
      discount_rate: 0
    };

    const result = await updateInvoice(updateInput);

    expect(result.customer_id).toEqual(secondCustomerId);
    expect(result.tax_rate).toEqual(10);
    expect(result.discount_rate).toEqual(0);
    // Recalculated values: subtotal 250, no discount, tax 25, total 275
    expect(result.subtotal).toEqual(250);
    expect(result.discount_amount).toEqual(0);
    expect(result.tax_amount).toEqual(25);
    expect(result.total_amount).toEqual(275);
  });

  it('should update items and recalculate totals', async () => {
    const updateInput: UpdateInvoiceInput = {
      id: invoiceId,
      items: [
        {
          description: 'Updated Item 1',
          quantity: 3,
          unit_price: 200
        }
      ]
    };

    const result = await updateInvoice(updateInput);

    // New subtotal: 3 * 200 = 600
    expect(result.subtotal).toEqual(600);
    // Discount: 600 * 5% = 30
    expect(result.discount_amount).toEqual(30);
    // Tax: (600 - 30) * 11% = 62.7
    expect(result.tax_amount).toEqual(62.7);
    // Total: 570 + 62.7 = 632.7
    expect(result.total_amount).toEqual(632.7);

    // Verify items were updated in database
    const items = await db.select()
      .from(invoiceItemsTable)
      .where(eq(invoiceItemsTable.invoice_id, invoiceId))
      .execute();

    expect(items).toHaveLength(1);
    expect(items[0].description).toEqual('Updated Item 1');
    expect(parseFloat(items[0].quantity)).toEqual(3);
    expect(parseFloat(items[0].unit_price)).toEqual(200);
    expect(parseFloat(items[0].total)).toEqual(600);
  });

  it('should save updated invoice to database', async () => {
    const updateInput: UpdateInvoiceInput = {
      id: invoiceId,
      status: 'Partial',
      seller_email: 'updated@example.com'
    };

    await updateInvoice(updateInput);

    const invoices = await db.select()
      .from(invoicesTable)
      .where(eq(invoicesTable.id, invoiceId))
      .execute();

    expect(invoices).toHaveLength(1);
    expect(invoices[0].status).toEqual('Partial');
    expect(invoices[0].seller_email).toEqual('updated@example.com');
    expect(invoices[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error if invoice not found', async () => {
    const updateInput: UpdateInvoiceInput = {
      id: 99999,
      status: 'Paid'
    };

    expect(updateInvoice(updateInput)).rejects.toThrow(/Invoice with id 99999 not found/i);
  });

  it('should throw error if customer not found', async () => {
    const updateInput: UpdateInvoiceInput = {
      id: invoiceId,
      customer_id: 99999
    };

    expect(updateInvoice(updateInput)).rejects.toThrow(/Customer with id 99999 not found/i);
  });

  it('should handle partial updates correctly', async () => {
    const updateInput: UpdateInvoiceInput = {
      id: invoiceId,
      payment_method: 'Credit Card'
    };

    const result = await updateInvoice(updateInput);

    expect(result.payment_method).toEqual('Credit Card');
    // All other fields should remain unchanged
    expect(result.status).toEqual('Unpaid');
    expect(result.seller_name).toEqual('Original Seller');
    expect(result.notes).toEqual('Original invoice notes');
  });
});