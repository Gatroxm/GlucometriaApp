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
    this.apiService.get<any[]>('glicemias').pipe(
      map(data => data.map(item => this.mapToFrontend(item))),
      tap(records => this.recordsSubject.next(records))
    ).subscribe();
  }

  addRecord(record: Omit<GlucoseRecord, 'id' | 'timestamp'>): Observable<any> {
    const backendData = this.mapToBackend(record);
    return this.apiService.post<any>('glicemias', backendData).pipe(
      tap(() => this.loadRecords())
    );
  }

  updateRecord(record: GlucoseRecord): Observable<any> {
    const backendData = this.mapToBackend(record);
    return this.apiService.put<any>(`glicemias/${record.id}`, backendData).pipe(
      tap(() => this.loadRecords())
    );
  }

  deleteRecord(id: string): Observable<any> {
    return this.apiService.delete<any>(`glicemias/${id}`).pipe(
      tap(() => this.loadRecords())
    );
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
}
