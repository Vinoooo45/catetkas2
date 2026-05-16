import { useState, FormEvent } from 'react';
import { useData } from '../../hooks/useData';
import { db, auth } from '../../lib/firebase';
import { cn } from '../../lib/utils';
import { collection, addDoc, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Package, Plus, Search, MoreVertical, Edit2, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Inventory() {
  const { products } = useData();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    stock: 0,
    price: 0,
    category: ''
  });

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    const data = {
      ...formData,
      userId: user.uid,
      updatedAt: serverTimestamp(),
      stock: Number(formData.stock),
      price: Number(formData.price)
    };

    try {
      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), data);
      } else {
        await addDoc(collection(db, 'products'), data);
      }
      setIsModalOpen(false);
      setEditingProduct(null);
      setFormData({ name: '', sku: '', stock: 0, price: 0, category: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (p: any) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      sku: p.sku,
      stock: p.stock,
      price: p.price,
      category: p.category || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      await deleteDoc(doc(db, 'products', id));
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Stock Inventory</h2>
          <p className="text-slate-500 text-sm font-medium">Manajemen stok barang dan harga jual.</p>
        </div>
        <button 
          onClick={() => {
            setEditingProduct(null);
            setFormData({ name: '', sku: '', stock: 0, price: 0, category: '' });
            setIsModalOpen(true);
          }}
          className="btn-primary"
        >
          <Plus size={18} className="mr-2" />
          <span>Tambah Barang</span>
        </button>
      </div>

      <div className="card-base overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari nama barang atau SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 rounded-lg bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all text-sm font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-widest font-bold text-slate-400 border-b border-slate-100">
              <tr>
                <th className="px-8 py-4">Barang</th>
                <th className="px-8 py-4">SKU</th>
                <th className="px-8 py-4">Kategori</th>
                <th className="px-8 py-4">Stock</th>
                <th className="px-8 py-4 text-right">Harga</th>
                <th className="px-8 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                        <Package size={18} />
                      </div>
                      <span className="font-semibold text-sm text-slate-700">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-4 text-xs font-mono text-slate-400">{p.sku}</td>
                  <td className="px-8 py-4">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                      {p.category || 'General'}
                    </span>
                  </td>
                  <td className="px-8 py-4">
                    <span className={cn(
                      "font-bold text-sm",
                      p.stock < 10 ? 'text-orange-600' : 'text-slate-700'
                    )}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-right font-bold text-slate-900 text-sm">
                    Rp {p.price.toLocaleString()}
                  </td>
                  <td className="px-8 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => handleEdit(p)}
                        className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(p.id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredProducts.length === 0 && (
            <div className="py-20 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
              Tidak ada barang ditemukan.
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
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
                  {editingProduct ? 'Edit Barang' : 'Tambah Barang Baru'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Nama Barang</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all font-medium text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">SKU / Kode</label>
                    <input 
                      type="text" 
                      value={formData.sku}
                      onChange={(e) => setFormData({...formData, sku: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Kategori</label>
                    <input 
                      type="text" 
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all font-medium text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Stok Awal</label>
                    <input 
                      type="number" 
                      required
                      value={formData.stock}
                      onChange={(e) => setFormData({...formData, stock: Number(e.target.value)})}
                      className="w-full px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all font-bold text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Harga Jual (Rp)</label>
                    <input 
                      type="number" 
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                      className="w-full px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all font-bold text-sm"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit"
                    className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 active:scale-95 transition-all shadow-md shadow-blue-500/20"
                  >
                    {editingProduct ? 'Simpan Perubahan' : 'Simpan Barang'}
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
