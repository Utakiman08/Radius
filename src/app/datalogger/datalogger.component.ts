import {
  Component,
  AfterViewInit,
  Inject,
  PLATFORM_ID,
  HostListener,
} from "@angular/core";
import { CommonModule, isPlatformBrowser } from "@angular/common";
import { HeaderComponent } from "../header/header.component";
import { FooterComponent } from "../footer/footer.component";
import { DataloggerService } from "./datalogger.service";
 import {  createGrid,  GridOptions,  GridReadyEvent} from "ag-grid-community";
import * as XLSX from "xlsx";
import { ActivatedRoute, Router } from "@angular/router";
import { forkJoin } from "rxjs";
import { SharedService } from "../shared.service";
declare var $: any; // Declare jQuery for Select2

@Component({
  selector: "app-datalogger",
  templateUrl: "./datalogger.component.html",
  styleUrls: ["./datalogger.component.scss"],
  standalone: true,
  imports: [
    CommonModule,
    FooterComponent,
    HeaderComponent,
   ],
})
export class DataloggerComponent implements AfterViewInit {

  private gridApi: any;
  private modalGridApi : any;


  loading : boolean = false
  
  data: {
    dl_count?: string;
    connected_dl?: string;
    connected_dl_ND?: string;
    maintanance_dl?: string;
    faulty_dl?: string;
    disconnected_dl_ND?: string;
    disconnected_dl?: string;
  } = {};
  typedata: any[] = [];
  types: string[] = [
    "Total",
    "ConnectedDL",
    "DisconnectedDL",
    "MaintenanceDL",
    "GetfaultyDL",
    "ConnectedDLND",
  ];

  currentType:string = ''

 
  public gridOptions: GridOptions = {
    columnDefs: [
      { field: "id", headerName: "ID", minWidth: 270, valueFormatter: this.nullValueFormatter },
      { field: "site_name", headerName: "Site Name", minWidth: 300, cellRenderer: 'agAnimateShowChangeCellRenderer', 
        // cellStyle: { cursor: 'pointer' },
        //  onCellClicked: (params: any) => this.onSiteIdClick(params),
          valueFormatter: this.nullValueFormatter },
      { field: "short_code", headerName: "Short Code", minWidth: 150, valueFormatter: this.nullValueFormatter },
      { field: "name", headerName: "Name", minWidth: 400, valueFormatter: this.nullValueFormatter },
      { field: "serial_number", headerName: "Serial Number", cellDataType: 'text', minWidth: 150, valueFormatter: this.nullValueFormatter },
      { field: "SIM1_mobile_no", headerName: "SIM1 Mobile No", minWidth: 160, valueFormatter: this.nullValueFormatter },
      { field: "SIM1_SRNO", headerName: "SIM1 SR no", minWidth: 170, valueFormatter: this.nullValueFormatter },
      { field: "last_modified_time", headerName: "Last Modified Time", minWidth: 190, valueFormatter: this.nullValueFormatter },
      { field: "gateway_id", headerName: "Gateway ID", minWidth: 170, valueFormatter: this.nullValueFormatter },
      { field: "csq_signal_strength", headerName: "CSQ Signal Strength", minWidth: 180, valueFormatter: this.nullValueFormatter },
      { field: "connected", headerName: "Connected", minWidth: 130, valueFormatter: this.nullValueFormatter },
      { field: "status", headerName: "Status", minWidth: 130, valueFormatter: this.nullValueFormatter },
      // { field: "license", headerName: "License", minWidth: 150, valueFormatter: this.nullValueFormatter },
    ],
    defaultColDef: {
      sortable: false,
      filter: true,
      resizable: true,
      flex: 1,
     },
  
    enableCellTextSelection: true,
    pagination: true,
    paginationPageSize: 10,
    paginationPageSizeSelector: [10, 20, 50, 100],
  
    onGridReady: (params: GridReadyEvent) => {
      this.gridApi = params.api;
    },
  };
  
