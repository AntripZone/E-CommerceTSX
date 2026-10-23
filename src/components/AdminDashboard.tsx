import { useEffect, useState, type FormEvent } from 'react';
import { dataApi, type Product, type OrderWithItems } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { formatPrice, formatDate } from '@/lib/format';
import {
  Plus, Pencil, Trash2, X, Lock, Package, ShoppingBag, Clock, CheckCircle2, XCircle, TrendingUp,
} from 'lucide-react';
import SalesTab from '@/components/SalesTab';

type Tab = 'products' | 'orders' | 'sales';

const CATEGORIES = ['Bread', 'Pastry', 'Cake', 'Dessert'];
const ORDER_STATUSES = ['pending', 'completed', 'cancelled'];

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-amber-100 text-amber-700' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700' },
};

export default function AdminDashboard() {
  const { user, isAdmin } = useAuth();
  const [tab, setTab] = useState<Tab>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const canEdit = !!(user && isAdmin);

  const loadData = () => {
    setLoading(true);
    setError(null);
    const productsPromise = dataApi.getProducts().then((res) => res.data as Product[]);
    const ordersPromise = dataApi.getAllOrders().then((res) => res.data as OrderWithItems[]);

    Promise.all([productsPromise, ordersPromise])
      .then(([prods, ords]) => {
        setProducts(prods);
        setOrders(ords);
      })
      .catch((err) => {
        setError('Failed to load dashboard data');
        console.error(err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveProduct = async (formData: Omit<Product, 'id' | 'created_at'>, id?: string) => {
    setActionLoading(true);
    setError(null);
    try {
      if (id) {
        await dataApi.updateProduct(id, formData);
      } else {
        await dataApi.createProduct(formData);
      }
      setShowForm(false);
      setEditingProduct(null);
      loadData();
    } catch (err) {
      const message = err instanceof Error && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? err.message
        : 'Failed to save product';
      setError(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    setActionLoading(true);
    setError(null);
    try {
      await dataApi.deleteProduct(id);
      loadData();
    } catch (err) {
      const message = err instanceof Error && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? err.message
        : 'Failed to delete product';
      setError(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (id: string, status: string) => {
    setActionLoading(true);
    setError(null);
    try {
      await dataApi.updateOrderStatus(id, status);
      loadData();
    } catch (err) {
      const message = err instanceof Error && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? err.message
        : 'Failed to update order';
      setError(message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Admin Dashboard</h1>
          <p className="text-stone-500 text-sm mt-1">Manage products and orders</p>
        </div>
        {!canEdit && (
          <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-lg text-sm">
            <Lock className="w-4 h-4" />
            Sign in as admin to make changes
          </div>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2.5 mb-6">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 p-1 bg-stone-100 rounded-lg w-fit overflow-x-auto">
        <button
          onClick={() => setTab('products')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
            tab === 'products' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'
          }`}
        >
          <Package className="w-4 h-4" />
          Products ({products.length})
        </button>
        <button
          onClick={() => setTab('orders')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
            tab === 'orders' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          Orders ({orders.length})
        </button>
        <button
          onClick={() => setTab('sales')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
            tab === 'sales' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Sales
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-stone-100 rounded-xl" />
          ))}
        </div>
      ) : tab === 'products' ? (
        <ProductsTab
          products={products}
          canEdit={canEdit}
          actionLoading={actionLoading}
          onAdd={() => { setEditingProduct(null); setShowForm(true); }}
          onEdit={(p) => { setEditingProduct(p); setShowForm(true); }}
          onDelete={handleDeleteProduct}
        />
      ) : tab === 'orders' ? (
        <OrdersTab
          orders={orders}
          canEdit={canEdit}
          actionLoading={actionLoading}
          onUpdateStatus={handleUpdateOrderStatus}
        />
      ) : (
        <SalesTab orders={orders} products={products} />
      )}

      {showForm && (
        <ProductFormModal
          product={editingProduct}
          loading={actionLoading}
          onClose={() => { setShowForm(false); setEditingProduct(null); }}
          onSave={handleSaveProduct}
        />
      )}
    </div>
  );
}

// ===== Products Tab =====
function ProductsTab({
  products, canEdit, actionLoading, onAdd, onEdit, onDelete,
}: {
  products: Product[];
  canEdit: boolean;
  actionLoading: boolean;
  onAdd: () => void;
  onEdit: (p: Product) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div>
      {canEdit && (
        <button
          onClick={onAdd}
          disabled={actionLoading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-600 text-white font-medium hover:bg-amber-700 disabled:opacity-50 transition-colors mb-4"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50">
                <th className="text-left text-xs font-semibold text-stone-500 uppercase tracking-wider px-6 py-3">Product</th>
                <th className="text-left text-xs font-semibold text-stone-500 uppercase tracking-wider px-6 py-3 hidden sm:table-cell">Category</th>
                <th className="text-right text-xs font-semibold text-stone-500 uppercase tracking-wider px-6 py-3">Price</th>
                <th className="text-center text-xs font-semibold text-stone-500 uppercase tracking-wider px-6 py-3 hidden md:table-cell">Status</th>
                {canEdit && <th className="text-right text-xs font-semibold text-stone-500 uppercase tracking-wider px-6 py-3">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-stone-50/50 transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.image_url ?? ''}
                        alt={product.name}
                        className="w-10 h-10 rounded-lg object-cover bg-stone-100 flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-stone-800 truncate">{product.name}</p>
                        <p className="text-xs text-stone-400 truncate sm:hidden">{product.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3 hidden sm:table-cell">
                    <span className="text-sm text-stone-600">{product.category}</span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <span className="text-sm font-semibold text-stone-800">{formatPrice(product.price)}</span>
                  </td>
                  <td className="px-6 py-3 hidden md:table-cell text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      product.available ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-500'
                    }`}>
                      {product.available ? 'Available' : 'Hidden'}
                    </span>
                  </td>
                  {canEdit && (
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onEdit(product)}
                          disabled={actionLoading}
                          className="p-2 rounded-lg text-stone-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(product.id)}
                          disabled={actionLoading}
                          className="p-2 rounded-lg text-stone-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ===== Orders Tab =====
function OrdersTab({
  orders, canEdit, actionLoading, onUpdateStatus,
}: {
  orders: OrderWithItems[];
  canEdit: boolean;
  actionLoading: boolean;
  onUpdateStatus: (id: string, status: string) => void;
}) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-3">
          <ShoppingBag className="w-8 h-8 text-stone-300" />
        </div>
        <p className="text-stone-500">No orders yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const badge = STATUS_BADGES[order.status] ?? STATUS_BADGES.pending;
        return (
          <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${badge.className}`}>
                  {order.status === 'pending' && <Clock className="w-3.5 h-3.5" />}
                  {order.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                  {order.status === 'cancelled' && <XCircle className="w-3.5 h-3.5" />}
                  {badge.label}
                </div>
                <div>
                  <p className="text-sm font-medium text-stone-800">{formatDate(order.created_at)}</p>
                  <p className="text-xs text-stone-400">#{order.id.slice(0, 8).toUpperCase()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-stone-900">{formatPrice(order.total)}</span>
                {canEdit && (
                  <select
                    value={order.status}
                    onChange={(e) => onUpdateStatus(order.id, e.target.value)}
                    disabled={actionLoading}
                    className="text-sm border border-stone-200 rounded-lg px-3 py-1.5 text-stone-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none disabled:opacity-50"
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
            <div className="px-6 py-3 space-y-1.5">
              {order.order_items?.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="text-stone-700">
                    <span className="text-stone-400 mr-2">{item.quantity}x</span>
                    {item.name}
                  </span>
                  <span className="text-stone-600">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ===== Product Form Modal =====
function ProductFormModal({
  product, loading, onClose, onSave,
}: {
  product: Product | null;
  loading: boolean;
  onClose: () => void;
  onSave: (formData: Omit<Product, 'id' | 'created_at'>, id?: string) => void;
}) {
  const [name, setName] = useState(product?.name ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [price, setPrice] = useState(product?.price.toString() ?? '');
  const [category, setCategory] = useState(product?.category ?? CATEGORIES[0]);
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? '');
  const [available, setAvailable] = useState(product?.available ?? true);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave(
      {
        name,
        description,
        price: parseFloat(price),
        category,
        image_url: imageUrl || null,
        available,
      },
      product?.id
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 sticky top-0 bg-white rounded-t-2xl">
          <h2 className="text-lg font-bold text-stone-800">
            {product ? 'Edit Product' : 'Add Product'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-stone-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all text-stone-900"
              placeholder="Sourdough Bread"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Description</label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg border border-stone-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all text-stone-900 resize-none"
              placeholder="Rustic sourdough loaf with a crispy crust..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Price ($)</label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-stone-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all text-stone-900"
                placeholder="6.50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-stone-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all text-stone-900"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Image URL</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-stone-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all text-stone-900"
              placeholder="https://..."
            />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={available}
              onChange={(e) => setAvailable(e.target.checked)}
              className="w-5 h-5 rounded border-stone-300 text-amber-600 focus:ring-amber-200"
            />
            <span className="text-sm text-stone-700">Available for purchase</span>
          </label>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-stone-200 text-stone-600 font-medium hover:bg-stone-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-amber-600 text-white font-medium hover:bg-amber-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Saving...' : product ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
