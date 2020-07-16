import { TestBed } from '@angular/core/testing';

import { AudiocallService } from './audiocall.service';

describe('AudiocallService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: AudiocallService = TestBed.get(AudiocallService);
    expect(service).toBeTruthy();
  });
});
