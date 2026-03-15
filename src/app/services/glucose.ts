import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ApiService } from '../api/api.service';
import { GlucoseRecord } from '../interfaces/glucose-record';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { environment } from '../../environments/environment';

import { Capacitor } from '@capacitor/core';
import { AlertController } from '@ionic/angular/standalone';

@Injectable({
  providedIn: 'root'
})
export class GlucoseService {
  private recordsSubject = new BehaviorSubject<GlucoseRecord[]>([]);
  public records$: Observable<GlucoseRecord[]> = this.recordsSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private alertCtrl: AlertController
  ) {
    this.loadRecords();
  }

  loadRecords() {
    this.apiService.get<any[]>('glicemias').pipe(
      map(data => data.map(item => this.mapToFrontend(item))),
      tap(records => this.recordsSubject.next(records))
    ).subscribe();
  }

  async addRecord(record: Omit<GlucoseRecord, 'id' | 'timestamp'>): Promise<void> {
    const backendData = this.mapToBackend(record);
    return this.apiService.post<any>('glicemias', backendData).pipe(
      tap(() => this.loadRecords())
    ).toPromise();
  }

  async updateRecord(record: GlucoseRecord): Promise<void> {
    const backendData = this.mapToBackend(record);
    return this.apiService.put<any>(`glicemias/${record.id}`, backendData).pipe(
      tap(() => this.loadRecords())
    ).toPromise();
  }

  async deleteRecord(id: string): Promise<void> {
    return this.apiService.delete<any>(`glicemias/${id}`).pipe(
      tap(() => this.loadRecords())
    ).toPromise();
  }

  private mapToFrontend(item: any): GlucoseRecord {
    return {
      id: item._id,
      value: item.valor,
      date: new Date(item.fecha).toISOString().split('T')[0],
      time: item.hora,
      context: item.tipo,
      notes: item.notas,
      timestamp: new Date(item.fecha).getTime()
    };
  }

  private mapToBackend(record: any): any {
    return {
      valor: record.value,
      fecha: record.date,
      hora: record.time,
      tipo: record.context,
      notas: record.notes
    };
  }

  getAverageGlucose(days: number = 7): Observable<number> {
    return this.records$.pipe(
      map((records: GlucoseRecord[]) => {
        if (!records.length) return 0;
        const cutoffTime = new Date().getTime() - (days * 24 * 60 * 60 * 1000);
        const recentRecords = records.filter((r: GlucoseRecord) => r.timestamp >= cutoffTime);
        if (!recentRecords.length) return 0;
        const sum = recentRecords.reduce((acc: number, curr: GlucoseRecord) => acc + curr.value, 0);
        return Math.round(sum / recentRecords.length);
      })
    );
  }

  exportToExcel() {
    this.apiService.getBlob('reportes/glicemias/excel').subscribe({
      next: async (blob) => {
        const fileName = 'reporte_glicemias_' + new Date().getTime() + '.xlsx';
        
        if (Capacitor.isNativePlatform()) {
          // Logic for mobile (requires @capacitor/filesystem and @capacitor/share)
          this.downloadMobile(blob, fileName);
        } else {
          // Logic for browser
          saveAs(blob, fileName);
        }
      },
      error: async (err) => {
        console.error('Error al descargar reporte', err);
        const alert = await this.alertCtrl.create({
          header: 'Error',
          message: 'No se pudo generar el reporte. Intenta de nuevo más tarde.',
          buttons: ['OK']
        });
        await alert.present();
      }
    });
  }

  private async downloadMobile(blob: Blob, fileName: string) {
    try {
      // Dynamic import to avoid build errors if plugins are not installed yet
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      const { Share } = await import('@capacitor/share');

      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        
        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: base64data,
          directory: Directory.Cache
        });

        await Share.share({
          title: 'Reporte de Glicemias',
          text: 'Aquí tienes tu reporte de glicemias.',
          url: savedFile.uri,
          dialogTitle: 'Compartir reporte'
        });
      };
    } catch (e) {
      console.error('Error en descarga móvil', e);
      const alert = await this.alertCtrl.create({
        header: 'Error en APK',
        message: 'Para descargar el reporte en el APK, necesitas instalar @capacitor/filesystem y @capacitor/share.',
        buttons: ['OK']
      });
      await alert.present();
    }
  }

  private saveAsExcelFile(buffer: any, fileName: string): void {
    const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const EXCEL_EXTENSION = '.xlsx';
    const data: Blob = new Blob([buffer], {
      type: EXCEL_TYPE
    });
    
    const fileNameFull = fileName + '_exportacion_' + new Date().getTime() + EXCEL_EXTENSION;
    saveAs(data, fileNameFull);
  }
}
