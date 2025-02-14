import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  Renderer2,
  ViewChild,
  ViewEncapsulation,
} from "@angular/core";
import L from "leaflet";
import "leaflet.markercluster";
import { DataService } from "../data.service";
import { Subscription } from "rxjs";
import { CommonModule } from "@angular/common";
import * as Highcharts from "highcharts";
 import { ToastService } from "../../toast.service";
import { FormsModule } from "@angular/forms";
import { IntervalService } from "../../interval.service";
 
@Component({
  selector: "app-map",
  standalone: true,
  templateUrl: "./map.component.html",
  imports: [CommonModule, FormsModule],
  styleUrls: ["./map.component.scss"],
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
    sessionStorage.setItem( `PVVNLsiteId`,SiteId)

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
{'lat': 28.6865823, 'lng': 77.3737143, 'name': '', 'city': '', 'site': '', 'siteId': '6075bb51153a20.38235471', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.5512898, 'lng': 77.3385049, 'name': '', 'city': '', 'site': '', 'siteId': '6075bc402b1d89.72314508', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.6648987, 'lng': 77.3499011, 'name': '', 'city': '', 'site': '', 'siteId': '60ded2c05753d1.99599034', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.5647149, 'lng': 77.3997542, 'name': '', 'city': '', 'site': '', 'siteId': '60f411392fe4c6.02964664', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.5623636, 'lng': 77.4000633, 'name': '', 'city': '', 'site': '', 'siteId': '60f7d92353e6d3.12088340', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.6682412, 'lng': 77.3515006, 'name': '', 'city': '', 'site': '', 'siteId': '6167d2097430c9.65764828', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.6331229, 'lng': 77.4421154, 'name': '', 'city': '', 'site': '', 'siteId': '61961929309215.13693661', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.5727986, 'lng': 77.3802387, 'name': '', 'city': '', 'site': '', 'siteId': '61c96bfe394798.80302324', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.4382133, 'lng': 77.4827525, 'name': '', 'city': '', 'site': '', 'siteId': '61ea5f60704e56.37094027', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.5961858, 'lng': 77.3850057, 'name': '', 'city': '', 'site': '', 'siteId': '620cbdc42c4e77.29646078', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.6993289, 'lng': 77.4050438, 'name': '', 'city': '', 'site': '', 'siteId': '6215d48b5141f8.01281185', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.535195, 'lng': 77.3889622, 'name': '', 'city': '', 'site': '', 'siteId': '6225dc495cae70.89574561', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.6531654, 'lng': 77.3528645, 'name': '', 'city': '', 'site': '', 'siteId': '622aed0b112783.60608422', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.7052804, 'lng': 77.4209795, 'name': '', 'city': '', 'site': '', 'siteId': '622aeda6abb325.51501691', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.5627511, 'lng': 77.3937459, 'name': '', 'city': '', 'site': '', 'siteId': '625026acce8214.16194500', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.7162414, 'lng': 77.4355946, 'name': '', 'city': '', 'site': '', 'siteId': '62511a24b3f741.05606129', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.5744429, 'lng': 77.3819039, 'name': '', 'city': '', 'site': '', 'siteId': '62511be0dadb64.10943403', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.64838305, 'lng': 77.40313657, 'name': '', 'city': '', 'site': '', 'siteId': '6259386a4a1ba6.08872492', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 26.7786065, 'lng': 80.954154, 'name': '', 'city': '', 'site': '', 'siteId': '62613fd392e970.27839705', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.7233107, 'lng': 77.4459944, 'name': '', 'city': '', 'site': '', 'siteId': '6262682ce2d1a4.06996982', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 26.7627987, 'lng': 80.961245, 'name': '', 'city': '', 'site': '', 'siteId': '6267d1616b4fa9.47560936', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.6571104, 'lng': 77.3666403, 'name': '', 'city': '', 'site': '', 'siteId': '626a70a6348741.04705271', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.7040071, 'lng': 77.4374236, 'name': '', 'city': '', 'site': '', 'siteId': '626a70fd7676d6.56088377', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.6758966, 'lng': 77.4906908, 'name': '', 'city': '', 'site': '', 'siteId': '626b8282a83ab2.91571577', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 26.7777254434181, 'lng': 80.9535490777419, 'name': '', 'city': '', 'site': '', 'siteId': '62765f838d8650.33574322', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.6452496, 'lng': 77.3789702, 'name': '', 'city': '', 'site': '', 'siteId': '62b2eed97f8e86.65999764', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.49765327, 'lng': 77.44102833, 'name': '', 'city': '', 'site': '', 'siteId': '62b2ef96d080f9.42409655', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 26.7708841, 'lng': 80.9883856, 'name': '', 'city': '', 'site': '', 'siteId': '62c46f71999fb3.41898967', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.571648, 'lng': 77.3825156, 'name': '', 'city': '', 'site': '', 'siteId': '62c677583611c5.92140540', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.6414877, 'lng': 77.379045, 'name': '', 'city': '', 'site': '', 'siteId': '62c6785015cf34.74541680', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.57558427, 'lng': 77.3802827, 'name': '', 'city': '', 'site': '', 'siteId': '62ce9dd47c4ce4.70469431', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.574784, 'lng': 77.3799058, 'name': '', 'city': '', 'site': '', 'siteId': '62cfd4fd4cb8f7.00245133', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.6293764, 'lng': 77.4436704, 'name': '', 'city': '', 'site': '', 'siteId': '62d6ac21ee84e8.45784861', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 26.7751333, 'lng': 80.984387, 'name': '', 'city': '', 'site': '', 'siteId': '62e8bd9551a880.75378669', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.4446394, 'lng': 77.4657547, 'name': '', 'city': '', 'site': '', 'siteId': '62e8f6b3afc7e7.63761431', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.6364753, 'lng': 77.4594306, 'name': '', 'city': '', 'site': '', 'siteId': '62e9081cb78853.37868177', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.9464916, 'lng': 77.676921, 'name': '', 'city': '', 'site': '', 'siteId': '62e90b700088e3.70399251', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.6668747, 'lng': 77.3851961, 'name': '', 'city': '', 'site': '', 'siteId': '62f742403a7a60.85909736', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.5423159, 'lng': 77.3732608, 'name': '', 'city': '', 'site': '', 'siteId': '63037a66720ea4.01734309', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.5762706, 'lng': 77.3770211, 'name': '', 'city': '', 'site': '', 'siteId': '630f348004e1a2.09184663', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 26.7730206, 'lng': 80.9819527, 'name': '', 'city': '', 'site': '', 'siteId': '632ad86f1cbf87.97688860', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.7019005, 'lng': 77.4071855, 'name': '', 'city': '', 'site': '', 'siteId': '6343af835d1622.11309433', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.7015052, 'lng': 77.428404, 'name': '', 'city': '', 'site': '', 'siteId': '6343b2cccf3842.73713160', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.93940405, 'lng': 77.68707927, 'name': '', 'city': '', 'site': '', 'siteId': '6343b5877a2016.63514263', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.5841168, 'lng': 77.3973942, 'name': '', 'city': '', 'site': '', 'siteId': '6343b71438a373.10992920', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.578959, 'lng': 77.368582, 'name': '', 'city': '', 'site': '', 'siteId': '636caac9a1e602.62371306', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 26.77655, 'lng': 80.9501358, 'name': '', 'city': '', 'site': '', 'siteId': '637dd202738f02.31096897', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.6995165, 'lng': 77.4271415, 'name': '', 'city': '', 'site': '', 'siteId': '6396b5679b86d9.29787115', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.6469695, 'lng': 77.3817283, 'name': '', 'city': '', 'site': '', 'siteId': '639d5e62c468a2.89977246', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.6665483, 'lng': 77.3828447, 'name': '', 'city': '', 'site': '', 'siteId': '639d5e656d6bb8.67038336', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.69695473, 'lng': 77.43587678, 'name': '', 'city': '', 'site': '', 'siteId': '639d61e1ec3604.91217451', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.57315027, 'lng': 77.39165555, 'name': '', 'city': '', 'site': '', 'siteId': '639dbb7b713295.28988227', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.577932, 'lng': 77.3793565, 'name': '', 'city': '', 'site': '', 'siteId': '639dbcc124f5f3.52569050', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.4313414, 'lng': 77.4853396, 'name': '', 'city': '', 'site': '', 'siteId': '639efde3e6b012.57788925', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.54983316, 'lng': 77.36152788, 'name': '', 'city': '', 'site': '', 'siteId': '639eff5014ad62.77434123', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.708195, 'lng': 77.4230786, 'name': '', 'city': '', 'site': '', 'siteId': '63a2b1b40d2143.28490010', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.706354, 'lng': 77.4209882, 'name': '', 'city': '', 'site': '', 'siteId': '63a8821ce472e7.43630877', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.6397374, 'lng': 77.3801253, 'name': '', 'city': '', 'site': '', 'siteId': '63aa833672e1e8.64595550', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.70079957, 'lng': 77.42524823, 'name': '', 'city': '', 'site': '', 'siteId': '63aa84f4d59c91.36920220', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.5742276, 'lng': 77.3837609, 'name': '', 'city': '', 'site': '', 'siteId': '63be8c3b9df3a1.53714749', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.6435872, 'lng': 77.3340577, 'name': '', 'city': '', 'site': '', 'siteId': '63be8d2d66ba09.83543023', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.561116, 'lng': 77.3845028, 'name': '', 'city': '', 'site': '', 'siteId': '63be9ca9a49b87.49882866', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.5870139, 'lng': 77.4507625, 'name': '', 'city': '', 'site': '', 'siteId': '63da30db346518.79533728', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.5940421, 'lng': 77.3808906, 'name': '', 'city': '', 'site': '', 'siteId': '63ff5e6b1ea4b8.96036145', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.5785423, 'lng': 77.3792112, 'name': '', 'city': '', 'site': '', 'siteId': '63ff5f5c80a675.60201643', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.61996368, 'lng': 77.42401211, 'name': '', 'city': '', 'site': '', 'siteId': '63ff602352b419.14585449', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.55044522, 'lng': 77.32456932, 'name': '', 'city': '', 'site': '', 'siteId': '640adf8a8fd891.66593080', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.65586421, 'lng': 77.36039377, 'name': '', 'city': '', 'site': '', 'siteId': '6448c01deb6407.66244824', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.65016761, 'lng': 77.39822124, 'name': '', 'city': '', 'site': '', 'siteId': '644bc1a42104b5.84371759', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.6162183, 'lng': 77.4264111, 'name': '', 'city': '', 'site': '', 'siteId': '646316b52cdc16.04785283', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.57621899, 'lng': 77.38381349, 'name': '', 'city': '', 'site': '', 'siteId': '6467432b3d2931.03781303', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.5756352, 'lng': 77.3913025, 'name': '', 'city': '', 'site': '', 'siteId': '64704c3f3bd840.49654048', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 29.0341943, 'lng': 77.6652315, 'name': '', 'city': '', 'site': '', 'siteId': '647f12cc5035d4.43328929', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.6999424, 'lng': 77.4288189, 'name': '', 'city': '', 'site': '', 'siteId': '64ddf58be3ca91.00434885', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.651726, 'lng': 77.4766659, 'name': '', 'city': '', 'site': '', 'siteId': '650039e0e3ccb5.55006005', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.6483387, 'lng': 77.5049943, 'name': '', 'city': '', 'site': '', 'siteId': '6500439c8f5835.38123395', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.7001275, 'lng': 77.4323908, 'name': '', 'city': '', 'site': '', 'siteId': '6508022de3a9d7.56656969', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.6536349, 'lng': 77.4002458, 'name': '', 'city': '', 'site': '', 'siteId': '650d6fd28553e3.58775658', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.558161, 'lng': 77.346189, 'name': '', 'city': '', 'site': '', 'siteId': '651408b70b6da2.89070132', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.5440044, 'lng': 77.3751496, 'name': '', 'city': '', 'site': '', 'siteId': '6535fbb386efc2.90579719', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.65379852, 'lng': 77.40507548, 'name': '', 'city': '', 'site': '', 'siteId': '6549e1a24aaa54.93098220', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.2887639022264, 'lng': 77.5603115036973, 'name': '', 'city': '', 'site': '', 'siteId': '6549e61acb8a47.12569455', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.5894706, 'lng': 77.4030272, 'name': '', 'city': '', 'site': '', 'siteId': '6549e758eb92b3.72039297', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 26.74432188, 'lng': 80.95383597, 'name': '', 'city': '', 'site': '', 'siteId': '655b0efeecff29.06172102', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.6566403, 'lng': 77.3612139, 'name': '', 'city': '', 'site': '', 'siteId': '6567406ca26fd6.79196172', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.63869781, 'lng': 77.37675856, 'name': '', 'city': '', 'site': '', 'siteId': '658a76ff9d6a48.47508909', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.698099, 'lng': 77.429642, 'name': '', 'city': '', 'site': '', 'siteId': '6593e68c0f58b7.43868730', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.4323282, 'lng': 77.4817822, 'name': '', 'city': '', 'site': '', 'siteId': '65c2238bbc9eb5.61343818', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.6494013, 'lng': 77.3511802, 'name': '', 'city': '', 'site': '', 'siteId': '65c2261e24c9c6.55718746', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.7084502, 'lng': 77.327455, 'name': '', 'city': '', 'site': '', 'siteId': '65c227a3f157f6.39570020', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.7038637, 'lng': 77.4234457, 'name': '', 'city': '', 'site': '', 'siteId': '65ddc20d4c2a05.33613295', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 29.07713532, 'lng': 77.70999492, 'name': '', 'city': '', 'site': '', 'siteId': '65ddc3af988975.99862042', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.43704043, 'lng': 77.48267199, 'name': '', 'city': '', 'site': '', 'siteId': '65ddc53bcf54c1.68632845', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 29.04851384, 'lng': 77.7029644, 'name': '', 'city': '', 'site': '', 'siteId': '65e56fc81249e5.66505465', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.6451191, 'lng': 77.3370004, 'name': '', 'city': '', 'site': '', 'siteId': '6603b3cc4cc654.62151790', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.7002035, 'lng': 77.4272522, 'name': '', 'city': '', 'site': '', 'siteId': '6628daf5eb6392.57053684', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.42014169, 'lng': 77.48399735, 'name': '', 'city': '', 'site': '', 'siteId': '6628de4234b644.87881878', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 27.5725515, 'lng': 77.641291, 'name': '', 'city': '', 'site': '', 'siteId': '663094f85081d4.98880115', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.418209, 'lng': 77.4875211, 'name': '', 'city': '', 'site': '', 'siteId': '664f147414a6b9.15181364', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 26.74975199, 'lng': 80.95476038, 'name': '', 'city': '', 'site': '', 'siteId': '665b2812c137e6.02018134', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.6466192, 'lng': 77.3791515, 'name': '', 'city': '', 'site': '', 'siteId': '665d7cf3be5ba3.91601701', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.8274713, 'lng': 77.5933725, 'name': '', 'city': '', 'site': '', 'siteId': '665d88b459c261.01137847', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.667051, 'lng': 77.3710026, 'name': '', 'city': '', 'site': '', 'siteId': '667006feb9dbb4.85984233', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.9430591852673, 'lng': 77.6808344087785, 'name': '', 'city': '', 'site': '', 'siteId': '668b8c3aa6c389.70878759', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.6541095, 'lng': 77.4010858, 'name': '', 'city': '', 'site': '', 'siteId': '6698b6bf102528.99239683', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.6325493, 'lng': 77.3301499, 'name': '', 'city': '', 'site': '', 'siteId': '6698b7f99c7467.36140122', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.582318, 'lng': 77.3649229, 'name': '', 'city': '', 'site': '', 'siteId': '669a051b60dd86.38399383', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.6527521, 'lng': 77.372279, 'name': '', 'city': '', 'site': '', 'siteId': '669a5de4c009b2.74369754', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.49815604, 'lng': 77.44007139, 'name': '', 'city': '', 'site': '', 'siteId': '66a10133bc0e70.71272070', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 26.8695781, 'lng': 81.0119106, 'name': '', 'city': '', 'site': '', 'siteId': '66ade0ff4be514.68139316', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.5098234, 'lng': 77.4066103, 'name': '', 'city': '', 'site': '', 'siteId': '66bedc3bce1bf4.45574800', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.57716534, 'lng': 77.38615841, 'name': '', 'city': '', 'site': '', 'siteId': '66c70968cde210.52647923', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.3047570732862, 'lng': 77.56485589403, 'name': '', 'city': '', 'site': '', 'siteId': '671252ccc69069.75611750', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.5778816928069, 'lng': 77.3793868258076, 'name': '', 'city': '', 'site': '', 'siteId': '625938be966cd2.25254929', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},
{'lat': 28.558825474835707, 'lng': 77.35106015851876, 'name': '', 'city': '', 'site': '', 'siteId': '672df262503711.71179174', 'sensorcount': 0, 'diccount': 0, 'datalogger_count': 0, 'Grid': '', 'DG': '', 'DG_RUNNING': [{'name': '', 'last_reading_updated_duration': ''}]},

// 28.558825474835707, 77.35106015851876
  ];
}
