import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CdailyComponent } from './cdaily.component';

describe('CdailyComponent', () => {
  let component: CdailyComponent;
  let fixture: ComponentFixture<CdailyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CdailyComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CdailyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
