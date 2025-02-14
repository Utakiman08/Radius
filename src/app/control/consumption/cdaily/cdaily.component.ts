import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ChangeDetectorRef, Component, HostListener, Inject, OnDestroy, OnInit, Output, PLATFORM_ID } from '@angular/core';
import Highcharts from 'highcharts';
import { catchError, forkJoin, of, Subscription } from 'rxjs';
import { DataService as DataServiceNPCL } from '../../../project2/data.service';
import { DataService as DataServicePVVNL } from '../../../project3/data.service';
import { DataService as DataServiceTorrent } from '../../../project4/data.service';
import { DataService as DataServiceAMR } from '../../../project-amr/data.service';
import { IntervalService } from '../../../interval.service';

@Component({
  selector: 'app-cdaily',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cdaily.component.html',
  styleUrl: './cdaily.component.scss'
})
export class CdailyComponent implements OnInit,OnDestroy{
  private subscribe : Subscription | null = null
  interval: any;
  activeConsumptionChart: string = "grid"; // default consumption chart to show
  intervalSubscription!: Subscription
  command!: Subscription
  secondsSettings:number = 0
  show: boolean = false;
  loading: boolean = false;
  gridData!: any; // Use the GridData interface
  dgData!: any; // Use the DgData interface
  chart!: Highcharts.Chart;
  chartdg! : Highcharts.Chart;
  Highcharts: typeof Highcharts = Highcharts;
  chartOptions: Highcharts.Options = {};
  private categories: string[] = [];
  private values: any[] = [];
  private values2: number[] = [];
  private categories2: string[] = [];
  private interval2: number = 5000;
  private intervalId: any;
  private intervalId2:any;
  private originalCategories: string[] = [];
  private originalValues: number[] = [];
  private originalCategories2: string[] = [];
  private originalValues2: number[] = [];
  private isMainDataVisible: boolean = false;
  private subscription !: Subscription 
  private periodic:any ;
  private hourlyinterval:any ;
  private hourlytimeout:any ;
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef,
    private dataServiceNPCL: DataServiceNPCL,
    private dataServicePVVNL: DataServicePVVNL,
    private dataServiceTorrent: DataServiceTorrent,
    private dataServiceAMR: DataServiceAMR,

