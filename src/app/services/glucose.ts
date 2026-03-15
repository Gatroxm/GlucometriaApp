import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GlucoseRecord } from '../interfaces/glucose-record';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const STORAGE_KEY = 'glucose_records';

@Injectable({
  providedIn: 'root'
})
export class GlucoseService {
  private _storage: Storage | null = null;
  private recordsSubject = new BehaviorSubject<GlucoseRecord[]>([]);

  public records$: Observable<GlucoseRecord[]> = this.recordsSubject.asObservable();

  constructor(private storage: Storage) {
    this.init();
  }

  async init() {
    const storage = await this.storage.create();
    this._storage = storage;
    this.loadRecords();
  }

  private async loadRecords() {
    const records = (await this._storage?.get(STORAGE_KEY)) || [];
    // Sort by timestamp descending (newest first)
    records.sort((a: GlucoseRecord, b: GlucoseRecord) => b.timestamp - a.timestamp);
    this.recordsSubject.next(records);
  }

  async addRecord(record: Omit<GlucoseRecord, 'id' | 'timestamp'>): Promise<void> {
    const newRecord: GlucoseRecord = {
      ...record,
      id: crypto.randomUUID(),
      timestamp: new Date(`${record.date}T${record.time}`).getTime()
    };

    const currentRecords = this.recordsSubject.value;
    const updatedRecords = [newRecord, ...currentRecords];
    updatedRecords.sort((a: GlucoseRecord, b: GlucoseRecord) => b.timestamp - a.timestamp);

    if (this._storage) {
        await this._storage.set(STORAGE_KEY, updatedRecords);
    }
    this.recordsSubject.next(updatedRecords);
  }

  async updateRecord(updatedRecord: GlucoseRecord): Promise<void> {
    const currentRecords = this.recordsSubject.value;
    const index = currentRecords.findIndex((r: GlucoseRecord) => r.id === updatedRecord.id);
    
    if (index > -1) {
      updatedRecord.timestamp = new Date(`${updatedRecord.date}T${updatedRecord.time}`).getTime();
      
      currentRecords[index] = updatedRecord;
      currentRecords.sort((a: GlucoseRecord, b: GlucoseRecord) => b.timestamp - a.timestamp);
      
      if (this._storage) {
        await this._storage.set(STORAGE_KEY, currentRecords);
      }
      this.recordsSubject.next([...currentRecords]);
    }
  }

  async deleteRecord(id: string): Promise<void> {
    const currentRecords = this.recordsSubject.value;
    const updatedRecords = currentRecords.filter((r: GlucoseRecord) => r.id !== id);
    
    if (this._storage) {
        await this._storage.set(STORAGE_KEY, updatedRecords);
    }
    this.recordsSubject.next(updatedRecords);
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
    const data = this.recordsSubject.value.map((record: GlucoseRecord) => ({
      Fecha: record.date,
      Hora: record.time,
      'Valor (mg/dL)': record.value,
      Contexto: record.context.replace('_', ' '),
      Notas: record.notes || ''
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const workbook: XLSX.WorkBook = { Sheets: { 'Registros': worksheet }, SheetNames: ['Registros'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    
    this.saveAsExcelFile(excelBuffer, 'registros_glucometria');
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
