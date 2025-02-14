import { AfterViewInit, Component, Inject, OnInit, PLATFORM_ID, ViewChild } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import { createGrid, GridApi, GridOptions, GridReadyEvent } from 'ag-grid-community';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import * as XLSX from 'xlsx';
import { ActivatedRoute, Router } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { MeterService } from './meter.service';
import { SharedService } from '../shared.service';

@Component({
  selector: 'app-meter-status',
  standalone: true,
  imports: [HeaderComponent,CommonModule],
  templateUrl: './meter-status.component.html',
  styleUrl: './meter-status.component.scss'
})
export class MeterStatusComponent implements OnInit,AfterViewInit {

  private gridApi!: GridApi;
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

  constructor(private dataService: MeterService,@Inject(PLATFORM_ID) private platformId: Object,private route: ActivatedRoute,private router: Router,private sharedService: SharedService
){}
loading :boolean = false
sourcecomponent :string =''


  ngOnInit(): void {
    // Get initial value from URL query params
    this.route.queryParams.subscribe((params) => {
      if (!this.sourcecomponent) {
        // Only set from queryParams if the component hasn't been set from the header
        //console.log(params)
        this.sourcecomponent = params['source'] || 'control'; // Default to 'control' if not set
        this.runComponentLogic();
      }
    });

    // Listen to changes from the header (SharedService)
    this.sharedService.selectedProject$.subscribe((project) => {
      if (project) {
        this.sourcecomponent = project;
        this.runComponentLogic(); // Re-run component logic when project changes
        this.updateUrl(); // Update URL to reflect the new sourceComponent

      }
    });
  }
  private updateUrl(): void {
    // Update the URL without reloading the page
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { source: this.sourcecomponent },
      queryParamsHandling: 'merge', // Merge with other existing query params if any
    });
  }
  private runComponentLogic(): void {
    //console.log('Running logic for:', this.sourcecomponent);

    // Call appropriate methods based on the source component
    if (this.sourcecomponent === 'control') {
      this.getmeter_Statustotal();
  } 
  else if(this.sourcecomponent === 'pvvnl'|| 'npcl' || 'torrent'||'amr') {
    this.getmeter_Status()
  }
 
  }

  getmeter_Status() {
    this.loading = true
    this.dataService.getData_Meter_dashboard(this.sourcecomponent).subscribe(meter => {
      this.meterdata = meter.data;
      this.typedata = this.transformResponse(meter.data);
      this.loading = false
      if (this.typedata === null || this.typedata.length === 0) {
        this.typedata = [];
      } else {
        // Calculate totals
        // const totalsRow =  this.createTotalsRow(this.meterdata);
  
        // // Add totals row to the end of the data
        // this.typedata.push(totalsRow);
  
        if (this.gridApi) {
          this.gridApi.setGridOption("rowData", this.typedata);
        }
      }
    });
  }


  getmeter_Statustotal() {
    this.loading = true;

    this.dataService.getData_Meter_dashboard(this.sourcecomponent).subscribe(
      (response) => {
        //console.log(response)
        const combinedMeterData = {
          totalMeterCount: 0,
          totalInfraMeterCount: 0,
          totalInstallMeterCount: 0,
          totalInfra: 0,
          totalThreePhase: 0,
          totalSinglePhase: 0,
          totalAEW: 0,
          totalGENUS: 0,
          totalCT: 0,
          totalHPL: 0,
          totalWOQ: 0,
        };

        let combinedTypedata: any[] = [];

        // Combine meter data values
        combinedMeterData.totalMeterCount += response.data.totalMeterCount || 0;
        combinedMeterData.totalInfraMeterCount += response.data.totalInfraMeterCount || 0;
        combinedMeterData.totalInstallMeterCount += response.data.totalInstallMeterCount || 0;
        combinedMeterData.totalInfra += response.data.totalInfra || 0;
        combinedMeterData.totalThreePhase += response.data.totalThreePhase || 0;
        combinedMeterData.totalSinglePhase += response.data.totalSinglePhase || 0;
        combinedMeterData.totalAEW += response.data.totalAEW || 0;
        combinedMeterData.totalGENUS += response.data.totalGENUS || 0;
        combinedMeterData.totalCT += response.data.totalCT || 0;
        combinedMeterData.totalHPL += response.data.totalHPL || 0;
        combinedMeterData.totalWOQ += response.data.totalWOQ || 0;

        // Combine table data
        const transformedData = this.transformResponse(response.data);
        combinedTypedata = combinedTypedata.concat(transformedData);

        this.meterdata = combinedMeterData;
  

        this.loading = false;
        if (combinedTypedata.length === 0) {
          this.typedata = [];
        } else {
          this.typedata = combinedTypedata;
          if (this.gridApi) {
            this.gridApi.setGridOption('rowData',this.typedata);
          }
        }
        this.loading = false
        //console.log(this.meterdata);
        //console.log(combinedTypedata);
      },
    );
  }
 
  createTotalsRow(meterdata: any): any {
    return {
      count: 'Total',  // Label for the totals row
      site_name: '',   // Leave blank or put some text like 'Totals'
      site_id: '',
      woq: meterdata.totalWOQ || 0,
      meter_count: meterdata.totalMeterCount || 0,
      infra_meter_count: meterdata.totalInfraMeterCount || 0,
      metercount: meterdata.totalInstallMeterCount || 0,
      infra_count: meterdata.totalInfra || 0,
      three_phase_count: meterdata.totalThreePhase || 0,
      single_phase_count: meterdata.totalSinglePhase || 0,
      aew_count: meterdata.totalAEW || 0,
      hpl_count: meterdata.totalHPL || 0,
      genus_count: meterdata.totalGENUS || 0,
      ct_count: meterdata.totalCT || 0
    };
  }
 
  @ViewChild('agGrid', { static: false }) agGrid!: AgGridAngular;

  typedata: any[] = [];
  noData: boolean = false;
  public gridOptions: GridOptions = {
    columnDefs: [
      { field: 'site_name', headerName: 'Site Name',minWidth:250 },
      { field: 'woq', headerName: 'W.O.QTY',minWidth:150 },
      { field: 'meter_count', headerName: 'Total Meter',minWidth:150 },
      { field: 'infra_meter_count', headerName: 'Infra Installed',minWidth:150 },
      { field: 'metercount', headerName: 'Installed Meter',minWidth:170 },
      { field: 'infra_count', headerName: 'Infra Meters',cellDataType:'text',minWidth:150 },
      { field: 'three_phase_count', headerName: '3 Phase',minWidth:150 },
      { field: 'single_phase_count', headerName: '1 Phase',minWidth:150 },
      { field: 'aew_count', headerName: 'AEW',minWidth:150 },
      { field: 'hpl_count', headerName: 'HPL',minWidth:150 },
      { field: 'genus_count', headerName: 'GENUS',minWidth:150 },
      { field: 'ct_count', headerName: 'CT',minWidth:150 },
    ],
    defaultColDef: {
      sortable: true,
      filter: true,
      resizable: true,
      flex: 1
    },
    enableCellTextSelection:true,
    pagination: true,
    paginationPageSize: 10,
    paginationPageSizeSelector:[10,20,50,100],
    onGridReady: (params: GridReadyEvent) => {
      this.gridApi = params.api;
      this.gridApi.sizeColumnsToFit();
    }
  };
  
  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const eGridDiv = document.querySelector<HTMLElement>('#myGrid')!;
      createGrid(eGridDiv, this.gridOptions);
    }
  }
