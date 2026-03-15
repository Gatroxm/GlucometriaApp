import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { BehaviorSubject, from, Observable } from 'rxjs';
import { tap, switchMap, map } from 'rxjs/operators';
import { ApiService } from '../api/api.service';

const TOKEN_KEY = 'auth_token';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private _storage: Storage | null = null;
  private authState = new BehaviorSubject<boolean>(false);
  private storageReadyPromise: Promise<void>;

  constructor(
    private apiService: ApiService,
    private storage: Storage
  ) {
    this.storageReadyPromise = this.init();
  }

  async init() {
    const storage = await this.storage.create();
    this._storage = storage;
    const token = await this._storage.get(TOKEN_KEY);
    if (token) {
      this.authState.next(true);
    }
  }

  login(credentials: any): Observable<any> {
    return this.apiService.post<any>('auth/login', credentials).pipe(
      tap(async (res) => {
        if (res.token) {
          await this.storageReadyPromise;
          await this._storage?.set(TOKEN_KEY, res.token);
          this.authState.next(true);
        }
      })
    );
  }

  register(user: any): Observable<any> {
    return this.apiService.post<any>('auth/register', user);
  }

  async logout() {
    await this.storageReadyPromise;
    await this._storage?.remove(TOKEN_KEY);
    this.authState.next(false);
  }

  async getToken(): Promise<string | null> {
    await this.storageReadyPromise;
    return this._storage ? this._storage.get(TOKEN_KEY) : null;
  }

  isAuthenticated(): Observable<boolean> {
    return this.authState.asObservable();
  }
}
