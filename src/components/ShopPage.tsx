import { useEffect, useState } from 'react';
import { supabase, type Product } from '../lib/supabase';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../lib/format';
import { Plus, Check } from 'lucide-react';

const CATEGORIES = ['All', 'Bread', 'Pastry', 'Cake', 'Dessert'];

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const { addToCart } = useCart();

  useEffect(() => {
    supabase
      .from('products')
      .select('*')
      .eq('available', true)
      .order('name')
      .then(({ data, error }) => {
        if (error) {
          console.error('Failed to load products:', error);
        } else {
          setProducts(data ?? []);
        }
        setLoading(false);
      });
  }, []);

  const filtered = category === 'All' ? products : products.filter((p) => p.category === category);

  const handleAdd = (product: Product) => {
    addToCart(product);
    setJustAdded(product.id);
    setTimeout(() => setJustAdded((prev) => (prev === product.id ? null : prev)), 1500);
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative h-80 sm:h-96 overflow-hidden">
        <img
          src="https://images.pexels.com/photos/32459865/pexels-photo-32459865.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
          alt="Bakery interior"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />
        <div className="relative h-full max-w-6xl mx-auto px-4 sm:px-6 flex flex-col justify-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 drop-shadow-lg">
            Freshly Baked, Every Day
          </h1>
          <p className="text-lg text-white/90 max-w-lg drop-shadow">
            Artisan breads, pastries, and desserts made with love and the finest ingredients.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                category === cat
                  ? 'bg-amber-600 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100">
                <div className="h-52 bg-stone-200 animate-pulse" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-stone-200 rounded animate-pulse w-2/3" />
                  <div className="h-4 bg-stone-200 rounded animate-pulse w-full" />
                  <div className="h-4 bg-stone-200 rounded animate-pulse w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((product) => (
              <div
                key={product.id}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 hover:shadow-lg transition-shadow duration-300"
              >
                <div className="relative h-52 overflow-hidden bg-stone-100">
                  <img
                    src={product.image_url ?? ''}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-xs font-medium text-stone-700 px-3 py-1 rounded-full">
                    {product.category}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-stone-800">{product.name}</h3>
                  <p className="text-sm text-stone-500 mt-1 line-clamp-2">{product.description}</p>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xl font-bold text-amber-700">{formatPrice(product.price)}</span>
                    <button
                      onClick={() => handleAdd(product)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        justAdded === product.id
                          ? 'bg-green-500 text-white'
                          : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                      }`}
                    >
                      {justAdded === product.id ? (
                        <>
                          <Check className="w-4 h-4" />
                          Added
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          Add to Cart
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
