
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Users, Mail, Phone, MapPin } from 'lucide-react';
import type { Customer } from '../../../server/src/schema';

interface CustomerListProps {
  customers: Customer[];
}

export function CustomerList({ customers }: CustomerListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCustomers = customers.filter((customer: Customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (customer.city && customer.city.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            👥 Daftar Pelanggan
          </CardTitle>
          <Badge variant="outline">
            {filteredCustomers.length} dari {customers.length} pelanggan
          </Badge>
        </div>

        <div className="relative pt-4">
          <Search className="absolute left-3 top-7 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Cari nama, email, atau kota pelanggan..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>

      <CardContent>
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {customers.length === 0 ? (
              <>
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Belum ada pelanggan yang terdaftar.</p>
                <p className="text-sm">Tambah pelanggan pertama Anda untuk memulai!</p>
              </>
            ) : (
              <>
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Tidak ada pelanggan yang sesuai dengan pencarian.</p>
                <p className="text-sm">Coba ubah kata kunci pencarian.</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredCustomers.map((customer: Customer) => (
              <Card key={customer.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">{customer.name}</h3>
                      
                      {customer.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4" />
                          <span>{customer.email}</span>
                        </div>
                      )}
                      
                      {customer.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span>{customer.phone}</span>
                        </div>
                      )}
                      
                      {(customer.address || customer.city) && (
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mt-0.5" />
                          <div>
                            {customer.address && <div>{customer.address}</div>}
                            <div className="flex gap-2">
                              {customer.city && <span>{customer.city}</span>}
                              {customer.postal_code && <span>{customer.postal_code}</span>}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs">
                        ID: {customer.id}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-2">
                        Terdaftar: {customer.created_at.toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