  // Formatter function to set "----" if value is null or empty
  nullValueFormatter(params: any): string {
    return params.value === null || params.value === "" ? "----" : params.value;
  }
  

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.sizeToFit();
  }
  sizeToFit(): void {
    if (this.gridApi) {
      this.gridApi.sizeColumnsToFit();
    }
  }
  sourceComponent!: string // Store the source component

  constructor(
    private apiDatalogger: DataloggerService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private route: ActivatedRoute,private router: Router,private sharedService: SharedService
    
  ) {}
  siteid:any
  Sitename:string =''
  sites: { name: string, siteId: string }[] = [];
  sitedata:any

  getsitedata(sourceComponent:string){
    this.apiDatalogger.getSiteName(sourceComponent).subscribe(data=>{
      this.sitedata = data;
      this.sites = data?.map((item:any) => ({name: item.name,siteId:item.siteId}));
       console.log(this.sites)
    })
  }
  selectedSiteId:string =''
  seletedSite(event: Event){
    const selectElement = event.target as HTMLSelectElement;
    this.selectedSiteId = selectElement.value;
    console.log(this.selectedSiteId)
    if (this.selectedSiteId ==='') {
      this.getselectedSiteIdData(this.currentType,'ALL')
    }
    else{
      this.getselectedSiteIdData(this.currentType,this.selectedSiteId); 
    }  }


  getselectedSiteIdData(type: string,site:string=''){
    this.loading = true;

       this.apiDatalogger.getDataByType(type, site, this.sourceComponent).subscribe(response => {
        let flattenedResponse = response.data;
  
        // Check if the response is a single object and not an array
        if (!Array.isArray(flattenedResponse)) {
          flattenedResponse = [flattenedResponse];
        }
  
       if (flattenedResponse && flattenedResponse.length > 0) {
          this.selectedSiteData = flattenedResponse;
          this.noData = false;
        } else {
          this.selectedSiteData = []
          this.noData = true;
        }
  
        if (this.gridApi) {
          this.gridApi.setGridOption('rowData', this.selectedSiteData);  // Set the row data for the grid
          this.gridApi.refreshCells({ force: true });  // Force cell refresh
        }
  
        this.loading = false;
       });
   }
  ngOnInit(): void {
     this.route.queryParams.subscribe((params) => {
      if (!this.sourceComponent) {
        // Only set from queryParams if the component hasn't been set from the header
        this.Sitename = params['SiteName']
        this.sourceComponent = params['source'] || 'control'; // Default to 'control' if not set
        this.siteid = sessionStorage.getItem(`${this.sourceComponent.toUpperCase()}siteId`)

        this.runComponentLogic();
      }
    });
    if(!this.Sitename){
      sessionStorage.removeItem(`${this.sourceComponent.toUpperCase()}siteId`)
    }
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
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { source: this.sourceComponent },
      queryParamsHandling: 'merge', // Merge with other existing query params if any
    });
  }
  private runComponentLogic(): void {

      if (this.sourceComponent === 'control') {
        this.fetchDatatotal(); // Load total data
        this.fetchDataByTypetotal('Total');
      } 
      else if(this.sourceComponent === 'pvvnl'|| 'npcl' || 'torrent'||'amr') {
        if (this.siteid) {
          console.log('siteidcrunnig')
           this.fetchDataAndType('Total',this.siteid); // Load specific typed data
        }
        else{
          // console.log('else running')
          this.getsitedata(this.sourceComponent)
           this.fetchDataAndType('Total'); // Load specific typed data
        }
      } 
  }




  fetchDataByTypetotal(type: string): void {
    this.currentType = type
    this.loading = true
    const requests = [
      this.apiDatalogger.getDataByType(type,'ALL','pvvnl'),
      this.apiDatalogger.getDataByType(type,'ALL','npcl'),
      this.apiDatalogger.getDataByType(type,'ALL','torrent'),
      this.apiDatalogger.getDataByType(type,'ALL','amr')

    ];
  
    forkJoin(requests).subscribe(responses => {
      // //console.log('Responses from all three APIs:', responses); // Debugging line
      let flattenedResponse =  responses.map(responses=> responses.data).flat(2);

      // Check if the response is a single object and not an array
      if (!Array.isArray(flattenedResponse)) {
        flattenedResponse = [flattenedResponse];
      }
      this.typedata = flattenedResponse;
      if (this.gridApi) {
        this.gridApi.setGridOption("rowData", this.typedata);
      }
      this.loading = false
    });
  }
  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const eGridDiv = document.querySelector<HTMLElement>("#myGrid")!;
      createGrid(eGridDiv, this.gridOptions);
    }
    $('#siteSelector').select2({
      placeholder: 'Select a site',
      allowClear: true,
    });
    $('#siteSelector').on('change', (event: any) => {
      this.seletedSite(event);
    });
  }

 
  private sumValues(...values: (number | undefined)[]): number {
    return values.reduce((acc:any, val) => acc + (val || 0), 0);
  }
