import {Injectable} from '@angular/core';
import {MainDataService} from '../maindata.service';
import {BackendService} from './backend.service';
import {Observable, of} from 'rxjs';
import {map, shareReplay} from 'rxjs/operators';
import {Booklet, BookletError, BookletMetadata, Restrictions, Testlet, Unit} from './group-monitor.interfaces';
import {BookletConfig} from '../config/booklet-config';


@Injectable()
export class BookletService {

    public booklets: Observable<Booklet|BookletError>[] = [];

    constructor(
        private bs: BackendService
    ) { }

    private static parseBookletXml(xmlString: string): Booklet|BookletError {
        try {
            const domParser = new DOMParser();
            const bookletElement = domParser.parseFromString(xmlString, 'text/xml').documentElement;

            if (bookletElement.nodeName !== 'Booklet') {
                console.warn('XML-root is not `Booklet`');
                return {error: 'xml'};
            }

            return {
                units: BookletService.parseTestlet(BookletService.xmlGetChildIfExists(bookletElement, 'Units')),
                metadata: BookletService.parseMetadata(bookletElement),
                config: BookletService.parseBookletConfig(bookletElement)
            };
        } catch (error) {
            console.warn('Error reading booklet XML:', error);
            return {error: 'xml'};
        }
    }

    private static parseBookletConfig(bookletElement: Element): BookletConfig {
        const bookletConfigElements = BookletService.xmlGetChildIfExists(bookletElement, 'BookletConfig', true);
        const bookletConfig = new BookletConfig();
        bookletConfig.setFromKeyValuePairs(MainDataService.getTestConfig());
        if (bookletConfigElements) {
            bookletConfig.setFromXml(bookletConfigElements[0]);
        }
        return bookletConfig;
    }

    private static parseMetadata(bookletElement: Element): BookletMetadata {
        const metadataElement = BookletService.xmlGetChildIfExists(bookletElement, 'Metadata');
        return {
            id: BookletService.xmlGetChildTextIfExists(metadataElement, 'Id'),
            label: BookletService.xmlGetChildTextIfExists(metadataElement, 'Label'),
            description: BookletService.xmlGetChildTextIfExists(metadataElement, 'Description', true),
        };
    }

    private static parseTestlet(testletElement: Element): Testlet {
        // TODO id will be mandatory (https://github.com/iqb-berlin/testcenter-iqb-php/issues/116), the remove fallback to ''
        return {
            id: testletElement.getAttribute('id') || '',
            label:  testletElement.getAttribute('label') || '',
            restrictions: BookletService.parseRestrictions(testletElement),
            children: BookletService.xmlGetDirectChildrenByTagName(testletElement, ['Unit', 'Testlet'])
                .map(BookletService.parseUnitOrTestlet),
            descendantCount: BookletService.xmlCountChildrenOfTagNames(testletElement, ['Unit'])
        };
    }

    private static parseUnitOrTestlet(unitOrTestletElement: Element): (Unit|Testlet) {
        if (unitOrTestletElement.tagName === 'Unit') {
            return {
                id: unitOrTestletElement.getAttribute('alias') || unitOrTestletElement.getAttribute('id'),
                label: unitOrTestletElement.getAttribute('label'),
                labelShort: unitOrTestletElement.getAttribute('labelshort')
            };
        }
        return BookletService.parseTestlet(unitOrTestletElement);
    }

    private static parseRestrictions(testletElement: Element): Restrictions {
        const restrictions: Restrictions = {};
        const restrictionsElement = BookletService.xmlGetChildIfExists(testletElement, 'Restrictions', true);
        if (!restrictionsElement) {
            return restrictions;
        }
        const codeToEnterElement = restrictionsElement.querySelector('CodeToEnter');
        if (codeToEnterElement) {
            restrictions.codeToEnter = {
                code: codeToEnterElement.getAttribute('code'),
                message: codeToEnterElement.textContent
            };
        }
        const timeMaxElement = restrictionsElement.querySelector('TimeMax');
        if (timeMaxElement) {
            restrictions.timeMax = {
                minutes: parseFloat(timeMaxElement.getAttribute('minutes')),
            };
        }
        return restrictions;
    }

    private static xmlGetChildIfExists(element: Element, childName: string, isOptional: boolean = false): Element {
        const elements = BookletService.xmlGetDirectChildrenByTagName(element, [childName]);
        if (!elements.length && !isOptional) {
            throw new Error(`Missing field: '${childName}'`);
        }
        return elements.length ? elements[0] : null;
    }

    private static xmlGetChildTextIfExists(element: Element, childName: string, isOptional: boolean = false): string {
        const childElement = BookletService.xmlGetChildIfExists(element, childName, isOptional);
        return childElement ? childElement.textContent : '';
    }

    private static xmlGetDirectChildrenByTagName(element: Element, tagNames: string[]): Element[] {
        return [].slice.call(element.childNodes)
            .filter((elem: Element) => (elem.nodeType === 1))
            .filter((elem: Element) => (tagNames.indexOf(elem.tagName) > -1));
    }

    private static xmlCountChildrenOfTagNames(element: Element, tagNames: string[]): number {
        return element.querySelectorAll(tagNames.join(', ')).length;
    }

    public getBooklet(bookletName: string): Observable<Booklet|BookletError> {
        if (typeof this.booklets[bookletName] !== 'undefined') {
            // console.log('FORWARDING booklet for ' + bookletName + '');
            return this.booklets[bookletName];
        }
        if (bookletName === '') {
            // console.log("EMPTY bookletID");
            this.booklets[bookletName] = of<Booklet|BookletError>({error: 'missing-id'});

        } else {
            // console.log('LOADING testletOrUnit data for ' + bookletName + ' not available. loading');
            this.booklets[bookletName] = this.bs.getBooklet(bookletName)
                .pipe(
                    map((response: string|BookletError) => {
                        return (typeof response === 'string') ? BookletService.parseBookletXml(response) : response;
                    }),
                    shareReplay(1)
                );
        }
        return this.booklets[bookletName];
    }
}




