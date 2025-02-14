import { ChangeDetectorRef, Component, HostListener, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { DataService as DataServiceNPCL } from '../../project2/data.service';
import { DataService as DataServicePVVNL } from '../../project3/data.service';
import { DataService as DataServiceTorrent } from '../../project4/data.service';
import { DataService as DataServiceAMR } from '../../project-amr/data.service';

import { forkJoin, Subscription } from 'rxjs';
import * as Highcharts from "highcharts";
import { CommonModule } from '@angular/common';
import { map } from 'rxjs/operators';
import { IntervalService } from '../../interval.service';
@Component({
  selector: 'app-seperate-datatotal',
  standalone: true,
  templateUrl: './seperate-data.component.html',
  styleUrls: ['./seperate-data.component.scss'],
  imports:[CommonModule]
})
export class SeperateDataComponent implements OnInit, OnDestroy {

  intervalSubscription!:Subscription

  constructor(    private dataServiceNPCL: DataServiceNPCL,
    private dataServicePVVNL: DataServicePVVNL,
    private dataServiceTorrent: DataServiceTorrent,
    private dataServiceAMR: DataServiceAMR,
    private cdr:ChangeDetectorRef,
    private timer : IntervalService
    ,
) {}
subscribeDG:Subscription | null = null
Highcharts: typeof Highcharts = Highcharts;
chartOptions: Highcharts.Options = {};
activechart: string = 'grid';

loading: boolean = false;

// Variables to store each amount based on type
bdGridAmount: number = 0;
Zaakpay: number = 0;

pbdGridAmount: number = 0;
xeMainAmount: number = 0;
dbdGridAmount: number = 0;
hdfcAmount: number = 0;
bdtotal: number = 0;
hdfcdg: number = 0;
xeMaindg: number = 0;
command! : Subscription

private subscribeGrid: Subscription | null = null;
private subscribeDg: Subscription | null = null;

type: string = 'data';
mode: string = 'grid';
currentDatetest: string = new Date().toISOString().split('T')[0];
chartInstance: Highcharts.Chart | null = null;
chartInstance2: Highcharts.Chart | null = null;
private dataUpdateIntervalId: any;
date: string = this.currentDatetest;
data: any;


loadalldata(initial_load: boolean) {
  if (initial_load) {
    this.loading = true;
  } else {
    this.loading = false;
  }

  // Grid Data Subscription
  this.subscribeGrid = forkJoin({
    npclData: this.dataServiceNPCL.getRechargeDaily(this.type, this.mode, this.date),
    pvvnlData: this.dataServicePVVNL.getRechargeDaily(this.type, this.mode, this.date),
    torrentData: this.dataServiceTorrent.getRechargeDaily(this.type, this.mode, this.date),
    AMRData: this.dataServiceAMR.getRechargeDaily(this.type, this.mode, this.date),

  }).pipe(
    map(({ npclData, pvvnlData, torrentData , AMRData }) => {
      // Combine and sum data from all sources
      const combinedData = [
        ...(npclData?.resource?.data || []),
        ...(pvvnlData?.resource?.data || []),
        ...(torrentData?.resource?.data || []),
        ...(AMRData?.resource?.data || []),
        
      ];

      // Helper function to sum amounts across all sources
      const sumAmounts = (type: string) => {
        return combinedData
          .filter((item: any) => item.type === type)
          .reduce((total, item) => total + (item.amount ? parseFloat(item.amount) : 0), 0);
      };

      return {
        bdGridAmount: sumAmounts('BDGRID'),
        pbdGridAmount: sumAmounts('PBDGRID'),
        xeMainAmount: sumAmounts('XE-MAIN'),
        dbdGridAmount: sumAmounts('DBDGRID'),
        hdfcAmount: sumAmounts('HDFCGRID'),
        Zaakpay: sumAmounts('ZP')
      };
    })
  ).subscribe(({ bdGridAmount, pbdGridAmount, xeMainAmount, dbdGridAmount, hdfcAmount , Zaakpay}) => {
    this.bdGridAmount = bdGridAmount;
    this.pbdGridAmount = pbdGridAmount;
    this.xeMainAmount = xeMainAmount;
    this.dbdGridAmount = dbdGridAmount;
    this.hdfcAmount = hdfcAmount;
    this.Zaakpay = Zaakpay;
    // console.log(Zaakpay)
    // Calculating the total amount
    this.bdtotal = this.bdGridAmount + this.pbdGridAmount + this.dbdGridAmount;
    this.bdtotal = parseFloat(this.bdtotal.toFixed(2));
      this.updateChartData();
  });

  // DG Data Subscription
  this.subscribeDG = forkJoin({
    npclData: this.dataServiceNPCL.getRechargeDaily(this.type, 'DG', this.date),
    pvvnlData: this.dataServicePVVNL.getRechargeDaily(this.type, 'DG', this.date),
    torrentData: this.dataServiceTorrent.getRechargeDaily(this.type, 'DG', this.date)
  }).pipe(
    map(({ npclData, pvvnlData, torrentData }) => {
      // Combine and sum data from all sources
      const combinedData = [
        ...(npclData?.resource?.data || []),
        ...(pvvnlData?.resource?.data || []),
        ...(torrentData?.resource?.data || [])
      ];

      // Helper function to sum amounts across all sources
      const sumAmounts = (type: string) => {
        return combinedData
          .filter((item: any) => item.type === type)
          .reduce((total, item) => total + (item.amount ? parseFloat(item.amount) : 0), 0);
      };

      return {
        hdfcdg: sumAmounts('HDFCDG'),
        xeMaindg: sumAmounts('XE-MAIN')
      };
    })
  ).subscribe(({ hdfcdg, xeMaindg }) => {
    // Assign the summed values to the component variables
    this.hdfcdg = hdfcdg;
    this.xeMaindg = xeMaindg;

    //console.log('Total HDFCDG:', this.hdfcdg); // Check the combined value
    //console.log('Total XE-MAIN DG:', this.xeMaindg); // Check the combined value

    this.loading = false;
  });
}
getupdateCommand(): void {
  this.command = this.timer.Update$.subscribe(() => { 
    //  console.log('got trigger command');
    this.loadalldata(true);
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
isSmallScreen: boolean = false;


ngOnInit(): void {
  this.loadalldata(true);
  this.startDataUpdateInterval();
  this.showChart(this.activechart);
  this.checkScreenWidth();
  this.getupdateCommand();
}

ngOnDestroy(): void {
  if (this.subscribeGrid) {
    this.subscribeGrid.unsubscribe();
  }
  if (this.subscribeDg) {
    this.subscribeDg.unsubscribe();
  }
  if (this.dataUpdateIntervalId) {
    clearInterval(this.dataUpdateIntervalId);
  }
  if (this.command) {
    this.command.unsubscribe();
  }    
  if (this.intervalSubscription) {
    this.intervalSubscription.unsubscribe();
  }
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
      categories: ['HDFC', 'Bill Desk', 'XE-MAIN','ZaakPay'],
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
          { name: 'Bill Desk', y: this.bdtotal, color: 'rgba(3, 155, 194,0.5)' },
          { name: 'XE-MAIN', y: this.xeMainAmount, color: 'rgba(0, 175, 206,0.5)' },
          { name: 'ZaakPay', y: this.Zaakpay, color: 'rgba(0, 175, 206,0.5)' },

        ],
        showInLegend: false,
        dataLabels: {
          enabled: true,
          formatter: function () {
            // Safely handle null values  
            if (this.y != null) {
              return this.y.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            }
            return ''; // Return an empty string if this.y is null
          }
        },
      },
    ],
    tooltip: {
      formatter: function () {
        return `Payment Type: ${this.point.name}<br>Grid Amount: ${this.point.y}`;
      },
    },
  };

  // Render the chart
  const chartContainer = document.querySelector('#recharge-chart') as HTMLElement;
  this.chartInstance = this.Highcharts.chart(chartContainer, this.chartOptions);
}
initializeChartdg(): void {
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
      categories: ['HDFC', 'XE-MAIN'],
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
          { name: 'HDFC', y: this.hdfcdg, color: 'rgba(14, 215, 225,0.5)' },
          { name: 'XE-MAIN', y: this.xeMaindg, color: 'rgba(0, 175, 206,0.5)' },
        ],
        showInLegend: false,
        dataLabels: {
          enabled: true,
          formatter: function () {
            // Safely handle null values
            if (this.y != null) {
              return this.y.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            }
            return ''; // Return an empty string if this.y is null
          },
        },
      },
    ],
    tooltip: {
      formatter: function () {
        return `Payment Type: ${this.point.name}<br>DG Amount: ${this.point.y}`;
      },
    },
  };
  // Render the chart
  //console.log('dg chart')
  const chartContainer = document.querySelector('#recharge_chartdg') as HTMLElement;
  this.chartInstance2 =  this.Highcharts.chart(chartContainer, this.chartOptions);
}

showChart(chartType: string) {
  this.activechart = chartType;
  this.cdr.detectChanges(); // Trigger change detection
  setTimeout(() => this.renderChart(), 0);
}

renderChart() {
  if (this.activechart === 'grid') {
    this.initializeChart();
  } else if (this.activechart === 'dg') {
    this.initializeChartdg();
  }
}

updateChartData(): void {
  if (this.chartInstance && this.activechart === 'grid') {
    const newSeriesData = [
      { name: 'HDFC', y: this.hdfcAmount },
      { name: 'Bill Desk', y: this.bdtotal },
      { name: 'XE-MAIN', y: this.xeMainAmount },
      { name: 'ZaakPay', y: this.Zaakpay },

    ];
    this.chartInstance.series[0].setData(newSeriesData, true);
    this.loading = false
  }

  if (this.chartInstance2 && this.activechart === 'dg') {
    const newSeriesData = [
      { name: 'HDFC', y: this.hdfcdg },
      { name: 'XE-MAIN', y: this.xeMaindg },
    ];
    this.chartInstance2.series[0].setData(newSeriesData, true);
    this.loading = false
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