fetchDatatotal(): void {
  this.loading = true
  forkJoin({
    apidata1: this.apiDatalogger.getBaseData('pvvnl'),
    apidata2: this.apiDatalogger.getBaseData('npcl'),
    apidata3: this.apiDatalogger.getBaseData('torrent'),
    apidata4: this.apiDatalogger.getBaseData('amr')
  }).subscribe(responses => {
    this.data = {
      dl_count: (this.sumValues(
        Number(responses.apidata1.data?.dl_count),
        Number(responses.apidata2.data?.dl_count),
        Number(responses.apidata3.data?.dl_count),
        Number(responses.apidata4.data?.dl_count)        
      )).toString(),
      connected_dl: (this.sumValues(
        Number(responses.apidata1.data?.connected_dl),
        Number(responses.apidata2.data?.connected_dl),
        Number(responses.apidata3.data?.connected_dl),
        Number(responses.apidata4.data?.connected_dl)        
      )).toString(),
      connected_dl_ND: (this.sumValues(
        Number(responses.apidata1.data?.connected_dl_ND),
        Number(responses.apidata2.data?.connected_dl_ND),
        Number(responses.apidata3.data?.connected_dl_ND),
        Number(responses.apidata4.data?.connected_dl_ND)        
      )).toString(),
      maintanance_dl: (this.sumValues(
        Number(responses.apidata1.data?.maintanance_dl),
        Number(responses.apidata2.data?.maintanance_dl),
        Number(responses.apidata3.data?.maintanance_dl),
        Number(responses.apidata4.data?.maintanance_dl)        
      )).toString(),
      faulty_dl: (this.sumValues(
        Number(responses.apidata1.data?.faulty_dl),
        Number(responses.apidata2.data?.faulty_dl),
        Number(responses.apidata3.data?.faulty_dl),
        Number(responses.apidata4.data?.faulty_dl)        
      )).toString(),
      disconnected_dl_ND: (this.sumValues(
        Number(responses.apidata1.data?.disconnected_dl_ND),
        Number(responses.apidata2.data?.disconnected_dl_ND),
        Number(responses.apidata3.data?.disconnected_dl_ND),
        Number(responses.apidata4.data?.disconnected_dl_ND)        
      )).toString(),
      disconnected_dl: (this.sumValues(
        Number(responses.apidata1.data?.disconnected_dl),
        Number(responses.apidata2.data?.disconnected_dl),
        Number(responses.apidata3.data?.disconnected_dl),
        Number(responses.apidata4.data?.disconnected_dl)        
      )).toString()
    };
    this.loading = false
  });
}

