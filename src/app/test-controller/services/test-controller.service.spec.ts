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
    console.log('uploaded', testId, unitDbKey, dataParts, unitStateDataType);
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
    it('should XXXXXXXXXXXX', fakeAsync(() => {
      service.setUnitStateDataParts(1, {});
      service.testMode = new TestMode('hot');
      service.testId = '111';
      service.setupUnitStateBuffer();

      const expectedUploadedData: UnitStateData[] = [];

      service.updateUnitStateDataParts('unit1', 1, { a: 'A', b: 'B' }, 'aType1');
      tick(10);
      expect(uploadedData).withContext('Debounce DataParts forwarding').toEqual(expectedUploadedData);

      tick(201);
      expectedUploadedData.push({
        unitDbKey: 'unit1',
        dataParts: { a: 'A', b: 'B' },
        unitStateDataType: 'aType1'
      });
      expect(uploadedData).withContext('Debounce DataParts forwarding ii').toEqual(expectedUploadedData);

      service.updateUnitStateDataParts('unit1', 1, { a: 'A', b: 'B' }, 'aType2');
      tick(250);
      expect(uploadedData).withContext('Skip when nothing changes').toEqual(expectedUploadedData);

      service.updateUnitStateDataParts('unit1', 1, { a: 'A2', b: 'B' }, 'aType3');
      tick(10);
      service.updateUnitStateDataParts('unit1', 1, { b: 'B', c: 'C' }, 'aType4');
      tick(250);
      expectedUploadedData.push({
        unitDbKey: 'unit1',
        dataParts: { a: 'A2', c: 'C' },
        unitStateDataType: 'aType3'
      });
      expect(uploadedData).withContext('Merge debounced changes').toEqual(expectedUploadedData);

      tick(300);
      service.updateUnitStateDataParts('unit1', 1, { b: 'BBBB', c: 'CCCC' }, 'aType');
      tick(10);
      service.updateUnitStateDataParts('unit2', 1, { b: 'BBBB', c: 'CCCC' }, 'aType');
      service.updateUnitStateDataParts('unit2', 1, { b: 'BBBB', c: 'CCCC' }, 'aType');
      tick(250);
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

      service.destroyUnitStateBuffer();
    }));
  });
});
