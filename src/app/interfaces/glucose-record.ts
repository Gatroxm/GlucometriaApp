export interface InsulinaRecord {
  unidades: number;
  tipoInsulina: 'rapida' | 'basal' | 'ninguna';
  ratioUtilizado: number;
}

export interface GlucoseRecord {
  _id?: string;               // MongoDB usa _id en lugar de id
  user?: string;              // ID del usuario propietario
  valor: number;             // Cambiado de 'value' a 'valor' para hacer match con el backend
  tipo: 'ayunas' | 'pre_comida' | 'post_comida' | 'pre_entreno' | 'post_entreno' | 'madrugada' | 'casual'; // Cambiado de context a tipo
  carbohidratos: number;      // Gramos contados con la gramera
  insulina: InsulinaRecord;   // Objeto anidado de insulina
  hizoEjercicio: boolean;     // Flag para cruzar con el gimnasio/natación
  notes?: string;             // Notas opcionales
  fecha: string;              // ISO string completo (reemplaza date, time y timestamp)
  createdAt?: string;
  updatedAt?: string;
}

// Stript de visualización simplificado para los formularios de Ionic/Angular
export const GLUCOSE_CONTEXTS = [
  { value: 'ayunas', label: 'En ayunas (Al despertar)' },
  { value: 'pre_comida', label: 'Antes de comer (Desayuno/Almuerzo/Cena)' },
  { value: 'post_comida', label: '2h después de comer' },
  { value: 'pre_entreno', label: 'Antes de entrenar (Fierros/Piscina)' },
  { value: 'post_entreno', label: 'Al terminar de entrenar' },
  { value: 'madrugada', label: 'Madrugada (Control 3:00 AM)' },
  { value: 'casual', label: 'Control casual / Rutina' }
];