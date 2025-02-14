import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TotalrechargemainComponent } from './totalrechargemain.component';

describe('TotalrechargemainComponent', () => {
  let component: TotalrechargemainComponent;
  let fixture: ComponentFixture<TotalrechargemainComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TotalrechargemainComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TotalrechargemainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
