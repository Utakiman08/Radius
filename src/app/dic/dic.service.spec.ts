import { TestBed } from '@angular/core/testing';

import { DicService } from './dic.service';

describe('DicService', () => {
  let service: DicService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DicService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
