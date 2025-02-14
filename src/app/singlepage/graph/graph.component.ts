import { ChangeDetectorRef, Component, Inject, PLATFORM_ID } from '@angular/core';
import * as Highcharts from 'highcharts';
import { DataserviceService } from '../dataservice.service';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-graph',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './graph.component.html',
  styleUrl: './graph.component.scss'
})
export class GraphComponent {
  location_grid: {
    location_id?:string ,
    site_id?:string ,
    location_no?:string ,
    location_type?:string ,
    consumer_name?:string ,
    tower_name?:string ,
    grid_load?:string ,
    grid_load_unit?:string ,
    total_recharged_amount?:string ,
    balance_amt?:string ,
    last_recharge_time?:string ,
    last_coupon_no?:string ,
    last_coupon_amount?:string ,
    possession_date?:string ,
    alert_daily_consumption_grid?:string ,
    meter_id?:string ,
    active_cut_off?:string ,
    active_cut_off_grid?:string ,
    ivrs_language?:string ,
    notification_email?:string ,
    notification_sms?:string ,
    unit_grid_closing?:string ,
    email_id?:string ,
    mobile_no?:string ,
    low_bal_alert?:string ,
    sms_alert_send?:string ,
    energy_source?:string ,
    last_reading_time?:string ,
    grid_amt?:string ,
    notification_app_load?:string ,
    last_process_time_mmc?:string ,
    last_process_time_fixed?:string ,
    last_process_time_CAM?:string ,
    last_process_time_other?:string ,
    last_process_time_CS?:string ,
    cut_balance?:string ,
    recharged_grid_amt?:string ,
    bp_no?:string ,
    move_in_date?:string ,
    rate_category?:string ,
    current_emi?:string ,
    total_emi?:string ,
    emi_gst?:string ,
    last_process_emi_time?:string 
}={};
location_dg: {
  location_id?:string ,
  site_id?:string ,
  location_no?:string ,
  location_type?:string ,
  consumer_name?:string ,
  tower_name?:string ,
  dg_load?:string ,
  dg_load_unit?:string ,
  total_recharged_amount?:string ,
  balance_amt?:string ,
  last_recharge_time?:string ,
  last_coupon_no?:string ,
  last_coupon_amount?:string ,
  possession_date?:string ,
  alert_daily_consumption_grid?:string ,
  meter_id?:string ,
  active_cut_off?:string ,
  active_cut_off_grid?:string ,
  ivrs_language?:string ,
  notification_email?:string ,
  notification_sms?:string ,
  unit_grid_closing?:string ,
  email_id?:string ,
  mobile_no?:string ,
  low_bal_alert?:string ,
  sms_alert_send?:string ,
  energy_source?:string ,
  last_reading_time?:string ,
  dg_amt?:string ,
  notification_app_load?:string ,
  last_process_time_mmc?:string ,
  last_process_time_fixed?:string ,
  last_process_time_CAM?:string ,
  last_process_time_other?:string ,
  last_process_time_CS?:string ,
  cut_balance?:string ,
  recharged_grid_amt?:string ,
  bp_no?:string ,
  move_in_date?:string ,
  rate_category?:string ,
  current_emi?:string ,
  total_emi?:string ,
  emi_gst?:string ,
  last_process_emi_time?:string 
}={};
    MeterDatails:{
      grid_load_sanctioned?: string, 
      dg_load_sanctioned?: string, 
    } = {}
  Highcharts: typeof Highcharts = Highcharts;
  chartOptions: Highcharts.Options = {};
  locationid:any

  constructor(private dataService : DataserviceService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ){}
  gridDates :  any[] =[];
  gridAmounts :  any[] =[];
  dgAmounts : any[] =[];
  gridunits :  any[] =[];
  dgunits : any[] =[];
  
