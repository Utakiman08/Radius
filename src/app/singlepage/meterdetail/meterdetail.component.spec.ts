import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MeterdetailComponent } from './meterdetail.component';

describe('MeterdetailComponent', () => {
  let component: MeterdetailComponent;
  let fixture: ComponentFixture<MeterdetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MeterdetailComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MeterdetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
