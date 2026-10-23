import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { dataApi } from '@/lib/supabase';
import { formatPrice } from '@/lib/format';
import { X, Plus, Minus, Trash2, CheckCircle2, ShoppingCart } from 'lucide-react';

export default function CartDrawer() {
  const { items, isOpen, setIsOpen, updateQuantity, removeFromCart, clearCart, subtotal, totalItems } = useCart();
  const { user } = useAuth();
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleCheckout = async () => {
    if (!user || items.length === 0) return;
    setPlacing(true);
    setError(null);
    try {
      const orderRes = await dataApi.createOrder({
        total: subtotal,
        status: 'pending',
        user_id: user.id,
      });
      const order = orderRes.data[0];

      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
      }));

      await dataApi.createOrderItems(orderItems);

      clearCart();
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setIsOpen(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
          <h2 className="text-lg font-bold text-stone-800">
            Your Cart {totalItems > 0 && <span className="text-stone-400 font-normal">({totalItems})</span>}
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
            <h3 className="text-xl font-bold text-stone-800 mb-2">Order Placed!</h3>
            <p className="text-stone-500">We're getting your baked goods ready.</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center mb-4">
              <ShoppingCart className="w-10 h-10 text-stone-300" />
            </div>
            <p className="text-stone-500 text-lg font-medium">Your cart is empty</p>
            <p className="text-stone-400 text-sm mt-1">Add some delicious treats to get started.</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {items.map((item) => (
                <div
                  key={item.product.id}
                  className="flex gap-3 items-center"
                >
                  <img
                    src={item.product.image_url ?? ''}
                    alt={item.product.name}
                    className="w-16 h-16 rounded-lg object-cover bg-stone-100 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-stone-800 truncate">{item.product.name}</h3>
                    <p className="text-sm text-stone-500">{formatPrice(item.product.price)}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="w-7 h-7 rounded-full border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-50 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-sm font-medium text-stone-800 w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="w-7 h-7 rounded-full border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-50 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="ml-auto p-1.5 text-stone-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-stone-800">
                      {formatPrice(item.product.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-stone-200 px-6 py-4 space-y-3">
              {error && (
                <div className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2.5">
                  {error}
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-stone-600">Subtotal</span>
                <span className="text-xl font-bold text-stone-900">{formatPrice(subtotal)}</span>
              </div>
              <button
                onClick={handleCheckout}
                disabled={placing}
                className="w-full py-3 rounded-xl bg-amber-600 text-white font-semibold hover:bg-amber-700 disabled:opacity-50 transition-colors"
              >
                {placing ? 'Placing Order...' : 'Place Order'}
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
