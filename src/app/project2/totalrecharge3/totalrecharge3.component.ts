import { ChangeDetectorRef, Component, HostListener, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { DataService } from '../data.service';
import { Subscription } from 'rxjs';
import { IntervalService } from '../../interval.service';

@Component({
  selector: 'app-totalrecharge3',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './totalrecharge3.component.html',
  styleUrl: './totalrecharge3.component.scss'
})
export class Totalrecharge3Component implements OnInit,OnDestroy {
  GridData!: any;
  DGData!: any;
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
  displayvalue: string = 'Grid';

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
      if (this.intervalSubscription) {
      this.intervalSubscription.unsubscribe();
    }    }
    if (this.command) {
      this.command.unsubscribe(); 
    }
    if (this.intervalSubscription) {
      this.intervalSubscription.unsubscribe();
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
      const totalData = data.resource.total;
       // Set grid and DG data to 0 if totalData is null
      if (totalData === null) {
        this.GridData = 0;
        this.DGData = 0;
      } else {
        const GridData = totalData.find((item: any) => item.type === 'GRID');
        this.GridData = GridData ? GridData.amount : 0; 
  
        const DGData = totalData.find((item: any) => item.type === 'DG');
        this.DGData = DGData ? DGData.amount : 0; 
      }
  
      this.setupvalue(this.displayvalue,false);  
    });
  }
  

  // Function to set the display value and update total
  setupvalue(value: string,loading:boolean): void {
    if (this.refreshId) {
      clearInterval(this.refreshId);
    }
    if (loading) {
      this.loading = true
    }
    this.displayvalue = value;
    this.cdr.detectChanges();

    if (value === 'Grid') {
      this.total = this.GridData ?? 0;
    } else if (value === 'DG') {
      this.total = this.DGData ?? 0;
    }
    this.currentHDFCValue = Number(this.total);
    this.startHDFCUpdate();
  }

  // Function to start HDFC updates
  private startHDFCUpdate(): void {
    if (this.refreshId) {
      clearInterval(this.refreshId);
    }
    
    this.refreshId = setInterval(() => {
      this.updateHDFC();
    }, 5000); 
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
      if (current) {
        current.classList.add('is-active');
        void current.offsetWidth; // Trigger reflow again to restart the animation
        outgoing.classList.add('outgoing'); 
      }
    }
  
    // Reapply animation classes

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

