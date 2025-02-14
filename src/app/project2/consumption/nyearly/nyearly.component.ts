import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component , HostListener, OnDestroy, OnInit  } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as Highcharts from 'highcharts'
import { DataService } from '../../data.service';
import { yeargrid, yeardg, TestingDatayear } from '../data.model';
import { skip, Subscription, timer } from 'rxjs';
import { IntervalService } from '../../../interval.service';
@Component({
  selector: 'app-nyearly',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './nyearly.component.html',
  styleUrl: './nyearly.component.scss'
})
export class NyearlyComponent implements OnInit , OnDestroy {
  loading: boolean = false;
     chart!: Highcharts.Chart;
     Highcharts: typeof Highcharts = Highcharts;
     chartOptions: Highcharts.Options = {};
     availableYears: string[] = [];
     selectedYear!: string;
     private subscribe: Subscription | null = null;
     private autoUpdateSubscription: Subscription | null = null;
      
     constructor(private dataservice: DataService, private cdr: ChangeDetectorRef,
       private timer : IntervalService
   
     ) {}
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
     ngOnInit() {
       const currentYear = new Date().getFullYear();
       this.availableYears = Array.from({ length: 5 }, (v, k) => String(currentYear - k));
       this.selectedYear = String(currentYear);
       this.loadDataFromsessionStorage();
       this.setupAutoUpdate(); // Set up auto-update every few minutes
       this.checkScreenWidth();
       this.triggerCommand();
     }
   
     ngOnDestroy(): void {
       if (this.subscribe) {
         this.subscribe.unsubscribe();
       }
       if (this.autoUpdateSubscription) {
         this.autoUpdateSubscription.unsubscribe();
       }
       if (this.command) {
         this.command.unsubscribe();
       }    
       if (this.IntervalCommand) {
         this.IntervalCommand.unsubscribe()
       }
     }
     command!: Subscription
     IntervalCommand!: Subscription
     activeConsumptionChart: string = "grid";
     show: boolean = false;
    
     gridDatayear!: yeargrid;
     dgDatayear!: yeardg;
     monthNames = ["Jan", "Feb", "March", "April", "May", "June", "July", "Aug", "Sep", "Oct", "Nov", "Dec"];
     gridyearlydataUnits: any[] = [];
     gridyearlydataAmounts: any[] = [];
     dgyearlydataUnits: any[] = [];
     dgyearlydataAmounts: any[] = [];
     monthcategorygrid: any[] = [];
     monthcategorydg: any[] = [];
     storedData: any
     // Load data initially from session storage or API
     loadDataFromsessionStorage() {
       this.storedData = sessionStorage.getItem(`NPCLyearlyData-${this.selectedYear}`);
       let sessionData: TestingDatayear;
     
       if (this.storedData) {
         sessionData = JSON.parse(this.storedData);
         this.processYearlyData(sessionData); // Render session data initially
       }
       
     
       this.loaddatayear();
     }
     
     // Helper function to compare session data with new data
     isDataDifferent(oldData: TestingDatayear | null, newData: TestingDatayear): boolean {
       if (!oldData) {
         return true; // If oldData is null, new data is considered different
       }
     
       // Implement a detailed comparison logic if necessary, or use JSON string comparison
       return JSON.stringify(oldData) !== JSON.stringify(newData);
     }
     
   
     loaddatayear() {
       this.loading = true;
     
       this.subscribe = this.dataservice.getData_consumption_Yearly(this.selectedYear).subscribe((data: TestingDatayear) => {
         // Fetch previously stored data from sessionStorage
         const storedData = JSON.parse(sessionStorage.getItem(`NPCLyearlyData-${this.selectedYear}`) || 'null');
     
         // Compare the stored data with the new data
         const isDifferent = this.isDataDifferent(storedData, data);
     
         if (isDifferent) {
           // Update sessionStorage with new data
         this.storedData = sessionStorage.setItem(`NPCLyearlyData-${this.selectedYear}`, JSON.stringify(data));
           this.processYearlyData(data); // Update the chart with new data
         }
     
         this.loading = false; // Ensure loading stops
       });
     }
     
