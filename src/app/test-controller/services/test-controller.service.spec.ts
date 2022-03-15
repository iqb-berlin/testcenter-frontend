import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientModule } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { TestControllerService } from './test-controller.service';
import { BackendService } from './backend.service';
import { KeyValuePairString, UnitStateData } from '../interfaces/test-controller.interfaces';
import { TestMode } from '../../config/test-mode';

const uploadedData: UnitStateData[] = [];

class MockBackendService {
  // eslint-disable-next-line class-methods-use-this
  updateDataParts(
    testId: string, unitDbKey: string, dataParts: KeyValuePairString, unitStateDataType: string
  ): Observable<boolean> {
    // console.log(testId, unitDbKey, dataParts, unitStateDataType);
    uploadedData.push({ unitDbKey, dataParts, unitStateDataType });
    return of(true);
  }
}

let service: TestControllerService;

describe('TestControllerService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TestControllerService,
        {
          provide: BackendService,
          useValue: new MockBackendService()
        }
      ],
      imports: [
        RouterTestingModule,
        HttpClientModule
      ]
    })
      .compileComponents();
    service = TestBed.inject(TestControllerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should normaliseIds correctly', () => {
    expect(TestControllerService.normaliseId('file-Name-1.html')).toEqual('FILE-NAME-1.HTML');
    expect(TestControllerService.normaliseId('file-Name-2.1.1.html')).toEqual('FILE-NAME-2.1.1.HTML');
    expect(TestControllerService.normaliseId('file-Name3.html')).toEqual('FILE-NAME3.HTML');
    expect(TestControllerService.normaliseId('file-Name4.0.html')).toEqual('FILE-NAME4.0.HTML');
    expect(TestControllerService.normaliseId('file-Name5.0', 'html')).toEqual('FILE-NAME5.0.HTML');
    expect(TestControllerService.normaliseId('file-Name_6.gif', 'html')).toEqual('FILE-NAME_6.GIF.HTML');
    expect(TestControllerService.normaliseId('µðöþ7', 'html')).toEqual('ΜÐÖÞ7.HTML');
    expect(TestControllerService.normaliseId(' whatever  8.html')).toEqual('WHATEVER  8.HTML');
  });

  fdescribe('updateDataParts', () => {

    beforeEach(() => {
      service.setUnitStateDataParts(1, {});
      service.testMode = new TestMode('hot');
      service.testId = '111';
    });

    it('should collect changed dataParts while debouncing the upload', fakeAsync(() => {
      const expectedUploadedData: UnitStateData[] = [];

      service.updateUnitStateDataParts('unit1', 1, { a: 'A', b: 'B' }, 'aType');
      tick(10);
      expect(uploadedData)
        .withContext('call 1 after 100ms should be debounced...')
        .toEqual(expectedUploadedData);

      tick(300);
      expectedUploadedData.push({
        unitDbKey: 'unit1',
        dataParts: { a: 'A', b: 'B' },
        unitStateDataType: 'aType'
      });
      expect(uploadedData)
        .withContext('... and be forwarded, if nothing else happens')
        .toEqual(expectedUploadedData);

      service.updateUnitStateDataParts('unit1', 1, { b: 'BB', c: 'CCa' }, 'aType');
      tick(10);
      service.updateUnitStateDataParts('unit1', 1, { b: 'BB', c: 'CCb' }, 'aType');
      tick(300);
      expectedUploadedData.push({
        unitDbKey: 'unit1',
        dataParts: { b: 'BB', c: 'CCb' },
        unitStateDataType: 'aType'
      });
      expect(uploadedData)
        .withContext('the first copy of an duplicate update should be filtered')
        .toEqual(expectedUploadedData);

      tick(300);
      service.updateUnitStateDataParts('unit1', 1, { b: 'BBBB', c: 'CCCC' }, 'aType');
      tick(10);
      service.updateUnitStateDataParts('unit2', 1, { b: 'BBBB', c: 'CCCC' }, 'aType');
      tick(200);
      expectedUploadedData.push({
        unitDbKey: 'unit1',
        dataParts: { b: 'BBBB', c: 'CCCC' },
        unitStateDataType: 'aType'
      }, {
        unitDbKey: 'unit2',
        dataParts: { b: 'BBBB', c: 'CCCC' },
        unitStateDataType: 'aType'
      });
      uploadedData.forEach(d => {
        console.log(`[= ${d.unitDbKey}: ${Object.keys(d.dataParts).map(k => `${k} -> ${d.dataParts[k]}`).join(', ')}]`);
      });
      expect(uploadedData)
        .withContext('when unitId changes debounce timer should be killed')
        .toEqual(expectedUploadedData);

      tick(300);
      service.updateUnitStateDataParts('unit1', 1, { a: 'A', b: 'B' }, 'aType');
      tick(10);
      service.updateUnitStateDataParts('unit1', 1, { b: 'BBB', c: 'CCC' }, 'aType');
      tick(300);
      expectedUploadedData.push({
        unitDbKey: 'unit1',
        dataParts: { a: 'A', b: 'BBB', c: 'CCC' },
        unitStateDataType: 'aType'
      });
      expect(uploadedData)
        .withContext('call 1 and 2 are merged after timeout')
        .toEqual(expectedUploadedData);
    }));
  });
});
