import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  constructor(private toastr: ToastrService) {}

  success(message: string, title: string = 'Success') {
    this.toastr.success(message, title, {
      timeOut: 3000,
      progressBar: true,
      closeButton: true,
      tapToDismiss: true,
      toastClass: 'ngx-toastr success-toast',
    });
  }

  error(message: string, title: string = 'Error', timeOut: number = 3000) {
    const config: any = {
      timeOut: timeOut,           // Use provided timeOut or default to 3000ms
      progressBar: true,
      closeButton: true,
      tapToDismiss: true,
      toastClass: 'ngx-toastr error-toast',
    };
  
    // If timeOut is set to 0, apply specific settings
    if (timeOut === 0) {
      config.extendedTimeOut = 0;
      config.disableTimeOut = true; // Prevents automatic closing
    }
  
    this.toastr.error(message, title, config);
  }
  
  

  warning(message: string, title: string = 'Warning',timeOut: number = 3000) {
    const config:any= {
      timeOut: timeOut,
      progressBar: true,
      closeButton: true,
      tapToDismiss: true,
      toastClass: 'ngx-toastr warning-toast',
    };
    if (timeOut === 0) {
      config.extendedTimeOut = 0;
      config.disableTimeOut = true; // Prevents automatic closing
    }
    this.toastr.warning(message,title,config)
  }

  info(message: string, title: string = 'Info') {
    this.toastr.info(message, title, {
      timeOut: 3000,
      progressBar: true,
      closeButton: true,
      tapToDismiss: true,
      toastClass: 'ngx-toastr info-toast',
    });
  }
}
