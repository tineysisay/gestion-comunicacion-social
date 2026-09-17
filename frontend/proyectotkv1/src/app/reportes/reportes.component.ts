import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReporteService } from '../services/reporte.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.css'
})
export class ReportesComponent implements OnInit, AfterViewInit {

  @ViewChild('chartEstados') chartEstadosRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartPrioridades') chartPrioridadesRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartInstituciones') chartInstitucionesRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartCarga') chartCargaRef!: ElementRef<HTMLCanvasElement>;

  estadisticas: any = {};
  solicitudesPorFecha: any[] = [];
  cargaPorUsuario: any[] = [];

  fechaInicio = '';
  fechaFin = '';

  chartEstados: Chart | null = null;
  chartPrioridades: Chart | null = null;
  chartInstituciones: Chart | null = null;
  chartCarga: Chart | null = null;

  constructor(private reporteService: ReporteService) {}

  ngOnInit(): void {
    this.cargarEstadisticas();
    this.cargarCargaPorUsuario();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.cargarPorEstado();
      this.cargarPorPrioridad();
      this.cargarPorInstitucion();
    }, 100);
  }

  cargarEstadisticas(): void {
    this.reporteService.obtenerEstadisticas().subscribe({
      next: (datos) => this.estadisticas = datos,
      error: (error) => console.error('Error:', error)
    });
  }

  cargarPorEstado(): void {
    this.reporteService.solicitudesPorEstado().subscribe({
      next: (datos) => {
        const ctx = this.chartEstadosRef?.nativeElement;
        if (!ctx) return;

        if (this.chartEstados) this.chartEstados.destroy();

        const colores = ['#3498db', '#2ecc71', '#f39c12', '#e74c3c', '#9b59b6', '#1abc9c'];

        this.chartEstados = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: datos.map(d => d.nombre_estado),
            datasets: [{
              data: datos.map(d => d.total),
              backgroundColor: colores.slice(0, datos.length)
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { position: 'bottom' }
            }
          }
        });
      },
      error: (error) => console.error('Error:', error)
    });
  }

  cargarPorPrioridad(): void {
    this.reporteService.solicitudesPorPrioridad().subscribe({
      next: (datos) => {
        const ctx = this.chartPrioridadesRef?.nativeElement;
        if (!ctx) return;

        if (this.chartPrioridades) this.chartPrioridades.destroy();

        const colores: Record<string, string> = {
          'Urgente': '#e74c3c',
          'Alta': '#e67e22',
          'Media': '#f1c40f',
          'Baja': '#27ae60'
        };

        this.chartPrioridades = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: datos.map(d => d.nombre_prioridad),
            datasets: [{
              label: 'Solicitudes',
              data: datos.map(d => d.total),
              backgroundColor: datos.map(d => colores[d.nombre_prioridad] || '#3498db')
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
      },
      error: (error) => console.error('Error:', error)
    });
  }

  cargarPorInstitucion(): void {
    this.reporteService.solicitudesPorInstitucion().subscribe({
      next: (datos) => {
        const ctx = this.chartInstitucionesRef?.nativeElement;
        if (!ctx) return;

        if (this.chartInstituciones) this.chartInstituciones.destroy();

        this.chartInstituciones = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: datos.map(d => d.nombre_institucion),
            datasets: [{
              label: 'Solicitudes',
              data: datos.map(d => d.total),
              backgroundColor: '#3498db'
            }]
          },
          options: {
            responsive: true,
            indexAxis: 'y',
            plugins: {
              legend: { display: false }
            },
            scales: {
              x: { beginAtZero: true, ticks: { stepSize: 1 } }
            }
          }
        });
      },
      error: (error) => console.error('Error:', error)
    });
  }

  cargarCargaPorUsuario(): void {
    this.reporteService.cargaPorUsuario().subscribe({
      next: (datos) => {
        this.cargaPorUsuario = datos;
        this.graficarCarga(datos);
      },
      error: (error) => console.error('Error:', error)
    });
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

  buscarPorFecha(): void {
    if (!this.fechaInicio || !this.fechaFin) {
      alert('Seleccione ambas fechas');
      return;
    }
    this.reporteService.solicitudesPorFecha(this.fechaInicio, this.fechaFin).subscribe({
      next: (datos) => this.solicitudesPorFecha = datos,
      error: (error) => console.error('Error:', error)
    });
  }
}
