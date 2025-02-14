import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NdailyComponent } from './ndaily.component';

describe('NdailyComponent', () => {
  let component: NdailyComponent;
  let fixture: ComponentFixture<NdailyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NdailyComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(NdailyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
