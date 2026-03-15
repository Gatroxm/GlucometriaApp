export interface GlucoseRecord {
  id: string;
  value: number; // mg/dL
  date: string; // ISO format (YYYY-MM-DD)
  time: string; // ISO format (HH:mm)
  context: string;
  notes?: string;
  timestamp: number; // For sorting
}

export const GLUCOSE_CONTEXTS = [
  { value: 'ayunas', label: 'En ayunas' },
  { value: 'pre_comida', label: 'Antes de comida' },
  { value: 'post_comida', label: '2h después de comida' },
  { value: 'antes_almuerzo', label: 'Antes de almuerzo' },
  { value: 'despues_almuerzo', label: '2h después de almuerzo' },
  { value: 'antes_cena', label: 'Antes de cenar' },
  { value: 'despues_cena', label: '2h después de cenar' },
  { value: 'antes_desayuno', label: 'Antes de desayuno' },
  { value: 'despues_desayuno', label: '2h después de desayuno' },
  { value: 'actividad_fisica', label: 'Actividad física' },
  { value: 'malestar', label: 'Con malestar/síntomas' },
  { value: 'control_rutina', label: 'Control de rutina' },
  { value: 'antes_dormir', label: 'Antes de dormir' },
  { value: 'madrugada', label: 'Madrugada' },
  { value: 'otro', label: 'Otro' }
];
