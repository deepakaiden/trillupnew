/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { FirebasePushNotificationService } from './FirebasePushNotification.service';

describe('Service: FirebasePushNotification', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FirebasePushNotificationService]
    });
  });

  it('should ...', inject([FirebasePushNotificationService], (service: FirebasePushNotificationService) => {
    expect(service).toBeTruthy();
  }));
});
