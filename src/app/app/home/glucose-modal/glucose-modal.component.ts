import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, 
  IonItem, IonInput, IonSelect, IonSelectOption, IonTextarea,
  ModalController
} from '@ionic/angular/standalone';
import { GlucoseService } from '../../../services/glucose';
import { GlucoseRecord, GLUCOSE_CONTEXTS } from '../../../interfaces/glucose-record';

@Component({
  selector: 'app-glucose-modal',
  templateUrl: './glucose-modal.component.html',
  styleUrls: ['./glucose-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, 
    IonItem, IonInput, IonSelect, IonSelectOption, IonTextarea
  ]
})
export class GlucoseModalComponent implements OnInit {
  @Input() record?: GlucoseRecord;
  
  contexts = GLUCOSE_CONTEXTS;
  
  formData: {
    value: number | null;
    date: string;
    time: string;
    context: string;
    notes?: string;
  } = {
    value: null,
    date: '',
    time: '',
    context: 'ayunas',
    notes: ''
  };

  constructor(
    private modalCtrl: ModalController,
    private glucoseService: GlucoseService
  ) {}

  ngOnInit() {
    if (this.record) {
      this.formData = {
        value: this.record.value,
        date: this.record.date,
        time: this.record.time,
        context: this.record.context,
        notes: this.record.notes
      };
    } else {
      const now = new Date();
      this.formData.date = now.toISOString().split('T')[0];
      this.formData.time = now.toTimeString().slice(0, 5);
    }
  }

  cancel() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  confirm() {
    if (!this.formData.value || !this.formData.date || !this.formData.time) return;

    const dataToSave: Omit<GlucoseRecord, 'id' | 'timestamp'> = {
        ...this.formData,
        value: Number(this.formData.value)
    };

    if (this.record) {
        this.glucoseService.updateRecord({
          ...this.record,
          ...dataToSave
        });
    } else {
        this.glucoseService.addRecord(dataToSave);
    }
    
    this.modalCtrl.dismiss(dataToSave, 'confirm');
  }
}
