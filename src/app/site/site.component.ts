import { AfterViewInit, Component, Inject, OnInit, PLATFORM_ID, ViewChild } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from "../footer/footer.component";
import { SiteService } from './site.service';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import * as XLSX from 'xlsx';
import { GridApi, GridOptions, GridReadyEvent,createGrid } from 'ag-grid-community';
import { forkJoin } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { AgGridAngular } from 'ag-grid-angular';
import { SharedService } from '../shared.service';


interface RowData {
  id: string;
  short_code: string;
  application: string;
  name: string;
  no_of_tenent: string;
  communication: string;
  admin_status: string;
  project_id: string | null;
  supervisor_name: string;
  supervisor_contact_no: string;
  active_cut_off: string;
  battery_available: string;
  license: string | null;
}

@Component({
  selector: 'app-site',
  templateUrl: './site.component.html',
  styleUrls: ['./site.component.scss'],
  standalone: true,
  imports: [HeaderComponent, FooterComponent, CommonModule]
})
export class SiteComponent implements OnInit, AfterViewInit {
  @ViewChild('agGrid', { static: false }) agGrid!: AgGridAngular;
@ViewChild('modalAgGrid', { static: false }) modalAgGrid!: AgGridAngular;

private gridApi!: GridApi;
loading:boolean=false
  data: {
    live_count?: number,
    maintenance_count?: number,
    other?: number,
    sodality_count?: number,
    // Adwards?: number,
    radius_count?: number,
    active_cut_Y_count?: number,
    active_cut_N_count?: number,
    closed_count?: number,
    aipl_count?:number,
    site_count?:number
  } = {};

  typedata: RowData[] = [];

