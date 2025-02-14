import { ChangeDetectorRef, Component, EventEmitter, HostListener, Inject, OnDestroy, OnInit, Output, PLATFORM_ID } from '@angular/core';
import { DataService } from '../data.service';
import { Subscription } from 'rxjs';
import * as Highcharts from "highcharts";
import { CommonModule } from '@angular/common';
import { IntervalService } from '../../interval.service';
@Component({
  selector: 'app-seperate-data-amr',
  standalone: true,
  templateUrl: './seperate-data.component.html',
  styleUrls: ['./seperate-data.component.scss'],
  imports:[CommonModule]
})
export class SeperateDataComponent implements OnInit, OnDestroy {
  constructor(
    private dataservice: DataService,
    private cdr: ChangeDetectorRef,
    private timer : IntervalService
   ) {}
  intervalSubscription!:Subscription
  command! : Subscription

  Highcharts: typeof Highcharts = Highcharts;
  chartOptions: Highcharts.Options = {};
  activechart: string = 'grid';

  loading: boolean = false;

  // Variables to store each amount based on type
   xeMainAmount: number = 0;
   hdfcAmount: number = 0;
   Zakkpay:number = 0
  private subscribe: Subscription | null = null;
   
  type: string = 'data';
  mode: string = 'grid';
  currentDatetest: string = new Date().toISOString().split('T')[0];
  chartInstance: Highcharts.Chart | null = null;
  chartInstance2: Highcharts.Chart | null = null;
  private dataUpdateIntervalId: any;
  date: string = this.currentDatetest;
  data: any;
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
  ngOnInit(): void {
    this.loadalldata(true);
    this.startDataUpdateInterval();
    this.showChart(this.activechart);
    this.checkScreenWidth();
    this.getupdateCommand();
  }
  getupdateCommand(): void {
    this.command = this.timer.Update$.subscribe(() => {
       console.log('got trigger command');
      this.loadalldata(true);
    });
  }

  ngOnDestroy(): void {
    if (this.subscribe) {
      this.subscribe.unsubscribe();
    }
 
    if (this.dataUpdateIntervalId) {
      clearInterval(this.dataUpdateIntervalId);
    }
    if (this.command) {
      this.command.unsubscribe();
    }    
    if (this.intervalSubscription) {
      this.intervalSubscription
    }
  }

  loadalldata(initial_load:boolean) {
    if (initial_load) {
      this.loading = true;
    }
    else{
      this.loading = false;
    }
    this.subscribe = this.dataservice.getRechargeDaily(this.type, this.mode, this.date).subscribe(response => {
      this.data = response.resource.data;
      if (response.rc === 0 && response.resource.data!== null) {
         const xeMainAmount = this.data.find((item: any) => item.type === 'XE-MAIN');
         const hdfcAmount = this.data.find((item: any) => item.type === 'HDFCGRID');
         const Zakkpay = this.data.find((item: any) => item.type === 'ZP');

         
         this.xeMainAmount = xeMainAmount ? parseFloat(xeMainAmount.amount) : 0;
         this.hdfcAmount = hdfcAmount ? parseFloat(hdfcAmount.amount) : 0;
         this.Zakkpay = Zakkpay ? parseFloat(Zakkpay.amount) : 0
              this.updateChartData();
              this.loading = false
      }
      else{
        this.updateChartData();
        this.loading = false;

      }
    });

  }

  initializeChart(): void {
    this.chartOptions = {
      chart: {
        backgroundColor: 'rgba(0,0,0,0)',
        type: 'bar',
        animation: true,
      },
      plotOptions: {
        bar: {
          borderWidth: 0,
        },
      },
      title: {
        text: '',
      },      
      credits: {
        enabled: false
    },
      xAxis: {
        categories: ['HDFC', 'ZaakPay', 'XE-MAIN',],
        labels: {
          align: 'right',
          style: {
            color: '#FFF',
          },
        },
      },
      yAxis: {
        labels: {
          style: {
            color: '#FFF',
          },
          formatter: function () {
            const value = Number(this.value); // Explicit type casting to number
            if (isNaN(value)) {
              return "0"; // Default fallback for invalid or non-numeric values
            }
            if (value >= 1e7) return (value / 1e7) + " Cr"; // Crore
            if (value >= 1e5) return (value / 1e5) + " L";  // Lakh
            if (value >= 1e3) return (value / 1e3) + "Th"; //Thousand

            return value.toLocaleString(); // Default formatting
          }
        },
        title: {
          text: 'Recharge Amount',
          margin: 10,
          style: {
            color: '#FFF',
          },
        },
        min: 1,
        type: 'logarithmic',
      },
      series: [
        {
          type: 'bar',
          data: [
            { name: 'HDFC', y: this.hdfcAmount, color: 'rgba(14, 215, 225,0.5)' },
            { name: 'XE-MAIN', y: this.xeMainAmount, color: 'rgba(0, 175, 206,0.5)' },
            { name: 'ZaakPay', y: this.Zakkpay, color: 'rgba(3, 155, 194,0.5)' },
          ],
          showInLegend: false,
          dataLabels: {
            enabled: true,
            formatter: function () {
              const value = this.y; // 'this.y' is the correct way to access the value in data labels
              if (value === null || value === undefined) {
                return "0"; // Default fallback for null or undefined
              }
              if (value >= 1e7) return (value / 1e7).toFixed(2) + " Cr"; // Crore
              if (value >= 1e5) return (value / 1e5).toFixed(2) + " L";  // Lakh
              if (value >= 1e3) return (value / 1e3) + "Th"; //Thousand

              return value.toLocaleString(); // Default formatting
            },
          },
        },
      ],
      tooltip: {
        formatter: function () {
          return `Payment Type: ${this.point.name}<br>Recharge Amount: ${this.point.y}`;
        },
      },
    };

    // Render the chart
    const chartContainer = document.querySelector('#recharge-chart') as HTMLElement;
    this.chartInstance = this.Highcharts.chart(chartContainer, this.chartOptions);
  }
 

  showChart(chartType: string) {
    this.activechart = chartType;
    this.cdr.detectChanges(); // Trigger change detection
    setTimeout(() => this.renderChart(), 0);
  }

  renderChart() {
       this.initializeChart();
   }

  updateChartData(): void {
    if (this.chartInstance && this.activechart === 'grid') {
      const newSeriesData = [
        { name: 'HDFC', y: this.hdfcAmount },
        { name: 'Bill Desk', y: this.Zakkpay },
        { name: 'XE-MAIN', y: this.xeMainAmount },
      ];
      this.chartInstance.series[0].setData(newSeriesData, true);
    }

  }

   startDataUpdateInterval(): void {
    this.intervalSubscription = this.timer.interval$.subscribe((updateInterval)=>{
      if (this.dataUpdateIntervalId) {
        clearInterval(this.dataUpdateIntervalId)
      }
      this.dataUpdateIntervalId = setInterval(() => {
        this.loadalldata(false); // Fetch new data
      }, updateInterval);
    })
  }
}
