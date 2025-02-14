import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, Renderer2, ViewChild, ViewEncapsulation } from '@angular/core';
import L from 'leaflet';
import 'leaflet.markercluster';
import { DataService } from '../data.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import * as Highcharts from 'highcharts';
 import { ToastService } from '../../toast.service';
import { FormsModule } from '@angular/forms';
import { IntervalService } from '../../interval.service';
import { SharedService } from '../../shared.service';

@Component({
  selector: 'app-map-amr',
  standalone: true,
  templateUrl: './map.component.html',
  imports:[CommonModule,FormsModule],
  styleUrls: ['./map.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class MAPComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild("scrollList") scrollList!: ElementRef;
  locationname:string =''
  private command!:Subscription
  private intervaltrigger!:Subscription;
  siteId:string =''
  scrollSpeed = 5000; // Speed of the auto-scroll
  scrollIncrement = 1; // Amount of pixels to scroll each time
  isPaused: boolean = false; // To track whether auto-scroll is paused
  scrollInterval: any;
  Highcharts: typeof Highcharts = Highcharts;
  chartOptions: Highcharts.Options | undefined;
  chart!: Highcharts.Chart;
  openInNewTab(url: string, sourceComponent: string): void {
    const fullUrl = `${url}?source=${sourceComponent}`;
    const siteUrl = `${fullUrl}&SiteName=${this.locationname}`
     window.open(siteUrl, "_blank");
  }
  ngOnInit(): void {
    this.loadsitedata();
    this.triggerCommand();
    // Wait for loadmapdata to complete before starting auto-zoom
    this.loadmapdata().then(() => {
      this.autoZoomMode(this.specialMarkers);
    });
    setTimeout(() => {
      this.mapstart();
    }, 0);
  
this.intervaltrigger = this.timer.interval$.subscribe((updatetimer)=>{
  if (this.intervalID) {
    clearInterval(this.intervalID)
  }
  this.intervalID = setInterval(() => {
    this.loadmapdata().then(() => {
      this.autoZoomMode(this.specialMarkers); // Restart auto-zoom after data reload
    });
    this.loadsitedata();
  }, updatetimer);
})

  }

  triggerCommand(): void{
    this.command = this.timer.Update$.subscribe(()=>{
      this.loadmapdata().then(() => {
        this.autoZoomMode(this.specialMarkers); // Restart auto-zoom after data reload
      });
      this.loadsitedata();
    })
  }

  isFullscreen:boolean = false
fullscreen(){
  this.isFullscreen = !this.isFullscreen
}
  showModal: boolean = false;
  ShowModal(SiteId: string): void {
    this.showModal = !this.showModal;
    sessionStorage.setItem( `AMRsiteId`,SiteId)
     if (this.autoZoomInterval) {
      clearInterval(this.autoZoomInterval); // Clear existing intervals
    }    if (this.subscribe) {
      this.subscribe.unsubscribe();
    }
    this.loadData(SiteId);
    this.loadalldata(SiteId);
  }
  startAutoScroll(slowstart:boolean) {
    if (this.scrollInterval) {
        clearInterval(this.scrollInterval);
        this.scrollInterval = null;
        //console.log('Auto-scrolling stopped');
    }
    let time = 0
    if (slowstart) {
      time === 3000
    }
    else{
      time === 0
    }
    //console.log('autoscroll is running');
    setTimeout(() => {
        const listElement = this.scrollList.nativeElement;
        const items = listElement.querySelectorAll('li');
        let currentIndex = 0;
        this.scrollInterval = setInterval(() => {
            if (items.length === 0) {
                return;
            }
            const currentItem = items[currentIndex];
            const listOffsetTop = listElement.getBoundingClientRect().top;
            const itemOffsetTop = currentItem.getBoundingClientRect().top;
            const scrollPosition = listElement.scrollTop + (itemOffsetTop - listOffsetTop);

            this.renderer.setProperty(listElement, 'scrollTop', scrollPosition);
            currentIndex = (currentIndex + 1) % items.length;
        }, this.scrollSpeed);
    }, time);
}

onMouseEnterSidemenu() {
  // Stop auto-scrolling
  if (this.scrollInterval) {
    clearInterval(this.scrollInterval);
    this.scrollInterval = null;
    //console.log('Auto-scrolling stopped');
}
}
 
  onMouseLeaveSidemenu() {
    // Resume auto-scrolling
    //console.log('Resuming scrolling after hover out of Sidemenu');
    this.startAutoScroll(false);
  }
  updateScrollValues() {
    const listElement = this.scrollList.nativeElement;
    const items = listElement.querySelectorAll('li'); // Update the list of items if necessary
    // Additional logic could be added here if needed (e.g., handling resize, recentering)
  }
  

  
  hideModal(): void {
    this.showModal = false;
    this.gridValues = [];
    this.dgValues = [];
    this.chart.update({
      series: [
        // Only add grid series if it is not null
        {
          data: this.gridValues,
          type: "line" as const, // Ensure type is 'line' specifically
          showInLegend: false,
        },
        // Only add DG series if it is not null
        {
          data: this.dgValues,
          type: "line" as const, // Ensure type is 'line' specifically
          showInLegend: false,
        },
      ],
    });
    if (this.autozoomstatus === true) {
      setTimeout(() => {
        this.autoZoomMode(this.specialMarkers)
      },3000);
    }
  }

  constructor(
    private dataService: DataService,
     private renderer: Renderer2,
     private toast: ToastService,
     private timer: IntervalService,
     private sharedService: SharedService
  ) {}
  loading: boolean = false;

  sensor: {
    healthy?: number;
    unhealthy?: number;
    zero_reading?: number;
    sensor_cut_dg?: number;
    sensor_cut_grid?: number;
    sensor_overload_dg?: number;
    sensor_overload_grid?: number;
    sensor_faulty?: number;
    sensor_cut?: number;
    sensor_overload?: number;
    sensor_maintenance?: number;
    infra_count?: number;
  } = {};

  dic: {
    healthy?: number;
    unhealthy?: number;
    faulty?: number;
    maintenance?: number;
  } = {};

  dl: {
    Count?: number;
    maintenance?: number;
    faulty?: number;
    connected_dl?:number,
    disconnected_dl?:number
  } = {};

  site: {
    live?: number;
    Maintenance?: number;
  } = {};
  currentChart: any; // To hold reference to the current chart

  currentDatetest: string = new Date().toISOString().split("T")[0];
  date: string = this.currentDatetest;
  gridData!: any; // Use the GridData interface
  dgData!: any; // Use the DgData interface
  gridValues: any[] = [];
  dgValues: any[] = [];

  loadData(siteid: string) {
    this.loading = true;
    this.subscribe = this.dataService
      .getData_consumption_daily(this.date, siteid)
      .subscribe((data) => {
        // Null checks for gridData and dgData
        this.gridData = data.resource.grid ? data.resource.grid : [];
        this.dgData = data.resource.dg ? data.resource.dg : [];
        // //console.log(this.gridData)
        // //console.log(this.dgData)

        const gridData = this.gridData[0];
        const dgData = this.dgData[0];

        // Get the current hour
        const currentHour = new Date().getHours();

        // Process grid values up to the current hour with null and NaN checks
        this.gridValues = Array.from(
          { length: currentHour + 1 }, // Only process up to the current hour
          (_, i) =>
            gridData
              ? parseFloat(
                  gridData[`grid_unit_${i.toString().padStart(2, "0")}`]
                )
              : NaN
        );

        // Process dg values up to the current hour with null and NaN checks
        this.dgValues = Array.from({ length: currentHour + 1 }, (_, i) =>
          dgData
            ? parseFloat(dgData[`dg_unit_${i.toString().padStart(2, "0")}`])
            : NaN
        );

        this.consumptionchart(currentHour);
        this.loading = false;
      });
  }
  darkMode: boolean = true;

  toggleMapMode() {
    const mapElement = document.getElementById('india');
    if (this.darkMode) {
      this.renderer.removeClass(mapElement, 'dark-mode');
      this.renderer.addClass(mapElement, 'light-mode');
    } else {
      this.renderer.removeClass(mapElement, 'light-mode');
      this.renderer.addClass(mapElement, 'dark-mode');
    }
    this.darkMode = !this.darkMode;
  }
  consumptionchart(currentHour: number) {
    // Generate x-axis labels as hours (00:00, 00:01, etc.)
    const categories = Array.from(
      { length: currentHour + 1 },
      (_, i) => `${i.toString().padStart(2, "0")}:00`
    );

    // Initialize series data
    let gridSeries =
      this.gridValues && this.gridValues.length > 0 ? this.gridValues : null;
    let dgSeries =
      this.dgValues && this.dgValues.length > 0 ? this.dgValues : null;

    // If both series are null or empty, default to 0 values
    if (!gridSeries && !dgSeries) {
      gridSeries = Array(currentHour + 1).fill(0);
      dgSeries = Array(currentHour + 1).fill(0);
    }

    this.chartOptions = {
      chart: {
        type: "line",
        backgroundColor: "rgba(0,0,0,0)",
        height: 250, // Height can still be set dynamically if needed
      },
      title: {
        text: "",
      },
      xAxis: {
        labels: {
          style: {
            color: "#FFF",
          },
        },
        categories: categories, // Set x-axis categories as hours
      },
      yAxis: {
        title: {
          text: "",
        },
        labels: {
          style: {
            color: "#FFF",
          },
        },
      },
      series: [
        // Only add grid series if it is not null
        ...(gridSeries
          ? [
              {
                name: "Grid Unit",
                data: gridSeries,
                type: "line" as const, // Ensure type is 'line' specifically
                showInLegend: false,
                color: "rgb(0, 255, 213)",
              },
            ]
          : []),
        // Only add DG series if it is not null
        ...(dgSeries
          ? [
              {
                name: "DG Unit",
                data: dgSeries,
                type: "line" as const, // Ensure type is 'line' specifically
                showInLegend: false,
                color: "rgb(255, 0 ,0)",
              },
            ]
          : []),
      ],
    };

    const chartContainer = document.querySelector(
      "#Consumption"
    ) as HTMLElement;
    this.chart = Highcharts.chart(chartContainer, this.chartOptions);
  }

  generateRandomData(): number[] {
    return Array.from({ length: 12 }, () => Math.floor(Math.random() * 100));
  }

  private subscribe: Subscription | null = null;
  private map!: L.Map; // Store reference to the map
  isSlideMenuVisible: boolean = false; // State to control slide menu visibility
  toggleSlideMenu(): void {
    this.isSlideMenuVisible = !this.isSlideMenuVisible; // Toggle the visibility state
    if (this.isSlideMenuVisible) {
      this.filteredLocations();
      this.startAutoScroll(false);
    } else {
      if (this.scrollInterval) {
        clearInterval(this.scrollInterval)
        //console.log('scrollshouldstop')
      }    }
  }
  intervalID: any;


  searchTerm: string = "";

  filteredLocations() {
    return this.locations
      .filter((location) =>
        location.name.toLowerCase().includes(this.searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        const aPriority = (a.site === "Maintenance" || a.DG === "ON") ? 1 : 0;
        const bPriority = (b.site === "Maintenance" || b.DG === "ON") ? 1 : 0;
  
        // Prioritize 'Maintenance' or 'ON' at the top
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
  
        // Otherwise, sort alphabetically
        return a.name.localeCompare(b.name);
      });
  }
  loadmapdata(): Promise<void> {
    return new Promise((resolve) => {
      this.subscribe = this.dataService.getMapData().subscribe((response) => {
        this.clearMarkers(); // Clear previous markers
  
        response.forEach((apiItem: any) => {
          const locationIndex = this.locations.findIndex(
            (loc) => loc.siteId === apiItem.siteId
          );
  
          if (locationIndex !== -1) {
            // Update existing location details
            this.locations[locationIndex] = {
              ...this.locations[locationIndex],
              name: apiItem.name,
              city: apiItem.city,
              site: apiItem.site,
              sensorcount: apiItem.sensorcount,
              diccount: apiItem.diccount,
              datalogger_count: apiItem.datalogger_count,
              Grid: apiItem.Grid,
              DG: apiItem.DG,
              DG_RUNNING: apiItem.DG_RUNNING ? apiItem.DG_RUNNING : "",
              lat:
              Number(apiItem.lat) !== 0.0000000
               ? apiItem.lat
               : this.locations[locationIndex].lat,
           lng:
              Number(apiItem.lng) !== 0.0000000
               ? apiItem.lng
               : this.locations[locationIndex].lng,
            };
          } 
          else {
            // Add a new location with default lat and long if siteId is not found
            this.locations.push({
              siteId: apiItem.siteId,
              name: apiItem.name,
              city: apiItem.city,
              site: apiItem.site,
              sensorcount: apiItem.sensorcount,
              diccount: apiItem.diccount,
              datalogger_count: apiItem.datalogger_count,
              Grid: apiItem.Grid,
              DG: apiItem.DG,
              DG_RUNNING: apiItem.DG_RUNNING ? apiItem.DG_RUNNING : "",
              lat: 
              Number(apiItem.lat) !== 0.0000000? apiItem.lat : 28 + (Math.random() * 0.6 - 0.5),
              lng:
              Number(apiItem.lng) !== 0.0000000? apiItem.lng:
               77 + (Math.random() * 0.6 - 0.5), 
            });
          }
        });
  
        this.mapinitialize(); // Re-initialize the map with the new data
        this.filteredLocations();
        this.siteNotification();
  
        resolve(); // Resolve the promise to indicate that markers are set up
      });
    });
  }
  
  
  
  clearMarkers() {
    // Clear individual markers
    if (this.allMarkers.length > 0) {
      this.allMarkers.forEach((marker) => {
        this.map.removeLayer(marker);
      });
      this.allMarkers = []; // Clear the marker array
    }
      if (this.specialMarkers.length > 0) {
      this.specialMarkers.forEach((marker) => {
        this.map.removeLayer(marker);
      });
      this.specialMarkers = []; // Clear the marker array
    }
    // Clear marker clusters
    if (this.markerClusters) {
      this.markerClusters.clearLayers();
    }
  }
  siteNotification() {
    let isSlideMenuVisibleFlag = false; // Flag to check for DG "ON" or Maintenance

    this.locations.forEach((location) => {
      if (location.site === "Maintenance") {
        this.toast.error(
          `${location.name} has gone into maintenance`,
          "Warning",
          300000
        );
        isSlideMenuVisibleFlag = true;  // Set flag if maintenance is detected
      }

      if (location.DG === 'ON') {
        const runningDuration = location.DG_RUNNING && location.DG_RUNNING.length > 0 
          ? location.DG_RUNNING[0].last_reading_updated_duration 
          : '-----';

        this.toast.warning(
          `${location.name} is running on DG for ${runningDuration}`, 'Alert', 300000
        );
        isSlideMenuVisibleFlag = true;  // Set flag if DG is ON
      }
    });

    // Set isSlideMenuVisible based on flag status
    this.isSlideMenuVisible = isSlideMenuVisibleFlag;
    if (this.isSlideMenuVisible) {
        this.startAutoScroll(true);
    }
}

  loadsitedata() {
    this.subscribe = this.dataService
      .getBaseDataSite()
      .subscribe((siteData) => {
        this.site.live = parseInt(siteData.data.live_count, 10);
        this.site.Maintenance = parseInt(siteData.data.maintenance_count, 10);
      });
  }
  loadalldata(SiteId: string) {
    this.dataService.getAllsite(SiteId).subscribe((data) => {
      (this.dl.Count = parseInt(data.datalogger.disconnected_dl, 10)),
        (this.dl.maintenance = parseInt(data.datalogger.maintanance_dl, 10)),
        (this.dl.faulty = parseInt(data.datalogger.faulty_dl, 10));
        (this.dl.connected_dl = parseInt(data.datalogger.connected_dl, 10));
        (this.dl.disconnected_dl = parseInt(data.datalogger.disconnected_dl, 10));


      (this.sensor.healthy = parseInt(data.sensor.sensor_healthy, 10)),
        (this.sensor.unhealthy = parseInt(data.sensor.sensor_unhealthy, 10)),
        (this.sensor.zero_reading = parseInt(
          data.sensor.sensor_zero_reading,
          10
        )),
        (this.sensor.sensor_cut = parseInt(data.sensor.sensor_cut, 10)),
        (this.sensor.sensor_overload = parseInt(
          data.sensor.sensor_overload,
          10
        ));
      this.sensor.sensor_faulty = parseInt(data.sensor.sensor_faulty, 10);
      (this.dic.healthy = parseInt(data.dic.dic_healthy, 10)),
        (this.dic.unhealthy = parseInt(data.dic.dic_unhealthy, 10)),
        (this.dic.faulty = parseInt(data.dic.dic_faulty, 10));

      this.sensor.sensor_maintenance = parseInt(
        data.sensor.sensor_maintenance,
        10
      );
      this.sensor.infra_count = parseInt(data.sensor.infra_count, 10);
    });
  }
  sitename: string = "";
  latitude: string = "";
  longitude: string = "";
   ngOnDestroy(): void {
    if (this.subscribe) {
      this.subscribe.unsubscribe();
    }
    
   if (this.map) {
      this.map.eachLayer((layer) => {
        this.map?.removeLayer(layer); 
      });
      this.map.off(); // Remove all event listeners
      this.map.remove(); // Destroy the map instance/ Properly remove the map when the component is destroyed
    }
    if (this.autoZoomInterval) {
      clearInterval(this.autoZoomInterval)
    }
    if (this.scrollInterval) {
      clearInterval(this.scrollInterval)
      ////console.log('scrollshouldstop')
    }
    if (this.intervalID) {
      clearInterval(this.intervalID)
    } 
    if (this.command) {
      this.command.unsubscribe();
    }    
    if (this.intervaltrigger) {
      this.intervaltrigger.unsubscribe();
    }
  }
  zoomToLocation(location: any): void {
    if (this.map) {
      // Set the map view to the location's coordinates with a specified zoom level
      this.map.setView([location.lat, location.lng], 17);
      this.isSlideMenuVisible = false
      // Find the marker associated with this location and open its popup
      const marker = this.allMarkers.find(m => m.getLatLng().lat === location.lat && m.getLatLng().lng === location.lng);
      if (marker) {
        marker.openPopup();
      }
    }
  }
  
  ngAfterViewInit(): void {}
  specialMarkers: L.Marker[] = [];
  allMarkers: L.Marker[] = [];

  markerClusters: any;
  mapstart() {
    const mapElement = document.getElementById('india');
    this.renderer.addClass(mapElement, 'dark-mode'); // Set default to light mode
    this.darkMode = true
    this.map = L.map("india", {
      zoomControl: false,
    }).setView([28.6139, 77.209], 10);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 23,
      attribution:
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(this.map);

    L.control
      .zoom({
        position: "topright",
      })
      .addTo(this.map);
  }
  private index : any

  mapinitialize() {
    this.markerClusters = L.markerClusterGroup({
      iconCreateFunction: (cluster) => this.createClusterIcon(cluster),
      disableClusteringAtZoom: 16, // Clusters will open at zoom level 16
      showCoverageOnHover: false,
    });

    this.locations.forEach((location, index) => {
      const latLng = L.latLng(location.lat, location.lng);
      let markerIcon = this.createIcon("Green", location.Grid, location.DG);
      let popupClass = "popup-Live animate";

      if (location.site === "Maintenance") {
        markerIcon = this.createIcon("Red", location.Grid, location.DG);
        popupClass = "popup-Maintenance animate";
      }
      const popupId = `popup-${index}`;
      const dgRunningContent = location.DG_RUNNING && location.DG_RUNNING.length > 0 
      ? location.DG_RUNNING.map((dg, index) => `
          <tr><th>${dg.name} Running For:</th><td>${dg.last_reading_updated_duration}</td></tr>
        `).join('') 
      : ''; // If DG_RUNNING is null or empty, no DG info will be shown
      
    const popupContent = `
      <div id = "${popupId}" class="${popupClass} animate-${location.site}">
        <h3>${location.name}</h3>
        <table style="font-size: 18px; font-weight: 400 !important; font-family: 'Rajdhani';">
          <tr><th style="font-weight: 500 !important;">Sensor Count:</th><td>${location.sensorcount}</td></tr>
          <tr><th>DIC Count:</th><td>${location.diccount}</td></tr>
          <tr><th>Datalogger Count:</th><td>${location.datalogger_count}</td></tr>
          ${dgRunningContent}
        </table>
        <button class="Open-modal">Expand</button>
      </div>
    `;
    this.index = index
    //console.log(`${this.index} AND ${latLng}`)

      const marker = L.marker(latLng, { icon: markerIcon }).bindPopup(
        popupContent
      );

      if (location.site === "Maintenance"|| location.DG ==="ON") {
        this.specialMarkers.push(marker);
      }

      marker.on("popupopen", () => {
        setTimeout(() => {
          this.locationname = location.name
          const modalButton = document.querySelector(`#${popupId} .Open-modal`);
          if (modalButton) {
            // Ensure we remove any previous event listeners before attaching a new one
            const newButton = modalButton.cloneNode(true) as HTMLElement;
            modalButton.replaceWith(newButton);
            newButton.addEventListener("click", () =>
              this.ShowModal(location.siteId)
            );
          }
        }, 0);
      });
      marker.on("popupclose", () => {
        // Clear the selected location name when popup is closed
        this.locationname = '';
      });

      this.allMarkers.push(marker);
      this.markerClusters.addLayer(marker);
    });

    // Initial state: show clustered markers
    this.staticMapMode(this.allMarkers, this.markerClusters);

  }
  // Method to show the map with static markers (clustered)
  autoZoomInterval: any;
  autozoomstatus:boolean = false

  setStaticMapMode(): void {
    this.staticMapMode(this.allMarkers, this.markerClusters);
  }

  // Method for auto zoom mode
  setAutoZoomMode(): void {
    this.autoZoomMode(this.specialMarkers);
  }
// Toggle to Static Mode
private staticMapMode(
  allMarkers: L.Marker[],
  markerClusters: L.MarkerClusterGroup
): void {
  if (this.autoZoomInterval) {
    clearInterval(this.autoZoomInterval); // Clear auto-zoom interval
  }
  this.autozoomstatus = false;
  // Close any open popups to reset state
  allMarkers.forEach(marker => marker.closePopup());
   // Calculate centroid for centering
  let totalLat = 0;
  let totalLng = 0;
  allMarkers.forEach(marker => {
    const { lat, lng } = marker.getLatLng();
    totalLat += lat;
    totalLng += lng;
  });

  const centroidLat = totalLat / allMarkers.length;
  const centroidLng = totalLng / allMarkers.length;

  // Center and set zoom
  this.map.setView([centroidLat, centroidLng], 10);
  this.map.addLayer(markerClusters);
}

// Auto Zoom Mode
private autoZoomMode(specialMarkers: L.Marker[]): void {
  let currentMarkerIndex = 0;
  this.autozoomstatus = true;
  if (specialMarkers.length === 0) {
    this.staticMapMode(this.allMarkers, this.markerClusters);
  }
  if (this.autoZoomInterval) {
    clearInterval(this.autoZoomInterval); // Clear existing intervals
  }
  if (specialMarkers.length === 1) {
    const marker = specialMarkers[0];
    this.map.setView(marker.getLatLng(), 18); // Zoom into the marker
    marker.openPopup(); // Open its popup
  }

else{
  // Start auto-zoom with interval
  this.autoZoomInterval = setInterval(() => {
    if (specialMarkers.length > 0) {

      // Get current marker and set view
      const marker = specialMarkers[currentMarkerIndex];
      this.map.setView(marker.getLatLng(), 18);
      //console.log(specialMarkers.length)
      // Try to open popup, then verify if it's open
      marker.openPopup();

      // Check if popup didn't open, and if so, force it to open again
      setTimeout(() => {
        if (!marker.isPopupOpen()) { // Check if the popup is not open
          //console.log(`Popup for marker ${currentMarkerIndex} did not open. Retrying...`);
          marker.openPopup(); // Force open again if it didn't open
        }
      }, 500); // Adjust delay as needed to allow popup some time to open

      // Increment index and ensure it wraps around correctly
      currentMarkerIndex = (currentMarkerIndex + 1) % specialMarkers.length; // Cycle index
      //console.log(`Current marker index: ${currentMarkerIndex}`);
    }
  }, 10000); // 10 seconds interval
}
  // Open the first marker’s popup immediately
  if (specialMarkers.length > 0) {
    this.map.setView(specialMarkers[0].getLatLng(), 18);
    specialMarkers[0].openPopup();

    // Check if the initial popup opened, and retry if not
    setTimeout(() => {
      if (!specialMarkers[0].isPopupOpen()) {
        //console.log(`Initial popup did not open. Retrying...`);
        specialMarkers[0].openPopup(); // Force open if the initial attempt failed
      }
    }, 500);
  }
}


  // Helper method to clear map layers

  // Create an icon with the specified color
  createIcon(color: string, grid: string, dg: string): L.Icon {
    const isBlinking = color === "Yellow" || color === "Red";

    let iconSuffix = "";
    if (grid === "ON") {
      iconSuffix = "-on";
    } else if (dg === "ON") {
      iconSuffix = "-off";
    }

    return L.icon({
      iconUrl: `../../../assets/images/${color}Icon${iconSuffix}.png`,
      iconSize: [64, 84],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
      className: isBlinking ? "blinking" : "",
    });
  }

  // Function to create the custom cluster icon (donut style)
  createClusterIcon(cluster: any): L.DivIcon {
    const count = cluster.getChildCount();

    let liveCount = 0,
      maintenanceCount = 0;

    cluster.getAllChildMarkers().forEach((marker: any) => {
      const status = marker.options.icon.options.iconUrl;
      if (status.includes("Green")) liveCount++;
      if (status.includes("Red")) maintenanceCount++;
    });

    const totalCount = liveCount + maintenanceCount;
    const livePercentage = (liveCount / totalCount) * 100;
    const maintenancePercentage = (maintenanceCount / totalCount) * 100;

    const donutHtml = `
    <div class="donut-cluster">
      <svg viewBox="0 0 42 42" class="donut">
        <circle class="donut-segment" cx="21" cy="21" r="15.91549431" fill="transparent"
          stroke="#28a745" stroke-width="10" 
          stroke-dasharray="${livePercentage} ${
      100 - livePercentage
    }" stroke-dashoffset="0"></circle>
        <circle class="donut-segment" cx="21" cy="21" r="15.91549431" fill="transparent"
          stroke="#dc3545" stroke-width="10"
          stroke-dasharray="${maintenancePercentage} ${
      100 - maintenancePercentage
    }" stroke-dashoffset="-${livePercentage}"></circle>
      </svg>
      <div class="donut-count">${count}</div>
    </div>`;
    return L.divIcon({
      html: donutHtml,
      className: "custom-cluster-icon",
      iconSize: L.point(60, 60, true),
    });
  }



  locations = [
    {'lat': 0, 'lng': 0, 'name': '', 'city': '', 'site': '', 'siteId': '',  'sensorcount':0 , 'diccount': 0, 'datalogger_count': 0, 'Grid': "", 'DG': "",'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
   ];
}
