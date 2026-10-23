import axios from "axios";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const STORAGE_KEY = "bakery-auth-token";

export const api = axios.create({
  baseURL: supabaseUrl,
  headers: {
    apikey: supabaseAnonKey,
    "Content-Type": "application/json",
  },
});

export function getAuthToken(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem(STORAGE_KEY, token);
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    localStorage.removeItem(STORAGE_KEY);
    delete api.defaults.headers.common["Authorization"];
  }
}

const storedToken = getAuthToken();
if (storedToken) {
  api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
}

export const authApi = {
  signIn: (email: string, password: string) =>
    api.post("/auth/v1/token?grant_type=password", { email, password }),
  signUp: (email: string, password: string) =>
    api.post("/auth/v1/signup", { email, password }),
  signOut: () => api.post("/auth/v1/logout", {}),
  getUser: (token: string) =>
    axios.get(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${token}` },
    }),
};

export const dataApi = {
  getProducts: () => api.get("/rest/v1/products?select=*&order=name.asc"),
  getAvailableProducts: () =>
    api.get("/rest/v1/products?select=*&available=eq.true&order=name.asc"),
  createProduct: (payload: Omit<Product, "id" | "created_at">) =>
    api.post("/rest/v1/products?select=*", payload, {
      headers: { Prefer: "return=representation" },
    }),
  updateProduct: (
    id: string,
    payload: Partial<Omit<Product, "id" | "created_at">>,
  ) =>
    api.patch(`/rest/v1/products?select=*&id=eq.${id}`, payload, {
      headers: { Prefer: "return=representation" },
    }),
  deleteProduct: (id: string) => api.delete(`/rest/v1/products?id=eq.${id}`),

  getOrders: (userId: string) =>
    api.get(
      `/rest/v1/orders?select=*,order_items(*)&user_id=eq.${userId}&order=created_at.desc`,
    ),
  getAllOrders: () =>
    api.get("/rest/v1/orders?select=*,order_items(*)&order=created_at.desc"),
  createOrder: (payload: { total: number; status: string; user_id: string }) =>
    api.post("/rest/v1/orders?select=*", payload, {
      headers: { Prefer: "return=representation" },
    }),
  createOrderItems: (
    items: {
      order_id: string;
      product_id: string;
      name: string;
      price: number;
      quantity: number;
    }[],
  ) => api.post("/rest/v1/order_items", items),
  updateOrderStatus: (id: string, status: string) =>
    api.patch(
      `/rest/v1/orders?select=*&id=eq.${id}`,
      { status },
      {
        headers: { Prefer: "return=representation" },
      },
    ),

  checkAdmin: () => api.get("/rest/v1/admins?select=id&limit=1"),
};

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string | null;
  available: boolean;
  created_at: string;
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export type Order = {
  id: string;
  user_id: string;
  status: string;
  total: number;
  created_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  name: string;
  price: number;
  quantity: number;
  created_at: string;
};

export type OrderWithItems = Order & {
  order_items: OrderItem[];
};

export type AuthUser = {
  id: string;
  email: string;
};
