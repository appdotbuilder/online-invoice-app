import { db } from '../db';
import { invoicesTable } from '../db/schema';
import { type DeleteInvoiceInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function deleteInvoice(input: DeleteInvoiceInput): Promise<void> {
  try {
    // First check if invoice exists
    const existingInvoice = await db.select()
      .from(invoicesTable)
      .where(eq(invoicesTable.id, input.id))
      .execute();

    if (existingInvoice.length === 0) {
      throw new Error(`Invoice with id ${input.id} not found`);
    }

    await db.delete(invoicesTable)
      .where(eq(invoicesTable.id, input.id))
      .execute();
  } catch (error) {
    console.error(`Failed to delete invoice ${input.id}:`, error);
    throw error;
  }
}