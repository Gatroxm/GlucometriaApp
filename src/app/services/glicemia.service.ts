import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ApiService } from '../api/api.service';
import { GlucoseRecord } from '../interfaces/glucose-record';

@Injectable({
  providedIn: 'root'
})
export class GlicemiaService {
  private recordsSubject = new BehaviorSubject<GlucoseRecord[]>([]);
  public records$: Observable<GlucoseRecord[]> = this.recordsSubject.asObservable();

  constructor(private apiService: ApiService) {
    this.loadRecords();
  }

  loadRecords() {
    // Apunta al endpoint correcto de tu API ('glicemias' o 'glicemia' según tus rutas)
    this.apiService.get<GlucoseRecord[]>('glicemias').pipe(
      tap(records => this.recordsSubject.next(records))
    ).subscribe();
  }

  // Omitimos _id porque el backend de MongoDB lo genera automáticamente al crear
  addRecord(record: Omit<GlucoseRecord, '_id'>): Observable<any> {
    return this.apiService.post<any>('glicemias', record).pipe(
      tap(() => this.loadRecords())
    );
  }

  updateRecord(record: GlucoseRecord): Observable<any> {
    return this.apiService.put<any>(`glicemias/${record._id}`, record).pipe(
      tap(() => this.loadRecords())
    );
  }

  deleteRecord(id: string): Observable<any> {
    return this.apiService.delete<any>(`glicemias/${id}`).pipe(
      tap(() => this.loadRecords())
    );
  }

  /**
   * Calcula el promedio de glucosa de los últimos X días.
   * Al usar el objeto Date nativo de JavaScript, la comparación de fechas es súper limpia.
   */
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
}