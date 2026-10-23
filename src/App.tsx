import { useState } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import AuthPage from '@/components/AuthPage';
import Header from '@/components/Header';
import ShopPage from '@/components/ShopPage';
import OrdersPage from '@/components/OrdersPage';
import AdminDashboard from '@/components/AdminDashboard';
import CartDrawer from '@/components/CartDrawer';

type View = 'shop' | 'orders' | 'admin';

function AppContent() {
  const { user, loading } = useAuth();
  const [view, setView] = useState<View>('shop');
  const [showAuth, setShowAuth] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50">
        <div className="w-10 h-10 border-3 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (showAuth || (view === 'orders' && !user)) {
    return <AuthPage
      onBack={() => { setShowAuth(false); setView('shop'); }}
      onSuccess={() => { setShowAuth(false); setView('admin');
      }}
    />;
  }

  const effectiveView: View = view === 'orders' && !user ? 'shop' : view;


  return (
    <div className="min-h-screen bg-stone-50">
      <Header view={effectiveView} onViewChange={setView} onSignIn={() => setShowAuth(true)} />
      <main>
        {effectiveView === 'shop' && <ShopPage />}
        {effectiveView === 'orders' && user && <OrdersPage />}
        {effectiveView === 'admin' && <AdminDashboard />}
      </main>
      <CartDrawer />
      <footer className="bg-stone-800 text-stone-400 py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center text-sm">
          Maison Dorée — Artisan Bakery & Patisserie
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  );
}
