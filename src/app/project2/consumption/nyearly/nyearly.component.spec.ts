import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NyearlyComponent } from './nyearly.component';

describe('NyearlyComponent', () => {
  let component: NyearlyComponent;
  let fixture: ComponentFixture<NyearlyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NyearlyComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(NyearlyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
