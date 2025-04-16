import { format, parse } from 'date-fns';

export const formatosFecha = {
  fechaBackend: 'yyyy-MM-dd',
  horaBackend: 'HH:mm:ss',
  fechaHoraBackend: 'yyyy-MM-dd HH:mm:ss',
  fechaMostrar: 'dd/MM/yyyy',
  horaMostrar: 'HH:mm'
};

export const formatearFecha = (fecha, formato) => {
  return format(fecha, formato);
};

export const parsearFecha = (fechaStr, formato) => {
  return parse(fechaStr, formato, new Date());
};
