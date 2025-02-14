import {  Component , OnDestroy, OnInit } from '@angular/core';
import { DataService as DataServiceNPCL } from '../project2/data.service';
import { DataService as DataServicePVVNL } from '../project3/data.service';
import { DataService as DataServiceTorrent } from '../project4/data.service';
import { DataService as DataServiceAMR } from '../project-amr/data.service';
import { CommonModule} from '@angular/common';
import { DeviceComponent } from "./device/device.component";
import { DgstatusComponent } from './dgstatus/dgstatus.component';
import * as Highcharts from 'highcharts'
import { catchError, forkJoin, of, Subscription } from 'rxjs';
import { TotalrechargemainComponent } from "./totalrechargemain/totalrechargemain.component";
import { SeperateDataComponent } from './seperate-data/seperate-data.component';
import { MAPComponent } from './map/map.component';
import { CdailyComponent } from './consumption/cdaily/cdaily.component';
import { CyearlyComponent } from './consumption/cyearly/cyearly.component';
import { IntervalService } from '../interval.service';

@Component({
  selector: 'app-control',
  standalone: true,
  imports: [CommonModule, DeviceComponent,SeperateDataComponent, DgstatusComponent, TotalrechargemainComponent,MAPComponent,CdailyComponent,CyearlyComponent],
  templateUrl: './control.component.html',
  styleUrls: ['./control.component.scss']
})
export class ControlComponent implements OnInit,OnDestroy {
  show:boolean=false;
  meterdata: {
    totalMeterCount?:number,
    totalInfraMeterCount?:number
    totalInstallMeterCount?:number
    totalInfra?:number
    totalThreePhase?:number
    totalSinglePhase?:number
    totalAEW?:number
    totalGENUS?:number
    totalCT?:number
    totalHPL?:number
    totalWOQ?:number
  }={};
 
  public componentName = 'control'
  command!: Subscription
  intervaltimer!:Subscription
  private subscriptionMobile : Subscription | null = null
  private subscriptionMeter : Subscription | null = null


  constructor(
  private DataServiceNPCL: DataServiceNPCL,
  private DataServicePVVNL: DataServicePVVNL,
  private DataServiceTorrent: DataServiceTorrent,
  private DataServiceAMR: DataServiceAMR,

  private timer: IntervalService
) {}
  interval:any


  ngOnInit(): void {
    this.getmeter_Status();
    this.getApp_status(true);
    this.Reloaddata();
    this.triggerReload();
    this.componentName = 'control'
  }

  toggledropdown(){
    this.show = !this.show;
  }

  triggerReload(){
    this.command = this.timer.Update$.subscribe(()=>{
      this.getmeter_Status();
      this.getApp_status(false); 
    })
  }
  Reloaddata(){
    this.intervaltimer = this.timer.interval$.subscribe((updateInterval)=>{
      if (this.interval) {
        clearInterval(this.interval)
      }
      this.interval = setInterval(() => {
        this.getmeter_Status();
        this.getApp_status(false);    
      }, updateInterval);
    })
  }


