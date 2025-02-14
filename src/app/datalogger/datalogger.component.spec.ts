import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataloggerComponent } from './datalogger.component';

describe('DataloggerComponent', () => {
  let component: DataloggerComponent;
  let fixture: ComponentFixture<DataloggerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataloggerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DataloggerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
