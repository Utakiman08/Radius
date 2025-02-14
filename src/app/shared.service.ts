// shared.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  private selectedProjectSource = new BehaviorSubject<string>(''); // Default empty value
  selectedProject$ = this.selectedProjectSource.asObservable();

  updateSelectedProject(project: string) {
    this.selectedProjectSource.next(project);
  }
  private siteIdSubject = new BehaviorSubject<string | null>(null); // Initial value is null
  siteId$ = this.siteIdSubject.asObservable(); // Observable to be subscribed to

  setSiteId(siteId: string): void {
    this.siteIdSubject.next(siteId); // Update the siteId
  }
}
