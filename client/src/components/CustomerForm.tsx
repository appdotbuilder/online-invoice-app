
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { trpc } from '@/utils/trpc';
import type { Customer, CreateCustomerInput } from '../../../server/src/schema';

interface CustomerFormProps {
  onSuccess: (customer: Customer) => void;
  onCancel: () => void;
}

export function CustomerForm({ onSuccess, onCancel }: CustomerFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateCustomerInput>({
    name: '',
    email: null,
    phone: null,
    address: null,
    city: null,
    postal_code: null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await trpc.createCustomer.mutate(formData);
      onSuccess(result);
    } catch (error) {
      console.error('Failed to create customer:', error);
      alert('Gagal membuat pelanggan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            👤 Tambah Pelanggan Baru
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Pelanggan *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateCustomerInput) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Nama lengkap atau nama perusahaan"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateCustomerInput) => ({ ...prev, email: e.target.value || null }))
              }
              placeholder="email@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telepon</Label>
            <Input
              id="phone"
              value={formData.phone || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateCustomerInput) => ({ ...prev, phone: e.target.value || null }))
              }
              placeholder="+62xxx"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Alamat</Label>
            <Input
              id="address"
              value={formData.address || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateCustomerInput) => ({ ...prev, address: e.target.value || null }))
              }
              placeholder="Alamat lengkap"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Kota</Label>
              <Input
                id="city"
                value={formData.city || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateCustomerInput) => ({ ...prev, city: e.target.value || null }))
                }
                placeholder="Nama kota"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="postal_code">Kode Pos</Label>
              <Input
                id="postal_code"
                value={formData.postal_code || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateCustomerInput) => ({ ...prev, postal_code: e.target.value || null }))
                }
                placeholder="12345"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Batal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Menyimpan...' : 'Simpan Pelanggan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