  siteID:any
  month = ((new Date().getMonth() + 1) > 9 ? (new Date().getMonth() + 1).toString() : '0' + (new Date().getMonth() + 1).toString());
  year = ((new Date().getFullYear() ) > 9 ? (new Date().getFullYear() ).toString() : '0' + (new Date().getFullYear() ).toString());
    today = new Date().toISOString().split('T')[0];
sourceComponent:any

  ngOnInit(): void {
    
    // this.loadConsumptiondataMonthly();
    if (isPlatformBrowser(this.platformId)) {
      // Fetch the saved data from sessionStorage
      const consumerData = sessionStorage.getItem('consumerData');
      this.sourceComponent = sessionStorage.getItem('sourceComponent')
      if (consumerData) {
        // Parse and assign the data to site_data
        const parsedData = JSON.parse(consumerData);
        this.location_grid = parsedData.data.location_grid
        this.location_dg = parsedData.data.location_dg  
        this.siteID = parsedData.data.location_grid.site_id;
        this.locationid = parsedData.data.location_grid.location_id;
        this.MeterDatails = parsedData.data.sensor_data
        this.piechart();
      }
    }
    this.getRecharge();
    if (this.sourceComponent !=='amr') {
      this.loadsurvey();
      const element = document.getElementById('LoadSanctionedchart') 
      if (element) {
        // element.style.minHeight = '300px'
      }
    }
this.loadConsumptiondataDaily();
this.loadConsumptiondataMonthly();
    //console.log(this.month)
  }
  rechargeData: {
    amount?: string,
    recharge_time?: string,
    mode?: string,
    r_message?:string
  }[] = [];
  
  recentRechargeData: {
    amount?: string,
    recharge_time?: string,
    mode?: string,
    r_message?:string
  }[] = [];
  
  getRecharge() {
    this.dataService.getRecharge(this.locationid).subscribe(data => {
      // Assuming the recharge data is available in `data.resource`
      this.rechargeData = data.resource;
  
      // Sort by recharge_time (descending order to get the latest ones first)
      this.rechargeData.sort((a, b) => {
        // Provide fallback to handle undefined dates
        const dateA = a.recharge_time ? new Date(a.recharge_time).getTime() : 0;
        const dateB = b.recharge_time ? new Date(b.recharge_time).getTime() : 0;
        return dateB - dateA;
      });
      
  
      // Slice the first 5 entries
      this.recentRechargeData = this.rechargeData.slice(0, 15);
  
      // If there are less than 5 records, fill the remaining with placeholders
      while (this.recentRechargeData.length < 15) {
        this.recentRechargeData.push({ amount: '---', recharge_time: '---', mode: '---' });
      }
    });
  }
  

  categories:any
  gridUnitSeries:any
  dgUnitSeries:any
  gridAmtSeries:any
  dgAmtSeries:any
  startDate:string = this.today
  endDate:string=this.today
  

