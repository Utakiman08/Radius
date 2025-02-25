import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SitedetailsComponent } from './sitedetails.component';

describe('SitedetailsComponent', () => {
  let component: SitedetailsComponent;
  let fixture: ComponentFixture<SitedetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SitedetailsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SitedetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
