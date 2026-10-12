export interface PaletaEstado {
  /** Tono oscuro: encabezados de columna, bordes y texto */
  color: string;
  /** Tono pálido: fondos de fichas y eventos */
  claro: string;
}

export const COLORES_ESTADO: Record<string, PaletaEstado> = {
  'REVISION':   { color: '#B45309', claro: '#FEF3C7' },
  'AUTORIZADO': { color: '#1D4ED8', claro: '#DBEAFE' },
  'EN PROCESO': { color: '#6D28D9', claro: '#EDE9FE' },
  'FINALIZADO': { color: '#15803D', claro: '#DCFCE7' },
  'CANCELADO':  { color: '#475569', claro: '#E2E8F0' }
};

export const ORDEN_ESTADOS = ['REVISION', 'AUTORIZADO', 'EN PROCESO', 'FINALIZADO', 'CANCELADO'];

const PALETA_POR_DEFECTO: PaletaEstado = { color: '#2A5298', claro: '#E3EBF7' };

export function normalizarEstado(nombre?: string | null): string {
  return (nombre || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();
}

export function coloresDeEstado(nombre?: string | null): PaletaEstado {
  return COLORES_ESTADO[normalizarEstado(nombre)] || PALETA_POR_DEFECTO;
}
