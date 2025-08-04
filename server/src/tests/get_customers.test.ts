
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable } from '../db/schema';
import { type CreateCustomerInput } from '../schema';
import { getCustomers } from '../handlers/get_customers';

describe('getCustomers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no customers exist', async () => {
    const result = await getCustomers();

    expect(result).toEqual([]);
  });

  it('should return all customers', async () => {
    // Create test customers
    const customer1: CreateCustomerInput = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      address: '123 Main St',
      city: 'New York',
      postal_code: '10001'
    };

    const customer2: CreateCustomerInput = {
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+0987654321',
      address: '456 Oak Ave',
      city: 'Los Angeles',
      postal_code: '90210'
    };

    await db.insert(customersTable)
      .values([customer1, customer2])
      .execute();

    const result = await getCustomers();

    expect(result).toHaveLength(2);
    
    // Check first customer
    const john = result.find(c => c.name === 'John Doe');
    expect(john).toBeDefined();
    expect(john!.email).toEqual('john@example.com');
    expect(john!.phone).toEqual('+1234567890');
    expect(john!.address).toEqual('123 Main St');
    expect(john!.city).toEqual('New York');
    expect(john!.postal_code).toEqual('10001');
    expect(john!.id).toBeDefined();
    expect(john!.created_at).toBeInstanceOf(Date);

    // Check second customer
    const jane = result.find(c => c.name === 'Jane Smith');
    expect(jane).toBeDefined();
    expect(jane!.email).toEqual('jane@example.com');
    expect(jane!.phone).toEqual('+0987654321');
    expect(jane!.address).toEqual('456 Oak Ave');
    expect(jane!.city).toEqual('Los Angeles');
    expect(jane!.postal_code).toEqual('90210');
    expect(jane!.id).toBeDefined();
    expect(jane!.created_at).toBeInstanceOf(Date);
  });

  it('should handle customers with nullable fields', async () => {
    // Create customer with minimal required fields
    const minimalCustomer: CreateCustomerInput = {
      name: 'Minimal Customer',
      email: null,
      phone: null,
      address: null,
      city: null,
      postal_code: null
    };

    await db.insert(customersTable)
      .values(minimalCustomer)
      .execute();

    const result = await getCustomers();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Minimal Customer');
    expect(result[0].email).toBeNull();
    expect(result[0].phone).toBeNull();
    expect(result[0].address).toBeNull();
    expect(result[0].city).toBeNull();
    expect(result[0].postal_code).toBeNull();
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });
});
