import { useState, FormEvent } from 'react';
import { useData } from '../../hooks/useData';
import { db, auth } from '../../lib/firebase';
import { collection, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { Users, Plus, Search, MoreVertical, Edit2, Trash2, X, Phone, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Customers() {
  const { customers } = useData();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: ''
  });

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    const data = {
      ...formData,
      userId: user.uid
    };

    try {
      if (editingCustomer) {
        await updateDoc(doc(db, 'customers', editingCustomer.id), data);
      } else {
        await addDoc(collection(db, 'customers'), data);
      }
      setIsModalOpen(false);
      setEditingCustomer(null);
      setFormData({ name: '', phone: '', email: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (c: any) => {
    setEditingCustomer(c);
    setFormData({
      name: c.name,
      phone: c.phone || '',
      email: c.email || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this customer?')) {
      await deleteDoc(doc(db, 'customers', id));
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Manajemen Pelanggan</h2>
          <p className="text-slate-500 text-sm font-medium">Database loyalitas CRM pelanggan toko Anda.</p>
        </div>
        <button 
          onClick={() => {
            setEditingCustomer(null);
            setFormData({ name: '', phone: '', email: '' });
            setIsModalOpen(true);
          }}
          className="btn-primary"
        >
          <Plus size={18} className="mr-2" />
          <span>Tambah Pelanggan</span>
        </button>
      </div>

      <div className="card-base overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari nama atau telepon..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 rounded-lg bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all text-sm font-medium"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {filteredCustomers.map((c) => (
            <motion.div 
              layout
              key={c.id} 
              className="p-6 rounded-xl bg-white border border-slate-200 space-y-5 hover:border-blue-500 hover:shadow-md transition-all group relative"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-500 border border-slate-200">
                  {c.name[0].toUpperCase()}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(c)} className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 truncate">{c.name}</h4>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Regular Customer</p>
              </div>

              <div className="space-y-2.5 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
                  <Phone size={14} className="text-slate-400" />
                  <span>{c.phone || '-'}</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
                  <Mail size={14} className="text-slate-400" />
                  <span className="truncate">{c.email || '-'}</span>
                </div>
              </div>
            </motion.div>
          ))}
          {filteredCustomers.length === 0 && (
            <div className="col-span-full py-20 text-center opacity-30 italic font-bold text-xs uppercase tracking-[0.2em]">
              <p>Belum ada data pelanggan</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800">
                  {editingCustomer ? 'Edit Pelanggan' : 'Data Pelanggan Baru'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Nama Lengkap</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all font-semibold text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Nomor Telepon</label>
                  <input 
                    type="tel" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all font-semibold text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all font-semibold text-sm"
                  />
                </div>

                <div className="pt-4">
                  <button 
                    type="submit"
                    className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 active:scale-95 transition-all shadow-md shadow-blue-500/20"
                  >
                    Simpan Database Pelanggan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
