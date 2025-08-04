
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Filter, Eye, Calendar } from 'lucide-react';
import type { Invoice, InvoiceStatus } from '../../../server/src/schema';

interface InvoiceListProps {
  invoices: Invoice[];
  onViewInvoice: (invoiceId: number) => void;
  onStatusUpdate: (invoiceId: number, newStatus: InvoiceStatus) => void;
  isLoading: boolean;
}

export function InvoiceList({ invoices, onViewInvoice, onStatusUpdate, isLoading }: InvoiceListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredInvoices = invoices.filter((invoice: Invoice) => {
    const matchesSearch = 
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.seller_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'Unpaid': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Overdue': return 'bg-red-100 text-red-800 border-red-200';
      case 'Partial': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            📋 Daftar Invoice
          </CardTitle>
          <Badge variant="outline" className="ml-auto">
            {filteredInvoices.length} dari {invoices.length} invoice
          </Badge>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari nomor invoice atau nama penjual..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="Paid">Lunas</SelectItem>
              <SelectItem value="Unpaid">Belum Bayar</SelectItem>
              <SelectItem value="Partial">Bayar Sebagian</SelectItem>
              <SelectItem value="Overdue">Terlambat</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {invoices.length === 0 ? (
              <>
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Belum ada invoice yang dibuat.</p>
                <p className="text-sm">Buat invoice pertama Anda untuk memulai!</p>
              </>
            ) : (
              <>
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Tidak ada invoice yang sesuai dengan pencarian.</p>
                <p className="text-sm">Coba ubah kata kunci atau filter status.</p>
              </>
            )}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nomor Invoice</TableHead>
                  <TableHead>Penjual</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Jatuh Tempo</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice: Invoice) => (
                  <TableRow key={invoice.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      {invoice.invoice_number}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{invoice.seller_name}</p>
                        {invoice.seller_email && (
                          <p className="text-sm text-gray-500">{invoice.seller_email}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {invoice.invoice_date.toLocaleDateString('id-ID')}
                    </TableCell>
                    <TableCell>
                      <div className={
                        invoice.due_date < new Date() && invoice.status !== 'Paid' 
                          ? 'text-red-600 font-medium' 
                          : ''
                      }>
                        {invoice.due_date.toLocaleDateString('id-ID')}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      Rp {invoice.total_amount.toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={invoice.status}
                        onValueChange={(value) => onStatusUpdate(invoice.id, value as InvoiceStatus)}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="w-32 h-8">
                          <Badge 
                            variant="outline" 
                            className={`${getStatusColor(invoice.status)} border-0 text-xs`}
                          >
                            {invoice.status}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Unpaid">Belum Bayar</SelectItem>
                          <SelectItem value="Partial">Bayar Sebagian</SelectItem>
                          <SelectItem value="Paid">Lunas</SelectItem>
                          <SelectItem value="Overdue">Terlambat</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewInvoice(invoice.id)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
