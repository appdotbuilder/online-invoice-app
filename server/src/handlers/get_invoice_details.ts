
import { db } from '../db';
import { customersTable, invoicesTable, invoiceItemsTable, paymentsTable } from '../db/schema';
import { type InvoiceWithDetails } from '../schema';
import { eq } from 'drizzle-orm';

export async function getInvoiceDetails(invoiceId: number): Promise<InvoiceWithDetails | null> {
  try {
    // Get invoice with customer data
    const invoiceResults = await db.select()
      .from(invoicesTable)
      .innerJoin(customersTable, eq(invoicesTable.customer_id, customersTable.id))
      .where(eq(invoicesTable.id, invoiceId))
      .execute();

    if (invoiceResults.length === 0) {
      return null;
    }

    const invoiceData = invoiceResults[0];

    // Get invoice items
    const itemResults = await db.select()
      .from(invoiceItemsTable)
      .where(eq(invoiceItemsTable.invoice_id, invoiceId))
      .execute();

    // Get payments
    const paymentResults = await db.select()
      .from(paymentsTable)
      .where(eq(paymentsTable.invoice_id, invoiceId))
      .execute();

    // Convert numeric fields and structure the response
    return {
      invoice: {
        ...invoiceData.invoices,
        subtotal: parseFloat(invoiceData.invoices.subtotal),
        tax_rate: parseFloat(invoiceData.invoices.tax_rate),
        tax_amount: parseFloat(invoiceData.invoices.tax_amount),
        discount_rate: parseFloat(invoiceData.invoices.discount_rate),
        discount_amount: parseFloat(invoiceData.invoices.discount_amount),
        total_amount: parseFloat(invoiceData.invoices.total_amount)
      },
      customer: invoiceData.customers,
      items: itemResults.map(item => ({
        ...item,
        quantity: parseFloat(item.quantity),
        unit_price: parseFloat(item.unit_price),
        total: parseFloat(item.total)
      })),
      payments: paymentResults.map(payment => ({
        ...payment,
        amount: parseFloat(payment.amount)
      }))
    };
  } catch (error) {
    console.error('Failed to get invoice details:', error);
    throw error;
  }
}
