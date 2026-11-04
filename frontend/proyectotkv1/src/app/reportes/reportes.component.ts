import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReporteService } from '../services/reporte.service';
import { CatalogoService } from '../services/catalogo.service';
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

  estadosActividad: any[] = [];
  idEstadoReporte = 0;

  pestanaTrabajadores = false;
  busquedaTrabajador = '';

  fechaInicio = '';
  fechaFin = '';
  filtroActivo = '';
  textoFiltro = '';
  cargarCompletado = false;

  // Fecha en que se genero el reporte (se actualiza al aplicar un filtro)
  fechaGeneracion = '';

  // Mes mostrado en el grafico de carga
  mesGrafica = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  private readonly MESES_GRAFICA = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  chartCarga: Chart | null = null;

  // Paleta Figma del proyecto para las barras del grafico
  private readonly PALETA_BARRAS: { color: string; hover: string }[] = [
    { color: '#1B3A6B', hover: '#122850' },
    { color: '#2A5298', hover: '#1B3A6B' },
    { color: '#243F7A', hover: '#122850' },
    { color: '#122850', hover: '#0C1A33' },
    { color: '#A8BDD8', hover: '#8FA9C9' }
  ];

  constructor(
    private reporteService: ReporteService,
    private catalogoService: CatalogoService,
    private notificacion: NotificacionService
  ) {}

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
    const anio = this.mesGrafica.getFullYear();
    const mes = this.mesGrafica.getMonth() + 1;
    this.reporteService.cargaPorUsuario(anio, mes).subscribe({
      next: (datos) => {
        this.cargaPorUsuario = datos;
        setTimeout(() => this.graficarCarga(datos), 100);
      },
      error: (error) => console.error('Error:', error)
    });
  }

  get tituloMesGrafica(): string {
    return `${this.MESES_GRAFICA[this.mesGrafica.getMonth()]} ${this.mesGrafica.getFullYear()}`;
  }

  cambiarMesGrafica(delta: number): void {
    this.mesGrafica = new Date(this.mesGrafica.getFullYear(), this.mesGrafica.getMonth() + delta, 1);
    this.cargarCargaPorUsuario();
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

  alternarGrupo(grupo: GrupoTrabajo): void {
    const estabaAbierto = grupo.abierto;
    this.gruposActividades.forEach(g => g.abierto = false);
    grupo.abierto = !estabaAbierto;
  }

  get gruposFiltrados(): GrupoTrabajo[] {
    const termino = this.busquedaTrabajador.toLowerCase().trim();
    if (!termino) return this.gruposActividades;
    return this.gruposActividades.filter(g =>
      g.nombre_usuario?.toLowerCase().includes(termino) ||
      g.nombre_cargo?.toLowerCase().includes(termino)
    );
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
          label: 'Asignaciones en el mes',
          data: datos.map(d => d.total_asignaciones),
          backgroundColor: datos.map((_, i) => this.PALETA_BARRAS[i % this.PALETA_BARRAS.length].color),
          hoverBackgroundColor: datos.map((_, i) => this.PALETA_BARRAS[i % this.PALETA_BARRAS.length].hover),
          borderRadius: 8,
          borderSkipped: false,
          maxBarThickness: 42
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1B3A6B',
            padding: 10,
            cornerRadius: 8,
            titleFont: { size: 13 },
            bodyFont: { size: 12 }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#64748B', font: { size: 12 } },
            border: { display: false }
          },
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, color: '#64748B', precision: 0 },
            grid: { color: '#F1F5F9' },
            border: { display: false }
          }
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
    const fechas = this.getFechasRango(tipo);
    const inicio = this.formatearFechaCorta(fechas.inicio);
    const fin = this.formatearFechaCorta(fechas.fin);
    switch (tipo) {
      case 'hoy': return `Hoy (${inicio})`;
      case 'semana': return `Esta Semana (${inicio} - ${fin})`;
      case 'mes': return `Este Mes (${inicio} - ${fin})`;
      case 'rango': return 'Rango Personalizado';
      default: return '';
    }
  }

  formatearFechaCorta(iso: string): string {
    return iso ? iso.substring(0, 10).split('-').reverse().join('/') : '';
  }

  aplicarFiltro(tipo: string): void {
    this.filtroActivo = tipo;
    this.textoFiltro = this.getTextoFiltro(tipo);
    this.fechaGeneracion = new Date().toLocaleString('es-GT', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
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
    this.textoFiltro = `Del ${this.formatearFechaCorta(this.fechaInicio)} al ${this.formatearFechaCorta(this.fechaFin)}`;
    this.fechaGeneracion = new Date().toLocaleString('es-GT', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
    this.cargarCompletado = false;

    this.reporteService.solicitudesPorFecha(this.fechaInicio, this.fechaFin).subscribe({
      next: (datos) => {
        this.solicitudesPorFecha = datos;
        this.cargarCompletado = true;
      },
      error: (error) => console.error('Error:', error)
    });
  }

  rangoFechas(inicio: string, fin: string): string {
    if (!inicio) return '';
    const inicioFmt = inicio.substring(0, 10);
    const finFmt = fin ? fin.substring(0, 10) : inicioFmt;
    if (finFmt === inicioFmt) {
      return inicioFmt.split('-').reverse().join('/');
    }
    return `${inicioFmt.split('-').reverse().join('/')} - ${finFmt.split('-').reverse().join('/')}`;
  }

  claseBadge(estado: string): string {
    const mapa: Record<string, string> = {
      'REVISION': 'badge-revision',
      'AUTORIZADO': 'badge-autorizado',
      'EN PROCESO': 'badge-proceso',
      'FINALIZADO': 'badge-finalizado',
      'CANCELADO': 'badge-cancelado'
    };
    const normalizado = (estado || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase();
    return mapa[normalizado] || 'badge-revision';
  }

  claseBadgePrioridad(prioridad: string): string {
    const normalizado = (prioridad || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase();
    const mapa: Record<string, string> = {
      'BAJA': 'badge-baja',
      'MEDIA': 'badge-media',
      'ALTA': 'badge-alta',
      'URGENTE': 'badge-urgente'
    };
    return mapa[normalizado] || 'badge-baja';
  }

  activarFiltroEstado(): void {
    this.filtroActivo = 'estado';
    this.textoFiltro = '';
    this.cargarCompletado = false;
    this.solicitudesPorFecha = [];
    if (this.estadosActividad.length === 0) {
      this.catalogoService.obtenerEstadosActividad().subscribe({
        next: (datos) => this.estadosActividad = datos,
        error: (error) => console.error('Error:', error)
      });
    }
  }

  buscarPorEstado(): void {
    if (!this.idEstadoReporte) {
      this.notificacion.info('Seleccione un estado');
      return;
    }

    const estadoSel = this.estadosActividad.find(e => e.id_estado_actividad === this.idEstadoReporte);
    this.filtroActivo = 'estado';
    this.textoFiltro = `Estado: ${estadoSel?.nombre_estado || ''}`;
    this.fechaGeneracion = new Date().toLocaleString('es-GT', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
    this.cargarCompletado = false;

    this.reporteService.solicitudesPorEstadoDetalle(this.idEstadoReporte).subscribe({
      next: (datos) => {
        this.solicitudesPorFecha = datos;
        this.cargarCompletado = true;
      },
      error: (error) => console.error('Error:', error)
    });
  }

  // Logo de la municipalidad redimensionado para el PDF (el original pesa 7MB)
  private cargarLogo(): Promise<string | null> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const maximo = 240;
          const lienzo = document.createElement('canvas');
          const escala = Math.min(maximo / img.width, maximo / img.height);
          lienzo.width = Math.round(img.width * escala);
          lienzo.height = Math.round(img.height * escala);
          const ctx = lienzo.getContext('2d');
          if (!ctx) { resolve(null); return; }
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, lienzo.width, lienzo.height);
          ctx.drawImage(img, 0, 0, lienzo.width, lienzo.height);
          resolve(lienzo.toDataURL('image/jpeg', 0.9));
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = 'assets/LOGOT.png';
    });
  }

  async exportarPDF(): Promise<void> {
    if (this.solicitudesPorFecha.length === 0) {
      this.notificacion.info('No hay datos para exportar. Primero aplique un filtro.');
      return;
    }

    const doc = new jsPDF({ orientation: 'l', unit: 'mm', format: 'a4' });
    const ancho = doc.internal.pageSize.getWidth();
    const logo = await this.cargarLogo();

    doc.setProperties({
      title: 'Reporte de Solicitudes',
      subject: 'Sistema web de gestión operativa bajo la metodología KANBAN',
      creator: 'Municipalidad de Santiago Atitlán'
    });

    // === ENCABEZADO INSTITUCIONAL ===
    doc.setFillColor(27, 58, 107);
    doc.rect(0, 0, ancho, 32, 'F');
    doc.setFillColor(245, 158, 11);
    doc.rect(0, 32, ancho, 1.5, 'F');

    if (logo) {
      doc.setFillColor(255, 255, 255);
      doc.circle(23, 16, 11, 'F');
      doc.addImage(logo, 'JPEG', 15.5, 8.5, 15, 15);
    }

    const xTexto = logo ? 40 : 14;
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Municipalidad de Santiago Atitlán', xTexto, 14.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(191, 219, 254);
    doc.text('Sistema web de gestión operativa bajo la metodología KANBAN', xTexto, 21.5);

    // === TITULO DEL REPORTE ===
    doc.setTextColor(27, 58, 107);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Reporte de Solicitudes', 14, 47);
    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(1);
    doc.line(14, 50, 54, 50);

    // === CAJA DE DATOS GENERALES ===
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, 56, ancho - 28, 16, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('FILTRO APLICADO', 19, 62);
    doc.text('FECHA DE GENERACIÓN DEL REPORTE', 190, 62);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    const filtro = this.textoFiltro.length > 80 ? this.textoFiltro.substring(0, 77) + '...' : this.textoFiltro;
    doc.text(filtro, 19, 68);
    doc.text(new Date().toLocaleDateString('es-GT'), 190, 68);

    // === TABLA DE RESULTADOS (hoja horizontal) ===
    const encabezados = [['#', 'Actividad', 'Descripción', 'Fecha', 'Lugar', 'Responsables', 'Estado', 'Prioridad', 'Solicitante']];

    const recortar = (texto: string, max: number): string => {
      const t = texto || '';
      return t.length > max ? t.substring(0, max - 1) + '…' : t;
    };

    const filas = this.solicitudesPorFecha.map((s, i) => [
      String(i + 1),
      recortar(s.nombre_actividad, 70),
      recortar(s.descripcion_actividad, 130),
      this.rangoFechas(s.fecha_actividad, s.fecha_fin_actividad),
      s.lugar_actividad || '',
      recortar(s.responsables || 'Sin asignar', 70),
      s.nombre_estado || '',
      s.nombre_prioridad || '',
      s.solicitante || ''
    ]);

    let paginaActual = 0;

    autoTable(doc, {
      head: encabezados,
      body: filas,
      startY: 80,
      margin: { left: 14, right: 14, bottom: 18 },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.1,
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: [27, 58, 107],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 42 },
        2: { cellWidth: 58 },
        3: { cellWidth: 26 },
        4: { cellWidth: 24 },
        5: { cellWidth: 38 },
        6: { cellWidth: 22 },
        7: { cellWidth: 20 },
        8: { cellWidth: 31 }
      },
      didDrawPage: () => {
        paginaActual++;
        const alto = doc.internal.pageSize.getHeight();
        // Pie de pagina en cada hoja
        doc.setFillColor(27, 58, 107);
        doc.rect(0, alto - 12, ancho, 12, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.text('Sistema web de gestión operativa bajo la metodología KANBAN', 14, alto - 7);
        doc.text(`Página ${paginaActual}`, ancho - 14, alto - 7, { align: 'right' });
      }
    });

    doc.save(`reporte_solicitudes_${new Date().toISOString().split('T')[0]}.pdf`);
  }
}
