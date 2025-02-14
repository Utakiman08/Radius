import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private apiUrl1 = 'https://torrentpower.myxenius.com/NOC_api/api/'
  private project = 'torrent'

  constructor(private http: HttpClient) {}
  getAllsite(SiteId:string): Observable<any> {
    const payload :any = {
      type: 'All',
      project : this.project,
      site_id:SiteId
    };

    return this.http.post<any>(`${this.apiUrl1}count_data`, payload);
  }
  getAllData(): Observable<any> {
    const payload :any = {
      "type":"",
      "site_id":"ALL",
      project : this.project
    };

    return this.http.post<any>(`${this.apiUrl1}count_data`, payload);
  }
  getBaseDataDIC(): Observable<any> {
    const payload :any = {
      type: 'dic',
      project : this.project
    };

    return this.http.post<any>(`${this.apiUrl1}count_data`, payload);
  }
  getBaseDataDL(): Observable<any> {
    const payload :any = {
      type: 'datalogger',
      project : this.project
    };


    return this.http.post<any>(`${this.apiUrl1}count_data`, payload);
  }
  getBaseDataSite(): Observable<any> {
    const payload :any = {
      type: 'site',
      project : this.project
    };

    return this.http.post<any>(`${this.apiUrl1}count_data`, payload);
  }
  getBaseDataSensor(): Observable<any> {
    const payload :any = {
      type: 'sensor',
      project : this.project
    };

    return this.http.post<any>(`${this.apiUrl1}count_data`, payload);
  }
  getData_DgStatus(): Observable<any> {
    const body={
      project: this.project
    }
    return this.http.post<any>(`${this.apiUrl1}DG_status`,body);
  }


  getData_recharge_total(date:string,type:string): Observable<any> {
    const body = { 
      date: date ,
      type: "total",
      project: this.project
    };
    return this.http.post<any>(`${this.apiUrl1}recharge`, body);
  }

  getData_consumption_daily(date:string,siteid?:string): Observable<any> {
    const body :any = {
      date: date ,
      type: "daily", 
      project: this.project

    };
    if (siteid) {
      body.site_id = siteid
    }

    return this.http.post<any>(`${this.apiUrl1}consumption`, body );
  }

  getData_consumption_Yearly(year:string): Observable<any> {
    const body = {
      year: year ,
      type: "yearly",
      project: this.project

    };
    return this.http.post<any>(`${this.apiUrl1}consumption`, body);
  }

  getData_Meter_dashboard(): Observable<any> {
    const body={
      project: this.project
    }
    return this.http.post<any>(`${this.apiUrl1}meter_status`,body);
  }

  getData_users(date:string): Observable<any> {
    const body = {
      date: date,
      project: this.project
    };
    return this.http.post<any>(`${this.apiUrl1}mobile_users`,body);
  }
  getRechargeDaily(type:string,mode:string,date:string){
    const body ={
      type:type,
      mode:mode,
      date:date,
      project : this.project
    }
    return this.http.post<any>(`${this.apiUrl1}recharge`,body);
  }

  getMapData(){
    const body ={
      project : this.project
    }
    return this.http.post<any>(`${this.apiUrl1}sites_map_data`,body);
  }

}
