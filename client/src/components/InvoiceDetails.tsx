
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { ArrowLeft, Printer, DollarSign, Calendar, User, Building } from 'lucide-react';
import type { InvoiceWithDetails, InvoiceStatus } from '../../../server/src/schema';

interface InvoiceDetailsProps {
  invoiceDetails: InvoiceWithDetails;
  onStatusUpdate: (invoiceId: number, newStatus: InvoiceStatus) => void;
  onBack: () => void;
}

export function InvoiceDetails({ invoiceDetails, onStatusUpdate, onBack }: InvoiceDetailsProps) {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  
  const { invoice, customer, items, payments } = invoiceDetails;

  const handleStatusUpdate = async (newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      await onStatusUpdate(invoice.id, newStatus as InvoiceStatus);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'Unpaid': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Overdue': return 'bg-red-100 text-red-800 border-red-200';
      case 'Partial': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const totalPaid = payments.reduce((acc, payment) => acc + payment.amount, 0);
  const remainingAmount = invoice.total_amount - totalPaid;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{invoice.invoice_number}</h1>
            <p className="text-gray-600">Detail Invoice</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Select
            value={invoice.status || ''}
            onValueChange={handleStatusUpdate}
            disabled={isUpdatingStatus}
          >
            <SelectTrigger className="w-40">
              <Badge className={`${getStatusColor(invoice.status)} border-0`}>
                {invoice.status || 'Unpaid'}
              </Badge>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Unpaid">Belum Bayar</SelectItem>
              <SelectItem value="Partial">Bayar Sebagian</SelectItem>
              <SelectItem value="Paid">Lunas</SelectItem>
              <SelectItem value="Overdue">Terlambat</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Informasi Invoice
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Nomor Invoice</p>
                  <p className="font-semibold">{invoice.invoice_number}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Tanggal Invoice</p>
                  <p>{invoice.invoice_date.toLocaleDateString('id-ID')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Tanggal Jatuh Tempo</p>
                  <p className={invoice.due_date < new Date() && invoice.status !== 'Paid' ? 'text-red-600 font-medium' : ''}>
                    {invoice.due_date.toLocaleDateString('id-ID')}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Metode Pembayaran</p>
                  <p>{invoice.payment_method}</p>
                </div>
              </div>
              
              {invoice.notes && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Catatan</p>
                  <p className="text-sm bg-gray-50 p-3 rounded">{invoice.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Seller & Customer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building className="w-5 h-5" />
                  Penjual
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-semibold">{invoice.seller_name}</p>
                {invoice.seller_email && (
                  <p className="text-sm text-gray-600">{invoice.seller_email}</p>
                )}
                {invoice.seller_phone && (
                  <p className="text-sm text-gray-600">{invoice.seller_phone}</p>
                )}
                {invoice.seller_address && (
                  <p className="text-sm text-gray-600">{invoice.seller_address}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="w-5 h-5" />
                  Pelanggan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-semibold">{customer.name}</p>
                {customer.email && (
                  <p className="text-sm text-gray-600">{customer.email}</p>
                )}
                {customer.phone && (
                  <p className="text-sm text-gray-600">{customer.phone}</p>
                )}
                {customer.address && (
                  <div className="text-sm text-gray-600">
                    <p>{customer.address}</p>
                    {(customer.city || customer.postal_code) && (
                      <p>
                        {customer.city} {customer.postal_code}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>Item Invoice</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Harga Satuan</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.description}</TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        Rp {item.unit_price.toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        Rp {item.total.toLocaleString('id-ID')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Summary & Payments */}
        <div className="space-y-6">
          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Ringkasan Pembayaran
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>Rp {invoice.subtotal.toLocaleString('id-ID')}</span>
              </div>
              
              {invoice.discount_rate > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Diskon ({invoice.discount_rate}%):</span>
                  <span>-Rp {invoice.discount_amount.toLocaleString('id-ID')}</span>
                </div>
              )}
              
              {invoice.tax_rate > 0 && (
                <div className="flex justify-between">
                  <span>Pajak ({invoice.tax_rate}%):</span>
                  <span>Rp {invoice.tax_amount.toLocaleString('id-ID')}</span>
                </div>
              )}
              
              <Separator />
              
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>Rp {invoice.total_amount.toLocaleString('id-ID')}</span>
              </div>
              
              {totalPaid > 0 && (
                <>
                  <div className="flex justify-between text-green-600">
                    <span>Sudah Dibayar:</span>
                    <span>Rp {totalPaid.toLocaleString('id-ID')}</span>
                  </div>
                  
                  <div className="flex justify-between font-medium">
                    <span>Sisa:</span>
                    <span className={remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}>
                      Rp {remainingAmount.toLocaleString('id-ID')}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Payment History */}
          {payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Riwayat Pembayaran
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <div key={payment.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">
                            Rp {payment.amount.toLocaleString('id-ID')}
                          </p>
                          <p className="text-sm text-gray-600">
                            {payment.payment_date.toLocaleDateString('id-ID')}
                          </p>
                          <Badge variant="outline" className="text-xs mt-1">
                            {payment.payment_method}
                          </Badge>
                        </div>
                      </div>
                      {payment.notes && (
                        <p className="text-sm text-gray-600 mt-2">{payment.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Aksi Cepat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full" size="sm">
                <DollarSign className="w-4 h-4 mr-2" />
                Catat Pembayaran
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
