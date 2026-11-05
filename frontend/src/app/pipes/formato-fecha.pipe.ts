import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatoFecha',
  standalone: true
})
export class FormatoFechaPipe implements PipeTransform {
  transform(valor: string | Date | null, tipo: 'fecha' | 'hora' | 'fechaHora' = 'fecha'): string {
    if (!valor) return '';

    if (tipo === 'hora') {
      return this.formatearHora(valor);
    }

    if (tipo === 'fecha') {
      return this.formatearFecha(valor);
    }

    if (tipo === 'fechaHora') {
      const fecha = this.formatearFecha(valor);
      const hora = this.formatearHora(valor);
      return `${fecha} ${hora}`;
    }

    return String(valor);
  }

  private formatearFecha(valor: string | Date): string {
    if (!valor) return '';

    const str = String(valor);

    if (str.includes('T')) {
      const partes = str.split('T')[0].split('-');
      if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
      }
    }

    if (str.includes('-')) {
      const partes = str.split('-');
      if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
      }
    }

    return str;
  }

  private formatearHora(valor: string | Date): string {
    if (!valor) return '';

    const str = String(valor);

    if (str.includes('T')) {
      const horaParte = str.split('T')[1];
      if (horaParte) {
        const hm = horaParte.substring(0, 5);
        return hm;
      }
    }

    if (str.includes(':')) {
      return str.substring(0, 5);
    }

    return str;
  }
}