  chartOptions: Highcharts.Options = {};
  private intervalId: any;
  chart!: Highcharts.Chart;
  Highcharts: typeof Highcharts = Highcharts;



  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    if (this.interval) {
      clearInterval(this.interval);
    }
    if (this.subscriptionMeter) {
      this.subscriptionMeter.unsubscribe();
    }
    if(this.subscriptionMobile){
      this.subscriptionMobile.unsubscribe();
    }
    if (this.command) {
      this.command.unsubscribe();
    }    
    if (this.intervaltimer) {
      this.intervaltimer.unsubscribe();
    }
      clearInterval(this.interval) 
 
  }
  appdata: {
    data_android?: string,
    data_ios?: string
  } = {}
  
 totalAndroid:number = 0
 totalIos:number = 0
 currentDatetest: string = new Date().toISOString().split('T')[0];

 getApp_status(initialLoad: boolean) {
  this.subscriptionMobile = forkJoin({
    apidata1: this.DataServiceNPCL.getData_users(this.currentDatetest).pipe(
      catchError(() => of({ rc: -1, data: {} })) // Return default object
    ),
    apidata2: this.DataServicePVVNL.getData_users(this.currentDatetest).pipe(
      catchError(() => of({ rc: -1, data: {} }))
    ),
    apidata3: this.DataServiceTorrent.getData_users(this.currentDatetest).pipe(
      catchError(() => of({ rc: -1, data: {} }))
    ),
    apidata4: this.DataServiceAMR.getData_users(this.currentDatetest).pipe(
      catchError(() => of({ rc: -1, data: {} }))
    ),
  }).subscribe(app => {
    // ✅ If rc = -1, replace with empty data
    const safeData1 = app.apidata1.rc !== -1 ? app.apidata1.data : {};
    const safeData2 = app.apidata2.rc !== -1 ? app.apidata2.data : {};
    const safeData3 = app.apidata3.rc !== -1 ? app.apidata3.data : {};
    const safeData4 = app.apidata4.rc !== -1 ? app.apidata4.data : {};

    // ✅ Ensure only valid numbers are added (fallback to 0 if missing)
    this.totalIos = 
      (parseInt(safeData1.data_ios, 10) || 0) +
      (parseInt(safeData2.data_ios, 10) || 0) +
      (parseInt(safeData3.data_ios, 10) || 0) +
      (parseInt(safeData4.data_ios, 10) || 0);

    this.totalAndroid = 
      (parseInt(safeData1.data_android, 10) || 0) +
      (parseInt(safeData2.data_android, 10) || 0) +
      (parseInt(safeData3.data_android, 10) || 0) +
      (parseInt(safeData4.data_android, 10) || 0);

    console.log('Total iOS:', this.totalIos);
    console.log('Total Android:', this.totalAndroid);

    // ✅ Ensure chart updates correctly
    if (initialLoad) {
      this.getChartOptions();
    } else {
      this.updateChartData();
    }
  });
}


  
getChartOptions() {
  const Android = Number(this.totalAndroid);
  const IOS = Number(this.totalIos);

  this.chartOptions = {
    chart: {
      type: 'pie',
      backgroundColor: 'rgba(0,0,0,0)',
      events: {
        render: () => {
          const chart = this.chart as Highcharts.Chart & { androidText?: Highcharts.SVGElement, iosText?: Highcharts.SVGElement };
          if (!chart) return;

          // Determine dynamic font size based on the chart's dimensions
          const dynamicFontSize = Math.max(12, Math.min(chart.plotWidth, chart.plotHeight) * 0.08); // Adjust multiplier as needed

          // Remove old text if any
          if (chart.androidText) chart.androidText.destroy();
          if (chart.iosText) chart.iosText.destroy();

          // Add Android text at the top center with dynamic font size
          chart.androidText = chart.renderer
            .text(
              `Android: ${Android}`,
              chart.plotLeft + chart.plotWidth / 2,
              chart.plotTop + chart.plotHeight / 2 - 15 // Position slightly above the center
            )
            .css({
              color: '#00FFFF',
              fontSize: `${dynamicFontSize}px`,
              textAlign: 'center',
            })
            .attr({
              align: 'center',
            })
            .add();

          // Add iOS text below the center with dynamic font size
          chart.iosText = chart.renderer
            .text(
              `iOS: ${IOS}`,
              chart.plotLeft + chart.plotWidth / 2,
              chart.plotTop + chart.plotHeight / 2 + 25 // Position slightly below the center
            )
            .css({
              color: '#3da6a6',
              fontSize: `${dynamicFontSize}px`,
              textAlign: 'center',
            })
            .attr({
              align: 'center',
            })
            .add();
        },
      },
    },
    title: {
      text: ''
    },
    accessibility: {
      point: {
        valueSuffix: '%'
      }
    },
    tooltip: {
      pointFormat: '{series.name}: <b>{point.y}</b>'
    },
    legend: {
      enabled: false
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        dataLabels: {
          enabled: false,
          distance: 20,
          format: '{point.name}'
        },
        showInLegend: true,
        innerSize: '75%'
      }
    },
    series: [{
      type: 'pie',
      name: 'Count',
      colorByPoint: true,
      data: [{
        name: 'Android',
        y: Android,
        color: '#00FFFF'
      }, {
        name: 'iOS',
        y: IOS,
        color: '#008080'
      }]
    } as Highcharts.SeriesPieOptions]
  };

  const chartContainer = document.querySelector('#app_Status') as HTMLElement;

  if (chartContainer) {
    this.chart = Highcharts.chart(chartContainer, this.chartOptions);
    this.intervalId = setInterval(() => {
      if (Android !== 0 || IOS !== 0) {
        this.updateChartData(); // Update only if neither Android nor IOS is 0
        this.chart.reflow(); // Adjust text position if needed
      }
    }, 2000); // Update every 2 seconds
  } else {
    console.error('Chart container not found');
  }
}
  

  private generateRandomData(): Highcharts.PointOptionsObject[] {
    const Android = Number(this.totalAndroid ?? 0) !== 0 
      ? Number(this.totalAndroid) 
      : 0;
  
    const Apple = Number(this.totalIos ?? 0) !== 0 
      ? Number(this.totalIos) 
      : 0;
  
    return [
      { name: 'Android', y: Android },
      { name: 'IOS', y: Apple }
    ];
  }
  