  loadsurvey() {
    // Initialize data arrays
    const tooltipData: any[] = [];  // Tooltip data common for both grid and dg
    const tooltipDataDG: any[] = [];  // Tooltip data common for both grid and dg

    const gridSeriesData: any[] = [];  // Data for the grid series
    const dgSeriesData: any[] = [];  // Data for the dg series
  
    // Create observables for GRID and DG data requests
    const gridObservable = this.dataService.getLoad_Survey(this.startDate, this.locationid, this.endDate, 'GRID');
    const dgObservable = this.dataService.getLoad_Survey(this.startDate, this.locationid, this.endDate, 'DG');
  
    // Use forkJoin to wait for both observables to complete
    forkJoin([gridObservable, dgObservable]).subscribe(([gridResponse, dgResponse]) => {
      // Process GRID data
      const gridData = gridResponse.DATA;
      gridData.forEach((entry: any) => {
        gridSeriesData.push(Number(entry.instant_cum_Kw));  // Add grid kWh data to the series
        tooltipData.push({
          creation_time: entry.creation_time,
          R_voltage: entry.R_voltage,
          B_voltage: entry.B_voltage,
          Y_voltage: entry.Y_volatge,
          r_current: entry.r_current,
          b_current: entry.b_current,
          y_current: entry.y_current,
          instant_cum_Kw: entry.instant_cum_Kw,
          frequency: entry.frequency,
          grid_reading_kwh: entry.grid_reading_kwh
        });
      });
  
      // Process DG data
      const dgData = dgResponse.DATA;
      dgData.forEach((entry: any) => {
        dgSeriesData.push(Number(entry.instant_cum_Kw));  // Add dg kWh data to the series
        tooltipDataDG.push({
          creation_time: entry.creation_time,
          R_voltage: entry.R_voltage,
          B_voltage: entry.B_voltage,
          Y_voltage: entry.Y_volatge,
          r_current: entry.r_current,
          b_current: entry.b_current,
          y_current: entry.y_current,
          instant_cum_Kw: entry.instant_cum_Kw,
          frequency: entry.frequency,
          dg_reading_kwh: entry.dg_reading_kwh
        });
      });
      //console.log(tooltipData)
      // Call renderChart once both GRID and DG data are processed
      this.renderChart(gridSeriesData, dgSeriesData, tooltipData,tooltipDataDG);
    });
  }
  
  

  loadConsumptiondataDaily(){
    this.dataService.getConsumption('daily',this.locationid,this.siteID,this.month,this.year).subscribe(data=>{
            this.gridDates = data.resource.grid.date;
      this.gridAmounts = data.resource.grid.grid_amt;
            this.gridunits = data.resource.grid.grid_unit;
      this.dgAmounts = data.resource.dg.dg_amt;
            this.dgunits = data.resource.dg.dg_unit;
            this.consumptionDaily();
            this.consumptionDaily2();

      //console.log(data)
    })
  }
  loadConsumptiondataMonthly(){
    this.dataService.getConsumption('monthly',this.locationid,this.siteID,'',this.year).subscribe(data=>{
  this.categories = data.resource.grid.map((item:any) => item.month);
  this.gridUnitSeries = data.resource.grid.map((item:any) => parseFloat(item.grid_unit));
  this.dgUnitSeries = data.resource.dg.map((item:any) => parseFloat(item.dg_unit));
  this.gridAmtSeries = data.resource.grid.map((item:any) => item.grid_amt);
  this.dgAmtSeries = data.resource.dg.map((item:any) => item.dg_amt);
  this.consumptionMonthly1();
  this.consumptionMonthly2();
    })


  }
  piechart() {
    this.chartOptions = {
      chart: {
        type: 'pie',
        backgroundColor: 'rgba(0,0,0,0)', // Optional, based on your theme
        borderRadius: 5,
        spacingTop: 0, // Eliminate any extra spacing at the top
        spacingBottom: 0, // Remove any extra spacing at the bottom
        marginTop: 0,
      },
      title: {
        text: '', // Optional title text
      },
      credits: {
        enabled: false
    },
      series: [{
        type: 'pie',
        innerSize: '50%',  // Creates the donut effect
        size: '150%',  // Increase size to fill more space
        data: [
          { 
            y: Number(this.location_grid.grid_load), 
            name: 'Grid',  
            color: {
              linearGradient: { x1: 0, y1: 0, x2: 1, y2: 0 }, // Horizontal gradient
              stops: [
                [0, '#11f2e7'], // Start color (green)
                [1, '#0aa199']  // End color (darker green)
              ]
            }
          },  
          { 
            y: Number(this.location_dg.dg_load), 
            name: 'DG',  
            color: {
              linearGradient: { x1: 0, y1: 0, x2: 1, y2: 0 }, // Horizontal gradient
              stops: [
                [0, '#098a8f'], // Start color (red)
                [1, '#064c4f']  // End color (darker red)
              ]
            }
          },  
        ],
        dataLabels: {
          enabled: false
        }
      }],
      plotOptions: {
        pie: {
          allowPointSelect: true,
          cursor: 'pointer',
          startAngle: -90,  // Widen the donut arc to fill more vertical space
          endAngle: 90,     // Expand the angle for a larger half-donut
          center: ['50%', '75%'],  // Position the center of the chart (optional)
          dataLabels: {
            enabled: true,
            format: '<b>{point.name}</b>: {point.y}',  // Show value instead of percentage
            style: {
              fontSize: '16px',  // Change this to the desired font size
              fontWeight: 'bold', // You can also adjust other styles like weight
              color: '#000'       // Optional: Change color as needed
            }
          }
        }
      }
    };
  
    const chartContainer = document.querySelector('#LoadSanctionedchart') as HTMLElement;
    this.Highcharts.chart(chartContainer, this.chartOptions);
  }
  

