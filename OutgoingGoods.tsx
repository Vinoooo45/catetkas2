import { useState } from 'react';
import { useData } from '../../hooks/useData';
import { db, auth } from '../../lib/firebase';
import { cn } from '../../lib/utils';
import { collection, addDoc, updateDoc, doc, serverTimestamp, increment } from 'firebase/firestore';
import { ArrowUpCircle, Trash2, CheckCircle, Search, User, CreditCard } from 'lucide-react';
import { TransactionType } from '../../types';

export default function OutgoingGoods() {
  const { products, customers } = useData();
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const addItem = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product || product.stock <= 0) {
      if (product && product.stock <= 0) alert('Stock habis!');
      return;
    }
    
    const existing = selectedItems.find(i => i.productId === productId);
    if (existing) {
      if (existing.quantity >= product.stock) {
        alert('Tidak bisa melebihi stok yang ada!');
        return;
      }
      setSelectedItems(selectedItems.map(i => 
        i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setSelectedItems([...selectedItems, {
        productId: product.id,
        name: product.name,
        quantity: 1,
        price: product.price
      }]);
    }
  };

  const removeItem = (productId: string) => {
    setSelectedItems(selectedItems.filter(i => i.productId !== productId));
  };

  const updateQuantity = (productId: string, qty: number) => {
    const p = products.find(prod => prod.id === productId);
    if (!p || qty < 1 || qty > p.stock) return;
    setSelectedItems(selectedItems.map(i => 
      i.productId === productId ? { ...i, quantity: qty } : i
    ));
  };

  const total = selectedItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);

  const handleSubmit = async () => {
    if (selectedItems.length === 0) return;
    setLoading(true);
    const user = auth.currentUser;
    if (!user) return;

    try {
      // 1. Create Transaction
      await addDoc(collection(db, 'transactions'), {
        type: TransactionType.OUT,
        totalAmount: total,
        items: selectedItems,
        customerId: selectedCustomerId || null,
        userId: user.uid,
        createdAt: serverTimestamp()
      });

      // 2. Update Stock
      for (const item of selectedItems) {
        await updateDoc(doc(db, 'products', item.productId), {
          stock: increment(-item.quantity)
        });
      }

      setSelectedItems([]);
      setSelectedCustomerId('');
      alert('Transaksi berhasil disimpan!');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-10 h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CreditCard size={28} className="text-blue-600" />
            Kasir / Point of Sale
          </h2>
          <p className="text-slate-500 text-sm font-medium">Input penjualan real-time pelanggan Anda.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start flex-1 overflow-hidden min-h-0">
        {/* Left: Product Selection */}
        <div className="card-base p-6 space-y-6 flex flex-col h-full min-h-0">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Pencarian Produk</h3>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Cari nama produk or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-blue-500 transition-all font-medium text-sm"
              />
            </div>
          </div>
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto pr-2 custom-scrollbar">
            {filteredProducts.map(p => (
              <button 
                key={p.id}
                onClick={() => addItem(p.id)}
                disabled={p.stock <= 0}
                className={cn(
                  "flex flex-col p-4 rounded-xl border transition-all text-left group",
                  p.stock <= 0 
                    ? "bg-slate-50 border-slate-50 opacity-40 cursor-not-allowed" 
                    : "bg-white border-slate-200 hover:border-blue-600 hover:shadow-md"
                )}
              >
                <p className="font-bold text-sm text-slate-800 truncate w-full">{p.name}</p>
                <p className="text-lg font-bold text-slate-900 tracking-tight mt-1">Rp {p.price.toLocaleString()}</p>
                <div className="flex items-center justify-between mt-3 w-full pt-3 border-t border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400">{p.sku}</span>
                  <span className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded",
                    p.stock < 10 ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-500"
                  )}>
                    Stok: {p.stock}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Cart & Payment */}
        <div className="bg-slate-900 text-slate-300 p-8 rounded-2xl shadow-2xl flex flex-col h-full min-h-0 border border-slate-800">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
            <h3 className="text-lg font-bold text-white">Rincian Order</h3>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
              <User size={14} className="text-slate-500" />
              <select 
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="bg-transparent text-[10px] font-bold uppercase tracking-wider outline-none appearance-none cursor-pointer text-slate-400"
              >
                <option value="" className="text-slate-900">Walk-in Guest</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id} className="text-slate-900">{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
            {selectedItems.map(item => (
              <div key={item.productId} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-white truncate">{item.name}</p>
                  <p className="text-[10px] font-bold text-slate-500">Rp {item.price.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-white/10 rounded-lg border border-white/10 px-1 py-0.5">
                    <button 
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="p-1.5 hover:text-white transition-opacity font-bold"
                    >-</button>
                    <span className="w-6 text-center font-bold text-xs text-blue-400">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="p-1.5 hover:text-white transition-opacity font-bold"
                    >+</button>
                  </div>
                  <button 
                    onClick={() => removeItem(item.productId)}
                    className="p-2 text-slate-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            {selectedItems.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30 italic font-bold text-xs uppercase tracking-[0.2em]">
                <ShoppingCart size={40} className="mb-4 text-slate-700" />
                <p>Klik produk untuk checkout</p>
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-[0.2em] text-slate-500">Grand Total</span>
              <span className="text-3xl font-bold text-white tracking-tight">Rp {total.toLocaleString()}</span>
            </div>
            <button 
              disabled={selectedItems.length === 0 || loading}
              onClick={handleSubmit}
              className="w-full py-5 bg-blue-600 text-white rounded-lg font-bold text-lg hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-20 flex items-center justify-center gap-3 shadow-xl shadow-blue-900/40"
            >
              {loading ? (
                <div className="h-6 w-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle size={22} />
                  <span>Selesaikan Pembayaran</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShoppingCart(props: any) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  );
}
