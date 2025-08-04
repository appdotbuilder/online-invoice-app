
import { db } from '../db';
import { invoicesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdateInvoiceStatusInput, type Invoice } from '../schema';

export async function updateInvoiceStatus(input: UpdateInvoiceStatusInput): Promise<Invoice> {
  try {
    // First verify the invoice exists
    const existingInvoice = await db.select()
      .from(invoicesTable)
      .where(eq(invoicesTable.id, input.id))
      .execute();

    if (existingInvoice.length === 0) {
      throw new Error(`Invoice with id ${input.id} not found`);
    }

    // Update the invoice status and updated_at timestamp
    const result = await db.update(invoicesTable)
      .set({
        status: input.status,
        updated_at: new Date()
      })
      .where(eq(invoicesTable.id, input.id))
      .returning()
      .execute();

    const updatedInvoice = result[0];

    // Convert numeric fields back to numbers before returning
    return {
      ...updatedInvoice,
      subtotal: parseFloat(updatedInvoice.subtotal),
      tax_rate: parseFloat(updatedInvoice.tax_rate),
      tax_amount: parseFloat(updatedInvoice.tax_amount),
      discount_rate: parseFloat(updatedInvoice.discount_rate),
      discount_amount: parseFloat(updatedInvoice.discount_amount),
      total_amount: parseFloat(updatedInvoice.total_amount)
    };
  } catch (error) {
    console.error('Invoice status update failed:', error);
    throw error;
  }
}
