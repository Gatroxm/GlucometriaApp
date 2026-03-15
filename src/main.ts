import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { importProvidersFrom, LOCALE_ID } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

import { Drivers } from '@ionic/storage';
import { IonicStorageModule } from '@ionic/storage-angular';

registerLocaleData(localeEs);

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    { provide: LOCALE_ID, useValue: 'es-CO' },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideCharts(withDefaultRegisterables()),
    importProvidersFrom(IonicStorageModule.forRoot({
      name: '__glucometerdb',
      driverOrder: [Drivers.IndexedDB, Drivers.LocalStorage]
    }))
  ],
});
