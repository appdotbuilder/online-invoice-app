import { db } from '../db';
import { customersTable } from '../db/schema';
import { type DeleteCustomerInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function deleteCustomer(input: DeleteCustomerInput): Promise<void> {
  try {
    // First check if customer exists
    const existingCustomer = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, input.id))
      .execute();

    if (existingCustomer.length === 0) {
      throw new Error(`Customer with id ${input.id} not found`);
    }

    await db.delete(customersTable)
      .where(eq(customersTable.id, input.id))
      .execute();
  } catch (error) {
    console.error(`Failed to delete customer ${input.id}:`, error);
    throw error;
  }
}