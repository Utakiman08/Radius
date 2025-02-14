import { TestBed } from '@angular/core/testing';

import { PassiveErrorService } from './passive-error.service';

describe('PassiveErrorService', () => {
  let service: PassiveErrorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PassiveErrorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
