import { db } from '../db';
import { invoicesTable, invoiceItemsTable, customersTable } from '../db/schema';
import { type Invoice, type UpdateInvoiceInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateInvoice(input: UpdateInvoiceInput): Promise<Invoice> {
  try {
    const existingInvoice = await db.select()
      .from(invoicesTable)
      .where(eq(invoicesTable.id, input.id))
      .execute();

    if (existingInvoice.length === 0) {
      throw new Error(`Invoice with id ${input.id} not found`);
    }

    // Verify customer exists if customer_id is being updated
    if (input.customer_id) {
      const customer = await db.select()
        .from(customersTable)
        .where(eq(customersTable.id, input.customer_id))
        .execute();
      if (customer.length === 0) {
        throw new Error(`Customer with id ${input.customer_id} not found`);
      }
    }

    // Get current values for calculations
    let subtotal = parseFloat(existingInvoice[0].subtotal);
    let taxRate = parseFloat(existingInvoice[0].tax_rate);
    let discountRate = parseFloat(existingInvoice[0].discount_rate);

    // Recalculate totals if items are updated
    if (input.items) {
      subtotal = input.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    }
    if (input.tax_rate !== undefined) taxRate = input.tax_rate;
    if (input.discount_rate !== undefined) discountRate = input.discount_rate;

    const discount_amount = Math.round(subtotal * (discountRate / 100) * 100) / 100;
    const discounted_subtotal = subtotal - discount_amount;
    const tax_amount = Math.round(discounted_subtotal * (taxRate / 100) * 100) / 100;
    const total_amount = Math.round((discounted_subtotal + tax_amount) * 100) / 100;

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date(),
    };

    if (input.customer_id !== undefined) updateData.customer_id = input.customer_id;
    if (input.due_date !== undefined) updateData.due_date = input.due_date;
    if (input.payment_method !== undefined) updateData.payment_method = input.payment_method;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.notes !== undefined) updateData.notes = input.notes;
    if (input.seller_name !== undefined) updateData.seller_name = input.seller_name;
    if (input.seller_email !== undefined) updateData.seller_email = input.seller_email;
    if (input.seller_phone !== undefined) updateData.seller_phone = input.seller_phone;
    if (input.seller_address !== undefined) updateData.seller_address = input.seller_address;

    // Update calculated fields if items or rates changed
    if (input.items !== undefined || input.tax_rate !== undefined || input.discount_rate !== undefined) {
      updateData.subtotal = subtotal.toString();
      updateData.tax_rate = taxRate.toString();
      updateData.tax_amount = tax_amount.toString();
      updateData.discount_rate = discountRate.toString();
      updateData.discount_amount = discount_amount.toString();
      updateData.total_amount = total_amount.toString();
    }

    const result = await db.update(invoicesTable)
      .set(updateData)
      .where(eq(invoicesTable.id, input.id))
      .returning()
      .execute();

    const updatedInvoice = result[0];

    // Handle updating invoice items if provided
    if (input.items) {
      // Delete existing items for this invoice
      await db.delete(invoiceItemsTable)
        .where(eq(invoiceItemsTable.invoice_id, input.id))
        .execute();

      // Insert new items
      for (const item of input.items) {
        const item_total = item.quantity * item.unit_price;
        await db.insert(invoiceItemsTable)
          .values({
            invoice_id: updatedInvoice.id,
            description: item.description,
            quantity: item.quantity.toString(),
            unit_price: item.unit_price.toString(),
            total: item_total.toString()
          })
          .execute();
      }
    }

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
    console.error(`Failed to update invoice ${input.id}:`, error);
    throw error;
  }
}