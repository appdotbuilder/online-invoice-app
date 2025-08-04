
import { db } from '../db';
import { customersTable, invoicesTable, invoiceItemsTable } from '../db/schema';
import { type CreateInvoiceInput, type Invoice } from '../schema';
import { eq } from 'drizzle-orm';

export async function createInvoice(input: CreateInvoiceInput): Promise<Invoice> {
  try {
    // Verify customer exists
    const customer = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, input.customer_id))
      .execute();

    if (customer.length === 0) {
      throw new Error(`Customer with id ${input.customer_id} not found`);
    }

    // Calculate totals from items
    const subtotal = input.items.reduce((sum, item) => {
      return sum + (item.quantity * item.unit_price);
    }, 0);

    const discount_amount = Math.round(subtotal * (input.discount_rate / 100) * 100) / 100;
    const discounted_subtotal = subtotal - discount_amount;
    const tax_amount = Math.round(discounted_subtotal * (input.tax_rate / 100) * 100) / 100;
    const total_amount = Math.round((discounted_subtotal + tax_amount) * 100) / 100;

    // Generate invoice number
    const invoiceCount = await db.select().from(invoicesTable).execute();
    const invoice_number = `INV-${String(invoiceCount.length + 1).padStart(6, '0')}`;

    // Create invoice
    const invoiceResult = await db.insert(invoicesTable)
      .values({
        invoice_number,
        customer_id: input.customer_id,
        due_date: input.due_date,
        subtotal: subtotal.toString(),
        tax_rate: input.tax_rate.toString(),
        tax_amount: tax_amount.toString(),
        discount_rate: input.discount_rate.toString(),
        discount_amount: discount_amount.toString(),
        total_amount: total_amount.toString(),
        payment_method: input.payment_method,
        status: 'Unpaid',
        notes: input.notes,
        seller_name: input.seller_name,
        seller_email: input.seller_email,
        seller_phone: input.seller_phone,
        seller_address: input.seller_address
      })
      .returning()
      .execute();

    const invoice = invoiceResult[0];

    // Create invoice items
    for (const item of input.items) {
      const item_total = item.quantity * item.unit_price;
      await db.insert(invoiceItemsTable)
        .values({
          invoice_id: invoice.id,
          description: item.description,
          quantity: item.quantity.toString(),
          unit_price: item.unit_price.toString(),
          total: item_total.toString()
        })
        .execute();
    }

    // Convert numeric fields back to numbers
    return {
      ...invoice,
      subtotal: parseFloat(invoice.subtotal),
      tax_rate: parseFloat(invoice.tax_rate),
      tax_amount: parseFloat(invoice.tax_amount),
      discount_rate: parseFloat(invoice.discount_rate),
      discount_amount: parseFloat(invoice.discount_amount),
      total_amount: parseFloat(invoice.total_amount)
    };
  } catch (error) {
    console.error('Invoice creation failed:', error);
    throw error;
  }
}
