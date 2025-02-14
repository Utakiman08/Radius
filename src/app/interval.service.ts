import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class IntervalService {
  private intervalSubject = new BehaviorSubject<number>(30 * 60 * 1000); // Default 30 minutes in milliseconds
  interval$ = this.intervalSubject.asObservable();

  private UpdateSubject = new Subject<void>();
  Update$ = this.UpdateSubject.asObservable();

  setIntervalValue(value: number): void {
    this.intervalSubject.next(value);
    console.log('sent timer')
  }
  triggerUpdate(){
    this.UpdateSubject.next();
    console.log('got trigger command')
  }
}
