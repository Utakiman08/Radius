import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { DataserviceService } from '../dataservice.service';

@Component({
  selector: 'app-sitedetails',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sitedetails.component.html',
  styleUrls: ['./sitedetails.component.scss']  // Corrected the 'styleUrl' to 'styleUrls'
})
export class SitedetailsComponent implements OnInit {

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private DataService : DataserviceService
  ) {}
  
  site_data: {
    site_id?: string;
    site_name?: string;
    short_code?: string;
    address?: string;
    supervisor_name?: string;
    pg_enable?: string;
    pg_enable_hdfc?: string;
    ibms_tp_mobile_app_enable?: string;
    access_control_available?: string;
    supervisor_contact_no?: string;
    supervisor_email_id?: string;
    low_balance_alert_grid?: string;
    low_balance_alert_dg?: string;
    sms_alert_message_enabled?: string;
    sms_alert_time_from?: string;
    sms_alert_time_to?: string;
    mmc_deduction_day?: string;
    fixed_deduction_day?: string;
    Grid_Fixed_deduction_day?: string;
    CAM_deduction_day?: string;
    CS_deduction_day?: string;
    other_deduction_day?: string;
    CAP_deduction_day?: string;
    mmc_deduction_hour?: string;
    fixed_deduction_hour?: string;
    Grid_Fixed_deduction_hour?: string;
    CAM_deduction_hour?: string;
    CS_deduction_hour?: string;
    other_deduction_hour?: string;
    CAP_deduction_hour?: string;
    happy_hh_from_grid?: string;
    happy_hh_to_grid?: string;
    happy_hh_from_dg?: string;
    happy_hh_to_dg?: string;
    grid_tax?: string;
    dg_tax?: string;
    min_recharge?: string;
    max_recharge?: string;
    active_cut_off_grid?: string;
    active_cut_off_dg?: string;
    emi_deduction_day?: string;
    emi_deduction_hour?: string;
  } = {};
  
  sanitizeSiteData(data: any): any {
    const defaultSiteData = {
      site_id: "---",
      site_name: "---",
      short_code: "---",
      address: "---",
      supervisor_name: "---",
      pg_enable: "---",
      pg_enable_hdfc: "---",
      ibms_tp_mobile_app_enable: "---",
      access_control_available: "---",
      supervisor_contact_no: "---",
      supervisor_email_id: "---",
      low_balance_alert_grid: "---",
      low_balance_alert_dg: "---",
      sms_alert_message_enabled: "---",
      sms_alert_time_from: "---",
      sms_alert_time_to: "---",
      mmc_deduction_day: "---",
      fixed_deduction_day: "---",
      Grid_Fixed_deduction_day: "---",
      CAM_deduction_day: "---",
      CS_deduction_day: "---",
      other_deduction_day: "---",
      CAP_deduction_day: "---",
      mmc_deduction_hour: "---",
      fixed_deduction_hour: "---",
      Grid_Fixed_deduction_hour: "---",
      CAM_deduction_hour: "---",
      CS_deduction_hour: "---",
      other_deduction_hour: "---",
      CAP_deduction_hour: "---",
      happy_hh_from_grid: "---",
      happy_hh_to_grid: "---",
      happy_hh_from_dg: "---",
      happy_hh_to_dg: "---",
      grid_tax: "---",
      dg_tax: "---",
      min_recharge: "---",
      max_recharge: "---",
      active_cut_off_grid: "---",
      active_cut_off_dg: "---",
      emi_deduction_day: "---",
      emi_deduction_hour: "---",
    };
  
    const sanitizedData: any = { ...defaultSiteData };
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        sanitizedData[key] = (data[key] === null || data[key] === 'NA') ? '---' : data[key];
      }
    }
  
    return sanitizedData;
  }
  
  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Fetch the saved data from sessionStorage
      const consumerData = sessionStorage.getItem('consumerData');
      if (consumerData) {
        // Parse and sanitize the data
        const parsedData = JSON.parse(consumerData);
        this.site_data = this.sanitizeSiteData(parsedData.data.site_data || {});
      } else {
        // If no consumerData, initialize with defaults
        this.site_data = this.sanitizeSiteData({});
      }
    }
  }
  
}
