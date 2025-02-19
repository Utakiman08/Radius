import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private loginUrl = 'https://vapt.myxenius.com/NOC_api/api/login/'; // Replace with your actual API endpoint
  private loginId: string ='';
  private password: string ='';
  private project: string ='';

  constructor(private http: HttpClient, @Inject(PLATFORM_ID) private platformId: any) {}

  login(loginData: { login_id: string; password: string; device_token: string; device_os: string; project: string }): Observable<any> {
    this.loginId = loginData.login_id;
    this.password = loginData.password;
    this.project = loginData.project;
    if (isPlatformBrowser(this.platformId) ) {
      sessionStorage.setItem('loginId', this.loginId); // Save the LoginId
      sessionStorage.setItem('password', this.password); // Save the LoginId
      sessionStorage.setItem('project', this.project); // Save the LoginId

    }
    return this.http.post<any>(this.loginUrl, loginData).pipe(
      map(response => {
        if (isPlatformBrowser(this.platformId) && response && response.token) {
          sessionStorage.setItem('authToken', response.token); // Save the token
        }
        return response;
      })
    );
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return sessionStorage.getItem('authToken');
    }
    return null;
  }

  getLoginId(): string | null{
    if (isPlatformBrowser(this.platformId)) {
      return sessionStorage.getItem('loginId');
    }
    return null;
  }

  getPassword(): string | null{
    if (isPlatformBrowser(this.platformId)) {
      return sessionStorage.getItem('password');
    }
    return null;
  }

  getProject(): string | null{
    if (isPlatformBrowser(this.platformId)) {
      return sessionStorage.getItem('project');
    }
    return null;
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem('authToken');
    }
    this.loginId = '';
    this.password = '';
    this.project = '';
  }
}
