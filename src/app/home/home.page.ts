import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon,
  IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCardContent,
  IonListHeader, IonLabel, IonList, IonItemSliding, IonItem, IonNote, IonItemOptions, IonItemOption,
  IonFab, IonFabButton, IonSegment, IonSegmentButton, IonInput, IonBadge, ModalController, AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { downloadOutline, createOutline, trashOutline, documentTextOutline, add, logOutOutline, fitnessOutline } from 'ionicons/icons';
import { GlicemiaService } from '../services/glicemia.service'; // Asegura la ruta de tu nuevo servicio
import { AuthService } from '../services/auth.service';
import { GlucoseRecord, GLUCOSE_CONTEXTS } from '../interfaces/glucose-record';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GlucoseModalComponent } from './glucose-modal/glucose-modal.component';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';

interface DailyRecordGroup {
  date: string;
  records: GlucoseRecord[];
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon,
    IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCardContent,
    IonListHeader, IonLabel, IonList, IonItemSliding, IonItem, IonNote, IonItemOptions, IonItemOption,
    IonFab, IonFabButton, IonSegment, IonSegmentButton, IonInput, IonBadge,
    BaseChartDirective
  ]
})
export class HomePage implements OnInit {
  records$: Observable<GlucoseRecord[]> = this.glucoseService.records$;
  average$: Observable<number> = this.glucoseService.getAverageGlucose(7);
  viewMode: 'grouped' | 'date' | 'range' = 'grouped';
  selectedDate = this.getTodayDate();
  rangeStartDate = this.getRelativeDate(-6);
  rangeEndDate = this.getTodayDate();
  
  private selectedDateSubject = new BehaviorSubject<string>(this.selectedDate);
  private rangeStartDateSubject = new BehaviorSubject<string>(this.rangeStartDate);
  private rangeEndDateSubject = new BehaviorSubject<string>(this.rangeEndDate);

  groupedRecords$: Observable<DailyRecordGroup[]> = this.records$.pipe(
    map((records: GlucoseRecord[]) => {
      const groups = new Map<string, GlucoseRecord[]>();

      for (const record of records) {
        // Extraemos solo la parte YYYY-MM-DD para agrupar por días de manera limpia
        const dateKey = record.fecha.split('T')[0];
        if (!groups.has(dateKey)) {
          groups.set(dateKey, []);
        }
        groups.get(dateKey)?.push(record);
      }

      return [...groups.entries()]
        .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
        .map(([date, grouped]) => ({
          date,
          records: grouped.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
        }));
    })
  );

  filteredRecordsByDate$: Observable<GlucoseRecord[]> = combineLatest([
    this.records$,
    this.selectedDateSubject.asObservable()
  ]).pipe(
    map(([records, date]) =>
      records
        .filter((record: GlucoseRecord) => record.fecha.startsWith(date))
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    )
  );

  filteredRecordsByRange$: Observable<GlucoseRecord[]> = combineLatest([
    this.records$,
    this.rangeStartDateSubject.asObservable(),
    this.rangeEndDateSubject.asObservable()
  ]).pipe(
    map(([records, startDate, endDate]) =>
      records
        .filter((record: GlucoseRecord) => {
          const rDate = record.fecha.split('T')[0];
          return rDate >= startDate && rDate <= endDate;
        })
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    )
  );
  
  public lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Nivel de Glucosa',
        fill: true,
        tension: 0.5,
        borderColor: 'rgba(56, 128, 255, 1)',
        backgroundColor: 'rgba(56, 128, 255, 0.2)'
      }
    ]
  };
  
  public lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { display: false },
      y: { 
        beginAtZero: false,
        suggestedMin: 60,
        suggestedMax: 180
      }
    }
  };

  constructor(
    private glucoseService: GlicemiaService, // Inyectamos el nuevo servicio optimizado
    private authService: AuthService,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController
  ) {
    addIcons({ downloadOutline, createOutline, trashOutline, documentTextOutline, add, logOutOutline, fitnessOutline });
  }

  ngOnInit() {
    this.records$.subscribe(records => {
      const chartRecords = [...records].slice(0, 10).reverse();
      
      this.lineChartData = {
        labels: chartRecords.map(r => {
          const dateObj = new Date(r.fecha);
          return `${dateObj.getMonth() + 1}/${dateObj.getDate()} ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }),
        datasets: [{
          ...this.lineChartData.datasets[0],
          data: chartRecords.map(r => r.valor)
        }]
      };
    });
  }

  async logout() {
    const alert = await this.alertCtrl.create({
      header: 'Cerrar Sesión',
      message: '¿Estás seguro de que quieres salir?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Salir', handler: () => this.authService.logout() }
      ]
    });
    await alert.present();
  }

  getContextLabel(value: string): string {
    const context = GLUCOSE_CONTEXTS.find(c => c.value === value);
    return context ? context.label : value;
  }

  async openModal(record?: GlucoseRecord) {
    const modal = await this.modalCtrl.create({
      component: GlucoseModalComponent,
      componentProps: { record: record }
    });
    await modal.present();
  }

  async deleteRecord(id?: string) {
    if (!id) return;
    const alert = await this.alertCtrl.create({
        header: 'Confirmar',
        message: '¿Estás seguro de que quieres eliminar este registro?',
        buttons: [
            { text: 'Cancelar', role: 'cancel' },
            { 
                text: 'Eliminar', 
                role: 'destructive',
                handler: () => this.glucoseService.deleteRecord(id)
            }
        ]
    });
    await alert.present();
  }

  exportToExcel() {
    // Si tienes este método en tu servicio viejo, asegúrate de migrarlo al nuevo
    // this.glucoseService.exportToExcel();
  }

  onDateChange(event: CustomEvent) {
    const value = event.detail.value;
    this.selectedDate = value || this.selectedDate;
    this.selectedDateSubject.next(this.selectedDate);
  }

  onRangeStartDateChange(event: CustomEvent) {
    const value = event.detail.value;
    if (!value) return;

    this.rangeStartDate = value;
    if (this.rangeStartDate > this.rangeEndDate) {
      this.rangeEndDate = this.rangeStartDate;
      this.rangeEndDateSubject.next(this.rangeEndDate);
    }
    this.rangeStartDateSubject.next(this.rangeStartDate);
  }

  onRangeEndDateChange(event: CustomEvent) {
    const value = event.detail.value;
    if (!value) return;

    this.rangeEndDate = value;
    if (this.rangeEndDate < this.rangeStartDate) {
      this.rangeStartDate = this.rangeEndDate;
      this.rangeStartDateSubject.next(this.rangeStartDate);
    }
    this.rangeEndDateSubject.next(this.rangeEndDate);
  }

  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  private getRelativeDate(daysOffset: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    return date.toISOString().split('T')[0];
  }

  getRiskLabel(valor: number): string {
    if (valor <= 70) return 'Bajo';
    if (valor >= 180) return 'Alto';
    return 'Normal';
  }

  getRiskColor(valor: number): 'warning' | 'danger' | 'success' {
    if (valor <= 70) return 'warning';
    if (valor >= 180) return 'danger';
    return 'success';
  }

  getRiskItemClass(valor: number): string {
    return `risk-item-${this.getRiskColor(valor)}`;
  }
}