  consumptionDaily() {
    this.chartOptions = {
      chart: {
        backgroundColor: '#17f6f12b',
        borderRadius: 5,
      },
      title: { text: '' },
      credits: {
        enabled: false
    },
      xAxis: {
        categories: this.gridDates.map(date => date.toString()),
        title: { text: '' },
        labels: {
          style: {
            color: '#FFFFFF'  // Set x-axis label color to white
          }
        }
      },
      yAxis: {
        title: { text: '' },
        labels: {
          style: {
            color: '#FFFFFF'  // Set y-axis label color to white
          }
        }
      },
      series: [
        {
          name: 'Grid',
          data: this.gridAmounts,
          type: 'line',
          color: 'rgb(0, 255, 213)'
        },
        {
          name: 'DG',
          data: this.dgAmounts,
          type: 'line',
          color: 'rgb(255, 0 ,0)'
        }
      ],
      legend: {
        layout: 'vertical',
        align: 'right',
        verticalAlign: 'middle',
        floating: false,
        itemMarginBottom: 10,
        enabled: true,
        itemStyle: {
          color: '#FFFFFF' // Set legend text color to white
        }
      },      tooltip: {
        formatter: function () {
          return `<b>${this.series.name}</b><br/>Date: ${this.x}<br/>Amount: ${this.y}`;
        },

        borderWidth: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        shadow: false
      }
    };
    const chartContainer = document.querySelector('#consumptiondailyamt') as HTMLElement;
    this.Highcharts.chart(chartContainer, this.chartOptions);
  }
  
  
  consumptionDaily2() {
    this.chartOptions = {
      chart: {
        backgroundColor: '#17f6f12b',
        borderRadius: 5,
      },
      title: { text: '' },
      credits: {
        enabled: false
    },
      xAxis: {
        categories: this.gridDates.map(date => date.toString()),
        title: { text: '' },
        labels: {
          style: {
            color: '#FFFFFF'  // Set x-axis label color to white
          }
        }
      },
      yAxis: {
        title: { text: '' },
        labels: {
          style: {
            color: '#FFFFFF'  // Set y-axis label color to white
          }
        }
      },
      series: [
        {
          name: 'Grid',
          data: this.gridunits,
          type: 'line',
          color: 'rgb(0, 255, 213)'
        },
        {
          name: 'DG',
          data: this.dgunits,
          type: 'line',
          color: 'rgb(255, 0 ,0)'
        }
      ],
      legend: {
        layout: 'vertical',
        align: 'right',
        verticalAlign: 'middle',
        floating: false,
        itemMarginBottom: 10,
        enabled: true,
        itemStyle: {
          color: '#FFFFFF' // Set legend text color to white
        }
      },      tooltip: {
        formatter: function () {
          return `<b>${this.series.name}</b><br/>Date: ${this.x}<br/>Grid Unit: ${this.y}`;
        },

        borderWidth: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        shadow: false
      }
    };
    const chartContainer = document.querySelector('#consumptiondailyunit') as HTMLElement;
    this.Highcharts.chart(chartContainer, this.chartOptions);
  }
  
  
  consumptionMonthly1() {
    this.chartOptions = {
      chart: {
        backgroundColor: '#17f6f12b',
        borderRadius: 5,
      },
      title: { text: '' },
      credits: {
        enabled: false
    },
      xAxis: {
        categories: this.categories,
        title: { text: '' },
        labels: {
          style: {
            color: '#FFFFFF'  // Set x-axis label color to white
          }
        }
      },
      yAxis: {
        title: { text: '' },
        labels: {
          style: {
            color: '#FFFFFF'  // Set y-axis label color to white
          }
        }
      },
      series: [
        {
          name: 'Grid',
          data: this.gridAmtSeries,
          type: 'line',
          color: 'rgb(0, 255, 213)'
        },
        {
          name: 'DG',
          data: this.dgAmtSeries,
          type: 'line',
          color: 'rgb(255, 0 ,0)'
        }
      ],
      legend: {
        layout: 'vertical',
        align: 'right',
        verticalAlign: 'middle',
        floating: false,
        itemMarginBottom: 10,
        enabled: true,
        itemStyle: {
          color: '#FFFFFF' // Set legend text color to white
        }
      },      tooltip: {
        formatter: function () {
          return `<b>${this.series.name}</b><br/>Date: ${this.x}<br/>Amount: ${this.y}`;
        },

        borderWidth: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        shadow: false
      }
    };
    const chartContainer = document.querySelector('#consumptionmonthlyamt') as HTMLElement;
    this.Highcharts.chart(chartContainer, this.chartOptions);
  }

