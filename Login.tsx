import { useState, FormEvent } from 'react';
import { auth } from '../../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { motion } from 'framer-motion';
import { LogIn, UserPlus, ShieldAlert } from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    let finalEmail = email;
    // Handle the "admin" username requirement
    if (email === 'admin') {
      finalEmail = 'admin@catetkas.id';
    }

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, finalEmail, password);
      } else {
        await createUserWithEmailAndPassword(auth, finalEmail, password);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password provider is not enabled in Firebase Console. Please enable it under Authentication > Sign-in method.');
      } else if ((err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') && email === 'admin' && password === 'admin123') {
        setError('Admin account not found or password incorrect. If this is your first time, please use the "Register" tab to initialize the admin account.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Format email tidak valid. Pastikan Anda memasukkan email yang benar atau gunakan".');
      } else if (err.code === 'auth/invalid-credential') {
        setError('Email atau password salah. Silakan periksa kembali.');
      } else {
        setError(err.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white p-10 rounded-[32px] shadow-2xl shadow-slate-200/50 border border-slate-200 space-y-8 relative overflow-hidden">
          {/* Subtle Accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-600" />
          
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white text-2xl mx-auto shadow-lg shadow-blue-600/20 mb-2">C</div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Catetkas Admin</h1>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">
              {isLogin ? 'Login to continue' : 'Create shop account'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 ml-1">Username / Email</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@email.com"
                className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all text-sm font-semibold outline-none text-slate-800"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 ml-1">Secret Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all text-sm font-semibold outline-none text-slate-800"
                required
              />
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-start gap-2 p-4 rounded-xl bg-red-50 text-red-600 text-[11px] font-bold border border-red-100 shadow-sm"
              >
                <ShieldAlert size={16} className="shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <button
              disabled={loading}
              className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-900/20 disabled:opacity-50"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
                  <span>{isLogin ? 'Sign In Now' : 'Initialize Account'}</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-6 text-center border-t border-slate-100 flex flex-col gap-4">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-[10px] uppercase tracking-widest font-bold text-slate-400 hover:text-blue-600 transition-colors"
            >
              {isLogin ? "Need a new account? Register" : "Have an account? Login here"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
