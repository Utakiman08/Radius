import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectAMRComponent } from './project-amr.component';

describe('ProjectAMRComponent', () => {
  let component: ProjectAMRComponent;
  let fixture: ComponentFixture<ProjectAMRComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectAMRComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProjectAMRComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
