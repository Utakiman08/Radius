import { Component, OnInit, ViewChild, HostListener, Inject, PLATFORM_ID, ChangeDetectorRef, AfterViewInit, OnDestroy } from '@angular/core';
import { SensorService } from './sensor.service';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AgGridAngular } from 'ag-grid-angular';
import {  createGrid,  GridOptions, GridReadyEvent } from 'ag-grid-community';
import * as XLSX from 'xlsx';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { SharedService } from '../shared.service';
declare var $: any; // Declare jQuery for Select2

@Component({
  selector: 'app-sensor',
  templateUrl: './sensor.component.html',
  styleUrls: ['./sensor.component.scss'],
  standalone: true,
  imports: [HeaderComponent, FooterComponent, CommonModule]
})
export class SensorComponent implements OnInit,AfterViewInit,OnDestroy {
  private gridApi: any;
  // private modalGridApi : any;
  // private modalGridApi: any; 
 offset:number = 0
  @ViewChild('agGrid', { static: false }) agGrid!: AgGridAngular;
  @ViewChild('modalAgGrid', { static: false }) modalAgGrid!: AgGridAngular;
  data: {
    sensor_count?: number,
    sensor_healthy?: number,
    sensor_zero_reading?: number,
    sensor_unhealthy?: number,
    sensor_faulty?:number,
    sensor_overload?: number,
    sensor_cut?: number,
    infra_count?:number ,
    sensor_maintenance?:number ,
    sensor_cut_dg?:number ,
    sensor_cut_grid?:number ,
    sensor_overload_grid?:number ,
    sensor_overload_dg?:number 
    
  } = {};
  loading: boolean = false;
  typedata: any[] = [];
  selectedSiteData: any[] = [];
  showModal: boolean = false;
  noData: boolean = false;
  types: string[] = [
    "Zero_reading", "Overload","Overload_dg","Overload_grid","Cut_meter_dg","Cut_meter_grid", "Cut_meter", "Unhealthy","Healthy","Maintenance","Faulty","Infra","Total"
  ];
  pagenateCommand:boolean = true
  totalRows:number = 0
  public gridOptions: GridOptions = {
    columnDefs: [
      { field: 'serial_no', headerName: 'Serial No', minWidth: 130, valueFormatter: this.nullValueFormatter },
      {
        field: 'site_name',
        headerName: 'Site Name',
        minWidth: 200,
        // cellRenderer: 'agAnimateShowChangeCellRenderer',
        // cellStyle: { cursor: 'pointer' },
        // onCellClicked: (params: any) => this.onSiteIdClick(params),
        valueFormatter: this.nullValueFormatter
      },
      { field: 'short_code', headerName: 'Short Code', minWidth: 150, valueFormatter: this.nullValueFormatter },
      { field: 'location_no', headerName: 'Location No', minWidth: 150, valueFormatter: this.nullValueFormatter },
      { field: 'location_id', headerName: 'Location ID', minWidth: 150, valueFormatter: this.nullValueFormatter },
      { field: 'admin_status', headerName: 'Admin Status', minWidth: 150, valueFormatter: this.nullValueFormatter },
      { field: 'dic_id', headerName: 'DIC ID', minWidth: 260, valueFormatter: this.nullValueFormatter },
      { field: 'dic_port', headerName: 'DIC Port', minWidth: 150, valueFormatter: this.nullValueFormatter },
      { field: 'last_reading_updated', headerName: 'Last Reading Updated', minWidth: 210, valueFormatter: this.nullValueFormatter },
      { field: 'state', headerName: 'State', minWidth: 150, valueFormatter: this.nullValueFormatter },
      { field: 'grid_reading', headerName: 'Grid Reading', minWidth: 150, valueFormatter: this.nullValueFormatter },
      { field: 'dg_reading', headerName: 'DG Reading', minWidth: 150, valueFormatter: this.nullValueFormatter },
    ],
    defaultColDef: {
      sortable: true,
      filter: true,
      resizable: true,
      flex: 1,
      suppressMovable: true,
    },
    enableCellTextSelection: true,
    pagination: true,
    paginationPageSize: 10,
    paginationPageSizeSelector: [10, 20, 50, 100],
    onGridReady: (params: GridReadyEvent) => {
      this.gridApi = params.api;
      this.gridApi.autoSizeColumns();
    },
    onPaginationChanged: () => this.onPaginationChanged(),
  };
  
