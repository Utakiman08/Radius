import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdailyComponent } from './pdaily.component';

describe('PdailyComponent', () => {
  let component: PdailyComponent;
  let fixture: ComponentFixture<PdailyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdailyComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PdailyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
