
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Calculator } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Customer, Invoice, CreateInvoiceInput, CreateInvoiceItemInput, PaymentMethod } from '../../../server/src/schema';

interface InvoiceFormProps {
  customers: Customer[];
  onSuccess: (invoice: Invoice) => void;
  onCancel: () => void;
}

export function InvoiceForm({ customers, onSuccess, onCancel }: InvoiceFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Omit<CreateInvoiceInput, 'items'>>({
    customer_id: 0,
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    tax_rate: 11,
    discount_rate: 0,
    payment_method: 'Bank Transfer',
    notes: null,
    seller_name: '',
    seller_email: null,
    seller_phone: null,
    seller_address: null
  });

  const [items, setItems] = useState<CreateInvoiceItemInput[]>([
    { description: '', quantity: 1, unit_price: 0 }
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.customer_id === 0) {
      alert('Pilih pelanggan terlebih dahulu');
      return;
    }
    if (items.some(item => !item.description || item.quantity <= 0 || item.unit_price <= 0)) {
      alert('Pastikan semua item memiliki deskripsi, kuantitas, dan harga yang valid');
      return;
    }

    setIsLoading(true);
    try {
      const invoiceData: CreateInvoiceInput = {
        ...formData,
        items
      };
      const result = await trpc.createInvoice.mutate(invoiceData);
      onSuccess(result);
    }catch (error) {
      console.error('Failed to create invoice:', error);
      alert('Gagal membuat invoice. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const addItem = () => {
    setItems((prev: CreateInvoiceItemInput[]) => [
      ...prev,
      { description: '', quantity: 1, unit_price: 0 }
    ]);
  };

  const removeItem = (index: number) => {
    setItems((prev: CreateInvoiceItemInput[]) => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof CreateInvoiceItemInput, value: string | number) => {
    setItems((prev: CreateInvoiceItemInput[]) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  // Calculate totals
  const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);
  const discountAmount = subtotal * (formData.discount_rate / 100);
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * (formData.tax_rate / 100);
  const total = taxableAmount + taxAmount;

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            📄 Buat Invoice Baru
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer & Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer">Pelanggan *</Label>
              <Select
                value={formData.customer_id > 0 ? formData.customer_id.toString() : ''}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, customer_id: parseInt(value) }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih pelanggan" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer: Customer) => (
                    <SelectItem key={customer.id} value={customer.id.toString()}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">Tanggal Jatuh Tempo *</Label>
              <Input
                type="date"
                value={formData.due_date.toISOString().split('T')[0]}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev) => ({ ...prev, due_date: new Date(e.target.value) }))
                }
                required
              />
            </div>
          </div>

          {/* Seller Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informasi Penjual</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="seller_name">Nama Penjual *</Label>
                <Input
                  id="seller_name"
                  value={formData.seller_name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev) => ({ ...prev, seller_name: e.target.value }))
                  }
                  placeholder="Nama lengkap atau nama perusahaan"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="seller_email">Email Penjual</Label>
                <Input
                  id="seller_email"
                  type="email"
                  value={formData.seller_email || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev) => ({ ...prev, seller_email: e.target.value || null }))
                  }
                  placeholder="email@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="seller_phone">Telepon Penjual</Label>
                <Input
                  id="seller_phone"
                  value={formData.seller_phone || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev) => ({ ...prev, seller_phone: e.target.value || null }))
                  }
                  placeholder="+62xxx"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="seller_address">Alamat Penjual</Label>
                <Input
                  id="seller_address"
                  value={formData.seller_address || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev) => ({ ...prev, seller_address: e.target.value || null }))
                  }
                  placeholder="Alamat lengkap"
                />
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Item Invoice</CardTitle>
                <Button type="button" onClick={addItem} size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item: CreateInvoiceItemInput, index: number) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-12 md:col-span-5 space-y-1">
                    <Label>Deskripsi</Label>
                    <Input
                      value={item.description}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateItem(index, 'description', e.target.value)
                      }
                      placeholder="Nama barang/jasa"
                      required
                    />
                  </div>
                  <div className="col-span-4 md:col-span-2 space-y-1">
                    <Label>Qty</Label>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateItem(index, 'quantity', parseInt(e.target.value) || 0)
                      }
                      min="1"
                      required
                    />
                  </div>
                  <div className="col-span-4 md:col-span-2 space-y-1">
                    <Label>Harga</Label>
                    <Input
                      type="number"
                      value={item.unit_price}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)
                      }
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="col-span-3 md:col-span-2 space-y-1">
                    <Label>Total</Label>
                    <div className="p-2 bg-gray-50 rounded text-sm font-medium">
                      Rp {(item.quantity * item.unit_price).toLocaleString('id-ID')}
                    </div>
                  </div>
                  <div className="col-span-1 md:col-span-1">
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Calculations & Payment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pengaturan Pembayaran</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="payment_method">Metode Pembayaran</Label>
                  <Select
                    value={formData.payment_method}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, payment_method: value as PaymentMethod }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="Cash">Tunai</SelectItem>
                      <SelectItem value="Credit Card">Kartu Kredit</SelectItem>
                      <SelectItem value="Check">Cek</SelectItem>
                      <SelectItem value="Other">Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="discount_rate">Diskon (%)</Label>
                    <Input
                      type="number"
                      value={formData.discount_rate}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev) => ({ ...prev, discount_rate: parseFloat(e.target.value) || 0 }))
                      }
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tax_rate">Pajak (%)</Label>
                    <Input
                      type="number"
                      value={formData.tax_rate}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev) => ({ ...prev, tax_rate: parseFloat(e.target.value) || 0 }))
                      }
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Catatan</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setFormData((prev) => ({ ...prev, notes: e.target.value || null }))
                    }
                    placeholder="Catatan tambahan untuk invoice"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Ringkasan Pembayaran
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                </div>
                {formData.discount_rate > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Diskon ({formData.discount_rate}%):</span>
                    <span>-Rp {discountAmount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                {formData.tax_rate > 0 && (
                  <div className="flex justify-between">
                    <span>Pajak ({formData.tax_rate}%):</span>
                    <span>Rp {taxAmount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-blue-600">
                      Rp {total.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
                <Badge variant="outline" className="w-full justify-center py-2">
                  {items.length} item dalam invoice
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Batal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Membuat...' : 'Buat Invoice'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
