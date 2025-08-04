
import { db } from '../db';
import { paymentsTable, invoicesTable } from '../db/schema';
import { type CreatePaymentInput, type Payment } from '../schema';
import { eq } from 'drizzle-orm';

export async function createPayment(input: CreatePaymentInput): Promise<Payment> {
  try {
    // First, verify the invoice exists
    const existingInvoice = await db.select()
      .from(invoicesTable)
      .where(eq(invoicesTable.id, input.invoice_id))
      .execute();

    if (existingInvoice.length === 0) {
      throw new Error(`Invoice with id ${input.invoice_id} not found`);
    }

    const invoice = existingInvoice[0];

    // Create the payment record
    const paymentResult = await db.insert(paymentsTable)
      .values({
        invoice_id: input.invoice_id,
        amount: input.amount.toString(),
        payment_date: input.payment_date,
        payment_method: input.payment_method,
        notes: input.notes
      })
      .returning()
      .execute();

    const payment = paymentResult[0];

    // Calculate total payments for this invoice
    const totalPaymentsResult = await db.select({
      total: paymentsTable.amount
    })
      .from(paymentsTable)
      .where(eq(paymentsTable.invoice_id, input.invoice_id))
      .execute();

    const totalPaid = totalPaymentsResult.reduce((sum, p) => sum + parseFloat(p.total), 0);
    const invoiceTotal = parseFloat(invoice.total_amount);

    // Determine new invoice status
    let newStatus: 'Paid' | 'Partial' | 'Unpaid' = 'Unpaid';
    if (totalPaid >= invoiceTotal) {
      newStatus = 'Paid';
    } else if (totalPaid > 0) {
      newStatus = 'Partial';
    }

    // Update invoice status if it has changed
    if (newStatus !== invoice.status) {
      await db.update(invoicesTable)
        .set({ 
          status: newStatus,
          updated_at: new Date()
        })
        .where(eq(invoicesTable.id, input.invoice_id))
        .execute();
    }

    // Return payment with numeric conversion
    return {
      ...payment,
      amount: parseFloat(payment.amount)
    };
  } catch (error) {
    console.error('Payment creation failed:', error);
    throw error;
  }
}
