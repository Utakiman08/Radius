import { ChangeDetectorRef, Component, HostListener, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { forkJoin, Subscription } from 'rxjs';
import { DataService as DataServiceNPCL } from '../../project2/data.service';
import { DataService as DataServicePVVNL } from '../../project3/data.service';
import { DataService as DataServiceTorrent } from '../../project4/data.service';
import { DataService as DataServiceAMR } from '../../project-amr/data.service';

import { IntervalService } from '../../interval.service';

@Component({
  selector: 'app-totalrechargemain',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './totalrechargemain.component.html',
  styleUrl: './totalrechargemain.component.scss'
})
export class TotalrechargemainComponent implements OnInit , OnDestroy{
  
  gridData!: any;
  amrData!: any;

  dgData!: any;
  currentHDFCValue: number = 0;
  ogvalue: number = 0;
  private refreshId: any;
  total: number = 0;
  type = 'amount';
  currentDatetest: string = new Date().toISOString().split('T')[0];
  private subscribe: Subscription | null = null;
  private dataLoadIntervalId: any;
  displayvalue: string = 'Grid';
  intervalSubscription!:Subscription
  command! : Subscription
  date = this.currentDatetest;
  periodic:any
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private dataServiceNPCL: DataServiceNPCL,
    private dataServicePVVNL: DataServicePVVNL,
    private dataServiceTorrent: DataServiceTorrent,
    private dataServiceAMR: DataServiceAMR,
    private cdr: ChangeDetectorRef,
    private timer : IntervalService

  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loaddata(true); // Load data immediately
      this.startDataLoadInterval(); // Start the interval for refreshing data
      this.checkScreenWidth();
      this.getupdateCommand();
    }
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
 isSmallScreen: boolean = false;
  loading:boolean=false
  ngOnDestroy(): void {
    if (this.refreshId) {
      clearInterval(this.refreshId);
    }
    if (this.dataLoadIntervalId) {
      clearInterval(this.dataLoadIntervalId);
    }
    if (this.subscribe) {
      this.subscribe.unsubscribe();
    }
    clearInterval(this.dataLoadIntervalId);
    if (this.intervalSubscription) {
      this.intervalSubscription.unsubscribe();
    }    
    if (this.command) {
      this.command.unsubscribe();
    }    

  }
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
  
  getupdateCommand(): void {
    this.command = this.timer.Update$.subscribe(() => {
       console.log('got trigger command');
      this.loaddata(true);
    });
  }
 

  private loaddata(loading: boolean): void {
    if (this.refreshId) {
        clearInterval(this.refreshId);
    }
    this.loading = loading;

    // Initialize sums for grid, DG, and AMR data
    let totalGridData = 0;
    let totalDgData = 0;
    let totalAmrData = 0;

    // Create an array of observables to call the API four times (adding AMR)
    const requests = [
        this.dataServiceNPCL.getData_recharge_total(this.date, this.type),
        this.dataServicePVVNL.getData_recharge_total(this.date, this.type),
        this.dataServiceTorrent.getData_recharge_total(this.date, this.type),
        this.dataServiceAMR.getData_recharge_total(this.date, this.type) // Add AMR request
    ];

    // Use forkJoin to make the requests and process all responses together
    this.subscribe = forkJoin(requests).subscribe((responses: any[]) => {
        responses.forEach((data, index) => {
            // Check if the response and total data exist
            if (data && data.resource && data.resource.total) {
                const totalData = data.resource.total;

                if (index < 3) { // First three responses (NPCL, PVVNL, Torrent)
                    const gridData = totalData.find((item: any) => item.type === 'GRID');
                    const dgData = totalData.find((item: any) => item.type === 'DG');

                    // Add to totals if data exists, otherwise add 0
                    totalGridData += gridData ? parseFloat(gridData.amount) : 0;
                    totalDgData += dgData ? parseFloat(dgData.amount) : 0;
                } else { // AMR response (last request)
                    // Add the total amount from AMR data
                    totalAmrData += totalData[0]?.amount ? parseFloat(totalData[0].amount) : 0;
                }
            }
        });

        // Round totals to two decimal places
        this.gridData = parseFloat(totalGridData.toFixed(2)) + parseFloat(totalAmrData.toFixed(2));
        this.dgData = parseFloat(totalDgData.toFixed(2));
 
        // Log data for debugging (if needed)
        // console.log(this.gridData);
        // console.log(this.dgData);
        // console.log(this.amrData);

        this.setupvalue('grid', false);
    });
}

setupvalue(value:string,loading:boolean){
  if (this.refreshId) {
    clearInterval(this.refreshId);
    this.cdr.detectChanges();
  }
  if (loading) {
    this.loading=false
  }
  if(value === 'grid'){
  this.loading = true
    this.total = this.gridData
    this.currentHDFCValue = Number(this.total);
  }
  if(value === 'dg'){
  this.loading = true
    this.total = this.dgData
    this.currentHDFCValue = Number(this.total);
  }
  this.startHDFCUpdate();
}


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
  
}