    private timer : IntervalService
  ) {}
  
    ngOnDestroy(): void {
      if (this.intervalId) {
        clearInterval(this.intervalId);
      }
      if (this.interval2){
        clearInterval(this.intervalId2);
      }
      if (this.periodic) {
        clearInterval(this.periodic);
      }
      if (this.hourlyinterval){
        clearInterval(this.hourlyinterval);
      }
      if (this.hourlytimeout){
        clearInterval(this.hourlytimeout);
      }
      if (this.subscribe){
        this.subscribe.unsubscribe();
      }
      clearInterval(this.periodic);
      if (this.intervalSubscription) {
      this.intervalSubscription.unsubscribe();
    }
      if (this.command) {
        this.command.unsubscribe();
      }    
    }

  
  toggledropdown() {
    this.show = !this.show;
  }


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
 isSmallScreen:boolean = false
  Typeofchart : string = 'Hourly'
  
  gridValues: any[] = []
  dgValues: any[] = []
  currentDatetest: string = new Date().toISOString().split('T')[0];
  
    date:string=this.currentDatetest
 
    ngOnInit(): void {
      if (isPlatformBrowser(this.platformId)) {
        this.setHourlyUpdate(); // Start the hourly update mechanism
        this.setPeriodicUpdate(); // Start the 5-10 min periodic update mechanism
        this.loadData(true);
        this.checkScreenWidth();
        this.triggerCommand();
      }
    }
    triggerCommand(){
      this.command = this.timer.Update$.subscribe(()=>{
        this.loadData(true)
      })
    }
    currentDate : any
    currentHour : any
  
    loadData(initialLoad: boolean = false) {
      if (initialLoad) {
        this.secondsSettings = 1
        this.loading = true;
        this.ZERORERUN = false;
        this.originalValues = [];
        this.originalValues2 = [];
        this.originalCategories = [];
        this.originalCategories2 = [];
        this.categories = [];
        this.values = [];
        this.values2 = [];
        this.categories2 = [];
      } else {
        this.secondsSettings = 9
        this.loading = false;
      }
    
      if (this.intervalId) {
        clearInterval(this.intervalId);
      }
      if (this.interval2) {
        clearInterval(this.intervalId2);
      }
    
      this.currentDate = new Date(); // Always update currentDate when loading data
    
      // Initialize arrays to store the accumulated sum of grid and DG values
      const totalGridValues = Array(24).fill(0);
      const totalDgValues = Array(24).fill(0);
    
      // Create an array of API requests
      const requests = [
        this.dataServiceNPCL.getData_consumption_daily(this.date).pipe(catchError(() => of(null))),
        this.dataServicePVVNL.getData_consumption_daily(this.date).pipe(catchError(() => of(null))),
        this.dataServiceTorrent.getData_consumption_daily(this.date).pipe(catchError(() => of(null))),
        this.dataServiceAMR.getData_consumption_daily(this.date).pipe(catchError(() => of(null)))
      ];
    
      // Use forkJoin to call the APIs
      this.subscription = forkJoin(requests).subscribe((responses: any[]) => {
        responses.forEach(data => {
          // If the response is missing or rc = -1, treat it as all zeros
          const isInvalidResponse = !data || data.rc === -1;
          const gridData = isInvalidResponse || !data.resource.grid ? null : data.resource.grid[0];
          const dgData = isInvalidResponse || !data.resource.dg ? null : data.resource.dg[0];
    
          // Process grid values
          for (let i = 0; i < 24; i++) {
            const gridValue = gridData ? parseFloat(gridData[`grid_unit_${i.toString().padStart(2, '0')}`]) || 0 : 0;
            totalGridValues[i] += isNaN(gridValue) ? 0 : gridValue;
            totalGridValues[i] = Number(totalGridValues[i].toFixed(2)); // Round to 2 decimal places
          }
    
          // Process DG values
          for (let i = 0; i < 24; i++) {
            const dgValue = dgData ? parseFloat(dgData[`dg_unit_${i.toString().padStart(2, '0')}`]) || 0 : 0;
            totalDgValues[i] += isNaN(dgValue) ? 0 : dgValue;
            totalDgValues[i] = Number(totalDgValues[i].toFixed(2)); // Round to 2 decimal places
          }
        });
    
        // Assign the accumulated values to gridData and dgData
        this.gridValues = [...totalGridValues];
        this.dgValues = [...totalDgValues];
    
        // Ensure the data is valid before proceeding
        if (this.activeConsumptionChart === 'grid') {
          if (!this.gridValues.includes(NaN) && !this.dgValues.includes(NaN)) {
            if (!initialLoad) {
              this.setupInitialData();
            } else {
              this.showConsumptionChart(this.activeConsumptionChart);
              this.loading = false;
            }
          }
        } else if (this.activeConsumptionChart === 'dg') {
          if (!this.gridValues.includes(NaN) && !this.dgValues.includes(NaN)) {
            if (!initialLoad) {
              this.setupInitialDatadg();
            } else {
              this.showConsumptionChart(this.activeConsumptionChart);
              this.loading = false;
            }
          }
        }
    
        this.loading = false;
      });
    }
      
    
    
    private setPeriodicUpdate() {
      this.intervalSubscription = this.timer.interval$.subscribe((updateInterval)=>{

        if (this.periodic) {
          clearInterval(this.periodic);
          console.log('Previous interval cleared');
        }
        
        this.periodic =  setInterval(() => {
           this.loadData(false); // Minor update without showing the loader
           console.log(updateInterval)
        }, updateInterval);
      })      
    }

  
    private setHourlyUpdate() {
      const now = new Date();
      const nextHour = new Date();
      nextHour.setHours(now.getHours() + 1, 0, 0, 0); // Set nextHour to the start of the next hour
      const millisecondsToNextHour = nextHour.getTime() - now.getTime();
  
      this.hourlytimeout =   setTimeout(() => {
        this.loadData(true); // Update data at the start of the next hour
        this.setHourlyInterval(); // Set an interval to update data every hour after the first update
      }, millisecondsToNextHour);
    }
  
    private setHourlyInterval() {
      this.hourlyinterval = setInterval(() => {
        this.loadData(true);
      }, 3600000); // 3600000 ms = 1 hour
    }

  
    showConsumptionChart(chartType: string) {
      this.currentDate = new Date();
      this.currentHour =  this.currentDate.getHours();
      this.activeConsumptionChart = chartType;
      this.show = false;
      this.cdr.detectChanges();
      this.secondsSettings = 9
      setTimeout(() => {
        this.show = true;
        this.cdr.detectChanges();
        setTimeout(() => this.renderConsumptionChart(), 0);
      }, 0);
    }
  
    renderConsumptionChart(): void {
    this.show = false;
    if (this.activeConsumptionChart === 'grid' && this.gridValues && !this.gridValues.includes(NaN)) {
      this.setupInitialData();
      this.Consumption_Grid();

    } else if (this.activeConsumptionChart === 'dg' && this.dgValues &&!this.dgValues.includes(NaN)) {
      this.setupInitialDatadg();
      this.Consumption_dg();
      
    }
  }


  

  Consumption_Grid(): void {
    this.chartOptions = {
      chart: {
        type: 'areaspline',
        animation: {
          duration: 1000,
          easing: 'easeOutBounce'
        },
        events: {
          load: () => {
           }
        },
        backgroundColor: 'rgba(0,0,0,0)',
        style: {
          color: '#FFF'
        }
      },
      title: {
        text: '',
        style: {
          color: '#FFF',
          fontWeight: 'bold'
        }
      },
      credits: {
        enabled: false
    },
      plotOptions: {
        areaspline: {
          color: 'rgba(0,255,255,0.6)', // Cyan with 60% opacity
          fillColor: {
            linearGradient: { x1: 0, x2: 0, y1: 0, y2: 1 },
            stops: [
              [0, 'rgba(0,255,255,0.4)'], // Cyan translucent
              [1, 'rgba(0,0,0,0)']        // Transparent at the bottom
            ]
          },
          threshold: null,
          marker: {
            lineWidth: 1,
            fillColor: 'white'
          },
          dataLabels: {
            enabled: true,
            style: {
              color: '#FFF',
              fontSize: '10px',
              textOutline: 'none'
            },
            formatter: function () {
              // Safely handle null values
              if (this.y != null) {
                return this.y.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
              }
              return ''; // Return an empty string if this.y is null
            }
          }
        }
      },
      series: [{
        type: 'areaspline',
        data: this.values,
        name: 'Grid Unit',
        showInLegend: false,
      }],
      xAxis: {
        categories: this.categories,
        labels: {
          rotation:0,
          style: {
            fontSize: '9px',
            color: '#FFF'
          }
        }
      },
      yAxis: {
        labels: {
          formatter: function () {
            // Safely handle null values for y-axis labels
            return this.value != null ? this.value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '';
          },
          style: {
            color: '#FFF'
          }
        },
        title:{
          text:''
        }
      },
      tooltip: {
        formatter: function (this: Highcharts.TooltipFormatterContextObject) {
          // Safely handle null values in tooltips
          let yValue = this.y != null ? this.y.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') : 'N/A';
          return `${this.series.name}: <b>${yValue}</b>`;
        }
      }
    };
  
    const chartContainer = document.querySelector('#consumption-grid') as HTMLElement;
    if (chartContainer) {
      this.chart = Highcharts.chart(chartContainer, this.chartOptions);
    } else {
      console.error('Chart container for Grid not found.');
    }
  }
  
  
  
  
  Consumption_dg(): void {
    this.chartOptions = {
      chart: {
        type:'areaspline',
        animation: {
          duration: 1000,
          easing: 'easeOutBounce'
      },
        backgroundColor: 'rgba(0,0,0,0)',
        style: {
          color: '#FFF',
        },
        events: {
          load: () => {
           }
        }
      },
      title: {
        text: '',
        style: {
          color: '#FFF',
          fontWeight: 'bold',
        },
      },
      credits: {
        enabled: false
    },
      plotOptions: {
        areaspline: {
          color: 'rgba(0,255,255,0.6)', // Cyan with 60% opacity
          fillColor: {
            linearGradient: { x1: 0, x2: 0, y1: 0, y2: 1 },
            stops: [
              [0, 'rgba(0,255,255,0.4)'], // Cyan translucent
              [1, 'rgba(0,0,0,0)']        // Transparent at the bottom
            ]
          },
          threshold: null,
          marker: {
            lineWidth: 1,
            fillColor: 'white'
          },
          dataLabels: {
            enabled: true,
            style: {
              color: '#FFF',
              fontSize: '10px',
              textOutline: 'none'
            },
            formatter: function () {
              // Safely handle null values
              if (this.y != null) {
                return this.y.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
              }
              return ''; // Return an empty string if this.y is null
            }
          }
        }
      },
      series: [{
          data: this.values2,
          type: 'areaspline', // Specify the type of series
          name: 'DG Unit',
          showInLegend:false,
      }],
      xAxis: {
        categories: this.categories2,
        labels: {
          rotation:0,
          style: {
            fontSize: '9',
            color: '#FFF'
          }
        }
      },
      yAxis: {
        labels: {
          formatter: function () {
            return this.value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '');
          },
          style: {
            color: '#FFF'
          }
        },
        title:{
          text:''
        }
      },
      tooltip: {
        formatter: function(this: Highcharts.TooltipFormatterContextObject) {
          let yValue = this.y != null ? this.y.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '') : '';
          return `${this.series.name}: <b>${yValue}</b>`;
        }
      },
    };

    const chartContainer = document.querySelector('#consumption-dg') as HTMLElement;
    // //console.log('Chart Container DG:', chartContainer); // Log to verify the container is found
    if (chartContainer) {
      this.chartdg = Highcharts.chart(chartContainer, this.chartOptions);
    } else {
      console.error('Chart container for DG not found.');
    }
  }
 
  
  onChartClick() {
    this.isMainDataVisible = !this.isMainDataVisible;
    if (this.isMainDataVisible) {
      this.chart.update({
        xAxis: {
          categories: this.originalCategories,
        },
        series: [{
          data: this.originalValues,
          type: 'areaspline'
        }]
      }, true, true);
    } else {
      this.chart.update({
        xAxis: {
          categories: this.categories,
        },
        series: [{
          data: this.values,
          type: 'areaspline'
        }]
      }, true, true);
    }
  }
  
  onChartClickdg() {
    this.isMainDataVisible = !this.isMainDataVisible;
    if (this.isMainDataVisible) {
      this.chart.update({
        xAxis: {
          categories: this.originalCategories2,
        },
        series: [{
          data: this.originalValues2,
          type: 'areaspline'
        }]
      }, true, true);
    } else {
      this.chart.update({
        xAxis: {
          categories: this.categories2,
        },
        series: [{
          data: this.values2,
          type: 'areaspline'
        }]
      }, true, true);
    }
  }
  
    ZERORERUN:boolean = false
  
    setupInitialData() {
    
      const currentMinute = this.currentDate.getMinutes();
      const currentSecond = this.currentDate.getSeconds();
    
      let adjustedDate = new Date();
      adjustedDate.setSeconds(currentSecond);
    
      if (currentSecond < 0) {
        adjustedDate.setMinutes(currentMinute - 1);
        adjustedDate.setSeconds(60 + currentSecond);
      }
    
      const adjustedHour = adjustedDate.getHours();
      const adjustedMinute = adjustedDate.getMinutes();
      let adjustedSecond = adjustedDate.getSeconds();
       // if (this.secondsSettings > 1) {
      //   adjustedSecond = adjustedSecond-40
      // }
    
      if (this.gridValues) {
        this.cdr.detectChanges();
        this.categories = Array.from({ length: this.currentHour + 1 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
        this.values = Array.from({ length: this.currentHour + 1 }, (_, i) => this.gridValues[i]);
    
        this.originalCategories = [...this.categories];
        this.originalValues = [...this.values];
        // console.log(this.originalValues)
        let initialData = this.values[this.values.length - 1];
        this.values = [initialData];
        if (initialData === 0 && this.ZERORERUN === false) {
          this.loadData(true)
         } 
        this.categories = [
          `${adjustedHour}:${adjustedMinute.toString().padStart(2, '0')}:${adjustedSecond.toString().padStart(2, '0')}`
        ];
    
        // Calculate absolute cumulative increment and average hourly increment to set a positive trend
        const totalConsumption = this.gridValues.slice(0, this.currentHour + 1).reduce((sum, val) => sum + val, 0);
        const averageIncrement = totalConsumption / (this.currentHour + 1);
        const increment = (averageIncrement * 5) / 3600
        // console.log(`increment = ${increment}`)
        for (let i = 1; i < this.secondsSettings; i++) {
          const nextTime = this.getNextTime(this.categories[this.categories.length - 1]);
          // console.log(nextTime)
          let newValue;
          if (initialData !== 0) {
            let incrementValue = (increment * (Math.random() * 0.1 + 1)); // Fluctuation between 1.0 and 1.1
            //console.log(incrementValue)
            initialData += incrementValue;
            newValue = parseFloat(initialData.toFixed(2));
          } else {
            newValue = 0;
          }
    
          this.values.push(newValue);
          this.categories.push(nextTime);
        }
      } else {
        console.error("Grid or DG values are missing. Please ensure loadData is called before setupInitialData.");
      }
        this.startAddingData();
    }
    
    startAddingData() {
      if (this.intervalId) {
        clearInterval(this.intervalId);
      }
      if (this.interval2) {
        clearInterval(this.intervalId2);
      }
    
      this.intervalId = setInterval(() => {
     
        const totalConsumption = this.gridValues.slice(0, this.currentHour + 1).reduce((sum, val) => sum + val, 0);
        const averageIncrement = totalConsumption / this.values.length;
        const increment = (averageIncrement)/720
         let initialData = this.values[this.values.length - 1];
  
        let newValue :number
        if (initialData===0) {
          newValue = 0
        }
        else{
          newValue = parseFloat((this.values[this.values.length - 1] + (increment)).toFixed(2));
        }
        this.values.push(newValue);
    
        if (this.values.length > 8) {
          this.values.shift();
        }
    
        const nextTime = this.getNextTime(this.categories[this.categories.length - 1]);
        this.categories.push(nextTime);
    
        if (this.categories.length > 8) {
          this.categories.shift();
        }
    
        if (!this.isMainDataVisible) {
          if (this.chart && this.chart.series[0]) {
            this.chart.series[0].setData(this.values, true, {
              duration: 1000
            });
          }
          this.chart.update({
            xAxis: {
              categories: this.categories,
            },
            series: [{
              data: this.values,
              type: 'areaspline'
            }]
          }, true, true);
        }
      }, 5000);
    }
    
    
    
    
  
    getNextTime(lastTime: string): string {
      // Extract the hour, minute, and second from the last time string
      const [hour, minute, second] = lastTime.split(':').map(Number);
      let newHour = hour;
      let newMinute = minute;
      let newSecond = second + this.interval2 / 1000;
    
      // Adjust the time if seconds exceed 60
      if (newSecond >= 60) {
        newSecond = 0;
        newMinute += 1;
      }
      // Adjust the time if minutes exceed 60
      if (newMinute >= 60) {
        newMinute = 0;
        newHour = (hour + 1) % 24;
      }
      // Return the new time as a formatted string
      return `${newHour}:${newMinute < 10 ? '0' : ''}${newMinute}:${newSecond < 10 ? '0' : ''}${newSecond}`;
    }
    
    
    setupInitialDatadg() {
      const currentDate = new Date();
      const currentHour = currentDate.getHours();
      const currentMinute = currentDate.getMinutes();
      const currentSecond = currentDate.getSeconds();
    
      let adjustedDate = new Date();
      adjustedDate.setSeconds(currentSecond);
    
      if (currentSecond < 0) {
        adjustedDate.setMinutes(currentMinute - 1);
        adjustedDate.setSeconds(60 + currentSecond);
      }
    
      const adjustedHour = adjustedDate.getHours();
      const adjustedMinute = adjustedDate.getMinutes();
      const adjustedSecond = adjustedDate.getSeconds();
    
      // Set the categories2 and values2 for static data up to the current hour
      this.categories2 = Array.from({ length: currentHour + 1 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
      this.values2 = Array.from({ length: currentHour + 1 }, (_, i) => this.dgValues[i]);
    
      // Store the original data for click events
      this.originalCategories2 = [...this.categories2];
      this.originalValues2 = [...this.values2];
    
      // Initialize dynamic data with the last known value
      let initialData = this.values2[currentHour];
    
      this.values2 = [initialData];
      this.categories2 = [
        `${adjustedHour}:${adjustedMinute.toString().padStart(2, '0')}:${adjustedSecond.toString().padStart(2, '0')}`
      ];
    
      // Calculate average increment based on cumulative values
      const totalConsumption = this.dgValues.slice(0, currentHour + 1).reduce((sum, val) => sum + val, 0);
      const averageIncrement = totalConsumption / (currentHour + 1);
      const increment = (averageIncrement * 5) /3600
  
      for (let i = 1; i < this.secondsSettings; i++) {
        const nextTime = this.getNextTime(this.categories2[this.categories2.length - 1]);
    
        let newValue;
        if (initialData !== 0) {
          let incrementValue = increment * (Math.random() * 0.1 + 1); // Fluctuation between 1.0 and 1.1
          initialData += incrementValue;
          newValue = parseFloat(initialData.toFixed(2));
        } else {
          newValue = 0;
        }
    
        this.values2.push(newValue);
        this.categories2.push(nextTime);
      }
      this.startAddingDatadg();
    }
    
    startAddingDatadg() {
       
      if (this.intervalId) {
        clearInterval(this.intervalId);
      }
      if (this.interval2) {
        clearInterval(this.intervalId2);
      }
       // Set an interval to update the chart with new data
      this.intervalId2 = setInterval(() => {
   
        const totalConsumption = this.dgValues.slice(0, this.currentHour + 1).reduce((sum, val) => sum + val, 0);
        const averageIncrement = totalConsumption / this.values2.length;
        const increment = (averageIncrement * 5) /3600
   
        const fluctuation = (Math.random() * 0.1) + 1.0; // Fluctuation between 1.0 and 1.1
        let initialData = this.values2[this.values2.length - 1];
  
        let newValue :number
        if (initialData===0) {
          newValue = 0
        }
        else{
          newValue = parseFloat((this.values2[this.values2.length - 1] + (increment * fluctuation)).toFixed(2));
        }  
        this.values2.push(newValue);
    
        // Limit the dynamic data points to a reasonable number (e.g., last 10 points)
        if (this.values2.length > 10) {
          this.values2.shift();
        }
    
        const nextTime = this.getNextTime(this.categories2[this.categories2.length - 1]);
        this.categories2.push(nextTime);
    
        // Limit the number of categories to match the number of data points
        if (this.categories2.length > 10) {
          this.categories2.shift();
        }
    
        // Update the chart if the main data is not being viewed
        if (!this.isMainDataVisible) {
          if (this.chartdg && this.chartdg.series[0]) {
            this.chartdg.series[0].setData(this.values2, true, {
              duration: 1000
            });
          }
          this.chartdg.update({
            xAxis: {
              categories: this.categories2,
            },
            series: [{
              data: this.values2,
              type: 'areaspline'
            }]
          }, true, true);
        }
      }, 5000);
    }
    
}
