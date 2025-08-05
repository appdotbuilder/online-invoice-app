import { db } from '../db';
import { customersTable } from '../db/schema';
import { type Customer, type UpdateCustomerInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateCustomer(input: UpdateCustomerInput): Promise<Customer> {
  try {
    const existingCustomer = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, input.id))
      .execute();

    if (existingCustomer.length === 0) {
      throw new Error(`Customer with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: any = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.email !== undefined) updateData.email = input.email;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.address !== undefined) updateData.address = input.address;
    if (input.city !== undefined) updateData.city = input.city;
    if (input.postal_code !== undefined) updateData.postal_code = input.postal_code;

    const result = await db.update(customersTable)
      .set(updateData)
      .where(eq(customersTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error(`Failed to update customer ${input.id}:`, error);
    throw error;
  }
}