  public gridOptions: GridOptions = {
    columnDefs: [
      { headerName: 'Name', field: 'name', suppressSizeToFit: true, cellRenderer: 'agAnimateShowChangeCellRenderer', cellStyle: { cursor: 'pointer' }, onCellClicked: (params: any) => this.onSiteIdClick(params), minWidth: 250, valueFormatter: this.nullValueFormatter },
      { headerName: 'Short Code', field: 'short_code', minWidth: 150, valueFormatter: this.nullValueFormatter },
      { headerName: 'Application', field: 'application', minWidth: 150, valueFormatter: this.nullValueFormatter },
      { headerName: 'No.of Consumers', field: 'no_of_tenent', minWidth: 170, valueFormatter: this.nullValueFormatter },
      { headerName: 'Communication', field: 'communication', minWidth: 160, valueFormatter: this.nullValueFormatter },
      { headerName: 'Admin Status', field: 'admin_status', minWidth: 150, valueFormatter: this.nullValueFormatter },
      // { headerName: 'Project ID', field: 'project_id', minWidth: 120, valueFormatter: this.nullValueFormatter },
      { headerName: 'Supervisor Name', field: 'supervisor_name', minWidth: 180, valueFormatter: this.nullValueFormatter },
      { headerName: 'Supervisor No', field: 'supervisor_contact_no', minWidth: 150, valueFormatter: this.nullValueFormatter },
      { headerName: 'Active Cut Off', field: 'active_cut_off', minWidth: 170, valueFormatter: this.nullValueFormatter },
      { headerName: 'Battery Available', field: 'battery_available', minWidth: 170, valueFormatter: this.nullValueFormatter },
      { headerName: 'License', field: 'license', minWidth: 100, valueFormatter: this.nullValueFormatter }
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
    paginationPageSizeSelector: [10, 20, 50, 100],
    onGridReady: (params: GridReadyEvent) => {
      this.gridApi = params.api;
      this.gridApi.sizeColumnsToFit();
    }
  };
  
  // Formatter function to set "----" if value is null or empty
  nullValueFormatter(params: any): string {
    return params.value === null || params.value === "" ? "----" : params.value;
  }
  
    sizeToFit(): void {
      if (this.gridApi) {
        this.gridApi.sizeColumnsToFit();
      }
    }

  constructor(private apiService: SiteService, @Inject(PLATFORM_ID) private platformId: Object,private route: ActivatedRoute,private router : Router,private sharedService: SharedService) {}

  ngOnInit(): void {
    // Get initial value from URL query params
    this.route.queryParams.subscribe((params) => {
      if (!this.sourceComponent) {
        // Only set from queryParams if the component hasn't been set from the header
        this.sourceComponent = params['source'] || 'control'; // Default to 'control' if not set
        //console.log(this.sourceComponent)
        this.runComponentLogic();
      }
    });
    this.currentDisplayType = 'Live'

    // Listen to changes from the header (SharedService)
    this.sharedService.selectedProject$.subscribe((project) => {
      if (project) {
        this.sourceComponent = project;
        this.runComponentLogic(); // Re-run component logic when project changes
        this.updateUrl(); // Update URL to reflect the new sourceComponent

      }
    });
  }
  private updateUrl(): void {
    // Update the URL without reloading the page
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { source: this.sourceComponent },
      queryParamsHandling: 'merge', // Merge with other existing query params if any
    });
  }
  private runComponentLogic(): void {

    // Call appropriate methods based on the source component
      if (this.sourceComponent === 'control') {
        this.fetchDatatotal(); // Load total data
        this.fetchDataByTypetotal('Live');}
        else if(this.sourceComponent === 'pvvnl'|| 'npcl' || 'torrent'||'amr') {
         this.fetchDataAndType('Live'); // Load specific typed data
      }
  }

 
  fetchDatatotal(): void {
    this.loading = true
    forkJoin({
      apidata1: this.apiService.getBaseData('pvvnl'),
      apidata2: this.apiService.getBaseData('npcl'),
      apidata3: this.apiService.getBaseData('torrent'),
      apidata4: this.apiService.getBaseData('amr')
    }).subscribe(responses => {
      this.data = { 
        live_count: this.sumValues(responses.apidata1.data?.live_count, responses.apidata2.data?.live_count, responses.apidata3.data?.live_count , responses.apidata4.data?.live_count),
        maintenance_count: this.sumValues(responses.apidata1.data?.maintenance_count, responses.apidata2.data?.maintenance_count, responses.apidata3.data?.maintenance_count , responses.apidata4.data?.maintenance_count),
        other: this.sumValues(responses.apidata1.data?.other, responses.apidata2.data?.other, responses.apidata3.data?.other , responses.apidata4.data?.other),
        sodality_count: this.sumValues(responses.apidata1.data?.sodality_count, responses.apidata2.data?.sodality_count, responses.apidata3.data?.sodality_count , responses.apidata4.data?.sodality_count),
        aipl_count: this.sumValues(responses.apidata1.data?.aipl_count, responses.apidata2.data?.aipl_count, responses.apidata3.data?.aipl_count , responses.apidata4.data?.aipl_count),
        radius_count: this.sumValues(responses.apidata1.data?.radius_count, responses.apidata2.data?.radius_count, responses.apidata3.data?.radius_count , responses.apidata4.data?.radius_count),
        active_cut_Y_count: this.sumValues(responses.apidata1.data?.active_cut_Y_count, responses.apidata2.data?.active_cut_Y_count, responses.apidata3.data?.active_cut_Y_count , responses.apidata4.data?.active_cut_Y_count),
        active_cut_N_count: this.sumValues(responses.apidata1.data?.active_cut_N_count, responses.apidata2.data?.active_cut_N_count, responses.apidata3.data?.active_cut_N_count , responses.apidata4.data?.active_cut_N_count),
        closed_count: this.sumValues(responses.apidata1.data?.closed_count, responses.apidata2.data?.closed_count, responses.apidata3.data?.closed_count , responses.apidata4.data?.closed_count),
        site_count: this.sumValues(responses.apidata1.data?.site_count, responses.apidata2.data?.site_count, responses.apidata3.data?.site_count , responses.apidata4.data?.site_count),
      };
      this.loading=false
    });
  }
  
  // Helper method to handle summing and default value handling
  private sumValues(...values: (number | undefined)[]): number {
    return values.reduce((acc:any, val) => acc + (val || 0), 0);
  }
  
  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const eGridDiv = document.querySelector<HTMLElement>('#myGrid')!;
      createGrid(eGridDiv, this.gridOptions);
    }
  }

 
  fetchDataAndType(type: string): void {
    this.loading = true; // Start the loader
  
    // Combine the two API calls into observables
    const baseDataObservable = this.apiService.getBaseData(this.sourceComponent);
    const typeDataObservable = this.apiService.getDataByType(type, 'ALL', this.sourceComponent);
  
    // Use forkJoin to execute both API calls simultaneously and wait for their completion
    forkJoin([baseDataObservable, typeDataObservable]).subscribe(
      ([baseDataResponse, typeDataResponse]) => {
        // Process the first API response
        this.data = baseDataResponse.data;
  
        // Process the second API response
        this.currentType = type;
        let flattenedResponse = typeDataResponse.data;
  
        // Check if the response is a single object and not an array
        if (!Array.isArray(flattenedResponse)) {
          flattenedResponse = [flattenedResponse];
        }
        this.typedata = flattenedResponse;
  
        if (this.typedata === null || this.typedata.length === 0) {
          this.typedata = [];
        }
  
        // Update grid data if available
        if (this.gridApi) {
          this.gridApi.setGridOption('rowData', this.typedata);
        }
      },
      (error) => {
        console.error('Error in API calls:', error);
        // Optionally handle errors here
      },
      () => {
        this.loading = false; // Stop the loader when both API calls complete
      }
    );
  }
  
  
