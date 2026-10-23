import { useEffect, useState } from 'react';
import { supabase, type OrderWithItems } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { formatPrice, formatDate } from '../lib/format';
import { Package, Clock, CheckCircle2, XCircle } from 'lucide-react';

const STATUS_STYLES: Record<string, { label: string; icon: typeof Clock; className: string }> = {
  pending: { label: 'Pending', icon: Clock, className: 'bg-amber-100 text-amber-700' },
  completed: { label: 'Completed', icon: CheckCircle2, className: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', icon: XCircle, className: 'bg-red-100 text-red-700' },
};

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error('Failed to load orders:', error);
        } else {
          setOrders((data ?? []) as OrderWithItems[]);
        }
        setLoading(false);
      });
  }, [user]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-stone-100 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4">
          <Package className="w-10 h-10 text-stone-300" />
        </div>
        <h2 className="text-xl font-bold text-stone-800">No orders yet</h2>
        <p className="text-stone-500 mt-1">Your past orders will appear here once you place one.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold text-stone-800 mb-6">Your Orders</h1>
      <div className="space-y-4">
        {orders.map((order) => {
          const status = STATUS_STYLES[order.status] ?? STATUS_STYLES.pending;
          const StatusIcon = status.icon;
          return (
            <div
              key={order.id}
              className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
                <div>
                  <p className="text-sm font-medium text-stone-800">
                    Order placed {formatDate(order.created_at)}
                  </p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {order.id.slice(0, 8).toUpperCase()}
                  </p>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${status.className}`}>
                  <StatusIcon className="w-3.5 h-3.5" />
                  {status.label}
                </div>
              </div>
              <div className="px-6 py-4 space-y-2">
                {order.order_items?.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-stone-700">
                      <span className="text-stone-400 mr-2">{item.quantity}x</span>
                      {item.name}
                    </span>
                    <span className="text-stone-600 font-medium">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between px-6 py-4 bg-stone-50 border-t border-stone-100">
                <span className="text-sm text-stone-500">Total</span>
                <span className="text-lg font-bold text-stone-900">{formatPrice(order.total)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
