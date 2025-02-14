import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TotalrechargeComponent } from './totalrecharge.component';

describe('TotalrechargeComponent', () => {
  let component: TotalrechargeComponent;
  let fixture: ComponentFixture<TotalrechargeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TotalrechargeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TotalrechargeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