fetchDataByTypetotal(type: string): void {
  this.loading=true
  const requests = [
    this.apiService.getDataByType(type,'ALL','pvvnl'),
    this.apiService.getDataByType(type,'ALL','npcl'),
    this.apiService.getDataByType(type,'ALL','torrent'),
    this.apiService.getDataByType(type,'ALL','amr')

  ];
  this.currentType = type;
  forkJoin(requests).subscribe(responses => {
    // //console.log('Responses from all three APIs:', responses); // Debugging line
    let flattenedResponse =  responses.map(responses=> responses.data).flat(2);
    this.loading=false
    // Check if the response is a single object and not an array
    if (!Array.isArray(flattenedResponse)) {
      flattenedResponse = [flattenedResponse];
    }
    this.typedata = flattenedResponse;
    if (this.gridApi) {
      this.gridApi.setGridOption("rowData", this.typedata);
    }
  });
}

sourceComponent!: string // Store the source component

onCardClick(type: string){
  //console.log('Card Clicked, Source Component:', this.sourceComponent);
  if (type) {
    switch (type) {
      case 'Maintenance':
        this.currentDisplayType = 'Maintenance';
        break;
      case 'Live':
        this.currentDisplayType = 'Live';
        break;
      case 'other':
        this.currentDisplayType = 'Other';
        break;
      case 'Society':
        this.currentDisplayType = 'Society';
        break;
      case 'Adwards':
        this.currentDisplayType = 'AIPL';
        break;
      case 'Radius':
        this.currentDisplayType = 'Radius';
        break;
      case 'active_cut_off_Y':
        this.currentDisplayType = 'Active Cut Off Y';
        break;
      case 'active_cut_off_N':
        this.currentDisplayType = 'Active Cut Off N';
        break;
      case 'Operation_Closed':
        this.currentDisplayType = 'Operation Closed';
        break;
      default:
        this.currentDisplayType = '---';
    }
  }
  if (this.sourceComponent === 'control') {
    // //console.log('Fetching total data for type:', type);
    this.fetchDataByTypetotal(type); // Fetch total data
    this.fetchDatatotal()
  }
  else if(this.sourceComponent === 'pvvnl'|| 'npcl' || 'torrent'||'amr') {
    // //console.log('Fetching regular data for type:', type);
    this.fetchDataAndType(type); // Fetch regular data
   }
}
  


