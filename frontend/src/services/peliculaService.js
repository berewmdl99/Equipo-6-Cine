import api from "../utils/api";

// Obtener lista de películas
export const getPeliculas = async () => {
  try {
    console.log("Obteniendo películas en cartelera...");
    const response = await api.get("/peliculas/");
    console.log("Respuesta de películas en cartelera:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error al obtener películas en cartelera:", error);
    throw new Error(error.response?.data?.detail || 'Error al obtener las películas');
  }
};

// Obtener todas las películas (incluyendo las que no están en cartelera)
export const getTodasPeliculas = async () => {
  try {
    console.log("Obteniendo todas las películas...");
    const response = await api.get("/peliculas/todas");
    console.log("Respuesta de todas las películas:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error al obtener todas las películas:", error);
    throw new Error(error.response?.data?.detail || 'Error al obtener todas las películas');
  }
};

// Crear una nueva película
export const createPelicula = async (peliculaData) => {
  try {
    const formData = new FormData();
    
    // Agregar campos obligatorios
    formData.append("titulo", peliculaData.titulo);
    formData.append("duracion_min", peliculaData.duracion_min);
    formData.append("clasificacion", peliculaData.clasificacion);
    formData.append("genero", peliculaData.genero);
    
    // Agregar campos opcionales
    if (peliculaData.descripcion) {
      formData.append("descripcion", peliculaData.descripcion);
    }
    if (peliculaData.imagen) {
      formData.append("imagen", peliculaData.imagen);
    }
    formData.append("en_cartelera", peliculaData.en_cartelera);

    const response = await api.post("/peliculas/", formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Error al crear la película');
  }
};

// Actualizar una película existente
export const updatePelicula = async (id, peliculaData) => {
  try {
    const formData = new FormData();
    
    // Solo agregar campos que se van a actualizar
    if (peliculaData.titulo) formData.append("titulo", peliculaData.titulo);
    if (peliculaData.duracion_min) formData.append("duracion_min", peliculaData.duracion_min);
    if (peliculaData.clasificacion) formData.append("clasificacion", peliculaData.clasificacion);
    if (peliculaData.genero) formData.append("genero", peliculaData.genero);
    if (peliculaData.descripcion !== undefined) formData.append("descripcion", peliculaData.descripcion);
    if (peliculaData.en_cartelera !== undefined) formData.append("en_cartelera", peliculaData.en_cartelera);
    
    if (peliculaData.imagen) {
      formData.append("imagen", peliculaData.imagen);
    }

    const response = await api.put(`/peliculas/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Error al actualizar la película');
  }
};

// Eliminar una película
export const deletePelicula = async (id) => {
  try {
    await api.delete(`/peliculas/${id}`);
  } catch (error) {
    if (error.response?.status === 400) {
      throw new Error("No se puede eliminar la película porque tiene funciones activas");
    }
    throw error;
  }
};

const peliculaService = {
  getPeliculas,
  getTodasPeliculas,
  createPelicula,
  updatePelicula,
  deletePelicula,
};

export default peliculaService;


