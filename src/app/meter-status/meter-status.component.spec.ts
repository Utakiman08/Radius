import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MeterStatusComponent } from './meter-status.component';

describe('MeterStatusComponent', () => {
  let component: MeterStatusComponent;
  let fixture: ComponentFixture<MeterStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MeterStatusComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MeterStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
