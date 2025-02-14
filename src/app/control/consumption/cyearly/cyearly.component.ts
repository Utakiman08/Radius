import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as Highcharts from 'highcharts';
import { DataService as DataServiceNPCL } from '../../../project2/data.service';
import { DataService as DataServicePVVNL } from '../../../project3/data.service';
import { DataService as DataServiceTorrent } from '../../../project4/data.service';
import { DataService as DataServiceAMR } from '../../../project-amr/data.service';
import { yeargrid, yeardg, TestingDatayear } from '../data.model';
import { forkJoin, interval, skip, Subscription, switchMap } from 'rxjs';
import { IntervalService } from '../../../interval.service';

@Component({
  selector: 'app-cyearly',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cyearly.component.html',
  styleUrls: ['./cyearly.component.scss']
})

export class CyearlyComponent implements OnInit, OnDestroy {
  loading: boolean = false;
  chart!: Highcharts.Chart;
  Highcharts: typeof Highcharts = Highcharts;
  chartOptions: Highcharts.Options = {};
  private subscription: Subscription | null = null;
  private autoRefreshSubscription: Subscription | null = null;

  availableYears: string[] = [];
  selectedYear!: string;
 
  gridDatayear!: yeargrid;
  dgDatayear!: yeardg;

  gridyearlydataUnits: any[] = [];
  gridyearlydataAmounts: any[] = [];
  dgyearlydataUnits: any[] = [];
  dgyearlydataAmounts: any[] = [];
  monthcategorygrid: any[] = [];
  monthcategorydg: any[] = [];
  command!: Subscription
  IntervalCommand!: Subscription
  activeConsumptionChart: string = "grid";
  show: boolean = false;

  monthNames = [
    "Jan", "Feb", "March", "April", "May", "June",
    "July", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  constructor(
    private dataServiceNPCL: DataServiceNPCL,
    private dataServicePVVNL: DataServicePVVNL,
    private dataServiceTorrent: DataServiceTorrent,
    private dataServiceAMR: DataServiceAMR,

    private cdr: ChangeDetectorRef,
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
    this.availableYears = Array.from({ length: 5 }, (_, k) => String(currentYear - k));
    this.selectedYear = String(currentYear);
    this.loadDataFromsessionStorage(); // Load from session storage or API
    this.setupAutoUpdate(); // Set up auto-update for data refresh
    this.checkScreenWidth();
    this.triggerCommand();
  }

  triggerCommand() {
    this.command = this.timer.Update$.pipe(skip(1)).subscribe(() => {
      this.loaddatayear();
    });
  }
  formatToLakhCrore(value: number): string {
    if (value >= 10000000) {
      return (value / 10000000).toFixed(2) + ' Cr'; // Convert to crore
    } else if (value >= 100000) {
      return (value / 100000).toFixed(2) + ' L'; // Convert to lakh
    }
    return value.toString(); // Display the original value for smaller numbers
  }
  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    if (this.autoRefreshSubscription) {
      this.autoRefreshSubscription.unsubscribe();
    }
    if (this.command) {
      this.command.unsubscribe();
    }
  }
  newallresponsedata:any

  // Set up auto-refresh to update data every 5 minutes
  setupAutoUpdate() {
    // Clear the previous subscription, if any
    if (this.autoRefreshSubscription) {
      this.autoRefreshSubscription.unsubscribe();
      console.log('Previous autoRefreshSubscription cleared');
    }
  
    if (this.IntervalCommand) {
      this.IntervalCommand.unsubscribe();
      console.log('Previous IntervalCommand cleared');
    }
    // Set up the new subscription
    this.IntervalCommand = this.timer.interval$.subscribe((updateInterval) => {
      // Clear the previous auto-refresh subscription, if any
      if (this.autoRefreshSubscription) {
        this.autoRefreshSubscription.unsubscribe();
        console.log('Previous auto-refresh interval cleared before setting a new one');
      }
  
      // Set up a new interval-based auto-refresh
      this.autoRefreshSubscription = interval(updateInterval)
        .pipe(
          switchMap(() =>
            forkJoin([
              this.dataServiceAMR.getData_consumption_Yearly(this.selectedYear),
              this.dataServicePVVNL.getData_consumption_Yearly(this.selectedYear),
              this.dataServiceNPCL.getData_consumption_Yearly(this.selectedYear),
              this.dataServiceTorrent.getData_consumption_Yearly(this.selectedYear),
            ])
          )
        )
        .subscribe((newData: TestingDatayear[]) => {
          newData.forEach(newData => {
            newData.resource?.grid.month.forEach((month:any, index) => {
              let monthIndex = newData.resource?.grid.month.indexOf(month);

              if (monthIndex === -1) {
                this.combinedData.resource?.grid.month.push(month);
                this.combinedData.resource?.grid.unit.push(parseFloat(newData.resource?.grid.unit[index]));
                this.combinedData.resource?.grid.amount.push(parseFloat(newData.resource?.grid.amount[index]));
                this.combinedData.resource?.dg.month.push(month);
                this.combinedData.resource?.dg.unit.push(parseFloat(newData.resource?.dg.unit[index]));
                this.combinedData.resource?.dg.amount.push(parseFloat(newData.resource?.dg.amount[index]));
              } else {
                this.combinedData.resource.grid.unit[monthIndex] += parseFloat(newData.resource?.grid.unit[index]);
                this.combinedData.resource.grid.amount[monthIndex] += parseFloat(newData.resource?.grid.amount[index]);
                this.combinedData.resource.dg.unit[monthIndex] += parseFloat(newData.resource?.dg.unit[index]);
                this.combinedData.resource.dg.amount[monthIndex] += parseFloat(newData.resource?.dg.amount[index]);
              }
            });
          });        
          this.newallresponsedata= this.combinedData
        this.processYearlyData(this.newallresponsedata , true)
        });
    });
  }