     triggerCommand() {
       this.command = this.timer.Update$.pipe(skip(1)).subscribe(() => {
         this.loaddatayear();
       });
     }
     // Setup auto update every few minutes (e.g., 5 minutes)
 setupAutoUpdate() {
   // Clear the previous interval subscription if it exists
   if (this.IntervalCommand) {
     this.IntervalCommand.unsubscribe();
     console.log('Previous interval command cleared');
   }
 
   // Subscribe to changes in the interval observable
   this.IntervalCommand = this.timer.interval$.subscribe((updateInterval) => {
     // Clear the previous auto-update subscription if it exists
     if (this.autoUpdateSubscription) {
       this.autoUpdateSubscription.unsubscribe();
       console.log('Previous auto-update subscription cleared');
     }
 
     // Use setInterval instead of an RxJS timer to call `loadDataFromsessionStorage`
     const intervalId = setInterval(() => {
       console.log('Calling loadDataFromsessionStorage...');
       this.loadDataFromsessionStorage();
     }, updateInterval);
 
     // Store the interval ID for cleanup
     this.autoUpdateSubscription = new Subscription(() => {
       clearInterval(intervalId);
       console.log('Interval cleared');
     });
   });
 }
 
   
     processYearlyData(data: TestingDatayear, isAutoUpdate: boolean = false) {
       this.gridDatayear = data.resource.grid;
       this.dgDatayear = data.resource.dg;
     
       const gridConsumption = this.gridDatayear.month.map((month, index) => ({
         month: this.monthNames[month - 1],
         unit: parseFloat(parseFloat(this.gridDatayear.unit[index]).toFixed(2)),
         amount: parseFloat(parseFloat(this.gridDatayear.amount[index]).toFixed(2))
       }));
     
       const dgConsumption = this.dgDatayear.month.map((month, index) => ({
         month: this.monthNames[month - 1],
         unit: parseFloat(parseFloat(this.dgDatayear.unit[index]).toFixed(2)),
         amount: parseFloat(parseFloat(this.dgDatayear.amount[index]).toFixed(2))
       }));
     
       this.gridyearlydataUnits = gridConsumption.map(item => item.unit);
       this.gridyearlydataAmounts = gridConsumption.map(item => item.amount);
       this.dgyearlydataUnits = dgConsumption.map(item => item.unit);
       this.dgyearlydataAmounts = dgConsumption.map(item => item.amount);
       this.monthcategorygrid = gridConsumption.map(item => item.month);
       this.monthcategorydg = dgConsumption.map(item => item.month);
     
       if (isAutoUpdate) {
         this.updateChartData();
       } else {
         this.showConsumptionChart(this.activeConsumptionChart);
       }
     }
     
   
     updateChartData() {
       if (this.chart && this.chart.series.length) {
         const chartSeries = this.chart.series[0];
         if (this.activeConsumptionChart === "grid") {
           chartSeries.setData(this.dgyearlydataUnits, true);
         } else {
           chartSeries.setData(this.dgyearlydataUnits, true);
         }
       }
     }
   
     toggledropdown() {
       this.show = !this.show;
     }
   
     showConsumptionChart(chartType: string) {
       this.activeConsumptionChart = chartType;
       this.cdr.detectChanges();
       setTimeout(() => {
         this.renderConsumptionChart();
       }, 0);
     }
   
     renderConsumptionChart(): void {
       if (this.activeConsumptionChart === "grid") {
         this.updateGridChart();
       } else if (this.activeConsumptionChart === "dg") {
         this.updateDgChart();
       }
     }
   
