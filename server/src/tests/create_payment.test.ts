
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, invoicesTable, paymentsTable } from '../db/schema';
import { type CreatePaymentInput } from '../schema';
import { createPayment } from '../handlers/create_payment';
import { eq } from 'drizzle-orm';

describe('createPayment', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let customerId: number;
  let invoiceId: number;

  beforeEach(async () => {
    // Create test customer
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        email: 'test@example.com'
      })
      .returning()
      .execute();
    customerId = customerResult[0].id;

    // Create test invoice
    const invoiceResult = await db.insert(invoicesTable)
      .values({
        invoice_number: 'INV-001',
        customer_id: customerId,
        due_date: new Date('2024-02-01'),
        subtotal: '1000.00',
        tax_rate: '10.00',
        tax_amount: '100.00',
        discount_rate: '0.00',
        discount_amount: '0.00',
        total_amount: '1100.00',
        payment_method: 'Bank Transfer',
        status: 'Unpaid',
        seller_name: 'Test Seller'
      })
      .returning()
      .execute();
    invoiceId = invoiceResult[0].id;
  });

  const testInput: CreatePaymentInput = {
    invoice_id: 0, // Will be set in tests
    amount: 500.00,
    payment_date: new Date('2024-01-15'),
    payment_method: 'Credit Card',
    notes: 'Partial payment'
  };

  it('should create a payment successfully', async () => {
    const input = { ...testInput, invoice_id: invoiceId };
    const result = await createPayment(input);

    expect(result.invoice_id).toEqual(invoiceId);
    expect(result.amount).toEqual(500.00);
    expect(typeof result.amount).toBe('number');
    expect(result.payment_date).toEqual(input.payment_date);
    expect(result.payment_method).toEqual('Credit Card');
    expect(result.notes).toEqual('Partial payment');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save payment to database', async () => {
    const input = { ...testInput, invoice_id: invoiceId };
    const result = await createPayment(input);

    const savedPayments = await db.select()
      .from(paymentsTable)
      .where(eq(paymentsTable.id, result.id))
      .execute();

    expect(savedPayments).toHaveLength(1);
    expect(savedPayments[0].invoice_id).toEqual(invoiceId);
    expect(parseFloat(savedPayments[0].amount)).toEqual(500.00);
    expect(savedPayments[0].payment_method).toEqual('Credit Card');
  });

  it('should update invoice status to Partial for partial payment', async () => {
    const input = { ...testInput, invoice_id: invoiceId, amount: 500.00 };
    await createPayment(input);

    const updatedInvoice = await db.select()
      .from(invoicesTable)
      .where(eq(invoicesTable.id, invoiceId))
      .execute();

    expect(updatedInvoice[0].status).toEqual('Partial');
  });

  it('should update invoice status to Paid for full payment', async () => {
    const input = { ...testInput, invoice_id: invoiceId, amount: 1100.00 };
    await createPayment(input);

    const updatedInvoice = await db.select()
      .from(invoicesTable)
      .where(eq(invoicesTable.id, invoiceId))
      .execute();

    expect(updatedInvoice[0].status).toEqual('Paid');
  });

  it('should update invoice status to Paid when total payments equal invoice total', async () => {
    // First partial payment
    const firstPayment = { ...testInput, invoice_id: invoiceId, amount: 600.00 };
    await createPayment(firstPayment);

    // Second payment to complete the total
    const secondPayment = { ...testInput, invoice_id: invoiceId, amount: 500.00 };
    await createPayment(secondPayment);

    const updatedInvoice = await db.select()
      .from(invoicesTable)
      .where(eq(invoicesTable.id, invoiceId))
      .execute();

    expect(updatedInvoice[0].status).toEqual('Paid');
  });

  it('should throw error for non-existent invoice', async () => {
    const input = { ...testInput, invoice_id: 99999 };
    
    expect(createPayment(input)).rejects.toThrow(/invoice.*not found/i);
  });

  it('should handle multiple payments correctly', async () => {
    // Create multiple payments
    const payment1 = { ...testInput, invoice_id: invoiceId, amount: 300.00 };
    const payment2 = { ...testInput, invoice_id: invoiceId, amount: 200.00 };

    const result1 = await createPayment(payment1);
    const result2 = await createPayment(payment2);

    expect(result1.amount).toEqual(300.00);
    expect(result2.amount).toEqual(200.00);

    // Check invoice status is Partial (total payments = 500, invoice total = 1100)
    const updatedInvoice = await db.select()
      .from(invoicesTable)
      .where(eq(invoicesTable.id, invoiceId))
      .execute();

    expect(updatedInvoice[0].status).toEqual('Partial');
  });
});
