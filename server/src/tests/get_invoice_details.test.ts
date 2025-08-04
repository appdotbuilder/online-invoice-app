
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, invoicesTable, invoiceItemsTable, paymentsTable } from '../db/schema';
import { getInvoiceDetails } from '../handlers/get_invoice_details';

describe('getInvoiceDetails', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return complete invoice details with customer, items, and payments', async () => {
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

    const customerId = customerResult[0].id;

    // Create test invoice
    const invoiceResult = await db.insert(invoicesTable)
      .values({
        invoice_number: 'INV-2024-001',
        customer_id: customerId,
        due_date: new Date('2024-12-31'),
        subtotal: '100.00',
        tax_rate: '10.00',
        tax_amount: '10.00',
        discount_rate: '5.00',
        discount_amount: '5.00',
        total_amount: '105.00',
        payment_method: 'Credit Card',
        status: 'Unpaid',
        notes: 'Test invoice',
        seller_name: 'Test Seller',
        seller_email: 'seller@example.com',
        seller_phone: '987-654-3210',
        seller_address: '456 Seller Ave'
      })
      .returning()
      .execute();

    const invoiceId = invoiceResult[0].id;

    // Create test invoice items
    await db.insert(invoiceItemsTable)
      .values([
        {
          invoice_id: invoiceId,
          description: 'Test Item 1',
          quantity: '2.00',
          unit_price: '25.00',
          total: '50.00'
        },
        {
          invoice_id: invoiceId,
          description: 'Test Item 2',
          quantity: '1.00',
          unit_price: '50.00',
          total: '50.00'
        }
      ])
      .execute();

    // Create test payments
    await db.insert(paymentsTable)
      .values([
        {
          invoice_id: invoiceId,
          amount: '50.00',
          payment_date: new Date('2024-01-15'),
          payment_method: 'Credit Card',
          notes: 'Partial payment'
        },
        {
          invoice_id: invoiceId,
          amount: '55.00',
          payment_date: new Date('2024-01-20'),
          payment_method: 'Bank Transfer',
          notes: 'Final payment'
        }
      ])
      .execute();

    const result = await getInvoiceDetails(invoiceId);

    expect(result).not.toBeNull();
    
    // Verify invoice data with proper numeric conversions
    expect(result!.invoice.id).toBe(invoiceId);
    expect(result!.invoice.invoice_number).toBe('INV-2024-001');
    expect(result!.invoice.subtotal).toBe(100.00);
    expect(typeof result!.invoice.subtotal).toBe('number');
    expect(result!.invoice.tax_rate).toBe(10.00);
    expect(result!.invoice.tax_amount).toBe(10.00);
    expect(result!.invoice.discount_rate).toBe(5.00);
    expect(result!.invoice.discount_amount).toBe(5.00);
    expect(result!.invoice.total_amount).toBe(105.00);
    expect(result!.invoice.payment_method).toBe('Credit Card');
    expect(result!.invoice.status).toBe('Unpaid');
    expect(result!.invoice.seller_name).toBe('Test Seller');

    // Verify customer data
    expect(result!.customer.id).toBe(customerId);
    expect(result!.customer.name).toBe('Test Customer');
    expect(result!.customer.email).toBe('test@example.com');
    expect(result!.customer.phone).toBe('123-456-7890');
    expect(result!.customer.city).toBe('Test City');

    // Verify invoice items with numeric conversions
    expect(result!.items).toHaveLength(2);
    expect(result!.items[0].description).toBe('Test Item 1');
    expect(result!.items[0].quantity).toBe(2.00);
    expect(typeof result!.items[0].quantity).toBe('number');
    expect(result!.items[0].unit_price).toBe(25.00);
    expect(result!.items[0].total).toBe(50.00);
    expect(result!.items[1].description).toBe('Test Item 2');
    expect(result!.items[1].quantity).toBe(1.00);
    expect(result!.items[1].unit_price).toBe(50.00);
    expect(result!.items[1].total).toBe(50.00);

    // Verify payments with numeric conversions
    expect(result!.payments).toHaveLength(2);
    expect(result!.payments[0].amount).toBe(50.00);
    expect(typeof result!.payments[0].amount).toBe('number');
    expect(result!.payments[0].payment_method).toBe('Credit Card');
    expect(result!.payments[0].notes).toBe('Partial payment');
    expect(result!.payments[1].amount).toBe(55.00);
    expect(result!.payments[1].payment_method).toBe('Bank Transfer');
    expect(result!.payments[1].notes).toBe('Final payment');
  });

  it('should return null for non-existent invoice', async () => {
    const result = await getInvoiceDetails(999);
    expect(result).toBeNull();
  });

  it('should handle invoice with no items or payments', async () => {
    // Create test customer
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Empty Invoice Customer',
        email: 'empty@example.com'
      })
      .returning()
      .execute();

    const customerId = customerResult[0].id;

    // Create invoice without items or payments
    const invoiceResult = await db.insert(invoicesTable)
      .values({
        invoice_number: 'INV-2024-002',
        customer_id: customerId,
        due_date: new Date('2024-12-31'),
        subtotal: '0.00',
        tax_rate: '0.00',
        tax_amount: '0.00',
        discount_rate: '0.00',
        discount_amount: '0.00',
        total_amount: '0.00',
        payment_method: 'Cash',
        status: 'Unpaid',
        seller_name: 'Test Seller'
      })
      .returning()
      .execute();

    const invoiceId = invoiceResult[0].id;

    const result = await getInvoiceDetails(invoiceId);

    expect(result).not.toBeNull();
    expect(result!.invoice.id).toBe(invoiceId);
    expect(result!.customer.id).toBe(customerId);
    expect(result!.items).toHaveLength(0);
    expect(result!.payments).toHaveLength(0);
  });

  it('should handle dates correctly', async () => {
    // Create test customer
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Date Test Customer',
        email: 'date@example.com'
      })
      .returning()
      .execute();

    const customerId = customerResult[0].id;

    const dueDate = new Date('2024-12-25');
    const invoiceDate = new Date('2024-01-01');

    // Create invoice with specific dates
    const invoiceResult = await db.insert(invoicesTable)
      .values({
        invoice_number: 'INV-2024-003',
        customer_id: customerId,
        invoice_date: invoiceDate,
        due_date: dueDate,
        subtotal: '100.00',
        tax_rate: '0.00',
        tax_amount: '0.00',
        discount_rate: '0.00',
        discount_amount: '0.00',
        total_amount: '100.00',
        payment_method: 'Check',
        seller_name: 'Date Seller'
      })
      .returning()
      .execute();

    const invoiceId = invoiceResult[0].id;

    const result = await getInvoiceDetails(invoiceId);

    expect(result).not.toBeNull();
    expect(result!.invoice.invoice_date).toBeInstanceOf(Date);
    expect(result!.invoice.due_date).toBeInstanceOf(Date);
    expect(result!.invoice.due_date.toISOString().substring(0, 10)).toBe('2024-12-25');
    expect(result!.customer.created_at).toBeInstanceOf(Date);
  });
});
