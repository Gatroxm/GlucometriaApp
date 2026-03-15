import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, 
  IonInput, IonButton, IonIcon, IonSpinner, IonBackButton, IonButtons, ToastController 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { waterOutline } from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, 
    IonInput, IonButton, IonIcon, IonSpinner, IonBackButton, IonButtons
  ]
})
export class RegisterPage implements OnInit {
  user = {
    name: '',
    email: '',
    password: ''
  };
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastCtrl: ToastController
  ) {
    addIcons({ waterOutline });
  }

  ngOnInit() {}

  async register() {
    if (!this.user.name || !this.user.email || !this.user.password) {
      this.showToast('Por favor completa todos los campos.');
      return;
    }

    this.loading = true;
    this.authService.register(this.user).subscribe({
      next: async (res) => {
        this.loading = false;
        const toast = await this.toastCtrl.create({
          message: 'Cuenta creada con éxito. Ahora puedes iniciar sesión.',
          duration: 3000,
          color: 'success',
          position: 'bottom'
        });
        toast.present();
        this.router.navigateByUrl('/login');
      },
      error: async (err) => {
        this.loading = false;
        let message = 'Error al registrarse. Intenta con otro correo.';
        if (err.error && err.error.msg === 'exists') {
          message = 'El correo ya está registrado.';
        }
        this.showToast(message, 'danger');
      }
    });
  }

  async showToast(message: string, color: string = 'warning') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    toast.present();
  }
}