     updateGridChart() {
       this.chartOptions = {
         chart: {
           zooming: { type: "x" },
           type: "area",
           animation: { duration: 1000, easing: "easeOutBounce" },
           backgroundColor: "rgba(0,0,0,0)",
           style: { color: "#FFF" }
         },
         title: { text: "" },
         credits: { enabled: false },
         xAxis: {
           categories: this.monthcategorygrid,
           labels: { rotation: 0, style: { color: "#FFF" } }
         },
         yAxis: {
           min: 0,
           title: { text: "" },
           labels: {
             style: { color: "#FFF" },
             formatter: function () {
               const value = Number(this.value); // Explicit type casting to number
               if (isNaN(value)) {
                 return "0"; // Default fallback for invalid or non-numeric values
               }
               if (value >= 1e7) return (value / 1e7).toFixed(2) + " Cr"; // Crore
               if (value >= 1e5) return (value / 1e5).toFixed(2) + " L";  // Lakh
               return value.toLocaleString(); // Default formatting
             }
             
           }
         },
         tooltip: {
           formatter: function () {
             const value = this.y !== null && this.y !== undefined
               ? this.y.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
               : '0';
             return `<b>${this.x}</b><br/>Grid Unit: ${value}`;
           }
         },
         series: [{
           type: "area",
           name: "Grid Unit",
           data: this.gridyearlydataUnits,
           showInLegend: false,
           color: {
             linearGradient: { x1: 0, y1: 1, x2: 0, y2: 0 },
             stops: [[0, "var(--primary-color)"], [1, "#419873"]]
           },
           dataLabels: {
             enabled: true,
             formatter: function () {
               const value = this.y; // 'this.y' is the correct way to access the value in data labels
               if (value === null || value === undefined) {
                 return "0"; // Default fallback for null or undefined
               }
               if (value >= 1e7) return (value / 1e7).toFixed(2) + " Cr"; // Crore
               if (value >= 1e5) return (value / 1e5).toFixed(2) + " L";  // Lakh
               return value.toLocaleString(); // Default formatting
             },
             style: { color: "#FFF" }
           }
           
         }]
       };
     
       const chartContainer = document.querySelector("#yearly-consumption-grid") as HTMLElement;
       if (chartContainer) {
         this.chart = Highcharts.chart(chartContainer, this.chartOptions);
       } else {
         console.error("Chart container for Grid not found.");
       }
     }
     
     updateDgChart() {
       this.chartOptions = {
         chart: {
           zooming: { type: "x" },
           type: "area",
           animation: { duration: 1000, easing: "easeOutBounce" },
           backgroundColor: "rgba(0,0,0,0)",
           style: { color: "#FFF" }
         },
         title: { text: "" },
         credits: { enabled: false },
         xAxis: {
           categories: this.monthcategorydg,
           labels: { rotation: 0, style: { color: "#FFF" } }
         },
         yAxis: {
           min: 0,
           title: { text: "" },
           labels: {
             style: { color: "#FFF" },
             formatter: function () {
               const value = Number(this.value); // Explicit type casting to number
               if (isNaN(value)) {
                 return "0"; // Default fallback for invalid or non-numeric values
               }
               if (value >= 1e7) return (value / 1e7).toFixed(2) + " Cr"; // Crore
               if (value >= 1e5) return (value / 1e5).toFixed(2) + " L";  // Lakh
               return value.toLocaleString(); // Default formatting
             }
             
           }
         },
         tooltip: {
           formatter: function () {
             const value = this.y !== null && this.y !== undefined
               ? this.y.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
               : '0';
             return `<b>${this.x}</b><br/>DG Unit: ${value}`;
           }
         },
         series: [
           {
           type: "area",
           name: "DG Unit",
           data: this.dgyearlydataUnits,
           showInLegend: false,
           color: {
             linearGradient: { x1: 0, y1: 1, x2: 0, y2: 0 },
             stops: [[0, "#00FFFF"], [1, "#419873"]]
           },
           dataLabels: {
             enabled: true,
             formatter: function () {
               const value = this.y; // 'this.y' is the correct way to access the value in data labels
               if (value === null || value === undefined) {
                 return "0"; // Default fallback for null or undefined
               }
               if (value >= 1e7) return (value / 1e7).toFixed(2) + " Cr"; // Crore
               if (value >= 1e5) return (value / 1e5).toFixed(2) + " L";  // Lakh
               return value.toLocaleString(); // Default formatting
             },
             style: { color: "#FFF" }
           }
   
         }]
       };
     
       const chartContainer = document.querySelector("#yearly-consumption-dg") as HTMLElement;
       if (chartContainer) {
         this.chart = Highcharts.chart(chartContainer, this.chartOptions);
       } else {
         console.error("Chart container for DG not found.");
       }
     }
   }
   