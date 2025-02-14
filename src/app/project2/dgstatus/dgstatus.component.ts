import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { DataService } from '../data.service';
import { Subscription } from 'rxjs';
import {  createGrid,  GridOptions,  GridReadyEvent} from "ag-grid-community";
import { IntervalService } from '../../interval.service';

@Component({
  selector: 'app-dgstatusp1',
  templateUrl: './dgstatus.component.html',
  styleUrl: './dgstatus.component.scss',
  standalone:true,
  imports:[CommonModule]
})

export class DgstatusComponent implements OnInit, OnDestroy {
  data: [] = [];
  private ApexCharts: any;
  private chart: any;  // Reference to the chart instance
  loading: boolean = false;
  private intervalId: any;  // To store interval reference
  private subscribe: Subscription|null = null
  constructor(@Inject(PLATFORM_ID) private platformId: Object, private dgstatus: DataService,
  private timer : IntervalService
) {}
  private command!: Subscription
  private timerCommand!:Subscription
  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadApexCharts();
      this.getDgStatus();  // Initial load with lo  ader
      this.setPeriodicUpdate();  // Set up periodic updates
      this.getTriggerCommand();
    }
  }

  getTriggerCommand(){
    this. command = this.timer.Update$.subscribe(()=>{
      this.getDgStatus()
    })
  }
  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
    this.data = [];
    if (this.subscribe) {
      this.subscribe.unsubscribe()
    }
    // Clear interval when component is destroyed
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    if (this.command) {
      this.command.unsubscribe();
    }    
    if (this.timerCommand) {
      this.timerCommand.unsubscribe();
    }    
    }

  async loadApexCharts() {
    this.ApexCharts = (await import('apexcharts')).default;
  }

  public gridOptions: GridOptions = {
    columnDefs: [
      { field: 'name', headerName: 'Site Name', minWidth: 300, valueFormatter: this.nullValueFormatter },
      { field: 'serial_no', headerName: 'Serial No', minWidth: 150, valueFormatter: this.nullValueFormatter },
      { field: 'location_no', headerName: 'Location No', minWidth: 160, valueFormatter: this.nullValueFormatter },
      { field: 'dic_id', headerName: 'DIC ID', minWidth: 270, valueFormatter: this.nullValueFormatter },
      { field: 'dic_port', headerName: 'DIC Port', minWidth: 100, valueFormatter: this.nullValueFormatter },
      //{ field: 'grid_reading', headerName: 'Grid Reading', minWidth: 150, valueFormatter: this.nullValueFormatter },
      { field: 'state', headerName: 'State', minWidth: 150, valueFormatter: this.nullValueFormatter },
      { field: 'admin_status', headerName: 'Admin Status', minWidth: 150, valueFormatter: this.nullValueFormatter },
      { field: 'last_reading_updated_dg', headerName: 'Last Reading Updated DG', minWidth: 230, valueFormatter: this.nullValueFormatter }
    ],
    defaultColDef: {
      sortable: true,
      filter: true,
      resizable: true,
      flex: 1,
      suppressMovable: true
    },
    enableCellTextSelection: true,
    pagination: true,
    paginationPageSize: 10,
    paginationPageSizeSelector:[10,20,50,100],
    onGridReady: (params: GridReadyEvent) => {
      this.gridApi = params.api;
      this.gridApi.sizeColumnsToFit();
    }
  };
  nullValueFormatter(params: any): string {
    return params.value === null || params.value === "" ? "----" : params.value;
  }
  ngAfterViewInit(): void {
    const eGridDiv = document.querySelector<HTMLElement>('#myGridNPCL')!;
    createGrid(eGridDiv, this.gridOptions);
  }

  private gridApi: any;
  public typedata: any[] = [];
  showModal: boolean = false;

  ShowModal() {
    // Reset only if modal is not already open
    if (!this.showModal) {
      this.currentType = '15min'; // Default type
      this.fetchDataByType(this.currentType); // Load default data
    }
    this.showModal = true;
  }
  hideModal(): void {
    this.showModal = !this.showModal;
  }

  private array15min: any[] = [];
  private array30min: any[] = [];
  private array60minbelow: any[] = [];
  private array60minabove: any[] = [];

  processData(data: any): void {
    this.array15min = data['15min'];
    this.array30min = data['30min'];
    this.array60minbelow = data['60min_below'];
    this.array60minabove = data['60min_above'];
    const count15min = data['15min_count'];
    const count30min = data['30min_count'];
    const count60minbelow = data['60min_count_below'];
    const count60minabove = data['60min_count_above'];
    //console.log(this.array15min);
    this.updateGridData(this.array15min);
    this.updateChart(count15min, count30min, count60minbelow,count60minabove);  // Update chart without re-rendering
  }

  updateGridData(dataArray: any[]): void {
    if (this.gridApi) {
      this.gridApi.setGridOption("rowData", dataArray);
    }
  }

  currentType: '15min' | '30min' | '60min' | '>60min' = '15min'; // Default to '15min'

  fetchDataByType(type: '15min' | '30min' | '60min' | '>60min'): void {
    this.currentType = type; // Track the selected data type
    let selectedData: any[];
  
    switch (type) {
      case '15min':
        selectedData = this.array15min;
        break;
      case '30min':
        selectedData = this.array30min;
        break;
      case '60min':
        selectedData = this.array60minbelow;
        break;
      case '>60min':
        selectedData = this.array60minabove;
        break;
      default:
        selectedData = [];
        break;
    }
  
    this.updateGridData(selectedData);
  }



  getDgStatus(): void {
    this.loading = true;  // Show loader for initial load
    this.subscribe = this.dgstatus.getData_DgStatus().subscribe(data => {
      this.processData(data);
      this.loading = false;  // Hide loader once data is loaded
    });
  }

  // Set periodic update without showing loader
  setPeriodicUpdate(): void {
    this.timerCommand = this.timer.interval$.subscribe((updateInterval)=>{
      if (this.intervalId) {
        clearInterval(this.intervalId)
      }
      this.intervalId = setInterval(() => {
        this.dgstatus.getData_DgStatus().subscribe(data => {
          this.processData(data);  // Update chart with new data
        });
      },updateInterval);  // Update every 5 minutes
    })

  }

  updateChart(count15min: number, count30min: number, count60min: number,aboveCountmin:number): void {
    if (this.chart) {
      this.chart.updateSeries([{
        name: 'Count',
        data: [count15min, count30min, count60min,aboveCountmin]
      }]);
    } else {
      this.initChart(count15min, count30min, count60min,aboveCountmin);
    }
  }

  // Initialize chart for the first time
  initChart(count15min: number, count30min: number, count60min: number, aboveCountmin: number): void {
    const dg_status = {
      series: [{
        name: 'Count',
        data: [count15min, count30min, count60min , aboveCountmin]
      }],
      chart: {
        type: 'bar',
        height: '100%',
        toolbar: {
          show: false,
        }
      },
      plotOptions: {
        bar: {
          columnWidth: '80%',
        },
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        width: 0,
      },
      colors: ["var(--primary-color)"],
      xaxis: {
        categories: ['0-15', '15-30', '30-60' ,'> 60'],
        title: {
          text: 'Time (in min)',  // Add title for x-axis
          style: {
            color: "#FFFFFF",
            fontSize: '12px',
            fontWeight: 300,
          }
        },
        labels: {
          show: true,
          style: {
            colors: "#8c9097",
            fontSize: '11px',
            fontWeight: 600,
            cssClass: 'apexcharts-xaxis-label',
          },
        }
      },
      yaxis: {
        title: {
          text: undefined
        },
        labels: {
          show: true,
          style: {
            colors: "#8c9097",
            fontSize: '11px',
            fontWeight: 600,
            cssClass: 'apexcharts-yaxis-label',
          },
        }
      },
      tooltip: {
        shared: false,
        y: {
          formatter: function (val: number) {
            return val;
          }
        }
      },
      fill: {
        type: 'pattern',
        opacity: 1,
        pattern: {
          style: ['horizontalLines', 'horizontalLines', 'horizontalLines'],
          width: 6,
          height: 6
        }
      },
      legend: {
        show: false,
      }
    };
  
    this.chart = new ApexCharts(document.querySelector("#dg_status"), dg_status);
    this.chart.render();
  }
}
