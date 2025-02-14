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

@Component({
  selector: 'app-map',
  standalone: true,
  templateUrl: './map.component.html',
  imports: [CommonModule,FormsModule],
  styleUrls: ['./map.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class MAPComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild("scrollList") scrollList!: ElementRef;
  locationname:string =''
  private command!:Subscription
  private intervaltrigger!:Subscription
  scrollSpeed = 5000; // Speed of the auto-scroll
  scrollIncrement = 1; // Amount of pixels to scroll each time
  isPaused: boolean = false; // To track whether auto-scroll is paused
  scrollInterval: any;
  Highcharts: typeof Highcharts = Highcharts;
  chartOptions: Highcharts.Options | undefined;
  chart!: Highcharts.Chart;
  openInNewTab(url: string, sourceComponent: string): void {
    const fullUrl = `${url}?source=${sourceComponent}`;
    const siteUrl = `${fullUrl}&SiteName=${this.locationname}`;
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
    sessionStorage.setItem( `NPCLsiteId`,SiteId)

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
     private timer: IntervalService
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
      (this.sensor.sensor_cut_grid = parseInt(data.sensor.sensor_cut_grid, 10)),
        (this.sensor.sensor_overload_grid = parseInt(
          data.sensor.sensor_overload_grid,
          10
        ));
      this.sensor.sensor_overload_dg = parseInt(
        data.sensor.sensor_overload_dg,
        10
      );
      this.sensor.sensor_cut_dg = parseInt(data.sensor.sensor_cut_dg, 10);

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
  siteid: string = "";
  ngOnDestroy(): void {
    if (this.subscribe) {
      this.subscribe.unsubscribe();
    }
   if (this.map) {
      this.map.eachLayer((layer) => {
        this.map?.removeLayer(layer); // Remove all layers
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
    {'lat': 28.6114957, 'lng': 77.4577397, 'name': '', 'city': '', 'site': '', 'siteId': '5e580d8c965578.35657951', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.4852731, 'lng': 77.5138793, 'name': '', 'city': '', 'site': '', 'siteId': '5f48cf5b1a75c3.82505657', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.5934935, 'lng': 77.4526108, 'name': '', 'city': '', 'site': '', 'siteId': '5f719a76553801.30053747', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.47697479, 'lng': 77.5440735999999, 'name': '', 'city': '', 'site': '', 'siteId': '5f86ca205ef0b6.59083031', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.4769586, 'lng': 77.54651963, 'name': '', 'city': '', 'site': '', 'siteId': '5fd1f216cecf32.60638621', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.6205938, 'lng': 77.4214059, 'name': '', 'city': '', 'site': '', 'siteId': '60139c8297c7b3.63648839', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.4621309, 'lng': 77.5386877999999, 'name': '', 'city': '', 'site': '', 'siteId': '6018f44c7a1843.93089896', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.47008427, 'lng': 77.5522224, 'name': '', 'city': '', 'site': '', 'siteId': '6037317a479531.94924567', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.6087521357903, 'lng': 77.4541849674624, 'name': '', 'city': '', 'site': '', 'siteId': '610bd9c12afd37.17120116', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.5859979, 'lng': 77.4359595, 'name': '', 'city': '', 'site': '', 'siteId': '614856556b33c0.24792611', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.6118895092958, 'lng': 77.4406241040144, 'name': '', 'city': '', 'site': '', 'siteId': '61514ff63c0707.18552219', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.4490228, 'lng': 77.5500076, 'name': '', 'city': '', 'site': '', 'siteId': '615150951243e2.10170366', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.4618635, 'lng': 77.5585385999999, 'name': '', 'city': '', 'site': '', 'siteId': '617902cc003a27.56344291', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.5700362, 'lng': 77.4461737, 'name': '', 'city': '', 'site': '', 'siteId': '61a4c4e1caf209.49046927', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.4953219, 'lng': 77.5379377, 'name': '', 'city': '', 'site': '', 'siteId': '61f8c89d734185.61333391', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
// {'lat': 28.6268540118676, 'lng': 77.3775887623003, 'name': '', 'city': '', 'site': '', 'siteId': '620cbb5a10fc33.09027460', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.4444422, 'lng': 77.5206061, 'name': '', 'city': '', 'site': '', 'siteId': '624551e5c62fd5.04613385', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.583403, 'lng': 77.3141733, 'name': '', 'city': '', 'site': '', 'siteId': '6284c883df88a8.28517488', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.5563679, 'lng': 77.4422929, 'name': '', 'city': '', 'site': '', 'siteId': '62873e46c60674.94123342', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.497043509963, 'lng': 77.5375277809521, 'name': '', 'city': '', 'site': '', 'siteId': '6294a15c7f3423.77848010', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.6091804, 'lng': 77.4402854, 'name': '', 'city': '', 'site': '', 'siteId': '62bc5f824094b3.09259214', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.4728926, 'lng': 77.5119400999999, 'name': '', 'city': '', 'site': '', 'siteId': '62e11703cec647.94751357', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.4537542989171, 'lng': 77.516256182092, 'name': '', 'city': '', 'site': '', 'siteId': '63071dc0f39bf4.52143055', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.5124938, 'lng': 77.5200991, 'name': '', 'city': '', 'site': '', 'siteId': '6307215f912ed3.20226428', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.5712139, 'lng': 77.4741408, 'name': '', 'city': '', 'site': '', 'siteId': '632429b42fa8a8.78931727', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.5834502, 'lng': 77.4318737999999, 'name': '', 'city': '', 'site': '', 'siteId': '632c29a96f83e3.14382777', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.5761727, 'lng': 77.4323603, 'name': '', 'city': '', 'site': '', 'siteId': '6396d4be726a32.55440818', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.4728268, 'lng': 77.5119991, 'name': '', 'city': '', 'site': '', 'siteId': '63ac2d5ee216c9.52413735', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.4630562858495, 'lng': 77.5368231267201, 'name': '', 'city': '', 'site': '', 'siteId': '63ad3f073e6164.75843278', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.46374624 , 'lng': 77.537109142, 'name': '', 'city': '', 'site': '', 'siteId': '63afe5e74d3194.84088637', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.6589452293279, 'lng': 77.3603743727076, 'name': '', 'city': '', 'site': '', 'siteId': '63b00adbdab624.74025813', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
// {'lat': 28.6165871, 'lng': 77.3705619, 'name': '', 'city': '', 'site': '', 'siteId': '63b287d43b4163.71845938', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.5944109007299, 'lng': 77.4541066097909, 'name': '', 'city': '', 'site': '', 'siteId': '63eb4f729274f3.42291458', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.567845, 'lng': 77.4765367999999, 'name': '', 'city': '', 'site': '', 'siteId': '640300b754e492.61005948', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.46421675  , 'lng': 77.53636238  , 'name': '', 'city': '', 'site': '', 'siteId': '64131909802299.11005962', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.6111588, 'lng': 77.4237591999999, 'name': '', 'city': '', 'site': '', 'siteId': '6442861ccc1800.38997348', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.5716289373678, 'lng': 77.4808538695236, 'name': '', 'city': '', 'site': '', 'siteId': '645652b1d27381.85464499', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.5611061, 'lng': 77.4388994, 'name': '', 'city': '', 'site': '', 'siteId': '6458e2d90f2455.46668818', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.5912498, 'lng': 77.4311728, 'name': '', 'city': '', 'site': '', 'siteId': '64637390cd9459.10167822', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.596489488212, 'lng': 77.4416579566223, 'name': '', 'city': '', 'site': '', 'siteId': '6475fcf13a4ad8.14595659', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.6099916757081, 'lng': 77.4363672009978, 'name': '', 'city': '', 'site': '', 'siteId': '647600ccc43570.49833027', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.5742505515081, 'lng': 77.4289551992785, 'name': '', 'city': '', 'site': '', 'siteId': '649147d50d2d05.96633533', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.5860886354945, 'lng': 77.4359895117156, 'name': '', 'city': '', 'site': '', 'siteId': '649e661fe6d390.12643208', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.4593494302093, 'lng': 77.508789895927, 'name': '', 'city': '', 'site': '', 'siteId': '64d386e3b3fe33.75103093', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.5813006, 'lng': 77.4319036, 'name': '', 'city': '', 'site': '', 'siteId': '65dc8176a07085.47491136', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.5961385, 'lng': 77.4522692, 'name': '', 'city': '', 'site': '', 'siteId': '65dc8ee4284f77.22876963', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.6094406, 'lng': 77.436189, 'name': '', 'city': '', 'site': '', 'siteId': '6630990f4ce817.92956033', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.5942875, 'lng': 77.4510780999999, 'name': '', 'city': '', 'site': '', 'siteId': '664c976538f730.26690777', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.5638568317647, 'lng': 77.4517276634517, 'name': '', 'city': '', 'site': '', 'siteId': '6661995b439b28.97170543', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.4951508, 'lng': 77.5393242, 'name': '', 'city': '', 'site': '', 'siteId': '6662b69dc32650.23190101', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.5992073873521, 'lng': 77.4440786670537, 'name': '', 'city': '', 'site': '', 'siteId': '6662b823dfad77.74129852', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.6098874, 'lng': 77.4381157999999, 'name': '', 'city': '', 'site': '', 'siteId': '6662b91f888ee9.32487917', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.6050088, 'lng': 77.4519110999999, 'name': '', 'city': '', 'site': '', 'siteId': '6666a0cdc04554.24117719', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.6282298, 'lng': 77.3803841, 'name': '', 'city': '', 'site': '', 'siteId': '6690c5f331c255.89541791', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.58243328, 'lng': 77.43457378 , 'name': '', 'city': '', 'site': '', 'siteId': '66fe334cbd6b62.99816619', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.4515492  , 'lng': 77.47867753  , 'name': '', 'city': '', 'site': '', 'siteId': '66ffe3c69368b7.64866864', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},

  ];
}
