/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { TeamChannelService } from './teamChannel.service';

describe('Service: TeamChannel', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TeamChannelService]
    });
  });

  it('should ...', inject([TeamChannelService], (service: TeamChannelService) => {
    expect(service).toBeTruthy();
  }));
});
