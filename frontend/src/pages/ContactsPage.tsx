import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, Plus, Search, Filter, RefreshCw, Users, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { contactsApi } from '@/api/contacts';
import { socket } from '@/lib/socket';

export default function ContactsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['contacts', page, search],
    queryFn: () => contactsApi.getContacts({ page, limit: 10, search }),
  });

  // Listen for real-time contact sync events from backend
  useEffect(() => {
    if (!socket) return;

    const handleContactsSynced = (payload: any) => {
      toast.success(`WhatsApp synced ${payload.count || 'new'} contacts!`);
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    };

    socket.on('whatsapp:contacts_synced' as any, handleContactsSynced);
    socket.on('whatsapp:reply' as any, () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    });

    return () => {
      socket.off('whatsapp:contacts_synced' as any, handleContactsSynced);
      socket.off('whatsapp:reply' as any);
    };
  }, [queryClient]);

  const addContactMutation = useMutation({
    mutationFn: (contactData: { name?: string; phoneNumber: string; email?: string }) =>
      contactsApi.createContact(contactData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact added successfully');
      setIsAddModalOpen(false);
      setNewName('');
      setNewPhone('');
      setNewEmail('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to add contact');
    }
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const phone = newPhone.trim();
    if (!phone) {
      toast.error('Phone number is required');
      return;
    }
    addContactMutation.mutate({
      phoneNumber: phone,
      name: newName.trim() || undefined,
      email: newEmail.trim() || undefined,
    });
  };

  const getSourceBadge = (source: string) => {
    const s = (source || 'MANUAL').toUpperCase();
    if (s === 'WHATSAPP_SYNC') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/40">
          <Smartphone size={12} /> WhatsApp
        </span>
      );
    }
    if (s === 'EXCEL' || s === 'IMPORT') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300/40">
          Excel
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-300/40">
        Manual
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Contacts & Students</h1>
          <p className="text-gray-500 dark:text-gray-400">View and manage contacts synced from WhatsApp or imported from Excel.</p>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            onClick={() => refetch()} 
            isLoading={isFetching}
            leftIcon={<RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />}
          >
            Refresh
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)} leftIcon={<Plus size={18} />}>
            Add Contact
          </Button>
        </div>
      </div>

      <Card>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="w-full sm:w-96 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name, phone or email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
            Total contacts: <span className="font-semibold text-gray-900 dark:text-white">{data?.total || 0}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700/50 dark:text-gray-300">
              <tr>
                <th className="px-6 py-4">Name / Student</th>
                <th className="px-6 py-4">Phone Number</th>
                <th className="px-6 py-4">Source</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Added</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Loading contacts...
                  </td>
                </tr>
              ) : data?.items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12">
                    <EmptyState 
                      icon={Users}
                      title="No contacts found"
                      description={search ? "No contacts match your search criteria." : "No contacts yet. Connect WhatsApp to auto-sync or add contacts manually."}
                    />
                  </td>
                </tr>
              ) : (
                data?.items.map((contact) => (
                  <tr key={contact.id} className="bg-white border-b dark:bg-gray-800/80 dark:border-gray-700/60 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {contact.name || 'Unnamed Contact'}
                      {contact.email && <div className="text-xs text-gray-500 dark:text-gray-400 font-normal">{contact.email}</div>}
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-800 dark:text-gray-200">
                      {contact.phoneNumber}
                    </td>
                    <td className="px-6 py-4">
                      {getSourceBadge(contact.source)}
                    </td>
                    <td className="px-6 py-4">
                      {contact.isOptedOut ? (
                        <Badge variant="danger">Opted Out</Badge>
                      ) : (
                        <Badge variant="success">Active</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400">
                      {new Date(contact.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {data && data.totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Showing <span className="font-medium">{(page - 1) * 10 + 1}</span> to <span className="font-medium">{Math.min(page * 10, data.total)}</span> of <span className="font-medium">{data.total}</span> entries
            </span>
            <Pagination 
              page={page} 
              totalPages={data.totalPages} 
              onPageChange={setPage} 
            />
          </div>
        )}
      </Card>

      {/* Add Contact Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Contact"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <Input
            label="Name / Student Name"
            placeholder="e.g. Sarah Khan"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />

          <Input
            label="Phone Number (with Country Code or Local)"
            placeholder="e.g. 03001234567 or +923001234567"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            required
          />

          <Input
            label="Email Address (Optional)"
            placeholder="student@university.edu.pk"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={addContactMutation.isPending}>
              Save Contact
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
