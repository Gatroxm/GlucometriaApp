import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { ApiService } from '../api/api.service';
import { GlucoseRecord } from '../interfaces/glucose-record';
import { AlertController } from '@ionic/angular/standalone';
import { saveAs } from 'file-saver';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root'
})
export class GlicemiaService {
  private recordsSubject = new BehaviorSubject<GlucoseRecord[]>([]);
  public records$: Observable<GlucoseRecord[]> = this.recordsSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private alertCtrl: AlertController
  ) {
    this.loadRecords();
  }

  // ✅ Carga los registros limpios directo del backend
  loadRecords() {
    this.apiService.get<GlucoseRecord[]>('glicemias').pipe(
      tap(records => this.recordsSubject.next(records))
    ).subscribe();
  }

  // ✅ Crear registro nuevo
  addRecord(record: Omit<GlucoseRecord, '_id'>): Observable<any> {
    return this.apiService.post<any>('glicemias', record).pipe(
      tap(() => this.loadRecords())
    );
  }

  // ✅ Actualizar registro existente
  updateRecord(record: GlucoseRecord): Observable<any> {
    return this.apiService.put<any>(`glicemias/${record._id}`, record).pipe(
      tap(() => this.loadRecords())
    );
  }

  // ✅ Eliminar registro
  deleteRecord(id: string): Observable<any> {
    return this.apiService.delete<any>(`glicemias/${id}`).pipe(
      tap(() => this.loadRecords())
    );
  }

  // ✅ Calcula el promedio clínico de los últimos X días de forma nativa
  getAverageGlucose(days: number = 7): Observable<number> {
    return this.records$.pipe(
      map((records: GlucoseRecord[]) => {
        if (!records.length) return 0;

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const recentRecords = records.filter((r: GlucoseRecord) => {
          const recordDate = new Date(r.fecha);
          return recordDate >= cutoffDate;
        });

        if (!recentRecords.length) return 0;

        const sum = recentRecords.reduce((acc: number, curr: GlucoseRecord) => acc + curr.valor, 0);
        return Math.round(sum / recentRecords.length);
      })
    );
  }

  // ==========================================
  // 🔥 MOTOR DE EXPORTACIÓN EXCEL
  // ==========================================
  exportToExcel() {
    this.apiService.getBlob('reportes/glicemias/excel').subscribe({
      next: async (blob: Blob) => {
        const fileName = `reporte_glicemias_${new Date().getTime()}.xlsx`;
        
        if (Capacitor.isNativePlatform()) {
          this.downloadMobile(blob, fileName);
        } else {
          saveAs(blob, fileName);
        }
      },
      error: async (err) => {
        console.error('Error al descargar reporte de excel:', err);
        const alert = await this.alertCtrl.create({
          header: 'Error',
          message: 'No se pudo generar el reporte desde el servidor. Intenta de nuevo más tarde.',
          buttons: ['OK']
        });
        await alert.present();
      }
    });
  }

  private async downloadMobile(blob: Blob, fileName: string) {
    try {
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
          text: 'Gustavo, aquí tienes tu reporte detallado de glicemias.',
          url: savedFile.uri,
          dialogTitle: 'Compartir reporte de salud'
        });
      };
    } catch (e) {
      console.error('Error en descarga nativa de Capacitor:', e);
      const alert = await this.alertCtrl.create({
        header: 'Complementos requeridos',
        message: 'Para compartir el reporte en el APK, es necesario asegurarse de instalar y compilar @capacitor/filesystem y @capacitor/share.',
        buttons: ['OK']
      });
      await alert.present();
    }
  }
}