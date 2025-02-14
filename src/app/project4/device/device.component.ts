import { ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Subscription } from 'rxjs';
import { DataService } from '../data.service';
import { IntervalService } from '../../interval.service';

@Component({
  selector: 'app-device3',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './device.component.html',
  styleUrls: ['./device.component.scss']
})
export class DeviceComponent implements OnInit, OnDestroy {
  data: {} = {};
  showBackButton: boolean = false;
  currentChart: any; // To hold reference to the current chart
  currentChartString: string = 'site';
  loading: boolean = false;
  private subscriptions: Subscription[] = [];
  private Highcharts: any;
  intervalid:any
  private command!: Subscription
  private timerCommand!:Subscription

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef,
    private dataService: DataService,
    private timer : IntervalService

  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadHighcharts().then(() => {
        this.fetchAllData(true);
        this.timerCommand = this.timer.interval$.subscribe((updateInterval)=>{
          if (this.intervalid) {
            clearInterval(this.intervalid)
          }
          this.intervalid = setInterval(() => {
            this.fetchAllData(false);
          }, updateInterval);          
        })
      });
    }
    this.getCommand();
  }
  getCommand(){
    this.command = this.timer.Update$.subscribe(()=>{
      this.fetchAllData(true);
    })
  }
  siteValues:any
  dataloggerValues:any
  sensorValues:any
  dicValues:any
  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
       clearInterval(this.intervalid)
       if (this.command) {
        this.command.unsubscribe();
      }    
      if (this.timerCommand) {
        this.timerCommand.unsubscribe();
      }    
      this.timerCommand.unsubscribe();
     
  }

  async loadHighcharts() {
    this.Highcharts = (await import('highcharts')).default;
  }
  fetchAllData(initial_load: boolean): void {
    if (initial_load) {
      this.loading = true; // Show the spinner
    }
    else{
      this.loading = false
    }
  
    // Fetch all data in one call
    this.subscriptions.push(
      this.dataService.getAllData().subscribe((response: any) => {
        const { site, datalogger, dic, sensor } = response;
  
        // Process site data
        this.siteValues = [
          parseInt(site.live_count, 10),
          parseInt(site.maintenance_count, 10),
          parseInt(site.closed_count, 10)
        ];
        sessionStorage.setItem('TorrentsiteData', JSON.stringify(this.siteValues));
        if (this.currentChartString === 'site') {
          if (initial_load) {
            this.site(this.siteValues);
          } else {
            this.updateChart(this.siteValues);
          }
        }
  
        // Process datalogger data
        this.dataloggerValues = [
          parseInt(datalogger.connected_dl, 10),
          parseInt(datalogger.maintanance_dl, 10),
          parseInt(datalogger.faulty_dl, 10),
          parseInt(datalogger.disconnected_dl, 10)
        ];
        sessionStorage.setItem('TorrentdataloggerData', JSON.stringify(this.dataloggerValues));
        if (this.currentChartString === 'datalogger') {
          if (initial_load) {
            this.dlogger(this.dataloggerValues);
          } else {
            this.updateChart(this.dataloggerValues);
          }
        }
  
        // Process sensor data
        this.sensorValues = [
          parseInt(sensor.sensor_healthy, 10),
          parseInt(sensor.sensor_unhealthy, 10),
          parseInt(sensor.sensor_zero_reading, 10),
          parseInt(sensor.infra_count, 10),
          parseInt(sensor.sensor_cut, 10),
          parseInt(sensor.sensor_overload, 10)
        ];
        sessionStorage.setItem('TorrentsensorData', JSON.stringify(this.sensorValues));
        if (this.currentChartString === 'sensor') {
          if (initial_load) {
            this.sensor(this.sensorValues);
          } else {
            this.updateChart(this.sensorValues);
          }
        }
  
        // Process dic data
        this.dicValues = [
          parseInt(dic.dic_healthy, 10),
          parseInt(dic.dic_unhealthy, 10),
          parseInt(dic.dic_maintenance, 10),
          parseInt(dic.dic_faulty, 10)
        ];
        sessionStorage.setItem('TorrentdicData', JSON.stringify(this.dicValues));
        if (this.currentChartString === 'dic') {
          if (initial_load) {
            this.DIC(this.dicValues);
          } else {
            this.updateChart(this.dicValues);
          }
        }
  
        // Stop the loading spinner
        this.loading = false;
      })
    );
  }
 

  updateChart(newData: number[]): void {
    if (this.currentChart && this.currentChart.series[0]) {
      this.currentChart.series[0].setData(newData, true); // Update chart data
    }
    this.loading = false;
  }
  openInNewTab(url: string, sourceComponent: string): void {
    const fullUrl = `${url}?source=${sourceComponent}`;
    window.open(fullUrl, '_blank');
  }
  createPieChart(data: any, labels: string[], colors: string[], containerId: string, chartName: string) {
    const chartOptions: any = {
      chart: {
        renderTo: containerId,
        type: 'pie',
        backgroundColor: 'rgba(0,0,0,0)',
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
        formatter: function (this: any) {
          let yValue = this.y != null ? this.y.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '') : '';
          return `${this.point.name}: <b>${yValue}</b>`;
        }
      },
      legend: {
        enabled: false
      },
      plotOptions: {
        pie: {
          borderWidth: 0,
          allowPointSelect: true,
          cursor: 'pointer',
          dataLabels: {
            enabled: false,
            distance: 20,
            format: '{point.name}'
          },
          showInLegend: true
        }
      },
      series: [{
        type: 'pie',
        name: chartName,
        colorByPoint: true,
        data: data.map((value: number, index: number) => ({
          name: labels[index],
          y: value,
          color: {
            linearGradient: { x1: 0, y1: 0, x2: 1, y2: 1 },
            stops: [
              [0, colors[index]],
              [1, this.Highcharts.color(colors[index]).brighten(-0.3).get('rgb')]
            ]
          }
        }))
      }]
    };

    if (this.currentChart) {
      this.currentChart.destroy();
    }

    this.currentChart = new this.Highcharts.Chart(chartOptions);
    this.currentChartString = chartName;
    this.loading = false;
    this.cdr.detectChanges();
  }

  site(data: any) {
    const labels = ['Live', 'Maintenance', 'Operation Closed'];
    const colors = ['rgb(0, 255, 213)', 'rgb(38, 118, 184)', 'rgb(7, 141, 172)'];
    this.createPieChart(data, labels, colors, 'device_status', 'site');
    this.loading = false; // Hide the spinner after all data is fetched
  }

  dlogger(data: any) {
    const labels = ['Connected', 'Maintenance', 'Faulty','Disconnected'];
    const colors = ['rgb(0, 255, 213)', 'rgb(38, 118, 184)', 'rgb(7, 141, 172)','rgb(100, 100, 100)'];
    this.createPieChart(data, labels, colors, 'device_status', 'datalogger');
    this.loading = false; // Hide the spinner after all data is fetched

  }


  DIC(data: any) {
    const labels = ['Healthy', 'Unhealthy', 'Maintenance', 'Faulty'];
    const colors = ['rgb(0, 255, 213)', 'rgb(38, 118, 184)', 'rgb(100, 100, 100)', 'rgb(7, 141, 172)'];
    this.createPieChart(data, labels, colors, 'device_status', 'dic');
    this.loading = false; // Hide the spinner after all data is fetched
  }

  sensor(data: any) {
    const labels = ['Healthy', 'Unhealthy', 'Zero Reading', 'Infra Count', 'Cut Off', 'OverLoad'];
    const colors = ['rgb(0, 255, 213)', 'rgb(38, 118, 184)', 'rgb(100, 100, 100)', 'rgb(7, 141, 172)', 'rgb(0, 255, 255)', 'rgb(0, 204, 255)'];
    this.createPieChart(data, labels, colors, 'device_status', 'sensor');
    this.loading = false; // Hide the spinner after all data is fetched
  }

  handleButtonClick(chartType: string) {
    this.cdr.detectChanges(); // Force Angular to detect changes immediately

    const data = JSON.parse(sessionStorage.getItem('Torrent'+chartType + 'Data')!);

    switch (chartType) {
      case 'datalogger':
        this.dlogger(data);
        break;
      case 'dic':
        this.DIC(data);
        break;
      case 'sensor':
        this.sensor(data);
        break;
      default:
        this.site(data);
        break;
    }
  }
}