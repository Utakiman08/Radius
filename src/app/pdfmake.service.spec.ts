import { TestBed } from '@angular/core/testing';

import { PdfmakeService } from './pdfmake.service';

describe('PdfmakeService', () => {
  let service: PdfmakeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PdfmakeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
