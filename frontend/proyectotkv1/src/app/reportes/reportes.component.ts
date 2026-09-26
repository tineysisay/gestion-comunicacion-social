import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReporteService } from '../services/reporte.service';
import { NotificacionService } from '../services/notificacion.service';
import { Chart, registerables } from 'chart.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

Chart.register(...registerables);

interface GrupoTrabajo {
  id_usuario: number;
  nombre_usuario: string;
  nombre_cargo: string;
  actividades: any[];
  abierto: boolean;
}

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.css'
})
export class ReportesComponent implements OnInit, AfterViewInit {

  @ViewChild('chartCarga') chartCargaRef!: ElementRef<HTMLCanvasElement>;

  estadisticas: any = {};
  solicitudesPorFecha: any[] = [];
  cargaPorUsuario: any[] = [];
  actividadesPorUsuario: any[] = [];
  gruposActividades: GrupoTrabajo[] = [];

  fechaInicio = '';
  fechaFin = '';
  filtroActivo = '';
  textoFiltro = '';
  cargarCompletado = false;

  chartCarga: Chart | null = null;

  constructor(private reporteService: ReporteService, private notificacion: NotificacionService) {}

  ngOnInit(): void {
    this.cargarEstadisticas();
    this.cargarCargaPorUsuario();
    this.cargarActividadesPorUsuario();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.graficarCarga(this.cargaPorUsuario);
    }, 100);
  }

  cargarEstadisticas(): void {
    this.reporteService.obtenerEstadisticas().subscribe({
      next: (datos) => this.estadisticas = datos,
      error: (error) => console.error('Error:', error)
    });
  }

  cargarCargaPorUsuario(): void {
    this.reporteService.cargaPorUsuario().subscribe({
      next: (datos) => {
        this.cargaPorUsuario = datos;
        setTimeout(() => this.graficarCarga(datos), 100);
      },
      error: (error) => console.error('Error:', error)
    });
  }

  cargarActividadesPorUsuario(): void {
    this.reporteService.actividadesPorUsuario().subscribe({
      next: (datos) => {
        this.actividadesPorUsuario = datos;
        this.gruposActividades = this.agruparActividades();
      },
      error: (error) => console.error('Error:', error)
    });
  }

  agruparActividades(): GrupoTrabajo[] {
    const mapa = new Map<number, GrupoTrabajo>();

    for (const act of this.actividadesPorUsuario) {
      if (!mapa.has(act.id_usuario)) {
        mapa.set(act.id_usuario, {
          id_usuario: act.id_usuario,
          nombre_usuario: act.nombre_usuario,
          nombre_cargo: act.nombre_cargo,
          actividades: [],
          abierto: false
        });
      }
      mapa.get(act.id_usuario)!.actividades.push(act);
    }

    return Array.from(mapa.values());
  }

  graficarCarga(datos: any[]): void {
    const ctx = this.chartCargaRef?.nativeElement;
    if (!ctx) return;

    if (this.chartCarga) this.chartCarga.destroy();

    this.chartCarga = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: datos.map(d => d.nombre_usuario),
        datasets: [{
          label: 'Asignaciones',
          data: datos.map(d => d.total_asignaciones),
          backgroundColor: '#075ca8'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } }
        }
      }
    });
  }

  getFechasRango(tipo: string): { inicio: string; fin: string } {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = hoy.getMonth();
    const dia = hoy.getDay();
    const fecha = hoy.getDate();

    let inicio: Date;
    let fin: Date;

    switch (tipo) {
      case 'hoy':
        inicio = new Date(anio, mes, fecha);
        fin = new Date(anio, mes, fecha);
        break;
      case 'semana':
        const diffLunes = dia === 0 ? 6 : dia - 1;
        inicio = new Date(anio, mes, fecha - diffLunes);
        fin = new Date(anio, mes, fecha - diffLunes + 6);
        break;
      case 'mes':
        inicio = new Date(anio, mes, 1);
        fin = new Date(anio, mes + 1, 0);
        break;
      default:
        inicio = hoy;
        fin = hoy;
    }

    return {
      inicio: inicio.toISOString().split('T')[0],
      fin: fin.toISOString().split('T')[0]
    };
  }

  getTextoFiltro(tipo: string): string {
    switch (tipo) {
      case 'hoy': return 'Hoy';
      case 'semana': return 'Esta Semana';
      case 'mes': return 'Este Mes';
      case 'rango': return 'Rango Personalizado';
      default: return '';
    }
  }

  aplicarFiltro(tipo: string): void {
    this.filtroActivo = tipo;
    this.textoFiltro = this.getTextoFiltro(tipo);
    this.cargarCompletado = false;

    if (tipo === 'rango') {
      return;
    }

    const fechas = this.getFechasRango(tipo);
    this.fechaInicio = fechas.inicio;
    this.fechaFin = fechas.fin;

    this.reporteService.solicitudesPorFecha(this.fechaInicio, this.fechaFin).subscribe({
      next: (datos) => {
        this.solicitudesPorFecha = datos;
        this.cargarCompletado = true;
      },
      error: (error) => console.error('Error:', error)
    });
  }

  filtrarHoy(): void {
    this.aplicarFiltro('hoy');
  }

  filtrarSemana(): void {
    this.aplicarFiltro('semana');
  }

  filtrarMes(): void {
    this.aplicarFiltro('mes');
  }

  buscarPorFecha(): void {
    if (!this.fechaInicio || !this.fechaFin) {
      this.notificacion.info('Seleccione ambas fechas');
      return;
    }
    this.filtroActivo = 'rango';
    this.textoFiltro = `Del ${this.fechaInicio} al ${this.fechaFin}`;
    this.cargarCompletado = false;

    this.reporteService.solicitudesPorFecha(this.fechaInicio, this.fechaFin).subscribe({
      next: (datos) => {
        this.solicitudesPorFecha = datos;
        this.cargarCompletado = true;
      },
      error: (error) => console.error('Error:', error)
    });
  }

  exportarPDF(): void {
    if (this.solicitudesPorFecha.length === 0) {
      this.notificacion.info('No hay datos para exportar. Primero aplique un filtro.');
      return;
    }

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Reporte de Solicitudes', 14, 20);

    doc.setFontSize(11);
    doc.text(`Filtro: ${this.textoFiltro}`, 14, 28);
    doc.text(`Fecha generacion: ${new Date().toLocaleDateString('es-GT')}`, 14, 34);
    doc.text(`Total resultados: ${this.solicitudesPorFecha.length}`, 14, 40);

    const encabezados = [['#', 'Actividad', 'Fecha', 'Lugar', 'Estado', 'Prioridad', 'Solicitante']];

    const filas = this.solicitudesPorFecha.map((s, i) => [
      String(i + 1),
      s.nombre_actividad || '',
      s.fecha_actividad || '',
      s.lugar_actividad || '',
      s.nombre_estado || '',
      s.nombre_prioridad || '',
      s.solicitante || ''
    ]);

    autoTable(doc, {
      head: encabezados,
      body: filas,
      startY: 46,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [7, 92, 168] },
      alternateRowStyles: { fillColor: [240, 245, 250] }
    });

    doc.save(`reporte_solicitudes_${new Date().toISOString().split('T')[0]}.pdf`);
  }
}
