import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataloggerService {
  private apiUrl2= 'https://uppclmp.myxenius.com/NOC_api/api/';
  private apiUrlNPCL = 'https://multipoint.myxenius.com/NOC_api/api/';
  private apiUrlTorrent ='https://torrentpower.myxenius.com/NOC_api/api/';
  private apiUrlAMR ='https://vapt-mp.myxenius.com/NOC_api/api/';

  constructor(private http: HttpClient) {}

  getBaseData(sourceComponent : string,siteId:string =''): Observable<any> {
    const url = this.getUrlBasedOnSource(sourceComponent);
    if (sourceComponent === 'pvvnl') {
      sourceComponent = 'PVVNL'
    }
    if (sourceComponent === 'npcl'){
      sourceComponent = 'NPCL'
    }
    if (sourceComponent === 'amr'){
      sourceComponent = 'AMR'
    }
    const payload = {
      type: 'datalogger',
      project:sourceComponent
    };
    const payloadSiteId = {
      type: 'datalogger',
      project:sourceComponent,
      site_id:siteId
    };
    if (siteId) {
      return this.http.post<any>(`${url}count_data`, payloadSiteId);
    }
    else{
      return this.http.post<any>(`${url}count_data`, payload);
    }   }

  getDataByType(type: string,site:string, sourceComponent:string): Observable<any> {
    const url = this.getUrlBasedOnSource(sourceComponent);
    if (sourceComponent === 'pvvnl') {
      sourceComponent = 'PVVNL'
    }
    if (sourceComponent === 'npcl'){
      sourceComponent = 'NPCL'
    }
    if (sourceComponent === 'amr'){
      sourceComponent = 'AMR'
    }
    const payload = {
      type: 'datalogger',
      mode: type,
      site:site,
      project:sourceComponent

    };
    return this.http.post<any>(`${url}list_data`, payload);
  }
  getSiteName(sourceComponent:string,){

    const url = this.getUrlBasedOnSource(sourceComponent)
    if (sourceComponent === 'pvvnl'||sourceComponent ==='amr'||sourceComponent ==='npcl') {
      sourceComponent = sourceComponent.toUpperCase();
     }
     else{
      sourceComponent = sourceComponent.toLowerCase();
     }
    const body ={
      project : sourceComponent
    }
    return this.http.post<any>(`${url}sites_map_data`,body);
  }
private getUrlBasedOnSource(sourceComponent: string): string {
    switch (sourceComponent) {
      case 'control':
        return '/api/control-data'; // Replace with actual URL
      case 'pvvnl':
        return this.apiUrl2; // Replace with actual URL
      case 'torrent':
        return this.apiUrlTorrent; // Replace with actual URL
      case 'npcl':
        return this.apiUrlNPCL; // Replace with actual URL
      case 'amr':
        return this.apiUrlAMR; // Replace with actual URL
      default:
        return '/api/default-data'; // Default URL
    }
  }
}
