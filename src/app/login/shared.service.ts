// src/app/services/shared.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  private formData: any = {};

  setFormData(data: any) {
    this.formData = data;
  }

  getFormData() {
    return this.formData;
  }
}
