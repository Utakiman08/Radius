import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import * as Highcharts from 'highcharts';


@Component({
  selector: 'app-meterdetail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './meterdetail.component.html',
  styleUrl: './meterdetail.component.scss'
})
export class MeterdetailComponent implements OnInit {
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object
  ){}
  MeterDetails: { 
    sensor_id?: string, 
    sensor_name?: string, 
    serial_no?: string, 
    dic_id?: string, 
    dic_port?: string, 
    grid_load_sanctioned?: string, 
    dg_load_sanctioned?: string, 
    last_reading_updated_dg?: string, 
    last_reading_updated_grid?: string, 
    dg_reading?: string, 
    grid_reading?: string, 
    overload_dg?: string, 
    overload_grid?: string, 
    dg_on?: string, 
    data_logger_id?: string, 
    R_Voltage?: string, 
    Y_Voltage?: string, 
    B_Voltage?: string, 
    R_Current?: string, 
    Y_Current?: string, 
    B_Current?: string, 
    grid_kWh?: string, 
    grid_kVAh?: string, 
    dg_kWh?: string, 
    dg_kVAh?: string, 
    grid_billing_type?: string, 
    dg_billing_type?: string, 
    instant_cum_KW?: string, 
    instant_cum_KVA?: string, 
    grid_over_load?: string, 
    dg_over_load?: string, 
    state?: string 
  } = {};

  // Expected keys for "none" and "0" values
  noneKeys: string[] = [
    'sensor_id', 'sensor_name', 'serial_no', 'dic_id', 'dic_port', 'last_reading_updated_dg',
    'last_reading_updated_grid', 'dg_reading', 'grid_reading', 'overload_dg', 'overload_grid', 
    'dg_on', 'data_logger_id', 'grid_billing_type', 'dg_billing_type', 'state'
  ];

  zeroKeys: string[] = [
    'grid_load_sanctioned', 'dg_load_sanctioned', 'R_Voltage', 'Y_Voltage', 'B_Voltage',
    'R_Current', 'Y_Current', 'B_Current', 'grid_kWh', 'grid_kVAh', 'dg_kWh', 'dg_kVAh',
    'instant_cum_KW', 'instant_cum_KVA', 'grid_over_load', 'dg_over_load'
  ];

  // Function to sanitize MeterDetails data
  sanitizeMeterDetails(data: any): any {
    const sanitizedData: any = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        sanitizedData[key] = (data[key] === null || data[key] === 'NA' || data[key] ==='') ? '---' : data[key];
      }
    }
    // Handle "none" keys
    this.noneKeys.forEach(key => {
      sanitizedData[key] = (!data.hasOwnProperty(key) || data[key] === null || data[key] === 'NA' || data[key] ==='') ? '---' : data[key];
    });

    // Handle "0" keys
    this.zeroKeys.forEach(key => {
      sanitizedData[key] = (!data.hasOwnProperty(key) || data[key] === null || data[key] === 'NA' || data[key] ==='') ? 0 : data[key];
    });

    return sanitizedData;
  }


  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Fetch the saved data from sessionStorage
      const consumerData = sessionStorage.getItem('consumerData');
      if (consumerData) {
        // Parse and sanitize the data
        const parsedData = JSON.parse(consumerData);
        this.MeterDetails = this.sanitizeMeterDetails(parsedData.data.sensor_data);
      }
    }

    // Call additional methods
    this.Voltage();
    this.Current();
  }




  Highcharts: typeof Highcharts = Highcharts;
  chartOptions: Highcharts.Options = {};

  Voltage(){
    this.chartOptions = {
      chart: {
        type: 'pie',
        backgroundColor: 'rgba(0,0,0,0)', // optional, based on your theme
        borderRadius: 5,
      },
      title: {
        text: '', // Keep it empty for now
      },
      credits: {
        enabled: false
    },
      series: [{
        type: 'pie',
        data: [
          {
            y: Number(this.MeterDetails.R_Voltage), 
            name: 'R',
            color: {
              linearGradient: { x1: 0, y1: 0, x2: 1, y2: 1 },
              stops: [
                [0, '#eb4034'],  // start color
                [1, '#ff6f61']   // end color
              ]
            }
          },
          {
            y: Number(this.MeterDetails.Y_Voltage),
            name: 'Y',
            color: {
              linearGradient: { x1: 0, y1: 0, x2: 1, y2: 1 },
              stops: [
                [0, '#cca01d'],  // start color
                [1, '#ffd966']   // end color
              ]
            }
          },
          {
            y: Number(this.MeterDetails.B_Voltage),
            name: 'B',
            color: {
              linearGradient: { x1: 0, y1: 0, x2: 1, y2: 1 },
              stops: [
                [0, '#1d69cc'],  // start color
                [1, '#6ea8dc']   // end color
              ]
            }
          }
        ]
      }],
      plotOptions: {
        pie: {
          allowPointSelect: true,
          cursor: 'pointer',
          dataLabels: {
            enabled: false,
            format: '<b>{point.name}</b>: {point.y}',  // Show value instead of percentage
            style: {
              fontSize: '16px',  // Change this to the desired font size
              fontWeight: 'bold',
              color: '#000'
            }
          }
        }
      }
    };
  
    const chartContainer = document.querySelector('#PiechartVoltage') as HTMLElement;
    this.Highcharts.chart(chartContainer, this.chartOptions);
  }
  

  Current(){
    this.chartOptions = {
      chart: {
        type: 'pie',
        backgroundColor: 'rgba(0,0,0,0)', // optional, based on your theme
        borderRadius: 5,
      },
      title: {
        text: '', // Keep it empty for now
      },
      credits: {
        enabled: false
    },
      series: [{
        type: 'pie',
        data: [
          {
            y: Number(this.MeterDetails.R_Current), 
            name: 'R',
            color: {
              linearGradient: { x1: 0, y1: 0, x2: 1, y2: 1 },
              stops: [
                [0, '#eb4034'],  // start color
                [1, '#ff6f61']   // end color
              ]
            }
          },
          {
            y: Number(this.MeterDetails.Y_Current),
            name: 'Y',
            color: {
              linearGradient: { x1: 0, y1: 0, x2: 1, y2: 1 },
              stops: [
                [0, '#cca01d'],  // start color
                [1, '#ffd966']   // end color
              ]
            }
          },
          {
            y: Number(this.MeterDetails.B_Current),
            name: 'B',
            color: {
              linearGradient: { x1: 0, y1: 0, x2: 1, y2: 1 },
              stops: [
                [0, '#1d69cc'],  // start color
                [1, '#6ea8dc']   // end color
              ]
            }
          }
        ]
      }],
      plotOptions: {
        pie: {
          allowPointSelect: true,
          cursor: 'pointer',
          dataLabels: {
            enabled: false,
            format: '<b>{point.name}</b>: {point.y}',  // Show value instead of percentage
            style: {
              fontSize: '16px',  // Change this to the desired font size
              fontWeight: 'bold',
              color: '#000'
            }
          }
        }
      }
    };
  
    const chartContainer = document.querySelector('#PiechartCurrent') as HTMLElement;
    this.Highcharts.chart(chartContainer, this.chartOptions);
  }
  

}