  renderChart(gridSeriesData: any[], dgSeriesData: any[], tooltipInfoGrid: any[], tooltipInfoDG: any[]) {
    // Reverse the data arrays to plot from last to first
    const reversedTooltipInfoGrid = [...tooltipInfoGrid].reverse();
    const reversedTooltipInfoDG = [...tooltipInfoDG].reverse();

    // Map each data point to include x value (creation_time as timestamp)
    const formattedGridData = reversedTooltipInfoGrid.map((info, i) => ({
        x: new Date(info.creation_time).getTime(),
        y: gridSeriesData[gridSeriesData.length - 1 - i] // reversed index
    }));
    
    const formattedDGData = reversedTooltipInfoDG.map((info, i) => ({
        x: new Date(info.creation_time).getTime(),
        y: dgSeriesData[dgSeriesData.length - 1 - i] // reversed index
    }));

    this.chartOptions = {
      chart: {
        type: 'line',
        zooming: {
          type: "x",
          singleTouch: true
        },
        backgroundColor: 'rgba(0,0,0,0)',
      },
      title: {
        text: '',
      },
      xAxis: {
        type: 'datetime', // Use datetime type for x-axis
        title: {
          text: 'Creation Time',
          style:{
          color:'#ffffff'
          
          }
        },
        labels: {
          style: {
            color: '#FFFFFF'
          }
        }
      },
      yAxis: {
        title: {
          text: ''
        },
        labels: {
          style: {
            color: '#FFFFFF'
          }
        }
      },
      series: [
        {
          type: 'line',
          name: 'Grid kWh',
          data: formattedGridData,
          color: 'rgb(0, 255, 213)',
          tooltip: {
            pointFormatter: function () {
              const index = this.index;
              const tooltipInfo = reversedTooltipInfoGrid[index];
              return `<b>Grid kWh:</b> ${this.y} kW<br>
                      <b>R Voltage:</b> ${tooltipInfo.R_voltage} V<br>
                      <b>B Voltage:</b> ${tooltipInfo.B_voltage} V<br>
                      <b>Y Voltage:</b> ${tooltipInfo.Y_voltage} V<br>
                      <b>R Current:</b> ${tooltipInfo.r_current} A<br>
                      <b>B Current:</b> ${tooltipInfo.b_current} A<br>
                      <b>Y Current:</b> ${tooltipInfo.y_current} A<br>
                      <b>Frequency:</b> ${tooltipInfo.frequency} Hz<br>
                      <b>Creation Time:</b> ${tooltipInfo.creation_time}<br>`;
            }
          }
        },
        {
          type: 'line',
          name: 'DG kWh',
          data: formattedDGData,
          color: 'rgb(255, 0 ,0)',
          tooltip: {
            pointFormatter: function () {
              const index = this.index;
              const tooltipInfo = reversedTooltipInfoDG[index];
              return `<b>DG kWh:</b> ${this.y} kW<br>
                      <b>R Voltage:</b> ${tooltipInfo.R_voltage} V<br>
                      <b>B Voltage:</b> ${tooltipInfo.B_voltage} V<br>
                      <b>Y Voltage:</b> ${tooltipInfo.Y_voltage} V<br>
                      <b>R Current:</b> ${tooltipInfo.r_current} A<br>
                      <b>B Current:</b> ${tooltipInfo.b_current} A<br>
                      <b>Y Current:</b> ${tooltipInfo.y_current} A<br>
                      <b>Frequency:</b> ${tooltipInfo.frequency} Hz<br>
                      <b>Creation Time:</b> ${tooltipInfo.creation_time}<br>`;
            }
          }
        }
      ],
      plotOptions: {
        line: {
          marker: {
            enabled: false
          },
        }
      },
      tooltip: {
        shared: false,
        valueDecimals: 2,
        xDateFormat: '%Y-%m-%d %H:%M:%S' // Format x-axis tooltip as datetime
      },
      legend: {
        enabled: true,
        itemStyle: {
          color: '#FFFFFF' // Set legend text color to white
        }
      },
      navigation: {
        buttonOptions: {
          enabled: true
        }
      },
      exporting: {
        buttons: {
          contextButton: {
            menuItems: ['printChart', 'downloadPNG', 'downloadPDF']
          }
        }
      },
      credits: {
        enabled: false
      },
      lang: {
        resetZoom: "Reset Zoom"
      }
    };

    // Render the chart after the data is loaded
    const chartContainer = document.querySelector('#Loaddata') as HTMLElement;
    this.Highcharts.chart(chartContainer, this.chartOptions);
}



  
  
