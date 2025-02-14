import { ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Subscription, catchError, forkJoin, of} from 'rxjs';
import { DataService as DataServiceNPCL } from '../../project2/data.service';
import { DataService as DataServicePVVNL } from '../../project3/data.service';
import { DataService as DataServiceTorrent } from '../../project4/data.service';
import { DataService as DataServiceAMR} from '../../project-amr/data.service';

import { IntervalService } from '../../interval.service';

@Component({
  selector: 'app-device',
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
  private command!: Subscription
  private timerCommand!:Subscription
  private intervalid:any
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef,
    private dataServiceNPCL: DataServiceNPCL,
    private dataServicePVVNL: DataServicePVVNL,
    private dataServiceTorrent: DataServiceTorrent,
    private dataServiceAMR: DataServiceAMR,

    private timer : IntervalService
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadHighcharts().then(() => {
        this.fetchAllData();
        this.timerCommand = this.timer.interval$.subscribe((updateInterval)=>{
          if (this.intervalid) {
            clearInterval(this.intervalid)
          }
          this.intervalid = setInterval(() => {
            this.fetchAllData();
          }, updateInterval);          
        })

      });
      this.getCommand();
    }
  }
  
  getCommand(){
    this.command = this.timer.Update$.subscribe(()=>{
      this.fetchAllData();
    })
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
    if (this.command) {
      this.command.unsubscribe();
    }
    if (this.timerCommand) {
      this.timerCommand.unsubscribe();
    }    
    clearInterval(this.intervalid)
  }

  async loadHighcharts() {
    this.Highcharts = (await import('highcharts')).default;
  }
 
  
  fetchAllData(): void {
    this.loading = true; // Show the spinner
  
    // Single API call for each data provider using getAllData
    const npclData = this.dataServiceNPCL.getAllData().pipe(
      catchError(() => of({ rc: -1, site: {}, datalogger: {}, sensor: {}, dic: {} }))
    );
    const pvvnlData = this.dataServicePVVNL.getAllData().pipe(
      catchError(() => of({ rc: -1, site: {}, datalogger: {}, sensor: {}, dic: {} }))
    );
    const torrentData = this.dataServiceTorrent.getAllData().pipe(
      catchError(() => of({ rc: -1, site: {}, datalogger: {}, sensor: {}, dic: {} }))
    );
    const AMRData = this.dataServiceAMR.getAllData().pipe(
      catchError(() => of({ rc: -1, site: {}, datalogger: {}, sensor: {}, dic: {} }))
    );
    

  
    // Combine all the data from NPCL, PVVNL, Torrent and AMR
    this.subscriptions.push(
      forkJoin({
        npcl: npclData,
        pvvnl: pvvnlData,
        torrent: torrentData,
        AMR: AMRData,

      }).subscribe(response => {
        // Ensure response is defined and has valid data
        const validResponses = {
          npcl: response.npcl && response.npcl?.rc !== -1 ? response.npcl : null,
          pvvnl: response.pvvnl && response.pvvnl?.rc !== -1 ? response.pvvnl : null,
          torrent: response.torrent && response.torrent?.rc !== -1 ? response.torrent : null,
          AMR: response.AMR && response.AMR?.rc !== -1 ? response.AMR : null
        };
      
        // Remove null values
        // const { npcl, pvvnl, torrent, AMR } = validResponses;
      // console.log(validResponses.pvvnl?.site.live_count||0)
      // console.log(validResponses.torrent?.site.live_count||0)
      // console.log(validResponses.AMR?.site.live_count||0)
              // Aggregating Site data from all 3 sources
        const siteValues = [
          parseInt(validResponses.npcl?.site.live_count || 0, 10) + parseInt(validResponses.pvvnl?.site.live_count || 0, 10) + parseInt(validResponses.torrent?.site.live_count || 0, 10) +parseInt(validResponses.AMR?.site.live_count || 0, 10),
          parseInt(validResponses.npcl?.site.maintenance_count || 0, 10) + parseInt(validResponses.pvvnl?.site.maintenance_count || 0, 10) + parseInt(validResponses.torrent?.site.maintenance_count || 0, 10)+ parseInt(validResponses.AMR?.site.maintenance_count || 0, 10),
          parseInt(validResponses.npcl?.site.closed_count || 0, 10) + parseInt(validResponses.pvvnl?.site.closed_count || 0, 10) + parseInt(validResponses.torrent?.site.closed_count || 0, 10) + parseInt(validResponses.AMR?.site.closed_count || 0, 10)
        ];
        console.log(siteValues)
        sessionStorage.setItem('AllsiteData', JSON.stringify(siteValues));
        if (this.currentChartString === 'site') this.site(siteValues);
  
        // Aggregating Datalogger data from all 3 sources
        const dataloggerValues = [
          parseInt(validResponses.npcl?.datalogger.connected_dl || 0, 10) + parseInt(validResponses.pvvnl?.datalogger.connected_dl || 0, 10) + parseInt(validResponses.torrent?.datalogger.connected_dl || 0, 10)+ parseInt(validResponses.AMR?.datalogger.connected_dl || 0, 10),
          parseInt(validResponses.npcl?.datalogger.maintenance_dl || 0, 10) + parseInt(validResponses.pvvnl?.datalogger.maintenance_dl || 0, 10) + parseInt(validResponses.torrent?.datalogger.maintenance_dl || 0, 10)+ parseInt(validResponses.AMR?.datalogger.maintenance_dl || 0, 10),
          parseInt(validResponses.npcl?.datalogger.faulty_dl || 0, 10) + parseInt(validResponses.pvvnl?.datalogger.faulty_dl || 0, 10) + parseInt(validResponses.torrent?.datalogger.faulty_dl || 0, 10)+ parseInt(validResponses.AMR?.datalogger.faulty_dl || 0, 10),
          parseInt(validResponses.npcl?.datalogger.disconnected_dl || 0, 10) + parseInt(validResponses.pvvnl?.datalogger.disconnected_dl || 0, 10) + parseInt(validResponses.torrent?.datalogger.disconnected_dl || 0, 10)+ parseInt(validResponses.AMR?.datalogger.disconnected_dl || 0, 10)

        ];
        sessionStorage.setItem('AlldataloggerData', JSON.stringify(dataloggerValues));
  
        // Aggregating Sensor data from all 3 sources
        const sensorValues = [
          parseInt(validResponses.npcl?.sensor.sensor_healthy || 0, 10) + parseInt(validResponses.pvvnl?.sensor.sensor_healthy || 0, 10) + parseInt(validResponses.torrent?.sensor.sensor_healthy || 0, 10)+parseInt(validResponses.AMR?.sensor.sensor_healthy || 0, 10),
          parseInt(validResponses.npcl?.sensor.sensor_unhealthy || 0, 10) + parseInt(validResponses.pvvnl?.sensor.sensor_unhealthy || 0, 10) + parseInt(validResponses.torrent?.sensor.sensor_unhealthy || 0, 10)+parseInt(validResponses.AMR?.sensor.sensor_unhealthy || 0, 10),
          parseInt(validResponses.npcl?.sensor.sensor_zero_reading || 0, 10) + parseInt(validResponses.pvvnl?.sensor.sensor_zero_reading || 0, 10) + parseInt(validResponses.torrent?.sensor.sensor_zero_reading || 0, 10)+parseInt(validResponses.AMR?.sensor.sensor_zero_reading || 0, 10),
          parseInt(validResponses.npcl?.sensor.infra_count || 0, 10) + parseInt(validResponses.pvvnl?.sensor.infra_count || 0, 10) + parseInt(validResponses.torrent?.sensor.infra_count || 0, 10)+parseInt(validResponses.AMR?.sensor.infra_count || 0, 10),
          parseInt(validResponses.npcl?.sensor.sensor_cut || 0, 10) + parseInt(validResponses.pvvnl?.sensor.sensor_cut || 0, 10) + parseInt(validResponses.torrent?.sensor.sensor_cut || 0, 10)+parseInt(validResponses.AMR?.sensor.sensor_cut || 0, 10),
          parseInt(validResponses.npcl?.sensor.sensor_overload || 0, 10) + parseInt(validResponses.pvvnl?.sensor.sensor_overload || 0, 10) + parseInt(validResponses.torrent?.sensor.sensor_overload || 0, 10)+parseInt(validResponses.AMR?.sensor.sensor_overload || 0, 10)
        ];
        sessionStorage.setItem('AllsensorData', JSON.stringify(sensorValues));
  
        // Aggregating DIC data from all 3 sources
       // Aggregating DIC data from all 3 sources        
        const dicValues = [
          parseInt(validResponses.npcl?.dic.dic_healthy || 0, 10) + parseInt(validResponses.pvvnl?.dic.dic_healthy || 0, 10) + parseInt(validResponses.torrent?.dic.dic_healthy || 0, 10) + parseInt(validResponses.AMR?.dic.dic_healthy || 0, 10),
          parseInt(validResponses.npcl?.dic.dic_unhealthy || 0, 10) + parseInt(validResponses.pvvnl?.dic.dic_unhealthy || 0, 10) + parseInt(validResponses.torrent?.dic.dic_unhealthy || 0, 10) + parseInt(validResponses.AMR?.dic.dic_unhealthy || 0, 10),
          parseInt(validResponses.npcl?.dic.dic_maintenance || 0, 10) + parseInt(validResponses.pvvnl?.dic.dic_maintenance || 0, 10) + parseInt(validResponses.torrent?.dic.dic_maintenance || 0, 10) + parseInt(validResponses.AMR?.dic.dic_maintenance || 0, 10),
          parseInt(validResponses.npcl?.dic.dic_faulty || 0, 10) + parseInt(validResponses.pvvnl?.dic.dic_faulty || 0, 10) + parseInt(validResponses.torrent?.dic.dic_faulty || 0, 10) + parseInt(validResponses.AMR?.dic.dic_faulty || 0, 10)
        ];
        sessionStorage.setItem('AlldicData', JSON.stringify(dicValues));
        // Update the chart depending on the current selection
        this.loading = false; // Hide the spinner after the data is processed
      })
    );
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
    const labels = ['Healthy', 'unhealthy || 0', 'Maintenance', 'Faulty'];
    const colors = ['rgb(0, 255, 213)', 'rgb(38, 118, 184)', 'rgb(100, 100, 100)', 'rgb(7, 141, 172)'];
    this.createPieChart(data, labels, colors, 'device_status', 'dic');
    this.loading = false; // Hide the spinner after all data is fetched
  }

  sensor(data: any) {
    const labels = ['Healthy', 'unhealthy || 0', 'Zero Reading', 'Infra Count', 'Cut Off', 'OverLoad'];
    const colors = ['rgb(0, 255, 213)', 'rgb(38, 118, 184)', 'rgb(100, 100, 100)', 'rgb(7, 141, 172)', 'rgb(0, 255, 255)', 'rgb(0, 204, 255)'];
    this.createPieChart(data, labels, colors, 'device_status', 'sensor');
    this.loading = false; // Hide the spinner after all data is fetched
  }

  handleButtonClick(chartType: string) {
    this.cdr.detectChanges(); // Force Angular to detect changes immediately

    const data = JSON.parse(sessionStorage.getItem('All'+chartType+'Data')!);
    //console.log(data)
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
