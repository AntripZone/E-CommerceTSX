//definimos la estructura de un producto existente
export interface Producto {
  id: number;
  name: string;
  description: string | null;
  price: string;
  stock: number;
  category: string | null;
  image_url: string | null;
  created_at: string;
}

//definimos los datos para crear un producto
export interface CrearProductoDTO {
  name: string;
  description: string | null;
  price: number | string;
  stock: number;
  category: string | null;
  image_url: string | null;
}

//definimos los datos para actualizar un producto
export interface ActualizarProductoDTO {
  name?: string | null;
  description?: string | null;
  price?: number | string | null;
  stock?: number | null;
  category?: string | null;
  image_url?: string | null;
}