transformResponse(response: any): any[] {
  const transformedData: any[] = [];
  const length = response.site_name?.length || 0; // Assuming all arrays have the same length

  for (let i = 0; i < length; i++) {
    transformedData.push({
      site_name: response.site_name?.[i] || '',  // Access array elements safely
      site_id: response.site_id?.[i] || '',
      woq: parseInt(response.woq?.[i]) || 0,  // Parse as integer if needed
      meter_count: response.meter_count?.[i] || 0,
      infra_meter_count: response.infra_meter_count?.[i] || 0,
      metercount: response.metercount?.[i] || 0,
      infra_count: parseInt(response.infra_count?.[i]) || 0,  // Explicitly handle nulls with parsing
      three_phase_count: response.three_phase_count?.[i] || 0,
      single_phase_count: response.single_phase_count?.[i] || 0,
      aew_count: response.aew_count?.[i] || 0,
      hpl_count: response.hpl_count?.[i] || 0,  // Safely access empty arrays
      genus_count: response.genus_count?.[i] || 0,
      ct_count: response.ct_count?.[i] || 0,
    });
  }

  return transformedData;
}

  
  onFilterTextBoxChanged() {
    this.gridApi.setGridOption(
      "quickFilterText",
      (document.getElementById("filter-text-box") as HTMLInputElement).value,
    );
  }

  onExport(format: string): void {
    if (this.gridApi) {
      if (format === 'csv') {
        this.gridApi.exportDataAsCsv();
      } else if (format === 'xlsx') {
        this.exportToExcel(`meter-data-${this.sourcecomponent.toUpperCase}.xlsx`);
      }
    }
  }

  exportToExcel(fileName: string): void {
    if (this.gridApi) {
      const rowData: any[] = [];
      this.gridApi.forEachNode((node) => {
        if (node.data) {
          rowData.push(node.data);
        }
      });

      const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(rowData);
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

      XLSX.writeFile(wb, fileName);
    }
  }
  
}
