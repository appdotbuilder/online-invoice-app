
import { db } from '../db';
import { invoicesTable } from '../db/schema';
import { desc } from 'drizzle-orm';
import { type Invoice } from '../schema';

export async function getInvoices(): Promise<Invoice[]> {
  try {
    const results = await db.select()
      .from(invoicesTable)
      .orderBy(desc(invoicesTable.created_at))
      .execute();

    // Convert numeric fields back to numbers
    return results.map(invoice => ({
      ...invoice,
      subtotal: parseFloat(invoice.subtotal),
      tax_rate: parseFloat(invoice.tax_rate),
      tax_amount: parseFloat(invoice.tax_amount),
      discount_rate: parseFloat(invoice.discount_rate),
      discount_amount: parseFloat(invoice.discount_amount),
      total_amount: parseFloat(invoice.total_amount)
    }));
  } catch (error) {
    console.error('Failed to fetch invoices:', error);
    throw error;
  }
}
