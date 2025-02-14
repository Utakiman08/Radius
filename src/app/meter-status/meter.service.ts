// meter.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class MeterService {
  private apiUrl2= 'https://uppclmp.myxenius.com/NOC_api/api/';
  private apiUrlNPCL = 'https://multipoint.myxenius.com/NOC_api/api/';
  private apiUrlTorrent = 'https://torrentpower.myxenius.com/NOC_api/api/';
  private apiUrlAMR = 'https://vapt-mp.myxenius.com/NOC_api/api/';


  constructor(private http: HttpClient) {}

  getData_Meter_dashboard(sourceComponent: string): Observable<any> {
    if (sourceComponent === 'control') {
      // Fetch data from all three APIs when the source is 'control'
      return this.getCombinedDataForControl();
    } else {
      
      // Fetch data based on the single source component
      const url = this.getUrlBasedOnSource(sourceComponent);
      if (sourceComponent === 'pvvnl'){
        sourceComponent = 'PVVNL'
      }
      if (sourceComponent === 'npcl'){
        sourceComponent = 'NPCL'
      }
      if (sourceComponent === 'amr'){
        sourceComponent = 'AMR'
      }
      const body = { project: sourceComponent };
      return this.http.post<any>(`${url}meter_status`, body).pipe(
        catchError(() => of({ data: {} })) // Fallback in case of errors
      );
    }
  }

  private getCombinedDataForControl(): Observable<any> {
    const bodyPVVNL = { project: 'PVVNL' };
    const bodyNPCL = { project: 'NPCL' };
    const bodyTorrent = { project: 'torrent' };
    const bodyAMR = { project: 'AMR' };

  
    return forkJoin({
      pvvnl: this.http.post<any>(`${this.apiUrl2}meter_status`, bodyPVVNL).pipe(
        catchError(() => of({ data: {} }))
      ),
      npcl: this.http.post<any>(`${this.apiUrlNPCL}meter_status`, bodyNPCL).pipe(
        catchError(() => of({ data: {} }))
      ),
      torrent: this.http.post<any>(`${this.apiUrlTorrent}meter_status`, bodyTorrent).pipe(
        catchError(() => of({ data: {} }))
      ),
      amr: this.http.post<any>(`${this.apiUrlAMR}meter_status`, bodyAMR).pipe(
        catchError(() => of({ data: {} }))
      ),
    }).pipe(
      map((responses) => {
        // Initialize the combined data object
        const combinedData = {
          totalMeterCount: 0,
          totalInfraMeterCount: 0,
          totalInstallMeterCount: 0,
          totalInfra: 0,
          totalThreePhase: 0,
          totalSinglePhase: 0,
          totalAEW: 0,
          totalGENUS: 0,
          totalCT: 0,
          totalHPL: 0,
          totalWOQ: 0,
          site_name: [],
          site_id: [],
          woq: [],
          meter_count: [],
          infra_meter_count: [],
          metercount: [],
          infra_count: [],
          three_phase_count: [],
          single_phase_count: [],
          aew_count: [],
          hpl_count: [],
          genus_count: [],
          ct_count: [],
        };
  
        // Combine the data from each response
        Object.values(responses).forEach((response: any) => {
          const data = response.data || {};
  
          // Aggregate count values
          combinedData.totalMeterCount += data.totalMeterCount || 0;
          combinedData.totalInfraMeterCount += data.totalInfraMeterCount || 0;
          combinedData.totalInstallMeterCount += data.totalInstallMeterCount || 0;
          combinedData.totalInfra += data.totalInfra || 0;
          combinedData.totalThreePhase += data.totalThreePhase || 0;
          combinedData.totalSinglePhase += data.totalSinglePhase || 0;
          combinedData.totalAEW += data.totalAEW || 0;
          combinedData.totalGENUS += data.totalGENUS || 0;
          combinedData.totalCT += data.totalCT || 0;
          combinedData.totalHPL += data.totalHPL || 0;
          combinedData.totalWOQ += data.totalWOQ || 0;
  
          // Combine arrays by concatenating them
          combinedData.site_name = combinedData.site_name.concat(data.site_name || []);
          combinedData.site_id = combinedData.site_id.concat(data.site_id || []);
          combinedData.woq = combinedData.woq.concat(data.woq || []);
          combinedData.meter_count = combinedData.meter_count.concat(data.meter_count || []);
          combinedData.infra_meter_count = combinedData.infra_meter_count.concat(data.infra_meter_count || []);
          combinedData.metercount = combinedData.metercount.concat(data.metercount || []);
          combinedData.infra_count = combinedData.infra_count.concat(data.infra_count || []);
          combinedData.three_phase_count = combinedData.three_phase_count.concat(data.three_phase_count || []);
          combinedData.single_phase_count = combinedData.single_phase_count.concat(data.single_phase_count || []);
          combinedData.aew_count = combinedData.aew_count.concat(data.aew_count || []);
          combinedData.hpl_count = combinedData.hpl_count.concat(data.hpl_count || []);
          combinedData.genus_count = combinedData.genus_count.concat(data.genus_count || []);
          combinedData.ct_count = combinedData.ct_count.concat(data.ct_count || []);
        });
  
        return { data: combinedData };
      })
    );
  }
  

  private getUrlBasedOnSource(sourceComponent: string): string {
    switch (sourceComponent) {
      case 'control':
        return ''; // This case is handled separately
      case 'pvvnl':
        return this.apiUrl2;
      case 'torrent':
        return this.apiUrlTorrent;
      case 'npcl':
        return this.apiUrlNPCL;
      case 'amr':
        return this.apiUrlAMR;
      default:
        return '/api/default-data'; // Default URL
    }
  }
}
