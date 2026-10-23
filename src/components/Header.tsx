import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Croissant, ShoppingCart, Package, LogOut, Store } from 'lucide-react';

type View = 'shop' | 'orders';

type Props = {
  view: View;
  onViewChange: (view: View) => void;
};

export default function Header({ view, onViewChange }: Props) {
  const { user, signOut } = useAuth();
  const { totalItems, setIsOpen } = useCart();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-stone-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <button
          onClick={() => onViewChange('shop')}
          className="flex items-center gap-2.5"
        >
          <div className="w-9 h-9 rounded-full bg-amber-600 text-white flex items-center justify-center">
            <Croissant className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold text-stone-800 hidden sm:block">Maison Dorée</span>
        </button>

        <nav className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => onViewChange('shop')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === 'shop'
                ? 'text-amber-700 bg-amber-50'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <Store className="w-4 h-4" />
            <span className="hidden sm:inline">Shop</span>
          </button>
          <button
            onClick={() => onViewChange('orders')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === 'orders'
                ? 'text-amber-700 bg-amber-50'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <Package className="w-4 h-4" />
            <span className="hidden sm:inline">Orders</span>
          </button>

          <button
            onClick={() => setIsOpen(true)}
            className="relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors"
          >
            <ShoppingCart className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>

          <div className="hidden md:flex items-center gap-3 ml-2 pl-4 border-l border-stone-200">
            <span className="text-sm text-stone-500">{user?.email}</span>
            <button
              onClick={signOut}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-stone-600 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
          <button
            onClick={signOut}
            className="md:hidden p-2 rounded-lg text-stone-600 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </nav>
      </div>
    </header>
  );
}
