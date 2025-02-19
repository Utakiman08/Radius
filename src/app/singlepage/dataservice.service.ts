import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataserviceService {

  private apiUrlPVVNL= 'https://vapt.myxenius.com/NOC_api/api/';
  private apiUrlNPCL = 'https://multipoint.myxenius.com/NOC_api/api/';
  private apiUrlTorrent ='https://torrentpower.myxenius.com/NOC_api/api/';
  private apiUrlAMR ='https://vapt-mp.myxenius.com/NOC_api/api/';

  private project = '';

  // BehaviorSubject to hold the latest data
  private consumerData = new BehaviorSubject<any>(null);
  
  // BehaviorSubject to hold the sourceComponent value
  private sourceComponent = new BehaviorSubject<string>(this.getStoredSourceComponent() || '');

  constructor(private http: HttpClient) {}
  getLoad_Survey(start_date: string, location_id: string, end_date: string,type:string) {
    // Get the latest sourceComponent from BehaviorSubject
    const sourceComponent = this.sourceComponent.getValue() || this.getStoredSourceComponent() || '';  // Ensure it's never null
    const url = this.getUrlBasedOnSource(sourceComponent);
  
    // Set the project based on the sourceComponent
    if (sourceComponent === 'pvvnl') {
      this.project = 'PVVNL';
    } else if (sourceComponent === 'npcl') {
      this.project = 'NPCL';
    }
    else if (sourceComponent === 'torrent') {
      this.project = 'torrent'
    }
    else if (sourceComponent === 'amr') {
      this.project = 'AMR'
    }
    // Construct the body with or without the 'day' parameter
    const body: any = {
      project: this.project,
      type: type,
      location_id: location_id,
      start_date: start_date,
      end_date:end_date
    };
    
    return this.http.post<any>(`${url}load_survey`, body);
  }

  getMonthlyBill(location_id:string,year:string,month:string){
    const sourceComponent = this.sourceComponent.getValue() || this.getStoredSourceComponent() || '';  // Ensure it's never null
    const url = this.getUrlBasedOnSource(sourceComponent);
    if (sourceComponent === 'pvvnl') {
      this.project = 'PVVNL';
    } else if (sourceComponent === 'npcl') {
      this.project = 'NPCL';
    }
    else if (sourceComponent === 'torrent') {
      this.project = 'torrent'
    }
    else if (sourceComponent === 'amr') {
      this.project = 'AMR'
    }
    const body:any = {
      location_id:location_id,
      project:this.project,
      date:`${year}-${month}`
    }
    return this.http.post<any>(`${url}reportData`,body)


  }
  getRecharge(location_id:string){
    const sourceComponent = this.sourceComponent.getValue() || this.getStoredSourceComponent() || '';  // Ensure it's never null
    const url = this.getUrlBasedOnSource(sourceComponent);
  
    // Set the project based on the sourceComponent
    if (sourceComponent === 'pvvnl') {
      this.project = 'PVVNL';
    } else if (sourceComponent === 'npcl') {
      this.project = 'NPCL';
    }
    else if (sourceComponent === 'torrent') {
      this.project = 'torrent'
    }
    else if (sourceComponent === 'amr') {
      this.project = 'AMR'
    }
    const body:any={
      location_id:location_id,
      project:this.project
    }

    return this.http.post<any>(`${url}recharge_history`,body)
  }
  // Method to fetch data and store the sourceComponent value
  getData(filterType: string, filterText: string, sourceComponent: string): Observable<any> {
    // Prioritize the sourceComponent passed as a parameter
    const sourceToUse = sourceComponent || this.getStoredSourceComponent() || ''; // Ensure sourceComponent is never null
  
    // Store the sourceComponent in the BehaviorSubject and sessionStorage
    this.sourceComponent.next(sourceToUse);
    this.storeSourceComponent(sourceToUse);
  
    // Set the project based on the sourceComponent
    if (sourceToUse === 'pvvnl') {
      this.project = 'PVVNL';
    } else if (sourceToUse === 'npcl') {
      this.project = 'NPCL';
    } else if (sourceToUse === 'torrent') {
      this.project = 'torrent';
    }else if (sourceToUse === 'amr') {
      this.project = 'AMR';
    }
  
    const body = { filter_type: filterType, filter_text: filterText, project: this.project };
    return this.http.post<any>(`${this.getUrlBasedOnSource(sourceToUse)}srchCnsmrDtl`, body);
  }
  

  // Store the fetched data in sessionStorage
  storeDataInSessionStorage(filterType: string, filterText: string, sourceComponent: string) {
    this.getData(filterType, filterText, sourceComponent).subscribe(data => {
      sessionStorage.setItem('consumerData', JSON.stringify(data));
      this.setConsumerData(data);
    });
  }

  // Store the fetched data in BehaviorSubject for easy access
  setConsumerData(data: any) {
    this.consumerData.next(data);
  }

  // Get the stored data as an Observable for other components
  getStoredConsumerData(): Observable<any> {
    return this.consumerData.asObservable();
  }
  SendBPNoSMS(location_id:string){
    const sourceComponent = this.sourceComponent.getValue() || this.getStoredSourceComponent() || '';
    const url = this.getUrlBasedOnSource(sourceComponent);

    const body :any ={
      location_id:location_id
    }
    return this.http.post<any>(`${url}sendBpNoSms`, body)
  }
  restore(location_id:string,site_id:string){
    const sourceComponent = this.sourceComponent.getValue() || this.getStoredSourceComponent() || '';
    const url = this.getUrlBasedOnSource(sourceComponent);

    const body :any ={
      location_id:location_id,
      site_id:site_id
    }
    return this.http.post<any>(`${url}master_action`, body)
  }
  // Example of another API call (consumption data)
  getConsumption(type: string, ConsumerID: string, siteId: string, month: string, year: string, day?: string) {
    // Get the latest sourceComponent from BehaviorSubject
    const sourceComponent = this.sourceComponent.getValue() || this.getStoredSourceComponent() || '';  // Ensure it's never null
    const url = this.getUrlBasedOnSource(sourceComponent);
  
    // Set the project based on the sourceComponent
    if (sourceComponent === 'pvvnl') {
      this.project = 'PVVNL';
    } else if (sourceComponent === 'npcl') {
      this.project = 'NPCL';
    }
    else if (sourceComponent === 'torrent') {
      this.project = 'torrent'
    }
    else if (sourceComponent === 'amr') {
      this.project = 'AMR'
    }
    // Construct the body with or without the 'day' parameter
    const body: any = {
      project: this.project,
      filter_type: type,
      location_id: ConsumerID,
      month: month,
      year: year
    };
  
    // Add 'day' only if it's provided
    if (day) {
      body.day = day;
    }
  
    return this.http.post<any>(`${url}user_consumption`, body);
  }
  

  // Private method to return URL based on the source component
  private getUrlBasedOnSource(sourceComponent: string): string {
    switch (sourceComponent.toLowerCase()) {
      case 'pvvnl':
        return this.apiUrlPVVNL;
      case 'npcl':
        return this.apiUrlNPCL;
      case 'torrent':
        return this.apiUrlTorrent;
      case 'amr':
         return this.apiUrlAMR;
      default:
        return this.apiUrlPVVNL; // Default URL if no matching source component
    }
  }

  // Store the sourceComponent in sessionStorage/localStorage
  private storeSourceComponent(sourceComponent: string) {
    sessionStorage.setItem('sourceComponent', sourceComponent);
  }

  // Get the sourceComponent from sessionStorage/localStorage
  private getStoredSourceComponent(): string | null {
    return sessionStorage.getItem('sourceComponent');
  }
}
