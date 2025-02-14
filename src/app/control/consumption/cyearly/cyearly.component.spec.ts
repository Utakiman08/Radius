import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CyearlyComponent } from './cyearly.component';

describe('CyearlyComponent', () => {
  let component: CyearlyComponent;
  let fixture: ComponentFixture<CyearlyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CyearlyComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CyearlyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