  private onPaginationChanged(): void {
    if (this.gridApi) {
      const currentPage = this.gridApi.paginationGetCurrentPage();
      const totalPages = this.gridApi.paginationGetTotalPages();
      // Ensure there is more than one page before calling the function
      if (
        totalPages > 1 && // Check to avoid triggering on single-page data
        currentPage === totalPages - 1 &&
        !this.isQuickFilterActive &&
        !this.gridApi.isAnyFilterPresent() &&
        this.sourceComponent ==='amr' || this.sourceComponent === 'control'
      ) {
        this.fetchDataByTypeWithPagination(this.currentType,50000);
      }
    }
  }
  
  
  // Formatter function to set "----" if value is null or empty
  nullValueFormatter(params: any): string {
    return params.value === null || params.value === "" ? "----" : params.value;
  }
   
  
  currentType: string = 'Total';

  constructor(private apiSensor: SensorService,@Inject(PLATFORM_ID) private platformId: Object,private route: ActivatedRoute,private cdr:ChangeDetectorRef,private router: Router, private sharedService: SharedService) {}
  ngOnDestroy(): void {
    throw new Error('Method not implemented.');
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.sizeToFit();
  }

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
  sourceComponent!: string // Store the source component
  siteid:any
  Sitename:string =''
  sitedata:any
  sites: { name: string, siteId: string }[] = [];

  getsitedata(sourceComponent:string){
    this.apiSensor.getSiteName(sourceComponent).subscribe(data=>{
      this.sitedata = data;
      this.sites = data?.map((item:any) => ({name: item.name,siteId:item.siteId}));
      //  console.log(this.sites)
    })
  }
  selectedSiteId:string =''
  seletedSite(event: Event){
    const selectElement = event.target as HTMLSelectElement;
    this.selectedSiteId = selectElement.value;
    const currentTypeToUse = this.currentType === "Total" ? "Total_2" : this.currentType;
    console.log(this.selectedSiteId)
    
    if (this.selectedSiteId ==='') {
      this.getselectedSiteIdData(this.currentType,'ALL')
    }
    else{
      this.getselectedSiteIdData(currentTypeToUse,this.selectedSiteId,50000);
    }  
  }

