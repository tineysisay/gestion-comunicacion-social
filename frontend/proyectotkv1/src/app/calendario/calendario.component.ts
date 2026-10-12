import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SolicitudService } from '../services/solicitud.service';
import { AuthService } from '../services/auth.service';
import { FormatoFechaPipe } from '../pipes/formato-fecha.pipe';
import { coloresDeEstado, normalizarEstado, ORDEN_ESTADOS } from '../shared/colores-estado';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [CommonModule, FormsModule, FormatoFechaPipe],
  templateUrl: './calendario.component.html',
  styleUrl: './calendario.component.css'
})
export class CalendarioComponent implements OnInit, OnDestroy {

  fechaActual = new Date();
  anio = this.fechaActual.getFullYear();
  mes = this.fechaActual.getMonth();
  diaSeleccionado: Date | null = null;

  vista: 'mes' | 'semana' | 'dia' = 'mes';
  solicitudes: any[] = [];
  solicitudesFiltradas: any[] = [];
  estadosPresentes: string[] = [];

  diasSemana = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
  nombreMes = '';

  diasMes: (Date | null)[] = [];
  diasSemanaActual: Date[] = [];

  solicitudSeleccionada: any = null;
  mostrarDetalle = false;
  private subscription: Subscription = new Subscription();

  constructor(
    private solicitudService: SolicitudService,
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarSolicitudes();
    this.generarCalendario();
    // Suscribirse a cambios para recargar automaticamente
    this.subscription.add(
      this.solicitudService.observarCambios().subscribe(() => {
        this.cargarSolicitudes();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  cargarSolicitudes(): void {
    this.solicitudService.obtenerTodas().subscribe({
      next: (datos) => {
        this.solicitudes = datos;
        this.calcularEstadosPresentes();
        this.generarCalendario();
        this.filtrarPorFecha();
      },
      error: (error) => console.error('Error:', error)
    });
  }

  calcularEstadosPresentes(): void {
    const unicos = new Set<string>();
    this.solicitudes.forEach(s => {
      if (s.estado) unicos.add(s.estado);
    });
    this.estadosPresentes = Array.from(unicos).sort((a, b) => {
      const ordenA = ORDEN_ESTADOS.indexOf(normalizarEstado(a));
      const ordenB = ORDEN_ESTADOS.indexOf(normalizarEstado(b));
      return (ordenA === -1 ? 99 : ordenA) - (ordenB === -1 ? 99 : ordenB);
    });
  }

  generarCalendario(): void {
    this.nombreMes = this.obtenerNombreMes(this.mes);

    if (this.vista === 'mes') {
      this.generarMes();
    } else if (this.vista === 'semana') {
      this.generarSemana();
    }
  }

  generarMes(): void {
    const primerDia = new Date(this.anio, this.mes, 1);
    const ultimoDia = new Date(this.anio, this.mes + 1, 0);
    const diasEnMes = ultimoDia.getDate();
    const diaSemanaInicio = primerDia.getDay();

    this.diasMes = [];

    for (let i = 0; i < diaSemanaInicio; i++) {
      this.diasMes.push(null);
    }

    for (let i = 1; i <= diasEnMes; i++) {
      this.diasMes.push(new Date(this.anio, this.mes, i));
    }
  }

  generarSemana(): void {
    const inicio = this.obtenerInicioSemana(this.fechaActual);
    this.diasSemanaActual = [];

    for (let i = 0; i < 7; i++) {
      const dia = new Date(inicio);
      dia.setDate(inicio.getDate() + i);
      this.diasSemanaActual.push(dia);
    }
  }

  obtenerInicioSemana(fecha: Date): Date {
    const dia = fecha.getDay();
    const inicio = new Date(fecha);
    inicio.setDate(fecha.getDate() - dia);
    return inicio;
  }

  filtrarPorFecha(): void {
    if (this.vista === 'dia' && this.diaSeleccionado) {
      const fechaStr = this.formatearFecha(this.diaSeleccionado);
      this.solicitudesFiltradas = this.solicitudes.filter(s => {
        const rango = this.rangoDe(s);
        return !!rango && fechaStr >= rango.inicio && fechaStr <= rango.fin;
      });
    } else if (this.vista === 'semana') {
      const inicioStr = this.formatearFecha(this.diasSemanaActual[0]);
      const finStr = this.formatearFecha(this.diasSemanaActual[6]);
      this.solicitudesFiltradas = this.solicitudes.filter(s => {
        const rango = this.rangoDe(s);
        return !!rango && rango.inicio <= finStr && rango.fin >= inicioStr;
      });
    } else {
      const mesNum = String(this.mes + 1).padStart(2, '0');
      const primerDiaStr = `${this.anio}-${mesNum}-01`;
      const ultimoDia = new Date(this.anio, this.mes + 1, 0).getDate();
      const ultimoDiaStr = `${this.anio}-${mesNum}-${String(ultimoDia).padStart(2, '0')}`;
      this.solicitudesFiltradas = this.solicitudes.filter(s => {
        const rango = this.rangoDe(s);
        return !!rango && rango.inicio <= ultimoDiaStr && rango.fin >= primerDiaStr;
      });
    }
  }

  rangoDe(solicitud: any): { inicio: string; fin: string } | null {
    if (!solicitud || !solicitud.fecha_actividad) return null;
    const inicio = solicitud.fecha_actividad.substring(0, 10);
    const fin = (solicitud.fecha_fin_actividad || solicitud.fecha_actividad).substring(0, 10);
    return { inicio, fin: fin >= inicio ? fin : inicio };
  }

  rangoFechasTexto(solicitud: any): string {
    const rango = this.rangoDe(solicitud);
    if (!rango) return '';
    const invertir = (fecha: string) => fecha.split('-').reverse().join('/');
    if (rango.inicio === rango.fin) return invertir(rango.inicio);
    return `${invertir(rango.inicio)} - ${invertir(rango.fin)}`;
  }

  formatearFecha(fecha: Date): string {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  obtenerSolicitudesDelDia(fecha: Date | null): any[] {
    if (!fecha) return [];
    const fechaStr = this.formatearFecha(fecha);
    return this.solicitudes.filter(s => {
      const rango = this.rangoDe(s);
      return !!rango && fechaStr >= rango.inicio && fechaStr <= rango.fin;
    });
  }

  esMismoDia(fecha1: Date, fecha2: Date): boolean {
    return fecha1.getFullYear() === fecha2.getFullYear() &&
           fecha1.getMonth() === fecha2.getMonth() &&
           fecha1.getDate() === fecha2.getDate();
  }

  esHoy(fecha: Date): boolean {
    return this.esMismoDia(fecha, this.fechaActual);
  }

  cambiarMes(delta: number): void {
    this.mes += delta;
    if (this.mes > 11) {
      this.mes = 0;
      this.anio++;
    } else if (this.mes < 0) {
      this.mes = 11;
      this.anio--;
    }
    this.generarCalendario();
    this.filtrarPorFecha();
  }

  cambiarSemana(delta: number): void {
    const inicio = this.diasSemanaActual[0];
    inicio.setDate(inicio.getDate() + (delta * 7));
    this.fechaActual = new Date(inicio);
    this.generarCalendario();
    this.filtrarPorFecha();
  }

  cambiarDia(delta: number): void {
    const nueva = new Date(this.diaSeleccionado!);
    nueva.setDate(nueva.getDate() + delta);
    this.diaSeleccionado = nueva;
    this.fechaActual = new Date(nueva);
    this.anio = nueva.getFullYear();
    this.mes = nueva.getMonth();
  }

  cambiarVista(vista: 'mes' | 'semana' | 'dia'): void {
    this.vista = vista;
    if (vista === 'semana') {
      this.generarSemana();
    } else if (vista === 'dia' && !this.diaSeleccionado) {
      this.diaSeleccionado = this.fechaActual;
    }
    this.generarCalendario();
    this.filtrarPorFecha();
  }

  seleccionarDia(fecha: Date): void {
    this.diaSeleccionado = fecha;
    if (this.vista === 'dia') {
      this.filtrarPorFecha();
    }
  }

  verDetalle(solicitud: any): void {
    this.solicitudSeleccionada = solicitud;
    this.mostrarDetalle = true;
  }

  cerrarDetalle(): void {
    this.mostrarDetalle = false;
    this.solicitudSeleccionada = null;
  }

  editarSolicitud(): void {
    if (!this.authService.esAdmin() || !this.solicitudSeleccionada) return;
    const id = this.solicitudSeleccionada.id_solicitud;
    this.cerrarDetalle();
    this.router.navigate(['/inicio/solicitudes'], { queryParams: { editar: id } });
  }

  irHoy(): void {
    this.fechaActual = new Date();
    this.anio = this.fechaActual.getFullYear();
    this.mes = this.fechaActual.getMonth();
    this.diaSeleccionado = this.fechaActual;
    this.generarCalendario();
    this.filtrarPorFecha();
  }

  obtenerNombreMes(mes: number): string {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return meses[mes];
  }

  getColorPrioridad(prioridad: string): string {
    const colores: Record<string, string> = {
      'Urgente': '#DC2626',
      'Alta': '#F59E0B',
      'Media': '#3B82F6',
      'Baja': '#64748B'
    };
    return colores[prioridad] || '#2A5298';
  }

  getColorEstado(estado?: string | null): string {
    return coloresDeEstado(estado).color;
  }

  getColorEstadoClaro(estado?: string | null): string {
    return coloresDeEstado(estado).claro;
  }
}