onFilterTextBoxChanged() {
  this.gridApi.setGridOption(
    "quickFilterText",
    (document.getElementById("filter-text-box") as HTMLInputElement).value,
  );
}
onFilterTextBoxChangedmodal() {
  this.modalGridApi.setGridOption(
    "quickFilterText",
    (document.getElementById("filter-text-box-modal") as HTMLInputElement).value,
  );    
}
  onExport(format: string): void {
    if (this.gridApi) {
      if (format === 'csv') {
        this.gridApi.exportDataAsCsv({ fileName: 'Site_Data.csv' });
      } else if (format === 'xlsx') {
        this.exportToExcel('Site_Data.xlsx');
      }
    }
  }

  exportToExcel(fileName: string): void {
    if (this.gridApi) {
      const rowData: RowData[] = [];
      this.gridApi.forEachNode(node => {
        if (node.data) {
          rowData.push(node.data);
        }
      });

      const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(rowData);
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

      XLSX.writeFile(wb, fileName);
    }
  }
  onExportModal(format: string): void {
    if (this.modalGridApi ) {
      if (format === 'csv') {
        this.gridApi.exportDataAsCsv({ fileName: 'Site_Data-Site.csv' });
      } else if (format === 'xlsx') {
        this.exportToExcel('Site_Data-Site.xlsx');
      }
    }
  }



  currentDisplayType:string='';

  currentType:string = '';
  selectedSiteData:any[]=[];
 noData:boolean=true;
 modalGridApi:any;
 showModal:boolean=false;

 onSiteIdClick(params: any) {
  const type = this.currentType || 'Total';
  const siteId = params.data?.id;
  this.loading = true;
  //console.log(siteId)
  // Check the sourceComponent to decide which logic to use
  if (this.sourceComponent === 'control') {
    // Use forkJoin to fetch data from multiple sources
    const requests = [
      this.apiService.getDataByType(type, siteId, 'pvvnl'),
      this.apiService.getDataByType(type, siteId, 'npcl'),
      this.apiService.getDataByType(type, siteId, 'torrent'),
      this.apiService.getDataByType(type, siteId, 'amr')
    ];

    forkJoin(requests).subscribe(responses => {
      let flattenedResponse = responses.flatMap(response => response.data);

      // Check if the response is a single object and not an array
      if (!Array.isArray(flattenedResponse)) {
        flattenedResponse = [flattenedResponse];
      }

      if (flattenedResponse && flattenedResponse.length > 0) {
        this.selectedSiteData = flattenedResponse;
        this.noData = false;
      } else {
        this.noData = true;
      }

      if (this.modalGridApi) {
        this.modalGridApi.setGridOption('rowData', this.selectedSiteData);  // Set the row data for the grid
        this.modalGridApi.refreshCells({ force: true });  // Force cell refresh
      }
      
      this.loading = false;
      this.showModal = true;  // Show the modal
    });
  } 
  else if(this.sourceComponent === 'pvvnl'|| 'npcl' || 'torrent'||'amr') {
    // Use the previous single API call logic
    this.apiService.getDataByType(type, siteId, this.sourceComponent).subscribe(response => {
      let flattenedResponse = response.data;

      // Check if the response is a single object and not an array
      if (!Array.isArray(flattenedResponse)) {
        flattenedResponse = [flattenedResponse];
      }

      if (flattenedResponse && flattenedResponse.length > 0) {
        this.selectedSiteData = flattenedResponse;
        this.noData = false;
      } else {
        this.noData = true;
      }

      if (this.modalGridApi) {
        this.modalGridApi.setGridOption('rowData', this.selectedSiteData);  // Set the row data for the grid
        this.modalGridApi.refreshCells({ force: true });  // Force cell refresh
      }

      this.loading = false;
      this.showModal = true;  // Show the modal
    });
  }

  // Ensure columns are resized after data is set
  setTimeout(() => {
    if (this.modalGridApi) {
      this.modalGridApi.sizeColumnsToFit();  // Ensure columns are resized after data is set
    }
  }, 0);

  const eGridDivmodal = document.querySelector<HTMLElement>('#myModalGrid');
  
  if (eGridDivmodal && !this.modalGridApi) {
    createGrid(eGridDivmodal, this.gridOptions2);  // Create the grid if not already created
  }
}
  hideModal(): void {
    this.showModal = false;
    this.noData = false;
  }

  public gridOptions2: GridOptions = {
    columnDefs: [
      { headerName: 'Name', field: 'name', suppressSizeToFit: true, cellRenderer: 'agAnimateShowChangeCellRenderer', cellStyle: { cursor: 'pointer' }, onCellClicked: (params: any) => this.onSiteIdClick(params), minWidth: 250, valueFormatter: this.nullValueFormatter },
      { headerName: 'Short Code', field: 'short_code', minWidth: 150, valueFormatter: this.nullValueFormatter },
      { headerName: 'Application', field: 'application', minWidth: 150, valueFormatter: this.nullValueFormatter },
      { headerName: 'No.of Consumers', field: 'no_of_tenent', minWidth: 170, valueFormatter: this.nullValueFormatter },
      { headerName: 'Communication', field: 'communication', minWidth: 160, valueFormatter: this.nullValueFormatter },
      { headerName: 'Admin Status', field: 'admin_status', minWidth: 150, valueFormatter: this.nullValueFormatter },
      { headerName: 'Project ID', field: 'project_id', minWidth: 120, valueFormatter: this.nullValueFormatter },
      { headerName: 'Supervisor Name', field: 'supervisor_name', minWidth: 180, valueFormatter: this.nullValueFormatter },
      { headerName: 'Supervisor No', field: 'supervisor_contact_no', minWidth: 150, valueFormatter: this.nullValueFormatter },
      { headerName: 'Active Cut Off', field: 'active_cut_off', minWidth: 170, valueFormatter: this.nullValueFormatter },
      { headerName: 'Battery Available', field: 'battery_available', minWidth: 170, valueFormatter: this.nullValueFormatter },
      { headerName: 'License', field: 'license', minWidth: 100, valueFormatter: this.nullValueFormatter }
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
      this.modalGridApi = params.api;
      this.modalGridApi.sizeColumnsToFit();
    }
  };




}
