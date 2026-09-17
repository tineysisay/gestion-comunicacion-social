import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SolicitudService } from '../services/solicitud.service';
import { FormatoFechaPipe } from '../pipes/formato-fecha.pipe';
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

  diasSemana = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
  nombreMes = '';

  diasMes: (Date | null)[] = [];
  diasSemanaActual: Date[] = [];

  solicitudSeleccionada: any = null;
  mostrarDetalle = false;
  private subscription: Subscription = new Subscription();

  constructor(private solicitudService: SolicitudService) {}

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
        this.filtrarPorFecha();
      },
      error: (error) => console.error('Error:', error)
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
      this.solicitudesFiltradas = this.solicitudes.filter(s => s.fecha_actividad === fechaStr);
    } else if (this.vista === 'semana') {
      const inicio = this.diasSemanaActual[0];
      const fin = this.diasSemanaActual[6];
      this.solicitudesFiltradas = this.solicitudes.filter(s => {
        const fecha = new Date(s.fecha_actividad);
        return fecha >= inicio && fecha <= fin;
      });
    } else {
      const mesStr = `${this.anio}-${String(this.mes + 1).padStart(2, '0')}`;
      this.solicitudesFiltradas = this.solicitudes.filter(s => s.fecha_actividad.startsWith(mesStr));
    }
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
    return this.solicitudesFiltradas.filter(s => s.fecha_actividad === fechaStr);
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
      'Urgente': '#e74c3c',
      'Alta': '#e67e22',
      'Media': '#f1c40f',
      'Baja': '#27ae60'
    };
    return colores[prioridad] || '#3498db';
  }
}
