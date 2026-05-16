import { useState } from 'react';
import { useData } from '../../hooks/useData';
import { db, auth } from '../../lib/firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp, increment } from 'firebase/firestore';
import { ArrowDownCircle, Plus, Trash2, CheckCircle } from 'lucide-react';
import { TransactionType } from '../../types';

export default function IncomingGoods() {
  const { products } = useData();
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const addItem = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const existing = selectedItems.find(i => i.productId === productId);
    if (existing) {
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
    if (qty < 1) return;
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
        type: TransactionType.IN,
        totalAmount: total,
        items: selectedItems,
        userId: user.uid,
        createdAt: serverTimestamp()
      });

      // 2. Update Stock
      for (const item of selectedItems) {
        await updateDoc(doc(db, 'products', item.productId), {
          stock: increment(item.quantity)
        });
      }

      setSelectedItems([]);
      alert('Stok barang berhasil ditambah!');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ArrowDownCircle size={28} className="text-blue-600" />
            Barang Masuk
          </h2>
          <p className="text-slate-500 text-sm font-medium">Input stok barang ke gudang sistem.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left: Product Selection */}
        <div className="card-base p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Pilih Produk</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {products.map(p => (
              <button 
                key={p.id}
                onClick={() => addItem(p.id)}
                className="flex flex-col p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-500 transition-all text-left group"
              >
                <p className="font-bold text-sm text-slate-700 truncate w-full">{p.name}</p>
                <div className="flex items-center justify-between mt-2 w-full">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{p.sku}</span>
                  <span className="text-[10px] font-bold uppercase text-slate-500 bg-slate-200/50 px-1.5 py-0.5 rounded">S: {p.stock}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Checkout List */}
        <div className="bg-slate-900 text-slate-300 p-8 rounded-2xl shadow-2xl flex flex-col h-[650px] border border-slate-800">
          <h3 className="text-lg font-bold text-white mb-8 border-b border-white/10 pb-4">Daftar Manifest</h3>
          
          <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
            {selectedItems.map(item => (
              <div key={item.productId} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-white truncate">{item.name}</p>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Rp {item.price.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-white/5 rounded-lg border border-white/10 px-1">
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
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30 italic font-bold text-xs">
                <ArrowDownCircle size={40} className="mb-4 text-slate-700" />
                <p className="uppercase tracking-[0.2em]">Pilih produk di samping</p>
              </div>
            )}
          </div>

          <div className="mt-8 pt-8 border-t border-white/10 space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-[0.2em] text-slate-500">Subtotal Valuasi</span>
              <span className="text-2xl font-bold text-white tracking-tight">Rp {total.toLocaleString()}</span>
            </div>
            <button 
              disabled={selectedItems.length === 0 || loading}
              onClick={handleSubmit}
              className="w-full py-4 bg-blue-600 text-white rounded-lg font-bold text-base hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-20 flex items-center justify-center gap-2 shadow-lg shadow-blue-900/40"
            >
              {loading ? <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <CheckCircle size={20} />}
              <span>Konfirmasi Masuk</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
