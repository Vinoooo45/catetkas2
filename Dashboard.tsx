import { useData } from '../../hooks/useData';
import { cn } from '../../lib/utils';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area 
} from 'recharts';
import { Wallet, Package, ShoppingCart, TrendingUp, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { TransactionType } from '../../types';

export default function Dashboard() {
  const { transactions, products, customers } = useData();

  const totalRevenue = transactions
    .filter(t => t.type === TransactionType.OUT)
    .reduce((acc, t) => acc + t.totalAmount, 0);

  const totalExpense = transactions
    .filter(t => t.type === TransactionType.IN)
    .reduce((acc, t) => acc + t.totalAmount, 0);

  const lowStockProducts = products.filter(p => p.stock < 10);

  // Chart Data preparation
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const chartData = last7Days.map(date => {
    const dayTransactions = transactions.filter(t => {
      const tDate = t.createdAt?.toDate ? t.createdAt.toDate() : new Date(t.createdAt);
      return tDate.toISOString().split('T')[0] === date;
    });

    return {
      date,
      income: dayTransactions
        .filter(t => t.type === TransactionType.OUT)
        .reduce((sum, t) => sum + t.totalAmount, 0),
      expense: dayTransactions
        .filter(t => t.type === TransactionType.IN)
        .reduce((sum, t) => sum + t.totalAmount, 0),
    };
  });

  const exportToExcel = () => {
    const data = transactions.map(t => ({
      ID: t.id,
      Type: t.type === TransactionType.OUT ? 'Income' : 'Expense',
      Amount: t.totalAmount,
      Date: t.createdAt?.toDate ? t.createdAt.toDate().toLocaleString() : new Date(t.createdAt).toLocaleString(),
      ItemsCount: t.items?.length || 0
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    XLSX.writeFile(wb, "Catetkas_Report.xlsx");
  };

  const stats = [
    { label: 'Total Pendapatan', value: `Rp ${totalRevenue.toLocaleString()}`, icon: Wallet, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Total Pengeluaran', value: `Rp ${totalExpense.toLocaleString()}`, icon: ShoppingCart, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Stock Items', value: products.length, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Pelanggan', value: customers.length, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Overview Dashboard</h2>
          <p className="text-slate-500 text-sm font-medium">Statistik real-time toko Anda hari ini.</p>
        </div>
        <button 
          onClick={exportToExcel}
          className="btn-secondary"
        >
          <Download size={16} className="mr-2 text-slate-500" />
          <span>Export Excel</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="card-base p-5 group hover:border-blue-200 transition-colors">
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">{stat.label}</p>
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
              <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                <stat.icon size={20} />
              </div>
            </div>
            <div className="mt-2 flex items-center text-[10px] font-bold text-green-600">
              <TrendingUp size={12} className="mr-1" />
              <span>+1.2% versus last week</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card-base p-6 flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-8">
            <h4 className="font-bold text-slate-800">Grafik Pendapatan & Pengeluaran</h4>
            <div className="flex space-x-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <div className="flex items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 mr-2"></span>Pendapatan
              </div>
              <div className="flex items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 mr-2"></span>Pengeluaran
              </div>
            </div>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                  tickFormatter={(val) => val.split('-').slice(1).join('/')}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="income" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="expense" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="4 4" fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-base p-6 flex flex-col h-[400px]">
          <h4 className="font-bold text-slate-800 mb-6">Manajemen Stok</h4>
          <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
            {lowStockProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                <Package size={40} className="mb-2 text-slate-400" />
                <p className="text-xs font-bold uppercase tracking-widest">Semua stok aman</p>
              </div>
            ) : (
              lowStockProducts.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded bg-white flex items-center justify-center text-[10px] font-bold border border-slate-200">
                      {p.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-bold text-slate-800">{p.name}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{p.stock} units left</p>
                    </div>
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded",
                    p.stock < 5 ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"
                  )}>
                    {p.stock < 5 ? 'LOW' : 'WARN'}
                  </span>
                </div>
              ))
            )}
          </div>
          <button className="w-full mt-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-bold transition-colors">
            Lihat Laporan Lengkap
          </button>
        </div>
      </div>

      <div className="card-base overflow-hidden flex flex-col">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <h4 className="font-bold text-slate-700 text-sm">Transaksi Terakhir</h4>
            <button className="text-blue-600 text-xs font-bold hover:underline">Lihat Semua</button>
          </div>
          <table className="w-full text-left">
            <thead className="bg-white text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
              <tr className="h-12">
                <th className="px-6">Status</th>
                <th className="px-6">Tipe</th>
                <th className="px-6">Waktu</th>
                <th className="px-6 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {transactions.slice(0, 5).map((t) => (
                <tr key={t.id} className="h-14 hover:bg-slate-50 transition-colors">
                  <td className="px-6">
                    <span className={cn(
                      "px-2 py-0.5 rounded-md text-[10px] font-bold",
                      t.type === TransactionType.OUT ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                    )}>
                      SELESAI
                    </span>
                  </td>
                  <td className="px-6">
                    <p className="font-bold text-slate-700">{t.type === TransactionType.OUT ? 'Penjualan' : 'Pemasukan Stok'}</p>
                  </td>
                  <td className="px-6 text-slate-500 font-medium">
                    {t.createdAt?.toDate ? t.createdAt.toDate().toLocaleTimeString() : 'Current'}
                  </td>
                  <td className="px-6 text-right">
                    <span className={cn(
                      "font-bold",
                      t.type === TransactionType.OUT ? "text-slate-900" : "text-blue-600"
                    )}>
                      Rp {t.totalAmount.toLocaleString()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {transactions.length === 0 && (
            <div className="py-20 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
              Belum ada transaksi
            </div>
          )}
        </div>
    </div>
  );
}
