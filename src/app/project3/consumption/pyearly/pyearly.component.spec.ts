import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PyearlyComponent } from './pyearly.component';

describe('PyearlyComponent', () => {
  let component: PyearlyComponent;
  let fixture: ComponentFixture<PyearlyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PyearlyComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PyearlyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
