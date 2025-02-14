import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ChangeDetectorRef, Component, Inject, PLATFORM_ID, OnDestroy, OnInit, HostListener } from '@angular/core';
import { DataService } from '../data.service';
import { Subscription } from 'rxjs';
import { IntervalService } from '../../interval.service';

@Component({
  selector: 'app-totalrecharge-amr',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './totalrecharge.component.html',
  styleUrls: ['./totalrecharge.component.scss']
})
export class TotalrechargeComponent implements OnInit, OnDestroy {
  GridData!: any;
  private subcribe: Subscription | null = null;
  currentHDFCValue: number = 0;
  ogvalue: number = 0;
  private refreshId: any;
  private dataLoadIntervalId: any;
  private intervalSubscription!:Subscription
  private command! : Subscription
  total: number = 0;
  type = 'amount';
  currentDatetest: string = new Date().toISOString().split('T')[0];
  date: string = this.currentDatetest;
 
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private dataService: DataService,
    private cdr: ChangeDetectorRef,
    private timer : IntervalService
  ) {}
  isSmallScreen: boolean = false;

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loaddata(true); // Load data immediately
      this.startDataLoadInterval(); // Start the interval for refreshing data
      this.checkScreenWidth();
      this.getupdateCommand();
    }
  }

  getupdateCommand(): void {
    this.command = this.timer.Update$.subscribe(() => {
       console.log('got trigger command');
      this.loaddata(true);
    });
  }
  
  show:boolean=false
 toggle(){
  this.show = !this.show
 }
 @HostListener('window:resize', ['$event'])
 onResize(): void {
   this.checkScreenWidth();
 }
  checkScreenWidth() {
    this.isSmallScreen = window.innerWidth < 500;
  }
  ngOnDestroy(): void {
    if (this.refreshId) {
      clearInterval(this.refreshId);
    }
    if (this.dataLoadIntervalId) {
      clearInterval(this.dataLoadIntervalId);
    }
    if (this.subcribe) {
      this.subcribe.unsubscribe();
    }
    clearInterval(this.dataLoadIntervalId);
    if (this.intervalSubscription) {
      this.intervalSubscription.unsubscribe();
    }
    if (this.command) {
      this.command.unsubscribe();
    }    

  }
  loading:boolean=false
  // Function to load data
  private loaddata(loading: boolean): void {
    if (this.subcribe) {
      this.subcribe.unsubscribe();
    }
  
    this.loading = loading;
  
    this.subcribe = this.dataService.getData_recharge_total(this.date, this.type).subscribe(data => {
      const totalData = data.resource.total[0];
      console.log(totalData)
       if (totalData === null) {
        this.GridData = 0;
       } else {
        const GridData = totalData.amount
        console.log(GridData)
        this.GridData = GridData ? GridData : 0;  // Set to 0 if GridData is null
      }
  
      this.currentHDFCValue = Number(this.GridData);
      this.startHDFCUpdate();

     });
  }
 
 
  // Function to start HDFC updates
  private startHDFCUpdate(): void {
    if (this.refreshId) {
      clearInterval(this.refreshId);
    }
    
    this.refreshId = setInterval(() => {
      this.updateHDFC();
    }, 5000); // Trigger update every 5 seconds
  }
  
  private updateHDFC(): void {
    const hdfcValueStr = this.currentHDFCValue.toFixed(2).padStart(12, '0').replace('.', '');
  
    for (let i = 0; i < hdfcValueStr.length; i++) {
      this.updateDigitDisplay(`unit${i + 1}`, hdfcValueStr[i], 9);
    }
  
    this.cdr.detectChanges();
  }
 
  private updateDigitDisplay(prefix: string, currentValue: string, max: number): void {
    const outgoingId = (parseInt(currentValue) - 1 + max + 1) % (max + 1);
    const outgoing = document.getElementById(`${prefix}-${outgoingId}`) as HTMLElement ;
    const current = document.getElementById(`${prefix}-${currentValue}`) as HTMLElement | null;
  
    // Reset all digit classes
    for (let i = 0; i <= max; i++) {
      const digitElement = document.getElementById(`${prefix}-${i}`) as HTMLElement | null;
      if (digitElement) {
        digitElement.classList.remove('is-active', 'outgoing');
        void digitElement.offsetWidth; // Trigger reflow
      }
    }
  
    // Reapply animation classes
    if (current) {
      current.classList.add('is-active');
      void current.offsetWidth; // Trigger reflow again to restart the animation
      outgoing.classList.add('outgoing'); 
    }
    this.loading = false
  }
  
  // Function to start an interval for loading data every 5-7 minutes
  private startDataLoadInterval(): void {
    this.intervalSubscription = this.timer.interval$.subscribe((updateInterval)=>{
      if (this.dataLoadIntervalId) {
      clearInterval(this.dataLoadIntervalId)
      }
      this.dataLoadIntervalId = setInterval(() => {
        this.loaddata(false); // Load data every 5-7 minutes
      },updateInterval );
    })

  }
}

