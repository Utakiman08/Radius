import {  ChangeDetectorRef, Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import * as Highcharts from 'highcharts';
import { DataserviceService } from '../dataservice.service';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PdfmakeService } from '../../pdfmake.service';

@Component({
  selector: 'app-consumer-detail',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './consumer-detail.component.html',
  styleUrl: './consumer-detail.component.scss'
})
export class ConsumerDetailComponent implements OnInit{

  Month:string = ''
  Year:string = ''
sourceComponent:any
getBill(){
  this.dataService.getMonthlyBill(this.locationid,this.Year,this.Month.toString().padStart(2,"0")).subscribe(data=>{
      this.pdfService.formatDocument(data)
  })
}
  sanitizeSiteData(data: any): any {
    const sanitizedData: any = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        sanitizedData[key] = (data[key] === null || data[key] === 'NA') ? '---' : data[key];
      }
    }
    return sanitizedData;
  }
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
            location_no?:string ,
            location_type?:string ,
            consumer_name?:string ,
            tower_name?:string ,
            dg_load?:string,
            grid_load_unit?:string ,
            total_recharged_amount?:string ,
            balance_amt?:string ,
            last_recharge_time?:string ,
            last_coupon_no?:string ,
            last_coupon_amount?:string ,
            possession_date?:string ,
            alert_daily_consumption_dg?:string ,
            meter_id?:string ,
            active_cut_off?:string ,
            active_cut_off_dg?:string ,
            ivrs_language?:string ,
            notification_email?:string ,
            notification_sms?:string ,
            unit_dg_closing?:string ,
            email_id?:string ,
            mobile_no?:string ,
            low_bal_alert?:string ,
            sms_alert_send?:string ,
            energy_source?:string ,
            last_reading_time?:string ,
            last_process_time_mmc?:string ,
            last_process_time_fixed?:string ,
            last_process_time_CAM?:string ,
            last_process_time_other?:string ,
            last_process_time_CS?:string ,
            cut_balance?:string ,
            recharged_dg_amt?:string ,
            bp_no?:string ,
            move_in_date?:string ,
            rate_category?:string 
        }={}

  Highcharts: typeof Highcharts = Highcharts;
  chartOptions: Highcharts.Options = {};

  constructor(private dataService : DataserviceService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object,
    private pdfService :PdfmakeService

  ){}
  gridDates :  any[] =[];
  gridAmounts :  any[] =[];
  dgAmounts : any[] =[]
  locationid: string = ''
  amritems:boolean = false
  ngOnInit(): void {
    // this.loadConsumptiondata();
    if (isPlatformBrowser(this.platformId)) {
      // Fetch the saved data from sessionStorage
      const consumerData = sessionStorage.getItem('consumerData');
      if (consumerData) {
        // Parse and assign the data to site_data
        const parsedData = JSON.parse(consumerData);
        this.location_grid = this.sanitizeSiteData(parsedData.data.location_grid);
        this.location_dg = this.sanitizeSiteData(parsedData.data.location_dg);
        this.locationid = parsedData.data.location_grid.location_id;
        this.siteID = parsedData.data.location_grid.site_id;
        this.gridload = parseFloat(parsedData.data.location_grid.grid_load)
        this.dgload = parseFloat(parsedData.data.location_dg.dg_load)
        this.sourceComponent = sessionStorage.getItem('sourceComponent')
        console.log(this.sourceComponent)
        if (this.sourceComponent ==='amr') {
          this.amritems = true
        }
       }
    }
    this.currentLocationData = this.location_grid
    this.piechart();
    this.loadConsumptiondataDaily();
    this.loadConsumptiondataMonthly();
    this.activeConsumptionChart = 'daily'
  }
  currentLocationData : any;
  isGridActive :boolean = true; 
  // Method to toggle between location_grid and location_dg
  toggleData() {
    this.isGridActive = !this.isGridActive;
    this.currentLocationData = this.isGridActive ? this.location_grid : this.location_dg;
    //console.log(this.currentLocationData)
  }
  gridload:number = 0
  dgload:number = 0
  gridunits :  any[] =[];
  dgunits : any[] =[];

  siteID:any
  month = ((new Date().getMonth() + 1) > 9 ? (new Date().getMonth() + 1).toString() : '0' + (new Date().getMonth() + 1).toString());
  year = ((new Date().getFullYear() ) > 9 ? (new Date().getFullYear() ).toString() : '0' + (new Date().getFullYear()).toString());

  loadConsumptiondataDaily(){
    this.dataService.getConsumption('daily',this.locationid,this.siteID,this.month,this.year).subscribe(data=>{
      this.gridDates = data.resource.grid.date;
      this.gridAmounts = data.resource.grid.grid_amt;
      // this.gridunits = data.resource.grid.grid_unit;
      this.dgAmounts = data.resource.dg.dg_amt;
      // this.dgunits = data.resource.dg.dg_unit;
      //console.log(this.gridAmounts);
      this.showConsumptionChart(this.activeConsumptionChart);
    })
  }
  categories:any
  gridUnitSeries:any
  dgUnitSeries:any
  gridAmtSeries:any
  dgAmtSeries:any
  
  loadConsumptiondataMonthly(){
    this.dataService.getConsumption('monthly',this.locationid,this.siteID,'',this.year).subscribe(data=>{
  this.categories = data.resource.grid.map((item:any) => item.month);
  // this.gridUnitSeries = data.resource.grid.map((item:any) => parseFloat(item.grid_unit));
  // this.dgUnitSeries = data.resource.dg.map((item:any) => parseFloat(item.dg_unit));
  this.gridAmtSeries = data.resource.grid.map((item:any) => item.grid_amt);
  this.dgAmtSeries = data.resource.dg.map((item:any) => item.dg_amt);

    })
  }

  activeConsumptionChart:string =''
  showConsumptionChart(chartType: string) {
    this.activeConsumptionChart = chartType;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.renderConsumptionChart();
    }, 0);
  }

  renderConsumptionChart(): void {
    if (this.activeConsumptionChart === "daily") {
      this.consumptionDaily();
    } else if (this.activeConsumptionChart === "monthly") {
      this.consumptionMonthly();
    }
  }

  piechart(){
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
          { y: Number(this.gridload), name: 'Grid', color:'#11f2e7' },  // Placeholder value
          { y: Number(this.dgload), name: 'DG', color:'#098a8f' },  // Placeholder value
        ],
        dataLabels:{
          enabled:false
        }
      }],
      plotOptions: {
        pie: {
          allowPointSelect: true,
          cursor: 'pointer',
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
  
    const chartContainer = document.querySelector('#Piechart') as HTMLElement;
    this.Highcharts.chart(chartContainer, this.chartOptions);
  }
  
  consumptionDaily(){
    this.chartOptions = {
      chart:{
        backgroundColor: '#17f6f12b',
        borderRadius: 5,
      },
      title: { text: '' },
      credits: {
        enabled: false
    },
      xAxis: {
        categories: this.gridDates,
        title: { text: 'Date', 
          style:{
            color:'#FFFFFF'
          }
        },
                labels: {
          style: {
            color: '#FFFFFF'  // Set y-axis label color to white
          }
        }
      },
      yAxis: {
        title: { text: 'Grid & DG Amount' ,style:{
          color:'#FFFFFF'
        } },
                labels: {
          style: {
            color: '#FFFFFF'  // Set y-axis label color to white
          }
        }
      },
      series: [
        {
          name: 'Grid Data',
          data: this.gridAmounts,
          type: 'line',
          color: 'rgb(0, 255, 213)',
          dataLabels:{
            enabled:true,
            style:{
              color:'#FFFFFF'
            }
          }
        },
        {
          name: 'DG Data',
          data: this.dgAmounts,
          type: 'line',
          color: 'rgb(255, 0 ,0)',
          dataLabels:{
            enabled:true,
            style:{
              color:'#FFFFFF'
            }
          }
        }
      ],
      legend:{
        enabled:true,
        itemStyle:{
          color:'#FFFFFF'
        }
      },
      tooltip: {
        formatter: function () {
          return `<b>${this.series.name}</b><br/>Date: ${this.x}<br/>Amount: ${this.y}`;
        },
        borderWidth: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        shadow: false
      }
    };
    const chartContainer = document.querySelector('#consumptiondaily') as HTMLElement;
    this.Highcharts.chart(chartContainer, this.chartOptions);
  }
    consumptionMonthly(){
      this.chartOptions = {
        chart:{
          backgroundColor: '#17f6f12b',
        borderRadius: 5,
        },
        title: { text: '' },
        credits: {
          enabled: false
      },
        xAxis: {
          categories: this.categories,
          title: { text: 'Date' ,style:{
            color:'#FFFFFF'
          }},
          labels: {
            style: {
              color: '#FFFFFF'  // Set y-axis label color to white
            }
          }
        },
        yAxis: {
          title: { text: 'Grid & DG Amount',style:{
            color:'#FFFFFF'
          }
           },
          labels: {
            style: {
              color: '#FFFFFF'  // Set y-axis label color to white
            }
          }
        },
        series: [
          {
            name: 'Grid Data',
            data: this.gridAmtSeries,
            type: 'line',
            color: 'rgb(0, 255, 213)',
            dataLabels:{
              enabled:true,
              style:{
                color:'#FFFFFF'
              }
            }
          },
          {
            name: 'DG Data',
            data: this.dgAmtSeries,
            type: 'line',
            color: 'rgb(255, 0 ,0)',
            dataLabels:{
              enabled:true,
              style:{
                color:'#FFFFFF'
              }
            }
          }
        ],
        legend:{
          enabled:true,
          itemStyle:{
            color:'#FFFFFF'
          }
        },
        tooltip: {
          formatter: function () {
            return `<b>${this.series.name}</b><br/>Date: ${this.x}<br/>Amount: ${this.y}`;
          },
          borderWidth: 1,
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          shadow: false
        }
      };
      const chartContainer = document.querySelector('#consumptionmontly') as HTMLElement;
      this.Highcharts.chart(chartContainer, this.chartOptions);
  }

  
  
}