  ngOnInit(): void {
     this.route.queryParams.subscribe((params) => {
      if (!this.sourceComponent) {
        this.Sitename = params['SiteName']
        this.sourceComponent = params['source'] || 'control'; // Default to 'control' if not set
        this.siteid = sessionStorage.getItem(`${this.sourceComponent.toUpperCase()}siteId`)
        console.log(this.sourceComponent)
        this.runComponentLogic();
      }
    });
    if(!this.Sitename){
      sessionStorage.removeItem(`${this.sourceComponent.toUpperCase()}siteId`)
    }
    this.currentDisplayType = 'Total'
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
        this.fetchDatatotal(); // Load total data
        this.fetchDataByTypetotal('Total');
      } 
      else if(this.sourceComponent === 'pvvnl'|| 'npcl' || 'torrent'||'amr') {
        if (this.siteid && this.Sitename) {
          console.log('siteidcrunnig')
           this.fetchDataAndType('Total',this.siteid); // Load specific typed data
        }
        else{
          console.log('else running')
          this.getsitedata(this.sourceComponent)
           this.fetchDataAndType('Total'); // Load specific typed data
        }
      }
  }

  fetchDatatotal(): void {
    this.loading = true
    forkJoin({
      apidata1: this.apiSensor.getBaseData('pvvnl'),
      apidata2: this.apiSensor.getBaseData('npcl'),
      apidata3: this.apiSensor.getBaseData('torrent'),
      apidata4: this.apiSensor.getBaseData('amr')

    }).subscribe(responses => {
      this.data = {
        sensor_count: this.sumValues(
          Number(responses.apidata1.data?.sensor_count),
          Number(responses.apidata2.data?.sensor_count),
          Number(responses.apidata3.data?.sensor_count),
          Number(responses.apidata4.data?.sensor_count)          
        ),
        sensor_healthy: this.sumValues(
          Number(responses.apidata1.data?.sensor_healthy),
          Number(responses.apidata2.data?.sensor_healthy),
          Number(responses.apidata3.data?.sensor_healthy),
          Number(responses.apidata4.data?.sensor_healthy)          
        ),
        sensor_maintenance: this.sumValues(
          Number(responses.apidata1.data?.sensor_maintenance),
          Number(responses.apidata2.data?.sensor_maintenance),
          Number(responses.apidata3.data?.sensor_maintenance),
          Number(responses.apidata4.data?.sensor_maintenance)          
        ),
        sensor_zero_reading: this.sumValues(
          Number(responses.apidata1.data?.sensor_zero_reading),
          Number(responses.apidata2.data?.sensor_zero_reading),
          Number(responses.apidata3.data?.sensor_zero_reading),
          Number(responses.apidata4.data?.sensor_zero_reading)          
        ),
        sensor_unhealthy: this.sumValues(
          Number(responses.apidata1.data?.sensor_unhealthy),
          Number(responses.apidata2.data?.sensor_unhealthy),
          Number(responses.apidata3.data?.sensor_unhealthy),
          Number(responses.apidata4.data?.sensor_unhealthy)          
        ),
        sensor_faulty: this.sumValues(
          Number(responses.apidata1.data?.sensor_faulty),
          Number(responses.apidata2.data?.sensor_faulty),
          Number(responses.apidata3.data?.sensor_faulty),
          Number(responses.apidata4.data?.sensor_faulty)          
        ),
        sensor_overload: this.sumValues(
          Number(responses.apidata1.data?.sensor_overload),
          Number(responses.apidata2.data?.sensor_overload),
          Number(responses.apidata3.data?.sensor_overload),
          Number(responses.apidata4.data?.sensor_overload)          
        ),
        sensor_cut: this.sumValues(
          Number(responses.apidata1.data?.sensor_cut),
          Number(responses.apidata2.data?.sensor_cut),
          Number(responses.apidata3.data?.sensor_cut),
          Number(responses.apidata4.data?.sensor_cut)          
        ),
        infra_count: this.sumValues(
          Number(responses.apidata1.data?.infra_count),
          Number(responses.apidata2.data?.infra_count),
          Number(responses.apidata3.data?.infra_count),
          Number(responses.apidata4.data?.infra_count)          
        ),
        sensor_cut_dg: this.sumValues(
          Number(responses.apidata1.data?.sensor_cut_dg),
          Number(responses.apidata2.data?.sensor_cut_dg),
          Number(responses.apidata3.data?.sensor_cut_dg),
          Number(responses.apidata4.data?.sensor_cut_dg)          
        ),
        sensor_cut_grid: this.sumValues(
          Number(responses.apidata1.data?.sensor_cut_grid),
          Number(responses.apidata2.data?.sensor_cut_grid),
          Number(responses.apidata3.data?.sensor_cut_grid),
          Number(responses.apidata4.data?.sensor_cut_grid)          
        ),
        sensor_overload_grid: this.sumValues(
          Number(responses.apidata1.data?.sensor_overload_grid),
          Number(responses.apidata2.data?.sensor_overload_grid),
          Number(responses.apidata3.data?.sensor_overload_grid),
          Number(responses.apidata4.data?.sensor_overload_grid)          
        ),
        sensor_overload_dg: this.sumValues(
          Number(responses.apidata1.data?.sensor_overload_dg),
          Number(responses.apidata2.data?.sensor_overload_dg),
          Number(responses.apidata3.data?.sensor_overload_dg),
          Number(responses.apidata4.data?.sensor_overload_dg)          
        ),
      };
    });
  }
  
  

  // public gridOptions2: GridOptions = {
  //   columnDefs: [
  //     { field: 'serial_no', headerName: 'Serial No', minWidth: 130, valueFormatter: this.nullValueFormatter },
  //     { field: 'site_name', headerName: 'Site Name', minWidth: 200,  valueFormatter: this.nullValueFormatter },
  //     { field: 'short_code', headerName: 'Short Code', minWidth: 150, valueFormatter: this.nullValueFormatter },
  //     { field: 'location_no', headerName: 'Location No', minWidth: 150, valueFormatter: this.nullValueFormatter },
  //     { field: 'location_id', headerName: 'Location ID', minWidth: 150, valueFormatter: this.nullValueFormatter },
  //     { field: 'admin_status', headerName: 'Admin Status', minWidth: 150, valueFormatter: this.nullValueFormatter },
  //     { field: 'dic_id', headerName: 'DIC ID', minWidth: 260, valueFormatter: this.nullValueFormatter },
  //     { field: 'dic_port', headerName: 'DIC Port', minWidth: 150, valueFormatter: this.nullValueFormatter },
  //     { field: 'last_reading_updated', headerName: 'Last Reading Updated', minWidth: 210, valueFormatter: this.nullValueFormatter },
  //     { field: 'state', headerName: 'State', minWidth: 150, valueFormatter: this.nullValueFormatter },
  //     { field: 'grid_reading', headerName: 'Grid Reading', minWidth: 150, valueFormatter: this.nullValueFormatter },
  //     { field: 'dg_reading', headerName: 'DG Reading', minWidth: 150, valueFormatter: this.nullValueFormatter },
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
  //     this.modalGridApi.sizeColumnsToFit();
  //   }
  // };



  private sumValues(...values: (number | undefined)[]): number {
    return values.reduce((acc:any, val) => acc + (val || 0), 0);
  }
 
  fetchDataByTypetotal(type: string,site:string='ALL'): void {
    this.currentType = type
    this.loading = true
    const requests = [
      this.apiSensor.getDataByType(type,site,'pvvnl'),
      this.apiSensor.getDataByType(type,site,'npcl'),
      this.apiSensor.getDataByType(type,site,'torrent'),
      this.apiSensor.getDataByType(type,site,'amr',50000,this.offset)
    ];
  
    forkJoin(requests).subscribe(responses => {
      let flattenedResponse = responses.flatMap(responses => responses.data) ;

      // Check if the response is a single object and not an array
      if (!Array.isArray(flattenedResponse)) {
        flattenedResponse = [flattenedResponse];
      }
      const mergedData = flattenedResponse;
      this.typedata = mergedData;
      if (this.gridApi) {
        this.gridApi.setGridOption("rowData", this.typedata);
      }
      this.loading=false
    });
  }
  
  getselectedSiteIdData(type: string,site:string='',limit:number = 0,offset:number = 0){
    this.loading = false;
    let SiteidSetup:any ;
    if(limit>0){
      SiteidSetup = this.apiSensor.getDataByType(type,site,this.sourceComponent,50000,0);
      this.isQuickFilterActive = true
    }
    else{
      SiteidSetup = this.apiSensor.getDataByType(type,site,this.sourceComponent,50000);
      this.isQuickFilterActive = false  
    }
       SiteidSetup.subscribe((response:any) => {
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
 
   fetchDataAndType(type: string, siteId: string = ''): void {
    this.loading = true;
    this.isQuickFilterActive = false
    const limit = 50000; 
    const offset = 0; 
    let baseDataObservable;
    let typeDataObservable;
    if (siteId && this.Sitename) {
      baseDataObservable = this.apiSensor.getBaseData(this.sourceComponent, siteId);
  
      if (this.sourceComponent === 'amr') {

        typeDataObservable = this.apiSensor.getDataByType(type, siteId, this.sourceComponent, limit, offset);
      } else {
        typeDataObservable = this.apiSensor.getDataByType(type, siteId, this.sourceComponent);
      }
    } 
    else {
      baseDataObservable = this.apiSensor.getBaseData(this.sourceComponent);
  
      // Check for sourceComponent as 'amr' and include limit and offset
      if (this.sourceComponent === 'amr') {

        typeDataObservable = this.apiSensor.getDataByType(type, 'ALL', this.sourceComponent, limit, offset);
        console.log(typeDataObservable+'AMR Condition')

      } else {
        typeDataObservable = this.apiSensor.getDataByType(type, 'ALL', this.sourceComponent);
        console.log(typeDataObservable+'Everything else Condition')

      }
    }
  
    forkJoin([baseDataObservable, typeDataObservable]).subscribe(
      ([baseDataResponse, typeDataResponse]) => {
        // Handle the first API response
        this.data = baseDataResponse.sensor || baseDataResponse.data;
  
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
        this.offset = limit
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
  

  fetchDataByTypeWithPagination(type: string, limit: number = 1000 , site: string = '',): void {
    this.gridApi.getDisplayedRowCount();
    console.log(this.gridApi.getDisplayedRowCount()%50000)
    // Initialize offset if not already set
 
    if (this.gridApi && this.gridApi.isAnyFilterPresent()) {
      console.log('Filters are active. Skipping additional API call.');
      this.loading = false;
      return;
    }
    if (this.gridApi.getDisplayedRowCount()%50000 === 0) {
    this.loading = true;

      if (site && this.Sitename) {
        this.apiSensor.getDataByType(type, site, this.sourceComponent, limit, this.offset).subscribe(
          (response:any) => {
            let flattenedResponse = response.data;
    
            // Ensure the response is an array
            if (!Array.isArray(flattenedResponse)) {
              flattenedResponse = [flattenedResponse];
            }
    
            // Append new data to existing data
            if (flattenedResponse && flattenedResponse.length > 0) {
              this.typedata = [...(this.typedata || []), ...flattenedResponse];
              this.noData = false;
    
              // Update the grid with new data
              if (this.gridApi) {
                this.gridApi.setGridOption('rowData', this.typedata);
                this.gridApi.refreshCells({ force: true });
              }
    
              // Increment the offset by the limit
              this.offset += limit;
            } else {
              this.noData = true;
            }
    
            this.loading = false;
          },
          (error) => {
            console.error('Error fetching data:', error);
            this.loading = false;
          }
        );
      } else {
        this.apiSensor.getDataByType(type, 'ALL', this.sourceComponent, limit, this.offset).subscribe(
          (response:any) => {
            let flattenedResponse = response.data;
    
            // Ensure the response is an array
            if (!Array.isArray(flattenedResponse)) {
              flattenedResponse = [flattenedResponse];
            }
    
            // Append new data to existing data
            if (flattenedResponse && flattenedResponse.length > 0) {
              this.typedata = [...(this.typedata || []), ...flattenedResponse];
    
              // Update the grid with new data
              if (this.gridApi) {
                this.gridApi.setGridOption('rowData', this.typedata);
                this.gridApi.refreshCells({ force: true });
              }
    
              // Increment the offset by the limit
              this.offset += limit;
            } else {
              this.noData = true;
            }
    
            this.loading = false;
          },
          (error) => {
            console.error('Error fetching data:', error);
            this.loading = false;
          }
        );
      }
    }

  }

  

  // onSiteIdClick(params: any) {
  //   const type = this.currentType || 'Total';
  //   const siteId = params.data?.site_id;
  //   this.loading = true;
  
  //   // Check the sourceComponent to decide which logic to use
  //   if (this.sourceComponent === 'control') {
  //     // Use forkJoin to fetch data from multiple sources
  //     const requests = [
  //       this.apiSensor.getDataByType(type, siteId, 'pvvnl'),
  //       this.apiSensor.getDataByType(type, siteId, 'npcl'),
  //       this.apiSensor.getDataByType(type, siteId, 'torrent'),
  //       this.apiSensor.getDataByType(type, siteId, 'amr'),

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
  //   } else if(this.sourceComponent === 'pvvnl'|| 'npcl' || 'torrent'|| 'amr') {
  //     // Use the previous single API call logic
  //     this.apiSensor.getDataByType(type, siteId, this.sourceComponent).subscribe(response => {
  //       let flattenedResponse = response.data;
  
  //       // Check if the response is a single object and not an array
  //       if (!Array.isArray(flattenedResponse)) {
  //         flattenedResponse = [flattenedResponse];
  //       }
  
  //      if (flattenedResponse && flattenedResponse.length > 0) {
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
  currentDisplayType:string = ''
  onCardClick(type: string){
    if (type) {
      switch (type) {
        case 'Total':
          this.currentDisplayType = 'Total';
          break;
        case 'Infra':
          this.currentDisplayType = 'Infra';
          break;
        case 'Healthy':
          this.currentDisplayType = 'Healthy';
          break;
        case 'Unhealthy':
          this.currentDisplayType = 'Unhealthy';
          break;
        case 'Maintenance':
          this.currentDisplayType = 'Maintenance';
          break;
        case 'Faulty':
          this.currentDisplayType = 'Faulty';
          break;
        case 'Zero_reading':
          this.currentDisplayType = 'Zero Reading';
          break;
        case 'Overload':
          this.currentDisplayType = 'Overload';
          break;
        case 'Overload_dg':
          this.currentDisplayType = 'Overload DG';
          break;
        case 'Overload_grid':
          this.currentDisplayType = 'Overload Grid';
          break;
        case 'Cut_meter':
          this.currentDisplayType = 'Cut Meter';
          break;
        case 'Cut_meter_dg':
          this.currentDisplayType = 'Cut Meter DG';
          break;
        case 'Cut_meter_grid':
          this.currentDisplayType = 'Cut Meter Grid';
          break;
        default:
          this.currentDisplayType = 'Unknown';
      }
    }
    
    // //console.log('Card Clicked, Source Component:', this.sourceComponent);
    this.currentType = type
    if (this.sourceComponent === 'control') {
      // //console.log('Fetching total data for type:', type);
      this.fetchDataByTypetotal(type);
      this.fetchDatatotal() // Fetch total data
    } 
    else if(this.sourceComponent === 'pvvnl'|| 'npcl' || 'torrent'||'amr') {
      // //console.log('Fetching regular data for type:', type);
      if (this.siteid && this.Sitename) {
        // console.log('siteidcrunnig')
         this.fetchDataAndType(type,this.siteid); // Load specific typed data
      }
      else{
        this.fetchDataAndType(type); // Fetch regular data      
       }
    }
 
  }


  // hideModal(): void {
  //   this.showModal = false;
  //   this.noData = false;
  // }


  sizeToFit(): void {
    if (this.gridApi) {
      this.gridApi.sizeColumnsToFit();
    }
  }
  isQuickFilterActive:boolean = false


 
  onFilterTextBoxChanged(): void {
    const filterText = (document.getElementById("filter-text-box") as HTMLInputElement).value;
  
    // Apply the quick filter
    this.gridApi.setGridOption("quickFilterText",filterText);
  
    // Reset pagination offset and stop additional data fetching when filtering is applied
    if (filterText) {
      this.isQuickFilterActive = true
      console.log('Search filter applied. Data fetching paused.');
    } else {
      this.isQuickFilterActive = false

      console.log('Search filter cleared. Data fetching resumed.');
    }
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
        this.gridApi.exportDataAsCsv({ fileName: `Sensor_Data-${this.currentDisplayType}.csv` });
      } else if (format === 'xlsx') {
        this.exportToExcel(`Sensor_Data-${this.currentDisplayType}.xlsx`);
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
  //       this.gridApi.exportDataAsCsv({ fileName: `Sensor_Site_Data-${this.currentDisplayType}.csv` });
  //     } else if (format === 'xlsx') {
  //       this.exportToExcel(`Sensor_Site_Data-${this.currentDisplayType}.xlsx`);
  //     }
  //   }
  // }


}


