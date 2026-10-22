//definimos los datos para iniciar sesión
export interface LoginDTO {
  email: string;
  password: string;
}

//definimos los datos para registrar un usuario
export interface RegistroDTO extends LoginDTO {
  name: string;
}

//definimos los datos del usuario registrado
export interface Usuario {
  id: number;
  email: string;
  name: string;
  role: string;
}

//definimos la respuesta del inicio de sesión
export interface TokenRespuesta {
  access_token: string;
  token_type: string;
  user_role: string;
  user_name: string;
}
