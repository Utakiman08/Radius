import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DgstatusComponent } from './dgstatus.component';

describe('DgstatusComponent', () => {
  let component: DgstatusComponent;
  let fixture: ComponentFixture<DgstatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DgstatusComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DgstatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
