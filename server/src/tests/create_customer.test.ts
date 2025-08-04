
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable } from '../db/schema';
import { type CreateCustomerInput } from '../schema';
import { createCustomer } from '../handlers/create_customer';
import { eq } from 'drizzle-orm';

// Test input with all fields
const testInput: CreateCustomerInput = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+1234567890',
  address: '123 Main St',
  city: 'Anytown',
  postal_code: '12345'
};

describe('createCustomer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a customer with all fields', async () => {
    const result = await createCustomer(testInput);

    // Basic field validation
    expect(result.name).toEqual('John Doe');
    expect(result.email).toEqual('john.doe@example.com');
    expect(result.phone).toEqual('+1234567890');
    expect(result.address).toEqual('123 Main St');
    expect(result.city).toEqual('Anytown');
    expect(result.postal_code).toEqual('12345');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save customer to database', async () => {
    const result = await createCustomer(testInput);

    // Query using proper drizzle syntax
    const customers = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, result.id))
      .execute();

    expect(customers).toHaveLength(1);
    expect(customers[0].name).toEqual('John Doe');
    expect(customers[0].email).toEqual('john.doe@example.com');
    expect(customers[0].phone).toEqual('+1234567890');
    expect(customers[0].address).toEqual('123 Main St');
    expect(customers[0].city).toEqual('Anytown');
    expect(customers[0].postal_code).toEqual('12345');
    expect(customers[0].created_at).toBeInstanceOf(Date);
  });

  it('should create customer with nullable fields as null', async () => {
    const minimalInput: CreateCustomerInput = {
      name: 'Jane Smith',
      email: null,
      phone: null,
      address: null,
      city: null,
      postal_code: null
    };

    const result = await createCustomer(minimalInput);

    expect(result.name).toEqual('Jane Smith');
    expect(result.email).toBeNull();
    expect(result.phone).toBeNull();
    expect(result.address).toBeNull();
    expect(result.city).toBeNull();
    expect(result.postal_code).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create customer with only required fields', async () => {
    const requiredOnlyInput: CreateCustomerInput = {
      name: 'Bob Wilson',
      email: null,
      phone: null,
      address: null,
      city: null,
      postal_code: null
    };

    const result = await createCustomer(requiredOnlyInput);

    // Verify in database
    const customers = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, result.id))
      .execute();

    expect(customers).toHaveLength(1);
    expect(customers[0].name).toEqual('Bob Wilson');
    expect(customers[0].email).toBeNull();
    expect(customers[0].phone).toBeNull();
    expect(customers[0].address).toBeNull();
    expect(customers[0].city).toBeNull();
    expect(customers[0].postal_code).toBeNull();
  });
});
