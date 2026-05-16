import { useState, useEffect } from 'react';
import { auth, db } from './lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { LayoutDashboard, Package, Users, ArrowDownCircle, ArrowUpCircle, LogOut, Menu, X, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from './lib/utils';

// Components (to be created)
import Dashboard from './components/dashboard/Dashboard';
import Inventory from './components/inventory/Inventory';
import IncomingGoods from './components/inventory/IncomingGoods';
import OutgoingGoods from './components/inventory/OutgoingGoods';
import Customers from './components/customers/Customers';
import Login from './components/auth/Login';

type View = 'dashboard' | 'inventory' | 'incoming' | 'outgoing' | 'customers' | 'reports';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Check if user exists in Firestore, if not create profile
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) {
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email,
            role: 'staff',
            createdAt: new Date().toISOString()
          });
        }
        setUser(user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#F5F5F0]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#141414]"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Stock Barang', icon: Package },
    { id: 'incoming', label: 'Barang Masuk', icon: ArrowDownCircle },
    { id: 'outgoing', label: 'Barang Keluar', icon: ArrowUpCircle },
    { id: 'customers', label: 'Pelanggan', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200">
        <h1 className="font-bold text-xl tracking-tight text-slate-900">CATETKAS</h1>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-slate-600">
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div className="flex h-[calc(100vh-64px)] lg:h-screen overflow-hidden">
        {/* Sidebar */}
        <motion.aside
          initial={false}
          animate={{ x: sidebarOpen ? 0 : -256 }}
          className={cn(
            "fixed lg:relative z-50 w-64 h-full bg-slate-900 text-slate-300 flex flex-col transition-all shadow-xl lg:shadow-none",
            !sidebarOpen && "lg:w-0 lg:opacity-0 pointer-events-none lg:pointer-events-auto"
          )}
        >
          <div className="p-6 flex items-center space-x-3 text-white border-b border-slate-800">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl">C</div>
            <span className="text-xl font-bold tracking-tight">Catetkas</span>
          </div>

          <nav className="flex-1 py-4 px-3 space-y-1">
            <div className="text-xs font-semibold text-slate-500 uppercase px-3 py-2 mt-2">Navigation</div>
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setView(item.id as View)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group",
                    view === item.id 
                      ? "bg-slate-800 text-white shadow-sm" 
                      : "hover:bg-slate-800 text-slate-400 hover:text-white"
                  )}
                >
                  <item.icon size={20} className={cn(view === item.id ? "text-blue-500" : "text-slate-500 group-hover:text-slate-300")} />
                  <span className="font-medium text-sm">{item.label}</span>
                </button>
              ))}
          </nav>

          <div className="p-4 border-t border-slate-800 bg-slate-900/50">
            <div className="bg-blue-600/10 border border-blue-600/20 rounded-xl p-3 mb-4 backdrop-blur-sm">
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider mb-1">Authenticated As</p>
              <p className="text-xs text-slate-300 truncate font-medium">{user.email}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-red-500/10 transition-all group"
            >
              <LogOut size={18} className="group-hover:text-red-500" />
              <span className="font-semibold text-sm">Sign Out</span>
            </button>
          </div>
        </motion.aside>

        {/* Main Workspace */}
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-bold text-slate-800 capitalize">{view.replace('-', ' ')}</h2>
              <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wider">LIVE DATA</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-800">
                  {user.email === 'admin@catetkas.id' ? 'Administrator' : user.email.split('@')[0]}
                </p>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">
                  {user.email === 'admin@catetkas.id' ? 'Super Access' : 'Staff Access'}
                </p>
              </div>
              <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center font-bold text-slate-500 text-sm shadow-sm ring-4 ring-white">
                {user.email?.[0].toUpperCase()}
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto bg-slate-50 custom-scrollbar">
            <div className="p-8 max-w-7xl mx-auto h-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={view}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  {view === 'dashboard' && <Dashboard />}
                  {view === 'inventory' && <Inventory />}
                  {view === 'incoming' && <IncomingGoods />}
                  {view === 'outgoing' && <OutgoingGoods />}
                  {view === 'customers' && <Customers />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
