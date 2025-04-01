import axios from "axios";

// Asegúrate de usar la URL correcta del backend
const API_URL = "http://localhost:8000/peliculas";

// Obtener lista de películas
export const getPeliculas = async (token) => {
  try {
    const response = await axios.get(API_URL, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || "Error al obtener las películas";
  }
};

// Crear una nueva película
export const createPelicula = async (peliculaData, imagen, token) => {
  const formData = new FormData();
  formData.append("titulo", peliculaData.titulo);
  formData.append("duracion_min", peliculaData.duracion_min);
  formData.append("clasificacion", peliculaData.clasificacion);
  formData.append("genero", peliculaData.genero);
  formData.append("descripcion", peliculaData.descripcion || "");
  formData.append("en_cartelera", peliculaData.en_cartelera);

  if (imagen) {
    formData.append("imagen", imagen);
  }

  try {
    const response = await axios.post(API_URL, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || "Error al crear la película";
  }
};

// Actualizar una película existente
export const updatePelicula = async (peliculaId, peliculaData, imagen, token) => {
  const formData = new FormData();
  if (peliculaData.titulo) formData.append("titulo", peliculaData.titulo);
  if (peliculaData.duracion_min !== undefined) formData.append("duracion_min", peliculaData.duracion_min);
  if (peliculaData.clasificacion) formData.append("clasificacion", peliculaData.clasificacion);
  if (peliculaData.genero) formData.append("genero", peliculaData.genero);
  if (peliculaData.descripcion !== undefined) formData.append("descripcion", peliculaData.descripcion);
  if (peliculaData.en_cartelera !== undefined) formData.append("en_cartelera", peliculaData.en_cartelera);

  if (imagen) {
    formData.append("imagen", imagen);
  }

  try {
    const response = await axios.put(`${API_URL}/${peliculaId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || "Error al actualizar la película";
  }
};

// Eliminar una película
export const deletePelicula = async (peliculaId, token) => {
  try {
    await axios.delete(`${API_URL}/${peliculaId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { message: "Película eliminada exitosamente" };
  } catch (error) {
    throw error.response?.data || "Error al eliminar la película";
  }
};


