import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root',
})
export class NetworkStatusService {
  constructor(private toastService: ToastrService) {
    this.initializeNetworkStatus();
  }

  private initializeNetworkStatus() {
    // Check initial online status
    this.updateOnlineStatus();

    // Add event listeners for online and offline events
    window.addEventListener('online', this.updateOnlineStatus.bind(this));
    window.addEventListener('offline', this.updateOnlineStatus.bind(this));
  }

  private updateOnlineStatus() {
    const isOnline = navigator.onLine;

    // Debugging to check if the events are firing
    console.log('Network status changed:', isOnline ? 'Online' : 'Offline');

    if (isOnline) {
      this.toastService.success('You are back online!', 'Success');
    } else {
      this.toastService.error('You are disconnected from the network!', 'Error');
    }
  }
}
