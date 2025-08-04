
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Users, DollarSign, Clock, AlertTriangle } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { InvoiceForm } from '@/components/InvoiceForm';
import { CustomerForm } from '@/components/CustomerForm';
import { InvoiceList } from '@/components/InvoiceList';
import { CustomerList } from '@/components/CustomerList';
import { InvoiceDetails } from '@/components/InvoiceDetails';
import type { Invoice, Customer, InvoiceWithDetails, InvoiceStatus } from '../../server/src/schema';

function App() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithDetails | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadInvoices = useCallback(async () => {
    try {
      const result = await trpc.getInvoices.query();
      setInvoices(result);
    } catch (error) {
      console.error('Failed to load invoices:', error);
    }
  }, []);

  const loadCustomers = useCallback(async () => {
    try {
      const result = await trpc.getCustomers.query();
      setCustomers(result);
    } catch (error) {
      console.error('Failed to load customers:', error);
    }
  }, []);

  useEffect(() => {
    loadInvoices();
    loadCustomers();
  }, [loadInvoices, loadCustomers]);

  const handleInvoiceCreated = useCallback(async (invoice: Invoice) => {
    setInvoices((prev: Invoice[]) => [invoice, ...prev]);
    setShowInvoiceForm(false);
    setActiveTab('invoices');
  }, []);

  const handleCustomerCreated = useCallback(async (customer: Customer) => {
    setCustomers((prev: Customer[]) => [...prev, customer]);
    setShowCustomerForm(false);
  }, []);

  const handleViewInvoice = useCallback(async (invoiceId: number) => {
    try {
      setIsLoading(true);
      const details = await trpc.getInvoiceDetails.query({ id: invoiceId });
      if (details) {
        setSelectedInvoice(details);
        setActiveTab('invoice-details');
      }
    } catch (error) {
      console.error('Failed to load invoice details:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleStatusUpdate = useCallback(async (invoiceId: number, newStatus: InvoiceStatus) => {
    try {
      await trpc.updateInvoiceStatus.mutate({ 
        id: invoiceId, 
        status: newStatus 
      });
      // Update local state
      setInvoices((prev: Invoice[]) => 
        prev.map((inv: Invoice) => 
          inv.id === invoiceId ? { ...inv, status: newStatus } : inv
        )
      );
      // Update selected invoice if it's the one being updated
      if (selectedInvoice && selectedInvoice.invoice.id === invoiceId) {
        setSelectedInvoice((prev) => 
          prev ? { 
            ...prev, 
            invoice: { ...prev.invoice, status: newStatus } 
          } : null
        );
      }
    } catch (error) {
      console.error('Failed to update invoice status:', error);
    }
  }, [selectedInvoice]);

  // Calculate dashboard stats
  const totalInvoices = invoices.length;
  const totalAmount = invoices.reduce((acc: number, inv: Invoice) => acc + inv.total_amount, 0);
  const paidInvoices = invoices.filter((inv: Invoice) => inv.status === 'Paid').length;
  const overdueInvoices = invoices.filter((inv: Invoice) => inv.status === 'Overdue').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-500';
      case 'Unpaid': return 'bg-yellow-500';
      case 'Overdue': return 'bg-red-500';
      case 'Partial': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                💼 Invoice Manager
              </h1>
              <p className="text-gray-600">
                Kelola invoice dan pelanggan dengan mudah dan efisien
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowCustomerForm(true)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Tambah Pelanggan
              </Button>
              <Button
                onClick={() => setShowInvoiceForm(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Plus className="w-4 h-4" />
                Buat Invoice
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-fit lg:grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="invoices" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Invoice ({totalInvoices})
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Pelanggan ({customers.length})
            </TabsTrigger>
            <TabsTrigger value="invoice-details" className="flex items-center gap-2" disabled={!selectedInvoice}>
              <FileText className="w-4 h-4" />
              Detail Invoice
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">
                    Total Invoice
                  </CardTitle>
                  <FileText className="h-4 w-4 opacity-90" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalInvoices}</div>
                  <p className="text-xs opacity-90">
                    {totalInvoices > 0 ? 'Invoice aktif' : 'Belum ada invoice'}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">
                    Total Nilai
                  </CardTitle>
                  <DollarSign className="h-4 w-4 opacity-90" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    Rp {totalAmount.toLocaleString('id-ID')}
                  </div>
                  <p className="text-xs opacity-90">
                    Nilai keseluruhan invoice
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">
                    Lunas
                  </CardTitle>
                  <Badge className="bg-white/20 text-white border-0">
                    {paidInvoices}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {totalInvoices > 0 ? Math.round((paidInvoices / totalInvoices) * 100) : 0}%
                  </div>
                  <p className="text-xs opacity-90">
                    Invoice yang sudah dibayar
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">
                    Terlambat
                  </CardTitle>
                  <AlertTriangle className="h-4 w-4 opacity-90" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overdueInvoices}</div>
                  <p className="text-xs opacity-90">
                    Invoice yang terlambat
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Invoices */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Invoice Terbaru
                </CardTitle>
              </CardHeader>
              <CardContent>
                {invoices.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Belum ada invoice. Mulai dengan membuat invoice pertama!</p>
                    <Button
                      onClick={() => setShowInvoiceForm(true)}
                      className="mt-4"
                    >
                      Buat Invoice Pertama
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {invoices.slice(0, 5).map((invoice: Invoice) => (
                      <div
                        key={invoice.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleViewInvoice(invoice.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(invoice.status)}`} />
                          <div>
                            <p className="font-medium">{invoice.invoice_number}</p>
                            <p className="text-sm text-gray-500">
                              {invoice.invoice_date.toLocaleDateString('id-ID')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            Rp {invoice.total_amount.toLocaleString('id-ID')}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {invoice.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices">
            <InvoiceList 
              invoices={invoices}
              onViewInvoice={handleViewInvoice}
              onStatusUpdate={handleStatusUpdate}
              isLoading={isLoading}
            />
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers">
            <CustomerList customers={customers} />
          </TabsContent>

          {/* Invoice Details Tab */}
          <TabsContent value="invoice-details">
            {selectedInvoice && (
              <InvoiceDetails 
                invoiceDetails={selectedInvoice}
                onStatusUpdate={handleStatusUpdate}
                onBack={() => setActiveTab('invoices')}
              />
            )}
          </TabsContent>
        </Tabs>

        {/* Modals */}
        {showInvoiceForm && (
          <InvoiceForm
            customers={customers}
            onSuccess={handleInvoiceCreated}
            onCancel={() => setShowInvoiceForm(false)}
          />
        )}

        {showCustomerForm && (
          <CustomerForm
            onSuccess={handleCustomerCreated}
            onCancel={() => setShowCustomerForm(false)}
          />
        )}
      </div>
    </div>
  );
}

export default App;