fetchDataAndType(type: string,siteId: string = ''): void {
  this.loading = true; // Start the loader

  let baseDataObservable;
  let typeDataObservable;

  // Set up observables based on conditions
  if (siteId && this.Sitename) {
    baseDataObservable = this.apiDatalogger.getBaseData(this.sourceComponent, siteId);
    typeDataObservable = this.apiDatalogger.getDataByType(type, siteId, this.sourceComponent);
  } else {
    baseDataObservable = this.apiDatalogger.getBaseData(this.sourceComponent);
    typeDataObservable = this.apiDatalogger.getDataByType(type, 'ALL', this.sourceComponent);
  }

  // Combine the observables using forkJoin
  forkJoin([baseDataObservable, typeDataObservable]).subscribe(
    ([baseDataResponse, typeDataResponse]) => {
      // Handle the first API response
      this.data = baseDataResponse.datalogger || baseDataResponse.data;

      // Handle the second API response
      let flattenedResponse = typeDataResponse.data;
      if (!Array.isArray(flattenedResponse)) {
        flattenedResponse = [flattenedResponse];
      }

      if (flattenedResponse && flattenedResponse.length > 0) {
        this.selectedSiteData = flattenedResponse;
        this.noData = false;
      } else {
        this.selectedSiteData = [];
        this.noData = true;
      }

      // Update grid data
      if (this.gridApi) {
        this.gridApi.setGridOption('rowData', this.selectedSiteData);
        this.gridApi.refreshCells({ force: true });
      }

      this.currentType = type;
      this.typedata = flattenedResponse || [];

      if (this.gridApi) {
        this.gridApi.setGridOption('rowData', this.typedata);
      }
    },
    (error) => {
      console.error('Error in API calls:', error);
      // Optionally handle errors
    },
    () => {
      this.loading = false; // Stop the loader when both API calls complete
    }
  );
}


 


  onCardClick(type: string){
    // //console.log('Card Clicked, Source Component:', this.sourceComponent);
    
    if (this.sourceComponent === 'control') {
      // //console.log('Fetching total data for type:', type);
      this.fetchDataByTypetotal(type); // Fetch total data
      this.fetchDatatotal();
    } 
    else if(this.sourceComponent === 'pvvnl'|| 'npcl' || 'torrent'||'amr') {
      // //console.log('Fetching regular data for type:', type);
      if (this.siteid) {
        // console.log('siteidcrunnig')
         this.fetchDataAndType(type,this.siteid); // Load specific typed data
      }
      else{
        this.fetchDataAndType(type); // Fetch regular data      
       }
    }
 
  }

  onFilterTextBoxChanged() {
    this.gridApi.setGridOption(
      "quickFilterText",
      (document.getElementById("filter-text-box") as HTMLInputElement).value
    );
  } 
  // onFilterTextBoxChangedmodal() {
  //   this.modalGridApi.setGridOption(
  //     "quickFilterText",
  //     (document.getElementById("filter-text-box-modal") as HTMLInputElement).value,
  //   );    
  // }
  onExport(format: string): void {
    if (this.gridApi) {
      if (format === 'csv') {
        this.gridApi.exportDataAsCsv({ fileName: `Datalogger_Data-${this.currentType}.csv` });
      } else if (format === 'xlsx') {
        this.exportToExcel(`Datalogger_Data-${this.currentType}.xlsx`);
      }
    }
  }

  exportToExcel(fileName: string): void {
    if (this.gridApi) {
      const rowData: any[] = [];
      this.gridApi.forEachNode((node:any) => {
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

  // onExportModal(format: string): void {
  //   if (this.modalGridApi ) {
  //     if (format === 'csv') {
  //       this.gridApi.exportDataAsCsv({ fileName: `Datalogger_Data_Site-${this.currentType}.csv` });
  //     } else if (format === 'xlsx') {
  //       this.exportToExcel(`Datalogger_Data_Site-${this.currentType}.xlsx`);
  //     }
  //   }
  // }

  solodata :any
  selectedSiteData:any[]=[]
  noData:boolean = true
  showModal:boolean = false


  // onSiteIdClick(params: any) {
  //   const type = this.currentType || 'Total';
  //   const siteId = params.data?.site_id;
  //   this.loading = true;
  
  //   // Check the sourceComponent to decide which logic to use
  //   if (this.sourceComponent === 'control') {
  //     // Use forkJoin to fetch data from multiple sources
  //     const requests = [
  //       this.apiDatalogger.getDataByType(type, siteId, 'pvvnl'),
  //       this.apiDatalogger.getDataByType(type, siteId, 'npcl'),
  //       this.apiDatalogger.getDataByType(type, siteId, 'torrent'),
  //       this.apiDatalogger.getDataByType(type, siteId, 'amr')
  //     ];
  
  //     forkJoin(requests).subscribe(responses => {
  //       let flattenedResponse = responses.flatMap(response => response.data);
  
  //       // Check if the response is a single object and not an array
  //       if (!Array.isArray(flattenedResponse)) {
  //         flattenedResponse = [flattenedResponse];
  //       }
  
  //       if (flattenedResponse && flattenedResponse.length > 0) {
  //         this.selectedSiteData = flattenedResponse;
  //         this.noData = false;
  //       } else {
  //         this.selectedSiteData =[]
  //         this.noData = true;
  //       }
  
  //       if (this.modalGridApi) {
  //         this.modalGridApi.setGridOption('rowData', this.selectedSiteData);  // Set the row data for the grid
  //         this.modalGridApi.refreshCells({ force: true });  // Force cell refresh
  //       }
        
  //       this.loading = false;
  //       this.showModal = true;  // Show the modal
  //     });
  //   } 
  //   else if(this.sourceComponent === 'pvvnl'|| 'npcl' || 'torrent'|| 'amr') {
  //     // Use the previous single API call logic
  //     this.apiDatalogger.getDataByType(type, siteId, this.sourceComponent).subscribe(response => {
  //       let flattenedResponse = response.data;
  
  //       // Check if the response is a single object and not an array
  //       if (!Array.isArray(flattenedResponse)) {
  //         flattenedResponse = [flattenedResponse];
  //       }
  
  //       if (flattenedResponse && flattenedResponse.length > 0) {
  //         this.selectedSiteData = flattenedResponse;
  //         this.noData = false;
  //       } else {
  //         this.noData = true;
  //       }
  
  //       if (this.modalGridApi) {
  //         this.modalGridApi.setGridOption('rowData', this.selectedSiteData);  // Set the row data for the grid
  //         this.modalGridApi.refreshCells({ force: true });  // Force cell refresh
  //       }
  
  //       this.loading = false;
  //       this.showModal = true;  // Show the modal
  //     });
  //   }
  
  //   // Ensure columns are resized after data is set
  //   setTimeout(() => {
  //     if (this.modalGridApi) {
  //       this.modalGridApi.sizeColumnsToFit();  // Ensure columns are resized after data is set
  //     }
  //   }, 0);
  
  //   const eGridDivmodal = document.querySelector<HTMLElement>('#myModalGrid');
    
  //   if (eGridDivmodal && !this.modalGridApi) {
  //     createGrid(eGridDivmodal, this.gridOptions2);  // Create the grid if not already created
  //   }
  // }
  // hideModal(): void {
  //   this.showModal = false;
  //   this.noData = false;
  // }

  // public gridOptions2: GridOptions = {
  //   columnDefs: [
  //     { field: "id", headerName: "ID", minWidth: 270, valueFormatter: this.nullValueFormatter },
  //     { field: "site_name", headerName: "Site Name", minWidth: 300, cellRenderer: 'agAnimateShowChangeCellRenderer', cellStyle: { cursor: 'pointer' }, onCellClicked: (params: any) => this.onSiteIdClick(params), valueFormatter: this.nullValueFormatter },
  //     { field: "short_code", headerName: "Short Code", minWidth: 150, valueFormatter: this.nullValueFormatter },
  //     { field: "name", headerName: "Name", minWidth: 400, valueFormatter: this.nullValueFormatter },
  //     { field: "serial_number", headerName: "Serial Number", cellDataType: 'text', minWidth: 150, valueFormatter: this.nullValueFormatter },
  //     { field: "SIM1_mobile_no", headerName: "SIM1 Mobile No", minWidth: 160, valueFormatter: this.nullValueFormatter },
  //     { field: "SIM1_SRNO", headerName: "SIM1 SR no", minWidth: 170, valueFormatter: this.nullValueFormatter },
  //     { field: "last_modified_time", headerName: "Last Modified Time", minWidth: 190, valueFormatter: this.nullValueFormatter },
  //     { field: "gateway_id", headerName: "Gateway ID", minWidth: 170, valueFormatter: this.nullValueFormatter },
  //     { field: "csq_signal_strength", headerName: "CSQ Signal Strength", minWidth: 180, valueFormatter: this.nullValueFormatter },
  //     { field: "connected", headerName: "Connected", minWidth: 130, valueFormatter: this.nullValueFormatter },
  //     { field: "status", headerName: "Status", minWidth: 130, valueFormatter: this.nullValueFormatter },
  //   ],
  //   defaultColDef: {
  //     sortable: true,
  //     filter: true,
  //     resizable: true,
  //     flex: 1
  //   },
  //   enableCellTextSelection:true,
  //   pagination: true,
  //   paginationPageSize: 10,
  //   paginationPageSizeSelector:[10,20,50,100],
  //   onGridReady: (params: GridReadyEvent) => {
  //     this.modalGridApi = params.api;
  //     this.modalGridApi.sizeColumnsToFit(); // Load default data
  //   }
  // };
}
