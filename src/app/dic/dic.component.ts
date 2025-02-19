import { Component, OnInit, Inject, PLATFORM_ID, AfterViewInit, HostListener } from '@angular/core';
import { DicService } from './dic.service';
 import { ColDef, createGrid, GridOptions, GridReadyEvent } from 'ag-grid-community';
import { FooterComponent } from '../footer/footer.component';
import { HeaderComponent } from '../header/header.component';
import * as XLSX from 'xlsx';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { forkJoin } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { SharedService } from '../shared.service';
import { PdfmakeService } from '../pdfmake.service';
declare var $: any; // Declare jQuery for Select2

@Component({
  selector: 'app-dic',
  standalone: true,
  imports: [HeaderComponent,FooterComponent, CommonModule],
  templateUrl: './dic.component.html',
  styleUrl: './dic.component.scss'
})
export class DicComponent implements OnInit,AfterViewInit {

  showModal: boolean = false;
  selectedSiteData: {
    site_name:string[]
    name:string[]
    status:string[]
    dtataLoggerid:string[]
    dicid:string[]
    tower_name:string[]
    dic_name:string[]
    datetime:string[]
    remark:string[]
  }[] = [];
  noData: boolean = false;
  currentType: string = '';
  private gridApi: any;
  private modalGridApi: any; // Separate reference for modal grid
  data: { dic_count?: number, dic_healthy?: number, dic_faulty?: number, dic_maintenance?: number, other?: number, dic_unhealthy?: number } = {};
  typedata: {
    id:string,
    data_logger_id:string,
    site_id:string,
    total_site:string,
    name:string,
    tower_name:string,
    site_name:string,
    site_short_code:string,
    supervisor_name:string,
    admin_status:string,
    remark:string,
  }[] = [];  types: string[] = ["Healthy", "Unhealthy", "Maintenance", "Faulty", "Total"];




  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
  };


  public gridOptions: GridOptions = {
    columnDefs: [
      { field: 'id', headerName: 'id', minWidth: 270, valueFormatter: this.nullValueFormatter },
      { field: 'site_name', headerName: 'Site Name', minWidth: 250, cellRenderer: 'agAnimateShowChangeCellRenderer',
        //  cellStyle: { cursor: 'pointer' },
          // onCellClicked: (params: any) => this.onSiteIdClick(params),
           valueFormatter: this.nullValueFormatter },
      { field: 'data_logger_id', headerName: 'Datalogger Id', minWidth: 270, valueFormatter: this.nullValueFormatter },
      { field: 'communication', headerName: 'Communication', minWidth: 170, valueFormatter: this.nullValueFormatter },
      { field: 'name', headerName: 'Name', minWidth: 250, valueFormatter: this.nullValueFormatter },
      { field: 'tower_name', headerName: 'Tower Name', minWidth: 150, valueFormatter: this.nullValueFormatter },
      { field: 'gateway_id', headerName: 'Gateway id', cellDataType: 'text', minWidth: 150, valueFormatter: this.nullValueFormatter },
      { field: 'last_data_received', headerName: 'Last Data Receiver', minWidth: 180, valueFormatter: this.nullValueFormatter },
      { field: 'admin_status', headerName: 'Admin Status', minWidth: 150, valueFormatter: this.nullValueFormatter }
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
  


  // public gridOptions2: GridOptions = {
  //   columnDefs: [
  //     { field: 'id', headerName: 'id', minWidth: 270, valueFormatter: this.nullValueFormatter },
  //     { field: 'site_name', headerName: 'Site Name', minWidth: 250, cellRenderer: 'agAnimateShowChangeCellRenderer', cellStyle: { cursor: 'pointer' }, onCellClicked: (params: any) => this.onSiteIdClick(params), valueFormatter: this.nullValueFormatter },
  //     { field: 'data_logger_id', headerName: 'Datalogger Id', minWidth: 270, valueFormatter: this.nullValueFormatter },
  //     { field: 'communication', headerName: 'Communication', minWidth: 170, valueFormatter: this.nullValueFormatter },
  //     { field: 'name', headerName: 'Name', minWidth: 250, valueFormatter: this.nullValueFormatter },
  //     { field: 'tower_name', headerName: 'Tower Name', minWidth: 150, valueFormatter: this.nullValueFormatter },
  //     { field: 'gateway_id', headerName: 'Gateway id', cellDataType: 'text', minWidth: 150, valueFormatter: this.nullValueFormatter },
  //     { field: 'last_data_received', headerName: 'Last Data Receiver', minWidth: 180, valueFormatter: this.nullValueFormatter },
  //     { field: 'admin_status', headerName: 'Admin Status', minWidth: 150, valueFormatter: this.nullValueFormatter }
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

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.sizeToFit();
  }
  sizeToFit(): void {
    if (this.gridApi) {
      this.gridApi.sizeColumnsToFit();
    }
  }
  constructor(private apiDIC: DicService,@Inject(PLATFORM_ID) private platformId: Object,private route: ActivatedRoute,private router: Router,private sharedService: SharedService,private pdfService:PdfmakeService) { }




  loading:boolean  = false
  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const eGridDiv = document.querySelector<HTMLElement>('#myGrid')!;
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
siteid:any
  sourceComponent!: string // Store the source component
  Sitename:string =''
  sites: { name: string, siteId: string }[] = [];
  sitedata:any


  getsitedata(sourceComponent:string){
    this.apiDIC.getSiteName(sourceComponent).subscribe(data=>{
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
    }
  }

  getselectedSiteIdData(type: string,site:string=''){
    this.loading = true;

       this.apiDIC.getDataByType(type, site, this.sourceComponent).subscribe(response => {
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
    // Get initial value from URL query params
    // console.log(this.siteid)
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
    // Update the URL without reloading the page
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { source: this.sourceComponent },
      queryParamsHandling: 'merge', // Merge with other existing query params if any
    });
  }
  private runComponentLogic(): void {
    //console.log('Running logic for:', this.sourceComponent);
    
    // Call appropriate methods based on the source component
      if (this.sourceComponent === 'control') {
        if (this.siteid) {
          this.fetchDatatotal(); // Load total data
          this.fetchDataByTypetotal('Total');
        }
        this.fetchDatatotal(); // Load total data
        this.fetchDataByTypetotal('Total');
      }
      else if(this.sourceComponent === 'pvvnl'|| 'npcl' || 'torrent'||'amr') {
        if (this.siteid) {
          // console.log('siteidcrunnig')
           this.fetchDataAndType('Total',this.siteid); // Load specific typed data
        }
        else{
          this.getsitedata(this.sourceComponent)
           this.fetchDataAndType('Total'); // Load specific typed data
        }

      }
  }



  
  private sumValues(...values: (number | undefined)[]): number {
    return values.reduce((acc:any, val) => acc + (val || 0), 0);
  }

  fetchDatatotal(): void {
    forkJoin({
      apidata1: this.apiDIC.getBaseData('pvvnl'),
      apidata2: this.apiDIC.getBaseData('npcl'),
      apidata3: this.apiDIC.getBaseData('torrent'),
      apidata4: this.apiDIC.getBaseData('amr')

    }).subscribe((responses) => {
      // Access the data from each response and sum the values
      this.data = {
        dic_count: this.sumValues(
          Number(responses.apidata1.data?.dic_count),
          Number(responses.apidata2.data?.dic_count),
          Number(responses.apidata3.data?.dic_count),
          Number(responses.apidata4.data?.dic_count)
        ),
        dic_healthy: this.sumValues(
          Number(responses.apidata1.data?.dic_healthy),
          Number(responses.apidata2.data?.dic_healthy),
          Number(responses.apidata3.data?.dic_healthy),
          Number(responses.apidata4.data?.dic_healthy)
        ),
        dic_faulty: this.sumValues(
          Number(responses.apidata1.data?.dic_faulty),
          Number(responses.apidata2.data?.dic_faulty),
          Number(responses.apidata3.data?.dic_faulty),
          Number(responses.apidata4.data?.dic_faulty)
        ),
        dic_maintenance: this.sumValues(
          Number(responses.apidata1.data?.dic_maintenance),
          Number(responses.apidata2.data?.dic_maintenance),
          Number(responses.apidata3.data?.dic_maintenance),
          Number(responses.apidata4.data?.dic_maintenance)
        ),
        dic_unhealthy: this.sumValues(
          Number(responses.apidata1.data?.dic_unhealthy),
          Number(responses.apidata2.data?.dic_unhealthy),
          Number(responses.apidata3.data?.dic_unhealthy),
          Number(responses.apidata4.data?.dic_unhealthy)
        )
      };
      this.loading=false
    });
  }
  
  fetchDataByTypetotal(type: string): void {
    this.currentType = type
    this.loading = true
    const requests = [
      this.apiDIC.getDataByType(type,'ALL','pvvnl'),
      this.apiDIC.getDataByType(type,'ALL','npcl'),
      this.apiDIC.getDataByType(type,'ALL','torrent'),
      this.apiDIC.getDataByType(type,'ALL','amr')

    ];  
    forkJoin(requests).subscribe(responses => {
      let flattenedResponse =  responses.map(responses=> responses.data).flat(2);

      // Check if the response is a single object and not an array
      if (!Array.isArray(flattenedResponse)) {
        flattenedResponse = [flattenedResponse];
      }
      this.typedata = flattenedResponse
      if (this.gridApi) {
        this.gridApi.setGridOption("rowData", this.typedata);
      }
      this.loading = false
    });
  }

 
  fetchDataAndType(type: string , siteId: string = '',): void {
    this.loading = true; // Start the loader
  
    let baseDataObservable;
    let typeDataObservable;
  
    // Set up observables based on conditions
    if (siteId && this.Sitename) {
      baseDataObservable = this.apiDIC.getBaseData(this.sourceComponent, siteId);
      typeDataObservable = this.apiDIC.getSiteDataById(siteId, type, this.sourceComponent);
    } else {
      baseDataObservable = this.apiDIC.getBaseData(this.sourceComponent);
      typeDataObservable = this.apiDIC.getDataByType(type, 'ALL', this.sourceComponent);
    }
  
    // Combine the observables using forkJoin
    forkJoin([baseDataObservable, typeDataObservable]).subscribe(
      ([baseDataResponse, typeDataResponse]) => {
        // Handle the first API response
        this.data = baseDataResponse.dic || baseDataResponse.data;
  
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
      (document.getElementById("filter-text-box") as HTMLInputElement).value,
    );    
  }
  // onFilterTextBoxChangedmodal() {
  //   this.modalGridApi.setGridOption(
  //     "quickFilterText",
  //     (document.getElementById("filter-text-box-modal") as HTMLInputElement).value,
  //   );    
  // }

  autoSizeAllColumns(): void {
    if (this.gridApi) {
      const allColumnIds: string[] = [];
      this.gridApi.getAllColumns().forEach((column: any) => {
        allColumnIds.push(column.getId());
      });
      this.gridApi.autoSizeColumns(allColumnIds);
    }
  }

  onFirstDataRendered(params: any): void {
    this.autoSizeAllColumns();
  }

  // onSiteIdClick(params: any) {
  //   const type = this.currentType || 'Total';
  //   const siteId = params.data?.site_id;
  //   this.loading = true;
  
  //   // Check the sourceComponent to decide which logic to use
  //   if (this.sourceComponent === 'control') {
  //     // Use forkJoin to fetch data from multiple sources
  //     const requests = [
  //       this.apiDIC.getDataByType(type, siteId, 'pvvnl'),
  //       this.apiDIC.getDataByType(type, siteId, 'npcl'),
  //       this.apiDIC.getDataByType(type, siteId, 'torrent'),
  //       this.apiDIC.getDataByType(type, siteId, 'amr'),

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
  //         this.noData = true;
  //       }
  
  //       if (this.modalGridApi) {
  //         this.modalGridApi.setGridOption('rowData', this.selectedSiteData);  // Set the row data for the grid
  //         this.modalGridApi.refreshCells({ force: true });  // Force cell refresh
  //       }
        
  //       this.loading = false;
  //       this.showModal = true;  // Show the modal
  //     });
  //   } else if(this.sourceComponent === 'pvvnl'|| 'npcl' || 'torrent'||'amr') {
  //     // Use the previous single API call logic
  //     this.apiDIC.getDataByType(type, siteId, this.sourceComponent).subscribe(response => {
  //       let flattenedResponse = response.data;
  
  //       // Check if the response is a single object and not an array
  //       if (!Array.isArray(flattenedResponse)) {
  //         flattenedResponse = [flattenedResponse];
  //       }
  
  //       if (flattenedResponse && flattenedResponse.length > 0) {
  //         this.selectedSiteData = flattenedResponse;
  //         this.noData = false;
  //       } else {
  //         this.selectedSiteData = []
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

  onExport(format: string): void {
    if (this.gridApi) {
      if (format === 'csv') {
        this.gridApi.exportDataAsCsv({ fileName: `DIC_Data-${this.currentType}.csv` });
      } else if (format === 'xlsx') {
        this.exportToExcel(`DIC_Data-${this.currentType}.xlsx`);
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

  generatepdf():void{
    this.pdfService.generatePDF(this.typedata,"DIC Report Data",["communication","site_id","gateway_id","remark"])
  }

  // onExportModal(format: string): void {
  //   if (this.modalGridApi ) {
  //     if (format === 'csv') {
  //       this.gridApi.exportDataAsCsv({ fileName: `DIC_Site_Data-${this.currentType}.csv` });
  //     } else if (format === 'xlsx') {
  //       this.exportToExcel(`DIC_Site_Data-${this.currentType}.xlsx`);
  //     }
  //   }
  // }

}
