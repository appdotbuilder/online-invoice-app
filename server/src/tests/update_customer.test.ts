import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable } from '../db/schema';
import { type CreateCustomerInput, type UpdateCustomerInput } from '../schema';
import { createCustomer } from '../handlers/create_customer';
import { updateCustomer } from '../handlers/update_customer';
import { eq } from 'drizzle-orm';

const testCustomerInput: CreateCustomerInput = {
  name: 'Test Customer',
  email: 'test@example.com',
  phone: '+1234567890',
  address: '123 Test Street',
  city: 'Test City',
  postal_code: '12345'
};

describe('updateCustomer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update customer fields', async () => {
    // Create initial customer
    const createdCustomer = await createCustomer(testCustomerInput);

    const updateInput: UpdateCustomerInput = {
      id: createdCustomer.id,
      name: 'Updated Customer Name',
      email: 'updated@example.com',
      phone: '+9876543210'
    };

    const result = await updateCustomer(updateInput);

    expect(result.id).toEqual(createdCustomer.id);
    expect(result.name).toEqual('Updated Customer Name');
    expect(result.email).toEqual('updated@example.com');
    expect(result.phone).toEqual('+9876543210');
    // Unchanged fields should remain the same
    expect(result.address).toEqual(testCustomerInput.address);
    expect(result.city).toEqual(testCustomerInput.city);
    expect(result.postal_code).toEqual(testCustomerInput.postal_code);
  });

  it('should update only provided fields', async () => {
    const createdCustomer = await createCustomer(testCustomerInput);

    const updateInput: UpdateCustomerInput = {
      id: createdCustomer.id,
      name: 'Partially Updated'
    };

    const result = await updateCustomer(updateInput);

    expect(result.name).toEqual('Partially Updated');
    // Other fields should remain unchanged
    expect(result.email).toEqual(testCustomerInput.email);
    expect(result.phone).toEqual(testCustomerInput.phone);
    expect(result.address).toEqual(testCustomerInput.address);
  });

  it('should save updated customer to database', async () => {
    const createdCustomer = await createCustomer(testCustomerInput);

    const updateInput: UpdateCustomerInput = {
      id: createdCustomer.id,
      name: 'Database Update Test',
      email: 'db@test.com'
    };

    await updateCustomer(updateInput);

    const customers = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, createdCustomer.id))
      .execute();

    expect(customers).toHaveLength(1);
    expect(customers[0].name).toEqual('Database Update Test');
    expect(customers[0].email).toEqual('db@test.com');
  });

  it('should throw error if customer not found', async () => {
    const updateInput: UpdateCustomerInput = {
      id: 99999,
      name: 'Non-existent Customer'
    };

    expect(updateCustomer(updateInput)).rejects.toThrow(/Customer with id 99999 not found/i);
  });
});