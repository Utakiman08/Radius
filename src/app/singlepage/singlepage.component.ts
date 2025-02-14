import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { GraphComponent } from './graph/graph.component';
import { SitedetailsComponent } from './sitedetails/sitedetails.component';
import { ConsumerDetailComponent } from './consumer-detail/consumer-detail.component';
import { MeterdetailComponent } from './meterdetail/meterdetail.component';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from "../footer/footer.component";
import { DataserviceService } from './dataservice.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-singlepage',
  standalone: true,
  imports: [GraphComponent, SitedetailsComponent, ConsumerDetailComponent, MeterdetailComponent, CommonModule, HeaderComponent, FooterComponent],
  templateUrl: './singlepage.component.html',
  styleUrl: './singlepage.component.scss'
})
export class SinglepageComponent implements OnInit {
  activeTab: string = 'Graphical View'; // Set default active tab
  sourceComponent:any
  
  siteId:string = ''
  locationId:string =''



  ngOnInit(): void {
    this.sourceComponent = sessionStorage.getItem('sourceComponent')
    if (isPlatformBrowser(this.platformId)) {
       const consumerData = sessionStorage.getItem('consumerData');
      if (consumerData) {
         const parsedData = JSON.parse(consumerData);
        this.siteId = (parsedData.data.site_data.site_id);
        this.locationId = (parsedData.data.location_grid.location_id);
      }

    }
  }
  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  constructor(private dataservice: DataserviceService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private route: ActivatedRoute

  ){}
 
}
