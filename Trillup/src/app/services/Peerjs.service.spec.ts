/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { PeerjsService } from './Peerjs.service';

describe('Service: Peerjs', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PeerjsService]
    });
  });

  it('should ...', inject([PeerjsService], (service: PeerjsService) => {
    expect(service).toBeTruthy();
  }));
});