private updateChartData(): void {
  if (this.chart) {
    // Update chart series data with new values
    this.chart.series[0].setData(this.generateRandomData(), true);

    // Also update the center text dynamically based on new values
    const chart = this.chart as Highcharts.Chart & { androidText?: Highcharts.SVGElement, iosText?: Highcharts.SVGElement };
    if (!chart) return;

    const dynamicFontSize = Math.max(12, Math.min(chart.plotWidth, chart.plotHeight) * 0.08);

    if (chart.androidText) chart.androidText.destroy();
    if (chart.iosText) chart.iosText.destroy();

    chart.androidText = chart.renderer
      .text(
        `Android: ${this.totalAndroid}`,
        chart.plotLeft + chart.plotWidth / 2,
        chart.plotTop + chart.plotHeight / 2 - 15
      )
      .css({
        color: '#00FFFF',
        fontSize: `${dynamicFontSize}px`,
        textAlign: 'center',
      })
      .attr({
        align: 'center',
      })
      .add();

    chart.iosText = chart.renderer
      .text(
        `iOS: ${this.totalIos}`,
        chart.plotLeft + chart.plotWidth / 2,
        chart.plotTop + chart.plotHeight / 2 + 25
      )
      .css({
        color: '#3da6a6',
        fontSize: `${dynamicFontSize}px`,
        textAlign: 'center',
      })
      .attr({
        align: 'center',
      })
      .add();
  }
}
  


  // getMonthName(monthNumber: string): string {
  //   const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  //   return months[parseInt(monthNumber) - 1];
  // }

  getmeter_Status() {
    this.subscriptionMeter = forkJoin({
      apidata1: this.DataServiceNPCL.getData_Meter_dashboard().pipe(
        catchError(() => of({ rc: -1 })) // Return an object with rc = -1
      ),
      apidata2: this.DataServicePVVNL.getData_Meter_dashboard().pipe(
        catchError(() => of({ rc: -1 }))
      ),
      apidata3: this.DataServiceTorrent.getData_Meter_dashboard().pipe(
        catchError(() => of({ rc: -1 }))
      ),
      apidata4: this.DataServiceAMR.getData_Meter_dashboard().pipe(
        catchError(() => of({ rc: -1 }))
      ),
    }).subscribe(responses => {
      // If rc = -1, replace the response with an empty object
      const safeData1 = responses.apidata1.rc !== -1 ? responses.apidata1 : { data: {} };
      const safeData2 = responses.apidata2.rc !== -1 ? responses.apidata2 : { data: {} };
      const safeData3 = responses.apidata3.rc !== -1 ? responses.apidata3 : { data: {} };
      const safeData4 = responses.apidata4.rc !== -1 ? responses.apidata4 : { data: {} };
  
      // Call the combine function with safe data
      this.meterdata = this.combineMeterData(safeData1, safeData2, safeData3, safeData4);
    });
  }
  
  // ✅ Ensures valid data structure
  combineMeterData(data1: any, data2: any, data3: any, data4: any): any {
    return {
      totalMeterCount: (data1.data?.totalMeterCount || 0) + (data2.data?.totalMeterCount || 0) + 
                       (data3.data?.totalMeterCount || 0) + (data4.data?.totalMeterCount || 0),
  
      totalInfraMeterCount: (data1.data?.totalInfraMeterCount || 0) + (data2.data?.totalInfraMeterCount || 0) + 
                            (data3.data?.totalInfraMeterCount || 0) + (data4.data?.totalInfraMeterCount || 0),
  
      totalInstallMeterCount: (data1.data?.totalInstallMeterCount || 0) + (data2.data?.totalInstallMeterCount || 0) + 
                              (data3.data?.totalInstallMeterCount || 0) + (data4.data?.totalInstallMeterCount || 0),
  
      totalInfra: (data1.data?.totalInfra || 0) + (data2.data?.totalInfra || 0) + 
                  (data3.data?.totalInfra || 0) + (data4.data?.totalInfra || 0),
  
      totalThreePhase: (data1.data?.totalThreePhase || 0) + (data2.data?.totalThreePhase || 0) + 
                       (data3.data?.totalThreePhase || 0) + (data4.data?.totalThreePhase || 0),
  
      totalSinglePhase: (data1.data?.totalSinglePhase || 0) + (data2.data?.totalSinglePhase || 0) + 
                        (data3.data?.totalSinglePhase || 0) + (data4.data?.totalSinglePhase || 0),
  
      totalAEW: (data1.data?.totalAEW || 0) + (data2.data?.totalAEW || 0) + 
                (data3.data?.totalAEW || 0) + (data4.data?.totalAEW || 0),
  
      totalGENUS: (data1.data?.totalGENUS || 0) + (data2.data?.totalGENUS || 0) + 
                  (data3.data?.totalGENUS || 0) + (data4.data?.totalGENUS || 0),
  
      totalCT: (data1.data?.totalCT || 0) + (data2.data?.totalCT || 0) + 
               (data3.data?.totalCT || 0) + (data4.data?.totalCT || 0),
  
      totalHPL: (data1.data?.totalHPL || 0) + (data2.data?.totalHPL || 0) + 
                (data3.data?.totalHPL || 0) + (data4.data?.totalHPL || 0),
  
      totalWOQ: (data1.data?.totalWOQ || 0) + (data2.data?.totalWOQ || 0) + 
                (data3.data?.totalWOQ || 0) + (data4.data?.totalWOQ || 0)
    };
  }
  


  openInNewTab(url: string, sourceComponent: string): void {
    const fullUrl = `${url}?source=${sourceComponent}`;
    window.open(fullUrl, '_blank');
  }
}
