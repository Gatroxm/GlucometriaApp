import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent,
  IonItem, IonInput, IonSelect, IonSelectOption, IonTextarea, IonToggle,
  ModalController, IonItemGroup, IonListHeader, IonLabel
} from '@ionic/angular/standalone';
import { GlicemiaService } from '../../services/glicemia.service'; // Inyectamos el servicio correcto
import { GlucoseRecord, GLUCOSE_CONTEXTS } from '../../interfaces/glucose-record';

@Component({
  selector: 'app-glucose-modal',
  templateUrl: './glucose-modal.component.html',
  styleUrls: ['./glucose-modal.component.scss'],
  standalone: true,
  imports: [IonLabel, IonListHeader, IonItemGroup, 
    CommonModule,
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, 
    IonItem, IonInput, IonSelect, IonSelectOption, IonTextarea, IonToggle
  ]
})
export class GlucoseModalComponent implements OnInit {
  @Input() record?: GlucoseRecord;
  
  contexts = GLUCOSE_CONTEXTS;
  

  formData = {
    valor: null as number | null,
    dateOnly: '', // Campo temporal para la vista de Ionic
    timeOnly: '', // Campo temporal para la vista de Ionic
    tipo: 'casual',
    carbohidratos: 0,
    insulinaUnidades: 0,
    tipoInsulina: 'ninguna' as 'rapida' | 'basal' | 'ninguna',
    ratioUtilizado: 0,
    hizoEjercicio: false,
    notes: ''
  };

  constructor(
    private modalCtrl: ModalController,
    private glucoseService: GlicemiaService
  ) {}

  ngOnInit() {
    if (this.record) {
      const dateObj = new Date(this.record.fecha);
      
      this.formData = {
        valor: this.record.valor,
        dateOnly: dateObj.toISOString().split('T')[0],
        timeOnly: dateObj.toTimeString().slice(0, 5),
        tipo: this.record.tipo,
        carbohidratos: this.record.carbohidratos || 0,
        insulinaUnidades: this.record.insulina?.unidades || 0,
        tipoInsulina: this.record.insulina?.tipoInsulina || 'ninguna',
        ratioUtilizado: this.record.insulina?.ratioUtilizado || 0,
        hizoEjercicio: this.record.hizoEjercicio || false,
        notes: this.record.notes || ''
      };
    } else {
      const now = new Date();
      this.formData.dateOnly = now.toISOString().split('T')[0];
      this.formData.timeOnly = now.toTimeString().slice(0, 5);
    }
  }

  cancel() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  confirm() {
    if (!this.formData.valor || !this.formData.dateOnly || !this.formData.timeOnly) return;

    const combinedFecha = new Date(`${this.formData.dateOnly}T${this.formData.timeOnly}:00`).toISOString();

    const dataToSave: Omit<GlucoseRecord, '_id'> = {
      valor: Number(this.formData.valor),
      tipo: this.formData.tipo as any,
      carbohidratos: Number(this.formData.carbohidratos),
      insulina: {
        unidades: Number(this.formData.insulinaUnidades),
        tipoInsulina: this.formData.tipoInsulina,
        ratioUtilizado: Number(this.formData.ratioUtilizado)
      },
      hizoEjercicio: this.formData.hizoEjercicio,
      notes: this.formData.notes,
      fecha: combinedFecha
    };

    if (this.record) {
      this.glucoseService.updateRecord({
        ...this.record,
        ...dataToSave
      }).subscribe();
    } else {
      this.glucoseService.addRecord(dataToSave).subscribe();
    }
    
    this.modalCtrl.dismiss(dataToSave, 'confirm');
  }
}