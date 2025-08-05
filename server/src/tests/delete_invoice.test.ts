import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, invoicesTable, invoiceItemsTable } from '../db/schema';
import { type CreateInvoiceInput, type DeleteInvoiceInput } from '../schema';
import { createInvoice } from '../handlers/create_invoice';
import { deleteInvoice } from '../handlers/delete_invoice';
import { eq } from 'drizzle-orm';

describe('deleteInvoice', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let customerId: number;
  let invoiceId: number;

  beforeEach(async () => {
    // Create test customer
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

    // Create test invoice
    const invoiceInput: CreateInvoiceInput = {
      customer_id: customerId,
      due_date: new Date('2024-02-01'),
      tax_rate: 11,
      discount_rate: 5,
      payment_method: 'Bank Transfer',
      notes: 'Test invoice for deletion',
      seller_name: 'Test Seller',
      seller_email: 'seller@example.com',
      seller_phone: '987-654-3210',
      seller_address: '456 Seller Ave',
      items: [
        {
          description: 'Test Item 1',
          quantity: 2,
          unit_price: 100
        },
        {
          description: 'Test Item 2',
          quantity: 1,
          unit_price: 50
        }
      ]
    };

    const createdInvoice = await createInvoice(invoiceInput);
    invoiceId = createdInvoice.id;
  });

  it('should delete invoice', async () => {
    const deleteInput: DeleteInvoiceInput = {
      id: invoiceId
    };

    // Should not throw
    await deleteInvoice(deleteInput);

    // Verify invoice is deleted from database
    const invoices = await db.select()
      .from(invoicesTable)
      .where(eq(invoicesTable.id, invoiceId))
      .execute();

    expect(invoices).toHaveLength(0);
  });

  it('should cascade delete invoice items', async () => {
    // Verify items exist before deletion
    const itemsBefore = await db.select()
      .from(invoiceItemsTable)
      .where(eq(invoiceItemsTable.invoice_id, invoiceId))
      .execute();

    expect(itemsBefore.length).toBeGreaterThan(0);

    const deleteInput: DeleteInvoiceInput = {
      id: invoiceId
    };

    await deleteInvoice(deleteInput);

    // Verify items are also deleted (due to foreign key cascade)
    const itemsAfter = await db.select()
      .from(invoiceItemsTable)
      .where(eq(invoiceItemsTable.invoice_id, invoiceId))
      .execute();

    expect(itemsAfter).toHaveLength(0);
  });

  it('should throw error if invoice not found', async () => {
    const deleteInput: DeleteInvoiceInput = {
      id: 99999
    };

    expect(deleteInvoice(deleteInput)).rejects.toThrow(/Invoice with id 99999 not found/i);
  });
});