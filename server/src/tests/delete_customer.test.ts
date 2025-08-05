import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable } from '../db/schema';
import { type CreateCustomerInput, type DeleteCustomerInput } from '../schema';
import { createCustomer } from '../handlers/create_customer';
import { deleteCustomer } from '../handlers/delete_customer';
import { eq } from 'drizzle-orm';

const testCustomerInput: CreateCustomerInput = {
  name: 'Test Customer for Deletion',
  email: 'delete@example.com',
  phone: '+1234567890',
  address: '123 Delete Street',
  city: 'Delete City',
  postal_code: '12345'
};

describe('deleteCustomer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete customer', async () => {
    // Create customer first
    const createdCustomer = await createCustomer(testCustomerInput);

    const deleteInput: DeleteCustomerInput = {
      id: createdCustomer.id
    };

    // Should not throw
    await deleteCustomer(deleteInput);

    // Verify customer is deleted from database
    const customers = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, createdCustomer.id))
      .execute();

    expect(customers).toHaveLength(0);
  });

  it('should throw error if customer not found', async () => {
    const deleteInput: DeleteCustomerInput = {
      id: 99999
    };

    expect(deleteCustomer(deleteInput)).rejects.toThrow(/Customer with id 99999 not found/i);
  });
});