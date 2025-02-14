import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsumerDetailComponent } from './consumer-detail.component';

describe('ConsumerDetailComponent', () => {
  let component: ConsumerDetailComponent;
  let fixture: ComponentFixture<ConsumerDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsumerDetailComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ConsumerDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
