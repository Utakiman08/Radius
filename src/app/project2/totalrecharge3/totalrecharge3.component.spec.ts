import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Totalrecharge3Component } from './totalrecharge3.component';

describe('Totalrecharge3Component', () => {
  let component: Totalrecharge3Component;
  let fixture: ComponentFixture<Totalrecharge3Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Totalrecharge3Component]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(Totalrecharge3Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
