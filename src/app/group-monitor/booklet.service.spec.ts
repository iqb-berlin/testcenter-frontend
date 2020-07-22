import { TestBed } from '@angular/core/testing';
import { BookletService } from './booklet.service';
import {BackendService} from './backend.service';
import {Observable, of} from 'rxjs';

class MockBackendService {

    public getBooklet(bookletName: string): Observable<string> {

        return of('<booklet>TODO insert nice booklet</booklet>');
    }
}


fdescribe('BookletService', () => {

    let service: BookletService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                BookletService,
                {
                    provide: BackendService,
                    useValue: new MockBackendService()
                }
            ]
        });
        service = TestBed.inject(BookletService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('XML functions', () => {

        it('xmlCountChildrenOfTagNames() should count all (grand-)children of the dfined types', () => {

            const domParser = new DOMParser();
            const testXml = "<root><a>x<b>x</b><b /><b></b></a><b><!-- ! --><c>x</c>x</b><a><b></b></a>x</root>";
            const testContent = domParser.parseFromString(testXml, 'text/xml').documentElement;

            let result = BookletService['xmlCountChildrenOfTagNames'](testContent, ['a']);
            expect(result).withContext('a').toEqual(2);

            result = BookletService['xmlCountChildrenOfTagNames'](testContent, ['b']);
            expect(result).withContext('b').toEqual(5);

            result = BookletService['xmlCountChildrenOfTagNames'](testContent, ['c']);
            expect(result).withContext('c').toEqual(1);

            result = BookletService['xmlCountChildrenOfTagNames'](testContent, ['d']);
            expect(result).withContext('c').toEqual(0);

            result = BookletService['xmlCountChildrenOfTagNames'](testContent, ['a', 'b', 'c', 'd']);
            expect(result).withContext('c').toEqual(8);
        });

    });

});
