import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Totalrecharge2Component } from './totalrecharge2.component';

describe('Totalrecharge2Component', () => {
  let component: Totalrecharge2Component;
  let fixture: ComponentFixture<Totalrecharge2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Totalrecharge2Component]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(Totalrecharge2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
