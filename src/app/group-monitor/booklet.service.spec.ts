import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { BookletService } from './booklet.service';
import { BackendService } from './backend.service';
import { Booklet } from './group-monitor.interfaces';
import { TestSessionService } from './test-session.service';

export const exampleBooklet: Booklet = { // labels are: {global index}-{ancestor index}-{local index}
  species: 'example',
  config: undefined,
  metadata: undefined,
  units: {
    id: 'root',
    label: 'Root',
    descendantCount: 10,
    children: [
      { id: 'unit-1', label: '0-0-0', labelShort: 'unit' },
      {
        id: 'zara',
        label: 'Testlet-0',
        children: [],
        descendantCount: 6
      },
      { id: 'unit-2', label: '1-1-1', labelShort: 'unit' },
      {
        id: 'alf',
        label: 'Testlet-1',
        descendantCount: 4,
        children: [
          { id: 'unit-3', label: '2-0-0', labelShort: 'unit' },
          {
            id: 'ben',
            label: 'Testlet-2',
            descendantCount: 3,
            children: [
              { id: 'unit-4', label: '3-1-0', labelShort: 'unit' },
              {
                id: 'cara',
                label: 'Testlet-3',
                descendantCount: 2,
                children: []
              },
              { id: 'unit-5', label: '4-2-1', labelShort: 'unit' },
              {
                id: 'dolf',
                label: 'Testlet-4',
                descendantCount: 1,
                children: [
                  { id: 'unit-6', label: '5-3-0', labelShort: 'unit' }
                ]
              }
            ]
          },
          { id: 'unit-7', label: '6-4-1', labelShort: 'unit' }
        ]
      },
      { id: 'unit-8', label: '7-2-2', labelShort: 'unit' },
      {
        id: 'ellie',
        label: 'Testlet-5',
        descendantCount: 2,
        children: [
          { id: 'unit-9', label: '8-0-0', labelShort: 'unit' },
          {
            id: 'fred',
            label: 'Testlet-6',
            descendantCount: 1,
            children: [
              { id: 'unit-10', label: '9-1-0', labelShort: 'unit' }
            ]
          }
        ]
      }
    ]
  }
};

export const exampleBooklet2: Booklet = {
  species: 'example',
  config: undefined,
  metadata: undefined,
  units: {
    id: 'root',
    label: 'Root',
    descendantCount: 4,
    children: [
      {
        id: 'zara',
        label: 'Testlet-0',
        descendantCount: 3,
        children: [
          {
            id: 'alf',
            label: 'Testlet-1',
            descendantCount: 2,
            children: [
              {
                id: 'alf',
                label: 'Testlet-1',
                descendantCount: 1,
                children: [
                  { id: 'unit-1', label: '0-0-0', labelShort: 'unit' }
                ]
              }
            ]
          }
        ]
      },
      { id: 'unit-2', label: '1-1-1', labelShort: 'unit' },
      {
        id: 'ben',
        label: 'Testlet-2',
        descendantCount: 0,
        children: []
      }
    ]
  }
};

class MockBackendService {
  // eslint-disable-next-line class-methods-use-this,@typescript-eslint/no-unused-vars
  public getBooklet(bookletName: string): Observable<string> {
    return of('<booklet>TODO insert nice booklet</booklet>');
  }
}

describe('BookletService', () => {
  let service: BookletService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        BookletService,
        {
          provide: BackendService,
          useValue: new MockBackendService()
        }
      ],
      imports: [MatTableModule, MatIconModule]
    });
    service = TestBed.inject(BookletService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getFirstUnit() should get first unit if a testlet, regardless of nested sub-testlets', () => {
    expect(BookletService.getFirstUnit(exampleBooklet.units).id).toEqual('unit-1');
    expect(BookletService.getFirstUnit(exampleBooklet2.units).id).toEqual('unit-1');
    expect(BookletService.getFirstUnit(exampleBooklet2.units.children[2])).toBeNull();
  });

  describe('getNextBlock()', () => {
    // eslint-disable-next-line @typescript-eslint/dot-notation,prefer-destructuring
    const getCurrent = TestSessionService['getCurrent'];

    it('should get next block at root-level, when blockless unit is selected', () => {
      const result = BookletService.getNextBlock(getCurrent(exampleBooklet.units, 'unit-1'), exampleBooklet);
      expect(result.id).toEqual('zara');
    });

    it('should get next block at root-level, when unit in nested testlet is selected', () => {
      const result = BookletService.getNextBlock(getCurrent(exampleBooklet.units, 'unit-3'), exampleBooklet);
      expect(result.id).toEqual('ellie');
    });

    it('should return null, if there is no next block on root-level', () => {
      const result = BookletService.getNextBlock(getCurrent(exampleBooklet.units, 'unit-9'), exampleBooklet);
      expect(result).toBeNull();
    });
  });

  xit('parseBookletXml() should parse a Booklet-Xml to a Booklet-Object', () => {
    // TODO implement unit.test
  });

  xit('parseMetadata() should parse the <metadata>-element', () => {
    // TODO implement unit.test
  });

  xit('parseTestlet() should parse the <testlet>-element', () => {
    // TODO implement unit.test
  });

  xit('parseUnitOrTestlet() should parse the <unit>-element or call parseTestlet()', () => {
    // TODO implement unit.test
  });

  xit('parseRestrictions() should parse the <restrictions>-element', () => {
    // TODO implement unit.test
  });

  describe('XML functions', () => {
    xit('xmlGetChildTextIfExists() should return a child element\'s text ' +
      'of a given name from a domElement if that exists', () => {
      // TODO implement unit.test
    });

    xit('xmlGetChildIfExists() should return a child element of a given name from a domElement if that exists', () => {
      // TODO implement unit.test
    });

    xit('xmlGetDirectChildrenByTagName() should return all children from a domElement with a given name', () => {
      // TODO implement unit.test
    });

    it('xmlCountChildrenOfTagNames() should count all (grand-)children of the defined types', () => {
      const domParser = new DOMParser();
      const testXml = '<root><a>x<b>x</b><b /><b></b></a><b><!-- ! --><c>x</c>x</b><a><b></b></a>x</root>';
      const testContent = domParser.parseFromString(testXml, 'text/xml').documentElement;

      // access to private function
      // eslint-disable-next-line @typescript-eslint/dot-notation, prefer-destructuring
      const xmlCountChildrenOfTagNames = BookletService['xmlCountChildrenOfTagNames'];

      let result = xmlCountChildrenOfTagNames(testContent, ['a']);
      expect(result).withContext('a').toEqual(2);

      result = xmlCountChildrenOfTagNames(testContent, ['b']);
      expect(result).withContext('b').toEqual(5);

      result = xmlCountChildrenOfTagNames(testContent, ['c']);
      expect(result).withContext('c').toEqual(1);

      result = xmlCountChildrenOfTagNames(testContent, ['d']);
      expect(result).withContext('c').toEqual(0);

      result = xmlCountChildrenOfTagNames(testContent, ['a', 'b', 'c', 'd']);
      expect(result).withContext('c').toEqual(8);
    });
  });
});
