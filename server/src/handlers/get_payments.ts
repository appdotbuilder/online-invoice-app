
import { db } from '../db';
import { paymentsTable } from '../db/schema';
import { type Payment } from '../schema';
import { eq } from 'drizzle-orm';

export async function getPayments(invoiceId: number): Promise<Payment[]> {
  try {
    const results = await db.select()
      .from(paymentsTable)
      .where(eq(paymentsTable.invoice_id, invoiceId))
      .execute();

    // Convert numeric fields back to numbers
    return results.map(payment => ({
      ...payment,
      amount: parseFloat(payment.amount)
    }));
  } catch (error) {
    console.error('Failed to fetch payments:', error);
    throw error;
  }
}
