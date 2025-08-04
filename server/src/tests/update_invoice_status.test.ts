
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, invoicesTable } from '../db/schema';
import { type UpdateInvoiceStatusInput } from '../schema';
import { updateInvoiceStatus } from '../handlers/update_invoice_status';
import { eq } from 'drizzle-orm';

describe('updateInvoiceStatus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testCustomerId: number;
  let testInvoiceId: number;

  beforeEach(async () => {
    // Create a test customer first
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        email: 'test@example.com',
        phone: null,
        address: null,
        city: null,
        postal_code: null
      })
      .returning()
      .execute();

    testCustomerId = customerResult[0].id;

    // Create a test invoice
    const invoiceResult = await db.insert(invoicesTable)
      .values({
        invoice_number: 'INV-TEST-001',
        customer_id: testCustomerId,
        due_date: new Date('2024-12-31'),
        subtotal: '100.00',
        tax_rate: '11.00',
        tax_amount: '11.00',
        discount_rate: '0.00',
        discount_amount: '0.00',
        total_amount: '111.00',
        payment_method: 'Bank Transfer',
        status: 'Unpaid',
        notes: null,
        seller_name: 'Test Seller',
        seller_email: 'seller@example.com',
        seller_phone: null,
        seller_address: null
      })
      .returning()
      .execute();

    testInvoiceId = invoiceResult[0].id;
  });

  it('should update invoice status successfully', async () => {
    const input: UpdateInvoiceStatusInput = {
      id: testInvoiceId,
      status: 'Paid'
    };

    const result = await updateInvoiceStatus(input);

    expect(result.id).toEqual(testInvoiceId);
    expect(result.status).toEqual('Paid');
    expect(result.updated_at).toBeInstanceOf(Date);
    
    // Verify numeric fields are properly converted
    expect(typeof result.subtotal).toBe('number');
    expect(typeof result.tax_rate).toBe('number');
    expect(typeof result.tax_amount).toBe('number');
    expect(result.subtotal).toEqual(100);
    expect(result.tax_rate).toEqual(11);
    expect(result.tax_amount).toEqual(11);
  });

  it('should update the invoice in the database', async () => {
    const input: UpdateInvoiceStatusInput = {
      id: testInvoiceId,
      status: 'Overdue'
    };

    const originalInvoice = await db.select()
      .from(invoicesTable)
      .where(eq(invoicesTable.id, testInvoiceId))
      .execute();

    await updateInvoiceStatus(input);

    const updatedInvoice = await db.select()
      .from(invoicesTable)
      .where(eq(invoicesTable.id, testInvoiceId))
      .execute();

    expect(updatedInvoice).toHaveLength(1);
    expect(updatedInvoice[0].status).toEqual('Overdue');
    expect(updatedInvoice[0].updated_at > originalInvoice[0].updated_at).toBe(true);
  });

  it('should update to different valid statuses', async () => {
    const statuses = ['Paid', 'Unpaid', 'Overdue', 'Partial'] as const;

    for (const status of statuses) {
      const input: UpdateInvoiceStatusInput = {
        id: testInvoiceId,
        status: status
      };

      const result = await updateInvoiceStatus(input);
      expect(result.status).toEqual(status);
    }
  });

  it('should throw error for non-existent invoice', async () => {
    const input: UpdateInvoiceStatusInput = {
      id: 99999,
      status: 'Paid'
    };

    expect(updateInvoiceStatus(input)).rejects.toThrow(/invoice with id 99999 not found/i);
  });
});
