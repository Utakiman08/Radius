import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import Highcharts from 'highcharts';
import { Subscription } from 'rxjs';
import { IntervalService } from '../interval.service';
import { DataService } from './data.service';
import { DailyComponent } from './consumption/daily/daily.component';
import { YearlyComponent } from './consumption/yearly/yearly.component';
import { DeviceComponent } from './device/device.component';
import { MAPComponent } from './map/map.component';
import { DgstatusComponent } from './dgstatus/dgstatus.component';
import { SeperateDataComponent } from './seperate-data/seperate-data.component';
import { TotalrechargeComponent } from './totalrecharge/totalrecharge.component';

@Component({
  selector: 'app-project-amr',
  standalone: true,
  imports: [DailyComponent,YearlyComponent,DeviceComponent,MAPComponent,DgstatusComponent,SeperateDataComponent,TotalrechargeComponent],
  templateUrl: './project-amr.component.html',
  styleUrl: './project-amr.component.scss'
})
export class ProjectAMRComponent implements OnInit,OnDestroy {
  public componentName: string = 'amr';
  private subscriptionMobile : Subscription | null = null
  private subscriptionMeter : Subscription | null = null
  private command!: Subscription
  private intervaltimer!:Subscription


  show: boolean = false;
  meterdata: {
    totalMeterCount?: number,
    totalInfraMeterCount?: number
    totalInstallMeterCount?: number
    totalInfra?: number
    totalThreePhase?: number
    totalSinglePhase?: number
    totalAEW?: number
    totalGENUS?: number
    totalCT?: number
    totalHPL?: number
    totalWOQ?: number
  } = {};
  hourData: string[] = [];
  hdfcData: number[] = [];
  currentHDFCValue: number = 0;
  interval:any
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private dataService: DataService,
    private timer: IntervalService
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.getmeter_Status();
      this.getApp_status(true);
      this.Reloaddata();
      this.triggerReload();
    }
    this.componentName = 'pvvnl';
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
  toggledropdown() {
    this.show = !this.show;
  }

  openInNewTab(url: string, sourceComponent: string): void {
    const fullUrl = `${url}?source=${sourceComponent}`;
    window.open(fullUrl, '_blank');
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
  currentDatetest: string = new Date().toISOString().split('T')[0];

  getApp_status(intialLoad:boolean) {
  this.subscriptionMobile =  this.dataService.getData_users(this.currentDatetest).subscribe(app => {
      this.appdata = app.data;

      if (!this.appdata || (this.appdata.data_android === undefined ||  this.appdata.data_android === '0')&&(this.appdata.data_ios === '0'|| this.appdata.data_ios === undefined)) {
        this.displayNullData();
      } else {
        if (intialLoad) {
          this.getChartOptions(); // Call getChartOptions() after data is fetched
        }
        else{
          this.updateChartData();
        }
      }
    });   
  }
  getChartOptions() {
    const Android = Number(this.appdata.data_android);
    const IOS = Number(this.appdata.data_ios);
  
    this.chartOptions = {
      chart: {
        type: 'pie',
        backgroundColor: 'rgba(0,0,0,0)',
        events: {
          render: () => {
            const chart = this.chart as Highcharts.Chart & { androidText?: Highcharts.SVGElement, iosText?: Highcharts.SVGElement };
            if (!chart) return;
  
            // Determine dynamic font size based on the chart's dimensions
            const dynamicFontSize = Math.max(12, Math.min(chart.plotWidth, chart.plotHeight) * 0.05); // Adjust multiplier as needed
  
            // Remove old text if any
            if (chart.androidText) chart.androidText.destroy();
            if (chart.iosText) chart.iosText.destroy();
  
            // Add Android text at the top center with dynamic font size
            chart.androidText = chart.renderer
              .text(
                `Android: ${Android}`,
                chart.plotLeft + chart.plotWidth / 2,
                chart.plotTop + chart.plotHeight / 2 - 20 // Position slightly above the center
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
                chart.plotTop + chart.plotHeight / 2 + 20 // Position slightly below the center
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
      credits: {
        enabled: false
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
    const Android = Number(this.appdata.data_android ?? 0) !== 0 
      ? Number(this.appdata.data_android) 
      : 0;
  
    const Apple = Number(this.appdata.data_ios ?? 0) !== 0 
      ? Number(this.appdata.data_ios) 
      : 0;
  
    return [
      { name: 'Android', y: Android },
      { name: 'IOS', y: Apple }
    ];
  }
  

  private updateChartData(): void {
    const Android = Number(this.appdata.data_android);
    const IOS = Number(this.appdata.data_ios);
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
          `Android: ${Android}`,
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
          `iOS: ${IOS}`,
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

  private displayNullData(): void {
    const chartContainer = document.querySelector('#app_Status') as HTMLElement;
    if (chartContainer) {
      chartContainer.innerHTML = '<div style="text-align:center; line-height: 231px; font-size: 30px; color: #ffffff;">No Data Found</div>';
    }
  }

  getmeter_Status() {
  this.subscriptionMeter =  this.dataService.getData_Meter_dashboard().subscribe(meter => {
      this.meterdata = meter.data;
    });
  }
}