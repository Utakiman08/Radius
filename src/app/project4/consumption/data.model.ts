export interface GridData {
    grid_unit: string[];
  }
  
  export interface DgData {
    dg_unit: string[];
  }
  
  export interface TestingData {
    resource: {
      grid: GridData;
      dg: DgData;
    };
  }

  export interface TestingDatamonth {
    resource: {
      grid: monthgrid;
      dg: monthdg;
    };
  }
  export interface TestingDatayear {
    resource: {
      grid: yeargrid;
      dg: yeardg;
    };
  }

  export interface monthgrid{
    month : string[];
    unit_grid_consumed: any[]
  }
  export interface monthdg{
    month : string[];
    unit_dg_consumed: any[]
  }

  export interface yeargrid{
    month : number[];
    unit: any[];
    amount: any[];
  }
  export interface yeardg{
    month : number[];
    unit: any[];
    amount: any[]
;

  }