  consumptionMonthly2() {
    this.chartOptions = {
      chart: {
        backgroundColor: '#17f6f12b',
        borderRadius: 5,
      },
      title: { text: '' },
      credits: {
        enabled: false
    },
      xAxis: {
        categories: this.categories,
        title: { text: '' },
        labels: {
          style: {
            color: '#FFFFFF'  // Set x-axis label color to white
          }
        }
      },
      yAxis: {
        title: { text: '' },
        labels: {
          style: {
            color: '#FFFFFF'  // Set y-axis label color to white
          }
        }
      },
      series: [
        {
          name: 'Grid',
          data: this.gridUnitSeries,
          type: 'line',
          color: 'rgb(0, 255, 213)'
        },
        {
          name: 'DG',
          data: this.dgUnitSeries,
          type: 'line',
          color: 'rgb(255, 0 ,0)'
        }
      ],
      legend: {
        layout: 'vertical',
        align: 'right',
        verticalAlign: 'middle',
        floating: false,
        itemMarginBottom: 10,
        enabled: true,
        itemStyle: {
          color: '#FFFFFF' // Set legend text color to white
        }
      },

      tooltip: {
        formatter: function () {
          return `<b>${this.series.name}</b><br/>Date: ${this.x}<br/>Unit: ${this.y}`;
        },

        borderWidth: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        shadow: false
      }
    };
    const chartContainer = document.querySelector('#consumptionmonthlyunit') as HTMLElement;
    this.Highcharts.chart(chartContainer, this.chartOptions);
  }
  

  
  
}
