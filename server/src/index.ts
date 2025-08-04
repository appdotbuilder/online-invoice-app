
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createCustomerInputSchema,
  createInvoiceInputSchema,
  updateInvoiceStatusInputSchema,
  createPaymentInputSchema
} from './schema';

// Import handlers
import { createCustomer } from './handlers/create_customer';
import { getCustomers } from './handlers/get_customers';
import { createInvoice } from './handlers/create_invoice';
import { getInvoices } from './handlers/get_invoices';
import { getInvoiceDetails } from './handlers/get_invoice_details';
import { updateInvoiceStatus } from './handlers/update_invoice_status';
import { createPayment } from './handlers/create_payment';
import { getPayments } from './handlers/get_payments';
import { checkOverdueInvoices } from './handlers/check_overdue_invoices';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Customer routes
  createCustomer: publicProcedure
    .input(createCustomerInputSchema)
    .mutation(({ input }) => createCustomer(input)),
  
  getCustomers: publicProcedure
    .query(() => getCustomers()),

  // Invoice routes
  createInvoice: publicProcedure
    .input(createInvoiceInputSchema)
    .mutation(({ input }) => createInvoice(input)),
  
  getInvoices: publicProcedure
    .query(() => getInvoices()),
  
  getInvoiceDetails: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getInvoiceDetails(input.id)),
  
  updateInvoiceStatus: publicProcedure
    .input(updateInvoiceStatusInputSchema)
    .mutation(({ input }) => updateInvoiceStatus(input)),

  // Payment routes
  createPayment: publicProcedure
    .input(createPaymentInputSchema)
    .mutation(({ input }) => createPayment(input)),
  
  getPayments: publicProcedure
    .input(z.object({ invoiceId: z.number() }))
    .query(({ input }) => getPayments(input.invoiceId)),

  // Utility routes
  checkOverdueInvoices: publicProcedure
    .mutation(() => checkOverdueInvoices()),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
