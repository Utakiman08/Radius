import { CommonModule } from '@angular/common';
import { Component , HostListener, Input } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
 import { SharedService } from '../shared.service';
import { DataserviceService } from '../singlepage/dataservice.service';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../toast.service';
import { Title } from '@angular/platform-browser';
import { IntervalService } from '../interval.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule,FormsModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
 
  loadingsearch:boolean = false
  @Input() showElements: boolean = true;
  @Input() ShowSomeElements: boolean = true;
  @Input() SearchInput: boolean = true;
  @Input() customClass: string = '';
  @Input() searchClass: string = '';
  @Input() sourcecomponent: string = '';
  @Input() showTimer:boolean = true
  hours: number = 0;
  minutes: number = 30;
  seconds: number = 0;
  selectedRoute: string = '';
  currenttype:string = 'LOCATION_ID'
  currenttypeNavbar:string = 'LOCATION_ID'
  constructor(
    private timer : IntervalService,
 
    private router: Router, 
    private sharedService: SharedService,
    private searchdataservice: DataserviceService,
    private toastr:ToastService, 
    private titleService: Title,  // Inject Title service
  ) {}
 
  // togglePattern(): void {
  //   const newPattern = this.isPatternOne ? this.bgPattern2 : this.bgPattern1;
  //   this.isPatternOne = !this.isPatternOne; // Toggle the pattern

  //   // Apply the background pattern to the custom property
  //   this.renderer.setStyle(
  //     this.el.nativeElement.ownerDocument.documentElement,
  //     '--bg-pattern',
  //     newPattern
  //   );
  // }
  onSelectChange(event: Event): void {
    const selectedValue = (event.target as HTMLSelectElement).value;
    if (selectedValue) {
      this.selectedRoute = selectedValue;
      this.router.navigate([selectedValue]);
    }
  }
  isValidInterval(): boolean {
    const totalSeconds = this.hours * 3600 + this.minutes * 60 + this.seconds;
    return totalSeconds >= 30; // Minimum interval is 30 seconds
  }
  updateInterval(): void {
    if (!this.isValidInterval()) {
      this.toastr.info("Timer Set cannot be less than 30")
      console.error("Invalid interval: Minimum interval is 30 seconds.");
      return;
    }
  
    const milliseconds =
      (this.hours * 3600 + this.minutes * 60 + this.seconds) * 1000; // Convert to milliseconds
    this.timer.setIntervalValue(milliseconds);
    this.timer.triggerUpdate();
  }
  SendUpdateCommand(): void {
    this.timer.triggerUpdate();
    console.log('sending trigger command')
  }

  updateRoute(route: string): void {
    this.selectedRoute = route;
    this.router.navigate([route]);
  }
  displayheader:boolean = true
  isSmallScreen: boolean = window.innerWidth <= 1400;

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.isSmallScreen = window.innerWidth <= 1400;
  }
  private presetTitle: string = 'Radius';

  onSelectInputType(event: Event): void {
    const selectedValue = (event.target as HTMLSelectElement).value;
    this.currenttype = selectedValue
  }
  selectedColor: string = '#00fefe'; // Default color: --primary-rgb: 0, 254, 254

  ngOnInit(): void {
    this.updatePageTitle(); // Set initial title

    this.selectedRoute = this.router.url; 
    const savedColor = localStorage.getItem('primaryColor');
    if (savedColor) {
      this.selectedColor = savedColor;
      this.updatePrimaryColor(savedColor);
    } else {
      this.updatePrimaryColor(this.selectedColor); // Set default color if no saved color
    }
  }
  private updatePageTitle(): void {
    if (!this.presetTitle || !this.sourcecomponent) {
         return; // Stop execution if either value is undefined
    }

    // Create a formattedSourceComponent based on the desired display format
    let formattedSourceComponent = this.sourcecomponent? this.sourcecomponent:this.searchComponent;

    // Apply specific formatting only for defined values
    switch (this.sourcecomponent.toLowerCase()) {
        case 'pvvnl':
        case 'npcl':
        case 'amr':
            formattedSourceComponent = this.sourcecomponent.toUpperCase();
            break;
        case 'torrent':
            formattedSourceComponent = 
                this.sourcecomponent.charAt(0).toUpperCase() + 
                this.sourcecomponent.slice(1).toLowerCase();
            break;
        case 'control':
            formattedSourceComponent = 'All'; // Display "All" for control
            break;
    }

    // Concatenate the preset title and formatted source component
    const newTitle = `${this.presetTitle} - ${formattedSourceComponent}`;
    this.titleService.setTitle(newTitle);
}


  ngOnChanges(): void {
    this.updatePageTitle();
  }
  onColorChange(event: any): void {
    const newColor = event.target.value;
    this.selectedColor = newColor;
    localStorage.setItem('primaryColor', newColor); // Save the chosen color in localStorage
    this.updatePrimaryColor(newColor);
  }

  updatePrimaryColor(color: string): void {
    const rgbColor = this.hexToRgb(color);
    if (rgbColor) {
      document.documentElement.style.setProperty('--primary-rgb', rgbColor.join(', '));
    }
  }

  // Helper function to convert hex to rgb
  hexToRgb(hex: string): number[] | null {
    const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return match ? [
      parseInt(match[1], 16),
      parseInt(match[2], 16),
      parseInt(match[3], 16)
    ] : null;
  }
  logout(): void {
    sessionStorage.clear();
    this.router.navigate(['/login']);
  }

  getPlaceholder(type: string): string {
    switch (type) {
      case 'LOCATION_ID':
        return 'Location ID...';
      case 'ACCOUNT_ID':
        return 'Account ID...';
      case 'SERIAL_NO':
        return 'Serial NO...';
      case 'MOBILE_NO':
        return 'Mobile NO...';
      default:
        return 'Search...';
    }
  }
  onImageClick(){
    const URL = this.sourcecomponent ? this.sourcecomponent : this.searchComponent
    this.router.navigate([`main/${URL}`])
  }
  onProjectChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.sharedService.updateSelectedProject(selectElement.value);
  }
  activeProject:string =''
  onProjectChangeNavlink(project: string): void {
    this.activeProject = this.sourcecomponent
    this.sharedService.updateSelectedProject(project);
  }
  password:string=''
  searchComponent:string =''
  
  search() {
    if (!this.password) {
       this.toastr.error("Please enter a password to search.");
      return;
    }
  
    let componentToUse = '';
  
    // Determine which component to use
    if (this.searchComponent) {
      componentToUse = this.searchComponent;
    } else if (this.sourcecomponent) {
      componentToUse = this.sourcecomponent;
    } else {
      // Handle the case where neither is set
      this.toastr.error("No component selected for search");
      return;
    }
  
    // Make the API call using the appropriate component
    this.searchdataservice.getData(this.currenttype, this.password, componentToUse).subscribe(
      (response) => {
        this.loadingsearch = true;
  
        if (response.rc === '-1') {
          // Handle no data found
          this.toastr.warning(`No data found for this ${this.currenttype}`);
          this.loadingsearch = false;
        } else if (response.rc === '0') {
          // Handle successful response
          this.loadingsearch = false;
          sessionStorage.setItem('consumerData', JSON.stringify(response));
          sessionStorage.setItem('ConsumerID', JSON.stringify(this.password));
  
          // Navigate to /Consumer with query parameters
          const queryParams = { source: componentToUse }; // Append source component to the query
          if (this.router.url.startsWith('/Consumer')) {
            // Reload the current page if already at /Consumer
            window.location.reload();
          } else {
            // Navigate to /Consumer with the query parameter
            this.router.navigate(['/Consumer']);
          }
        }
      },
      (error) => {
        // Handle API error
        this.toastr.error("An error occurred while searching.");
        this.loadingsearch = false;
      }
    );
  
    this.loadingsearch = false;
  }
  
  
  
  Navbarpassword:string=''
  Navbarsearch() {
    if (!this.Navbarpassword) {
      // Prevent the search when no input is entered
      return;
    }
  
    let componentToUse = '';
  
    // Check if searchComponent is set first, otherwise use sourcecomponent
    if (this.searchComponent) {
      componentToUse = this.searchComponent;
    } else if (this.sourcecomponent) {
      componentToUse = this.sourcecomponent;
    } else {
      // If neither is set, alert the user or handle the case
      this.toastr.error("No component selected for search");
      return;
    }
  //console.log("Using component: ", componentToUse);

    // Make the API call using the appropriate component
    this.searchdataservice.getData(this.currenttypeNavbar, this.Navbarpassword, componentToUse).subscribe(response => {
      if (response.rc === "-1") {
        this.toastr.warning(`No data found for this ${this.currenttypeNavbar}`);
      } else if (response.rc === '0') {
        this.sourcecomponent = componentToUse
        // Store the response in session storage
        sessionStorage.setItem('consumerData', JSON.stringify(response));
        sessionStorage.setItem('ConsumerID', JSON.stringify(this.password));
        const queryParams = { source: componentToUse }; // Append source component to the query
        if (this.router.url.startsWith('/Consumer')) {
          // Reload the current page if already at /Consumer
          window.location.reload();
        } else {
          // Navigate to /Consumer with the query parameter
          this.router.navigate(['/Consumer']);
        }
      }
    });
  }
  }

