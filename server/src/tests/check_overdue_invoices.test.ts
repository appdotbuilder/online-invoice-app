
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, invoicesTable } from '../db/schema';
import { type CreateCustomerInput, type CreateInvoiceInput } from '../schema';
import { checkOverdueInvoices } from '../handlers/check_overdue_invoices';
import { eq } from 'drizzle-orm';

// Test customer data
const testCustomer: CreateCustomerInput = {
  name: 'Test Customer',
  email: 'test@example.com',
  phone: '555-0123',
  address: '123 Test St',
  city: 'Test City',
  postal_code: '12345'
};

describe('checkOverdueInvoices', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update overdue unpaid invoices to overdue status', async () => {
    // Create a test customer first
    const customerResult = await db.insert(customersTable)
      .values(testCustomer)
      .returning()
      .execute();
    const customer = customerResult[0];

    // Create an overdue invoice (due yesterday)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const invoiceResult = await db.insert(invoicesTable)
      .values({
        invoice_number: 'INV-001',
        customer_id: customer.id,
        due_date: yesterday,
        subtotal: '100.00',
        tax_rate: '11.00',
        tax_amount: '11.00',
        discount_rate: '0.00',
        discount_amount: '0.00',
        total_amount: '111.00',
        payment_method: 'Bank Transfer',
        status: 'Unpaid',
        seller_name: 'Test Seller',
        seller_email: 'seller@example.com',
        seller_phone: '555-0456',
        seller_address: '456 Seller St'
      })
      .returning()
      .execute();

    const createdInvoice = invoiceResult[0];
    expect(createdInvoice.status).toBe('Unpaid');

    // Run the check overdue invoices function
    const updatedInvoices = await checkOverdueInvoices();

    // Verify the invoice was updated
    expect(updatedInvoices).toHaveLength(1);
    expect(updatedInvoices[0].id).toBe(createdInvoice.id);
    expect(updatedInvoices[0].status).toBe('Overdue');
    expect(updatedInvoices[0].subtotal).toBe(100.00);
    expect(updatedInvoices[0].tax_rate).toBe(11.00);
    expect(updatedInvoices[0].total_amount).toBe(111.00);

    // Verify the database was actually updated
    const dbInvoice = await db.select()
      .from(invoicesTable)
      .where(eq(invoicesTable.id, createdInvoice.id))
      .execute();

    expect(dbInvoice[0].status).toBe('Overdue');
  });

  it('should not update paid invoices that are overdue', async () => {
    // Create a test customer first
    const customerResult = await db.insert(customersTable)
      .values(testCustomer)
      .returning()
      .execute();
    const customer = customerResult[0];

    // Create an overdue but paid invoice
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await db.insert(invoicesTable)
      .values({
        invoice_number: 'INV-002',
        customer_id: customer.id,
        due_date: yesterday,
        subtotal: '100.00',
        tax_rate: '11.00',
        tax_amount: '11.00',
        discount_rate: '0.00',
        discount_amount: '0.00',
        total_amount: '111.00',
        payment_method: 'Bank Transfer',
        status: 'Paid',
        seller_name: 'Test Seller',
        seller_email: 'seller@example.com',
        seller_phone: '555-0456',
        seller_address: '456 Seller St'
      })
      .returning()
      .execute();

    // Run the check overdue invoices function
    const updatedInvoices = await checkOverdueInvoices();

    // Should not update paid invoices
    expect(updatedInvoices).toHaveLength(0);
  });

  it('should not update unpaid invoices that are not yet overdue', async () => {
    // Create a test customer first
    const customerResult = await db.insert(customersTable)
      .values(testCustomer)
      .returning()
      .execute();
    const customer = customerResult[0];

    // Create an unpaid invoice due tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    await db.insert(invoicesTable)
      .values({
        invoice_number: 'INV-003',
        customer_id: customer.id,
        due_date: tomorrow,
        subtotal: '100.00',
        tax_rate: '11.00',
        tax_amount: '11.00',
        discount_rate: '0.00',
        discount_amount: '0.00',
        total_amount: '111.00',
        payment_method: 'Bank Transfer',
        status: 'Unpaid',
        seller_name: 'Test Seller',
        seller_email: 'seller@example.com',
        seller_phone: '555-0456',
        seller_address: '456 Seller St'
      })
      .returning()
      .execute();

    // Run the check overdue invoices function
    const updatedInvoices = await checkOverdueInvoices();

    // Should not update future invoices
    expect(updatedInvoices).toHaveLength(0);
  });

  it('should handle multiple overdue invoices', async () => {
    // Create a test customer first
    const customerResult = await db.insert(customersTable)
      .values(testCustomer)
      .returning()
      .execute();
    const customer = customerResult[0];

    // Create multiple overdue invoices
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    // First overdue invoice
    await db.insert(invoicesTable)
      .values({
        invoice_number: 'INV-004',
        customer_id: customer.id,
        due_date: yesterday,
        subtotal: '100.00',
        tax_rate: '11.00',
        tax_amount: '11.00',
        discount_rate: '0.00',
        discount_amount: '0.00',
        total_amount: '111.00',
        payment_method: 'Bank Transfer',
        status: 'Unpaid',
        seller_name: 'Test Seller',
        seller_email: 'seller@example.com',
        seller_phone: '555-0456',
        seller_address: '456 Seller St'
      })
      .returning()
      .execute();

    // Second overdue invoice
    await db.insert(invoicesTable)
      .values({
        invoice_number: 'INV-005',
        customer_id: customer.id,
        due_date: twoDaysAgo,
        subtotal: '200.00',
        tax_rate: '11.00',
        tax_amount: '22.00',
        discount_rate: '0.00',
        discount_amount: '0.00',
        total_amount: '222.00',
        payment_method: 'Credit Card',
        status: 'Unpaid',
        seller_name: 'Test Seller',
        seller_email: 'seller@example.com',
        seller_phone: '555-0456',
        seller_address: '456 Seller St'
      })
      .returning()
      .execute();

    // Run the check overdue invoices function
    const updatedInvoices = await checkOverdueInvoices();

    // Should update both invoices
    expect(updatedInvoices).toHaveLength(2);
    updatedInvoices.forEach(invoice => {
      expect(invoice.status).toBe('Overdue');
      expect(typeof invoice.subtotal).toBe('number');
      expect(typeof invoice.total_amount).toBe('number');
    });
  });

  it('should return empty array when no overdue invoices exist', async () => {
    // Run the check overdue invoices function with no data
    const updatedInvoices = await checkOverdueInvoices();

    // Should return empty array
    expect(updatedInvoices).toHaveLength(0);
  });
});
