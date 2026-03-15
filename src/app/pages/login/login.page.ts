import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, 
  IonInput, IonButton, IonIcon, IonSpinner, ToastController 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { waterOutline } from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, 
    IonInput, IonButton, IonIcon, IonSpinner
  ]
})
export class LoginPage implements OnInit {
  credentials = {
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

  async login() {
    if (!this.credentials.email || !this.credentials.password) return;

    this.loading = true;
    this.authService.login(this.credentials).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigateByUrl('/home', { replaceUrl: true });
      },
      error: async (err) => {
        this.loading = false;
        const toast = await this.toastCtrl.create({
          message: 'Error al iniciar sesión. Verifica tus credenciales.',
          duration: 3000,
          color: 'danger',
          position: 'bottom'
        });
        toast.present();
      }
    });
  }

  goToRegister() {
    this.router.navigateByUrl('/register');
  }

  async showInfo(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'bottom'
    });
    toast.present();
  }
}
