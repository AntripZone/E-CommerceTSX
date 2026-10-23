import { useMemo } from 'react';
import type { OrderWithItems, Product } from '@/lib/supabase';
import { formatPrice } from '@/lib/format';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { TrendingUp, DollarSign, ShoppingBag, Package } from 'lucide-react';

const PIE_COLORS = ['#d97706', '#92400e', '#fbbf24', '#fcd34d', '#fde68a'];

type Props = {
  orders: OrderWithItems[];
  products: Product[];
};

export default function SalesTab({ orders, products }: Props) {
  const stats = useMemo(() => {
    const completed = orders.filter((o) => o.status === 'completed');
    const totalRevenue = completed.reduce((sum, o) => sum + Number(o.total), 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / (completed.length || 1) : 0;
    return {
      totalRevenue,
      totalOrders,
      pendingOrders: orders.filter((o) => o.status === 'pending').length,
      avgOrderValue,
      productsCount: products.length,
    };
  }, [orders, products]);

  // Revenue over last 7 days (line chart)
  const revenueByDay = useMemo(() => {
    const days: { date: string; label: string; revenue: number; orders: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);

      const dayOrders = orders.filter((o) => {
        const created = new Date(o.created_at);
        return created >= d && created < next && o.status !== 'cancelled';
      });

      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      days.push({
        date: d.toISOString(),
        label: dayLabel,
        revenue: dayOrders.reduce((sum, o) => sum + Number(o.total), 0),
        orders: dayOrders.length,
      });
    }
    return days;
  }, [orders]);

  // Sales by category (bar chart)
  const salesByCategory = useMemo(() => {
    const map = new Map<string, { category: string; revenue: number; quantity: number }>();
    for (const order of orders) {
      if (order.status === 'cancelled') continue;
      for (const item of order.order_items ?? []) {
        const product = products.find((p) => p.id === item.product_id);
        const category = product?.category ?? 'Other';
        const existing = map.get(category) ?? { category, revenue: 0, quantity: 0 };
        existing.revenue += Number(item.price) * item.quantity;
        existing.quantity += item.quantity;
        map.set(category, existing);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [orders, products]);

  // Order status distribution (pie chart)
  const statusDistribution = useMemo(() => {
    const map = new Map<string, number>();
    for (const order of orders) {
      map.set(order.status, (map.get(order.status) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  }, [orders]);

  // Top products by revenue
  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; revenue: number; quantity: number }>();
    for (const order of orders) {
      if (order.status === 'cancelled') continue;
      for (const item of order.order_items ?? []) {
        const existing = map.get(item.name) ?? { name: item.name, revenue: 0, quantity: 0 };
        existing.revenue += Number(item.price) * item.quantity;
        existing.quantity += item.quantity;
        map.set(item.name, existing);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [orders]);

  if (orders.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-3">
          <TrendingUp className="w-8 h-8 text-stone-300" />
        </div>
        <p className="text-stone-500">No sales data yet</p>
        <p className="text-stone-400 text-sm mt-1">Sales charts will appear here once orders come in.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Revenue"
          value={formatPrice(stats.totalRevenue)}
          icon={<DollarSign className="w-5 h-5" />}
          color="bg-amber-50 text-amber-700"
        />
        <StatCard
          label="Total Orders"
          value={stats.totalOrders.toString()}
          icon={<ShoppingBag className="w-5 h-5" />}
          color="bg-blue-50 text-blue-700"
        />
        <StatCard
          label="Pending"
          value={stats.pendingOrders.toString()}
          icon={<Package className="w-5 h-5" />}
          color="bg-orange-50 text-orange-700"
        />
        <StatCard
          label="Avg Order Value"
          value={formatPrice(stats.avgOrderValue)}
          icon={<TrendingUp className="w-5 h-5" />}
          color="bg-green-50 text-green-700"
        />
      </div>

      {/* Revenue over time */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6">
        <h3 className="text-base font-semibold text-stone-800 mb-4">Revenue — Last 7 Days</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={revenueByDay} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#78716c' }} />
            <YAxis tick={{ fontSize: 12, fill: '#78716c' }} tickFormatter={(v) => `$${v}`} />
            <Tooltip
              formatter={(value) => [formatPrice(Number(value ?? 0)), 'Revenue']}
              contentStyle={{ borderRadius: '12px', border: '1px solid #e7e5e4', fontSize: '13px' }}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#d97706"
              strokeWidth={3}
              dot={{ fill: '#d97706', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by category */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6">
          <h3 className="text-base font-semibold text-stone-800 mb-4">Sales by Category</h3>
          {salesByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={salesByCategory} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="category" tick={{ fontSize: 12, fill: '#78716c' }} />
                <YAxis tick={{ fontSize: 12, fill: '#78716c' }} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  formatter={(value) => [formatPrice(Number(value ?? 0)), 'Revenue']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e7e5e4', fontSize: '13px' }}
                />
                <Bar dataKey="revenue" fill="#d97706" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </div>

        {/* Order status distribution */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6">
          <h3 className="text-base font-semibold text-stone-800 mb-4">Order Status</h3>
          {statusDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={50}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusDistribution.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e7e5e4', fontSize: '13px' }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{ fontSize: '13px', color: '#78716c' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </div>
      </div>

      {/* Top products */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6">
        <h3 className="text-base font-semibold text-stone-800 mb-4">Top Products by Revenue</h3>
        {topProducts.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topProducts} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12, fill: '#78716c' }} tickFormatter={(v) => `$${v}`} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12, fill: '#78716c' }}
                width={120}
              />
              <Tooltip
                formatter={(value) => [formatPrice(Number(value ?? 0)), 'Revenue']}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e7e5e4', fontSize: '13px' }}
              />
              <Bar dataKey="revenue" fill="#92400e" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </div>
    </div>
  );
}

function StatCard({
  label, value, icon, color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-5">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${color}`}>
        {icon}
      </div>
      <p className="text-stone-400 text-xs font-medium uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-stone-800 mt-1">{value}</p>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="h-[260px] flex items-center justify-center">
      <p className="text-stone-400 text-sm">No data available</p>
    </div>
  );
}
