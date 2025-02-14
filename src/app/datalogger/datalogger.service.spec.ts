import { TestBed } from '@angular/core/testing';

import { DataloggerService } from './datalogger.service';

describe('DataloggerService', () => {
  let service: DataloggerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DataloggerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
