import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MAPComponent } from './map.component';

describe('MAPComponent', () => {
  let component: MAPComponent;
  let fixture: ComponentFixture<MAPComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MAPComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MAPComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
