import { TestBed } from '@angular/core/testing';

import { Glucose } from './glucose';

describe('Glucose', () => {
  let service: Glucose;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Glucose);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