          // Helper function to compare session data with new data
  isDataDifferent(oldData: TestingDatayear | null, newData: TestingDatayear): boolean {
    if (!oldData) {
      return true; // If oldData is null, new data is considered different
    } 
  
    // Implement a detailed comparison logic if necessary, or use JSON string comparison
    return JSON.stringify(oldData) !== JSON.stringify(newData);
  }
          
  storedData:any

        loadDataFromsessionStorage() {
          this.storedData = sessionStorage.getItem(`Control-${this.selectedYear}`);
          let sessionData: TestingDatayear;
        
          if (this.storedData) {
            sessionData = JSON.parse(this.storedData);
            this.processYearlyData(sessionData); // Render session data initially
          }
          
        
          this.loaddatayear();
        }

  allresponsedata:any
  private combinedData: {
    rc: number;
    message: string;
    resource: {
      grid: {
        month: string[];
        unit: number[];
        amount: number[];
      };
      dg: {
        month: string[];
        unit: number[];
        amount: number[];
      };
    };
  } = {
    rc: 0,
    message: "Success",
    resource: {
      grid: {
        month: [],
        unit: [],
        amount: [],
      },
      dg: {
        month: [],
        unit: [],
        amount: [],
      },
    },
  };
  loaddatayear() {
    this.loading = true;
    
    const requests = [
      this.dataServiceNPCL.getData_consumption_Yearly(this.selectedYear),
      this.dataServicePVVNL.getData_consumption_Yearly(this.selectedYear),
      this.dataServiceTorrent.getData_consumption_Yearly(this.selectedYear),
      this.dataServiceAMR.getData_consumption_Yearly(this.selectedYear),
    ];
  
    this.subscription = forkJoin(requests).subscribe((responses: TestingDatayear[]) => {

      
  
      responses.filter(res => res && res.resource).forEach(response => {
        if (response.resource?.grid && response.resource?.grid.month) {
          response.resource?.grid.month.forEach((month: any, index) => {
                  let monthIndex = this.combinedData.resource?.grid.month.indexOf(month);
          
          if (monthIndex === -1) {
            this.combinedData.resource?.grid.month.push(month);
            this.combinedData.resource?.grid.unit.push(parseFloat(response.resource?.grid.unit[index]));
            this.combinedData.resource?.grid.amount.push(parseFloat(response.resource?.grid.amount[index]));
            this.combinedData.resource?.dg.month.push(month);
            this.combinedData.resource?.dg.unit.push(parseFloat(response.resource?.dg.unit[index]));
            this.combinedData.resource?.dg.amount.push(parseFloat(response.resource?.dg.amount[index]));
          } else {
            this.combinedData.resource.grid.unit[monthIndex] += parseFloat(response.resource?.grid.unit[index]);
            this.combinedData.resource.grid.amount[monthIndex] += parseFloat(response.resource?.grid.amount[index]);
            this.combinedData.resource.dg.unit[monthIndex] += parseFloat(response.resource?.dg.unit[index]);
            this.combinedData.resource.dg.amount[monthIndex] += parseFloat(response.resource?.dg.amount[index]);
          }
        });
    }});
 
      this.allresponsedata = this.combinedData
      const isDifferent = this.isDataDifferent(this.storedData,this.allresponsedata)
      if (isDifferent) {
      this.storedData = sessionStorage.setItem(`Control-${this.selectedYear}`, JSON.stringify(this.combinedData));
      this.processYearlyData(this.allresponsedata, false);
      }
      this.loading = false;
    });
  }
  
        processYearlyData(data: TestingDatayear, isAutoUpdate: boolean = false) {
          this.gridDatayear = data.resource?.grid;
          this.dgDatayear = data.resource?.dg;
        
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
    if (this.activeConsumptionChart === 'grid') {
      if (this.chart && this.chart.series[0]) {
        this.chart.series[0].setData(this.gridyearlydataAmounts, true); // Update grid chart
      }
    } else if (this.activeConsumptionChart === 'dg') {
      if (this.chart && this.chart.series[0]) {
        this.chart.series[0].setData(this.dgyearlydataAmounts, true); // Update DG chart
      }
    }
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

  // Update the grid chart
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
      series: [{
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
