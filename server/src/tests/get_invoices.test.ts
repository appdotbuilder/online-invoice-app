
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, invoicesTable } from '../db/schema';
import { getInvoices } from '../handlers/get_invoices';

describe('getInvoices', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no invoices exist', async () => {
    const result = await getInvoices();
    expect(result).toEqual([]);
  });

  it('should fetch all invoices with proper numeric conversions', async () => {
    // Create test customer first
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const customerId = customerResult[0].id;

    // Create test invoice
    await db.insert(invoicesTable)
      .values({
        invoice_number: 'INV-001',
        customer_id: customerId,
        due_date: new Date('2024-12-31'),
        subtotal: '100.50',
        tax_rate: '11.00',
        tax_amount: '11.06',
        discount_rate: '5.00',
        discount_amount: '5.03',
        total_amount: '106.53',
        payment_method: 'Credit Card',
        seller_name: 'Test Seller'
      })
      .execute();

    const result = await getInvoices();

    expect(result).toHaveLength(1);
    const invoice = result[0];
    
    // Verify basic fields
    expect(invoice.invoice_number).toEqual('INV-001');
    expect(invoice.customer_id).toEqual(customerId);
    expect(invoice.payment_method).toEqual('Credit Card');
    expect(invoice.status).toEqual('Unpaid');
    expect(invoice.seller_name).toEqual('Test Seller');
    
    // Verify numeric conversions
    expect(typeof invoice.subtotal).toBe('number');
    expect(invoice.subtotal).toEqual(100.5);
    expect(typeof invoice.tax_rate).toBe('number');
    expect(invoice.tax_rate).toEqual(11);
    expect(typeof invoice.tax_amount).toBe('number');
    expect(invoice.tax_amount).toEqual(11.06);
    expect(typeof invoice.discount_rate).toBe('number');
    expect(invoice.discount_rate).toEqual(5);
    expect(typeof invoice.discount_amount).toBe('number');
    expect(invoice.discount_amount).toEqual(5.03);
    expect(typeof invoice.total_amount).toBe('number');
    expect(invoice.total_amount).toEqual(106.53);
    
    // Verify dates
    expect(invoice.invoice_date).toBeInstanceOf(Date);
    expect(invoice.due_date).toBeInstanceOf(Date);
    expect(invoice.created_at).toBeInstanceOf(Date);
    expect(invoice.updated_at).toBeInstanceOf(Date);
  });

  it('should sort invoices by creation date (newest first)', async () => {
    // Create test customer
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const customerId = customerResult[0].id;

    // Create first invoice
    const firstInvoice = await db.insert(invoicesTable)
      .values({
        invoice_number: 'INV-001',
        customer_id: customerId,
        due_date: new Date('2024-12-31'),
        subtotal: '100.00',
        tax_rate: '11.00',
        tax_amount: '11.00',
        discount_rate: '0.00',
        discount_amount: '0.00',
        total_amount: '111.00',
        payment_method: 'Credit Card',
        seller_name: 'Test Seller'
      })
      .returning()
      .execute();

    // Wait a small amount to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    // Create second invoice (newer)
    const secondInvoice = await db.insert(invoicesTable)
      .values({
        invoice_number: 'INV-002',
        customer_id: customerId,
        due_date: new Date('2024-12-31'),
        subtotal: '200.00',
        tax_rate: '11.00',
        tax_amount: '22.00',
        discount_rate: '0.00',
        discount_amount: '0.00',
        total_amount: '222.00',
        payment_method: 'Bank Transfer',
        seller_name: 'Test Seller'
      })
      .returning()
      .execute();

    const result = await getInvoices();

    expect(result).toHaveLength(2);
    
    // Newest should be first
    expect(result[0].invoice_number).toEqual('INV-002');
    expect(result[0].total_amount).toEqual(222);
    expect(result[1].invoice_number).toEqual('INV-001');
    expect(result[1].total_amount).toEqual(111);
    
    // Verify ordering by timestamp
    expect(result[0].created_at.getTime()).toBeGreaterThanOrEqual(result[1].created_at.getTime());
  });

  it('should handle multiple invoices with different statuses', async () => {
    // Create test customer
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const customerId = customerResult[0].id;

    // Create invoices with different statuses
    await db.insert(invoicesTable)
      .values([
        {
          invoice_number: 'INV-001',
          customer_id: customerId,
          due_date: new Date('2024-12-31'),
          subtotal: '100.00',
          tax_rate: '11.00',
          tax_amount: '11.00',
          discount_rate: '0.00',
          discount_amount: '0.00',
          total_amount: '111.00',
          payment_method: 'Credit Card',
          status: 'Paid',
          seller_name: 'Test Seller'
        },
        {
          invoice_number: 'INV-002',
          customer_id: customerId,
          due_date: new Date('2024-12-31'),
          subtotal: '200.00',
          tax_rate: '11.00',
          tax_amount: '22.00',
          discount_rate: '0.00',
          discount_amount: '0.00',
          total_amount: '222.00',
          payment_method: 'Bank Transfer',
          status: 'Overdue',
          seller_name: 'Test Seller'
        }
      ])
      .execute();

    const result = await getInvoices();

    expect(result).toHaveLength(2);
    
    // Check that both statuses are preserved
    const statuses = result.map(invoice => invoice.status).sort();
    expect(statuses).toEqual(['Overdue', 'Paid']);
    
    // Verify all invoices have properly converted numeric fields
    result.forEach(invoice => {
      expect(typeof invoice.subtotal).toBe('number');
      expect(typeof invoice.tax_rate).toBe('number');
      expect(typeof invoice.tax_amount).toBe('number');
      expect(typeof invoice.discount_rate).toBe('number');
      expect(typeof invoice.discount_amount).toBe('number');
      expect(typeof invoice.total_amount).toBe('number');
    });
  });
});
