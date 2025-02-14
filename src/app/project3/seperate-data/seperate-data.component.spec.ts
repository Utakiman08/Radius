import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeperateDataComponent } from './seperate-data.component';

describe('SeperateDataComponent', () => {
  let component: SeperateDataComponent;
  let fixture: ComponentFixture<SeperateDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeperateDataComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SeperateDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
