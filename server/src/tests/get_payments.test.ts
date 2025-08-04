
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, invoicesTable, paymentsTable } from '../db/schema';
import { type CreateCustomerInput, type CreateInvoiceInput, type CreatePaymentInput } from '../schema';
import { getPayments } from '../handlers/get_payments';

describe('getPayments', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const testCustomer: CreateCustomerInput = {
    name: 'Test Customer',
    email: 'test@example.com',
    phone: '+1-555-123-4567',
    address: '123 Test St',
    city: 'Test City',
    postal_code: '12345'
  };

  const testInvoice: Omit<CreateInvoiceInput, 'customer_id' | 'items'> = {
    due_date: new Date('2024-12-31'),
    tax_rate: 10,
    discount_rate: 5,
    payment_method: 'Bank Transfer',
    notes: 'Test invoice',
    seller_name: 'Test Seller',
    seller_email: 'seller@example.com',
    seller_phone: '+1-555-987-6543',
    seller_address: '456 Seller Ave'
  };

  it('should return empty array when no payments exist for invoice', async () => {
    // Create customer first
    const customerResult = await db.insert(customersTable)
      .values(testCustomer)
      .returning()
      .execute();
    const customerId = customerResult[0].id;

    // Create invoice
    const invoiceResult = await db.insert(invoicesTable)
      .values({
        invoice_number: 'INV-001',
        customer_id: customerId,
        due_date: testInvoice.due_date,
        subtotal: '100.00',
        tax_rate: testInvoice.tax_rate.toString(),
        tax_amount: '10.00',
        discount_rate: testInvoice.discount_rate.toString(),
        discount_amount: '5.00',
        total_amount: '105.00',
        payment_method: testInvoice.payment_method,
        status: 'Unpaid',
        notes: testInvoice.notes,
        seller_name: testInvoice.seller_name,
        seller_email: testInvoice.seller_email,
        seller_phone: testInvoice.seller_phone,
        seller_address: testInvoice.seller_address
      })
      .returning()
      .execute();
    const invoiceId = invoiceResult[0].id;

    const result = await getPayments(invoiceId);

    expect(result).toEqual([]);
  });

  it('should return payments for specific invoice', async () => {
    // Create customer first
    const customerResult = await db.insert(customersTable)
      .values(testCustomer)
      .returning()
      .execute();
    const customerId = customerResult[0].id;

    // Create invoice
    const invoiceResult = await db.insert(invoicesTable)
      .values({
        invoice_number: 'INV-001',
        customer_id: customerId,
        due_date: testInvoice.due_date,
        subtotal: '100.00',
        tax_rate: testInvoice.tax_rate.toString(),
        tax_amount: '10.00',
        discount_rate: testInvoice.discount_rate.toString(),
        discount_amount: '5.00',
        total_amount: '105.00',
        payment_method: testInvoice.payment_method,
        status: 'Unpaid',
        notes: testInvoice.notes,
        seller_name: testInvoice.seller_name,
        seller_email: testInvoice.seller_email,
        seller_phone: testInvoice.seller_phone,
        seller_address: testInvoice.seller_address
      })
      .returning()
      .execute();
    const invoiceId = invoiceResult[0].id;

    // Create test payments
    const payment1: CreatePaymentInput = {
      invoice_id: invoiceId,
      amount: 50.00,
      payment_date: new Date('2024-01-15'),
      payment_method: 'Credit Card',
      notes: 'First payment'
    };

    const payment2: CreatePaymentInput = {
      invoice_id: invoiceId,
      amount: 55.00,
      payment_date: new Date('2024-01-20'),
      payment_method: 'Bank Transfer',
      notes: 'Final payment'
    };

    await db.insert(paymentsTable)
      .values([
        {
          invoice_id: payment1.invoice_id,
          amount: payment1.amount.toString(),
          payment_date: payment1.payment_date,
          payment_method: payment1.payment_method,
          notes: payment1.notes
        },
        {
          invoice_id: payment2.invoice_id,
          amount: payment2.amount.toString(),
          payment_date: payment2.payment_date,
          payment_method: payment2.payment_method,
          notes: payment2.notes
        }
      ])
      .execute();

    const result = await getPayments(invoiceId);

    expect(result).toHaveLength(2);
    
    // Check first payment
    const firstPayment = result.find(p => p.notes === 'First payment');
    expect(firstPayment).toBeDefined();
    expect(firstPayment!.amount).toEqual(50.00);
    expect(typeof firstPayment!.amount).toBe('number');
    expect(firstPayment!.payment_method).toEqual('Credit Card');
    expect(firstPayment!.payment_date).toBeInstanceOf(Date);
    expect(firstPayment!.created_at).toBeInstanceOf(Date);

    // Check second payment
    const secondPayment = result.find(p => p.notes === 'Final payment');
    expect(secondPayment).toBeDefined();
    expect(secondPayment!.amount).toEqual(55.00);
    expect(typeof secondPayment!.amount).toBe('number');
    expect(secondPayment!.payment_method).toEqual('Bank Transfer');
  });

  it('should not return payments from other invoices', async () => {
    // Create customer first
    const customerResult = await db.insert(customersTable)
      .values(testCustomer)
      .returning()
      .execute();
    const customerId = customerResult[0].id;

    // Create two invoices
    const invoice1Result = await db.insert(invoicesTable)
      .values({
        invoice_number: 'INV-001',
        customer_id: customerId,
        due_date: testInvoice.due_date,
        subtotal: '100.00',
        tax_rate: testInvoice.tax_rate.toString(),
        tax_amount: '10.00',
        discount_rate: testInvoice.discount_rate.toString(),
        discount_amount: '5.00',
        total_amount: '105.00',
        payment_method: testInvoice.payment_method,
        status: 'Unpaid',
        notes: testInvoice.notes,
        seller_name: testInvoice.seller_name,
        seller_email: testInvoice.seller_email,
        seller_phone: testInvoice.seller_phone,
        seller_address: testInvoice.seller_address
      })
      .returning()
      .execute();
    const invoice1Id = invoice1Result[0].id;

    const invoice2Result = await db.insert(invoicesTable)
      .values({
        invoice_number: 'INV-002',
        customer_id: customerId,
        due_date: testInvoice.due_date,
        subtotal: '200.00',
        tax_rate: testInvoice.tax_rate.toString(),
        tax_amount: '20.00',
        discount_rate: testInvoice.discount_rate.toString(),
        discount_amount: '10.00',
        total_amount: '210.00',
        payment_method: testInvoice.payment_method,
        status: 'Unpaid',
        notes: testInvoice.notes,
        seller_name: testInvoice.seller_name,
        seller_email: testInvoice.seller_email,
        seller_phone: testInvoice.seller_phone,
        seller_address: testInvoice.seller_address
      })
      .returning()
      .execute();
    const invoice2Id = invoice2Result[0].id;

    // Create payments for both invoices
    await db.insert(paymentsTable)
      .values([
        {
          invoice_id: invoice1Id,
          amount: '100.00',
          payment_date: new Date('2024-01-15'),
          payment_method: 'Credit Card',
          notes: 'Payment for invoice 1'
        },
        {
          invoice_id: invoice2Id,
          amount: '200.00',
          payment_date: new Date('2024-01-20'),
          payment_method: 'Bank Transfer',
          notes: 'Payment for invoice 2'
        }
      ])
      .execute();

    // Get payments only for invoice 1
    const result = await getPayments(invoice1Id);

    expect(result).toHaveLength(1);
    expect(result[0].notes).toEqual('Payment for invoice 1');
    expect(result[0].amount).toEqual(100.00);
  });
});
