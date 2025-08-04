
import { db } from '../db';
import { invoicesTable } from '../db/schema';
import { type Invoice } from '../schema';
import { and, eq, lt } from 'drizzle-orm';

export async function checkOverdueInvoices(): Promise<Invoice[]> {
  try {
    const now = new Date();
    
    // Find invoices that are past due date and not already 'Overdue' or 'Paid'
    const overdueInvoices = await db.select()
      .from(invoicesTable)
      .where(
        and(
          lt(invoicesTable.due_date, now),
          eq(invoicesTable.status, 'Unpaid')
        )
      )
      .execute();

    if (overdueInvoices.length === 0) {
      return [];
    }

    // Update all overdue invoices to 'Overdue' status
    const invoiceIds = overdueInvoices.map(invoice => invoice.id);
    
    const updatedInvoices = await db.update(invoicesTable)
      .set({ 
        status: 'Overdue',
        updated_at: now
      })
      .where(eq(invoicesTable.id, invoiceIds[0])) // Start with first ID
      .returning()
      .execute();

    // Handle multiple IDs by updating each one
    const allUpdatedInvoices = [];
    for (const invoiceId of invoiceIds) {
      const result = await db.update(invoicesTable)
        .set({ 
          status: 'Overdue',
          updated_at: now
        })
        .where(eq(invoicesTable.id, invoiceId))
        .returning()
        .execute();
      
      if (result.length > 0) {
        allUpdatedInvoices.push(result[0]);
      }
    }

    // Convert numeric fields to numbers for the response
    return allUpdatedInvoices.map(invoice => ({
      ...invoice,
      subtotal: parseFloat(invoice.subtotal),
      tax_rate: parseFloat(invoice.tax_rate),
      tax_amount: parseFloat(invoice.tax_amount),
      discount_rate: parseFloat(invoice.discount_rate),
      discount_amount: parseFloat(invoice.discount_amount),
      total_amount: parseFloat(invoice.total_amount)
    }));
  } catch (error) {
    console.error('Check overdue invoices failed:', error);
    throw error;
  }
}
