import {Injectable} from '@angular/core';
import {MainDataService} from '../maindata.service';
import {BackendService} from './backend.service';
import {Observable, of} from 'rxjs';
import {isDefined} from '@angular/compiler/src/util';
import {map, shareReplay} from 'rxjs/operators';
import {BookletData} from '../app.interfaces';
import {Booklet, BookletMetadata, Restrictions, Testlet, Unit} from './group-monitor.interfaces';
import {BookletConfig} from '../config/booklet-config';


@Injectable()
export class BookletService {


    public booklets: Observable<Booklet>[] = [];


    constructor(
        private bs: BackendService
    ) { }


    public getBooklet(bookletName: string): Observable<Booklet|boolean> {

        if (isDefined(this.booklets[bookletName])) {

            // console.log('FORWARDING booklet for ' + bookletName + '');
            return this.booklets[bookletName];
        }

        if (bookletName == "") {

            // console.log("EMPTY bookletID");
            this.booklets[bookletName] = of<Booklet|boolean>(false);

        } else {

            // console.log('LOADING testletOrUnit data for ' + bookletName + ' not available. loading');

            this.booklets[bookletName] = this.bs.getBooklet(bookletName)
                .pipe(map((testData: BookletData): string => testData.xml))
                .pipe(map(BookletService.parseBookletXml))
                .pipe(shareReplay(1));
        }

        return this.booklets[bookletName];
    }


    private static parseBookletXml(xmlString: string): Booklet|boolean {

        try {

            const domParser = new DOMParser();
            const bookletElement = domParser.parseFromString(xmlString, 'text/xml').documentElement;

            if (bookletElement.nodeName !== 'Booklet') {
                throw new Error("XML is not Booklet");
            }

            return {
                units: BookletService.parseTestlet(BookletService.xmlGetChildIfExists(bookletElement, 'Units')),
                metadata: BookletService.parseMetadata(bookletElement),
                config: BookletService.parseBookletConfig(bookletElement)
            };

        } catch (error) {

            console.log('error reading booklet XML:');
            console.log(error);
            return false;
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
            id: BookletService.xmlGetChildTextIfExists(metadataElement, "Id"),
            label: BookletService.xmlGetChildTextIfExists(metadataElement, "Label"),
            description: BookletService.xmlGetChildTextIfExists(metadataElement, "Description", true),
        }
    }


    private static parseTestlet(testletElement: Element): Testlet {

        // TODO fehlende ID -> Zeit wird nicht angezeigt... überdenken: https://github.com/iqb-berlin/testcenter-iqb-php/issues/116

        return {
            id: testletElement.getAttribute('id') || '',
            label:  testletElement.getAttribute('label') || '',
            restrictions: BookletService.parseRestrictions(testletElement),
            children: BookletService.xmlGetDirectChildrenByTagName(testletElement, ['Unit', 'Testlet'])
                .map(BookletService.parseUnitOrTestlet)
        };
    }


    private static parseUnitOrTestlet(unitOrTestletElement: Element): (Unit|Testlet) {

        if (unitOrTestletElement.tagName == 'Unit') {
            return {
                id: unitOrTestletElement.getAttribute('alias') || unitOrTestletElement.getAttribute('id'),
                label: unitOrTestletElement.getAttribute('label'),
                labelShort: unitOrTestletElement.getAttribute('labelshort')
            }
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
                code: codeToEnterElement.getAttribute('parameter'),
                message: codeToEnterElement.textContent
            }
        }

        const timeMaxElement = restrictionsElement.querySelector('TimeMax');
        if (timeMaxElement) {

            restrictions.timeMax = parseInt(timeMaxElement.textContent);
        }

        const lockElement = restrictionsElement.querySelector('Lock');
        if (lockElement) {

            restrictions.lock = {
                message: lockElement.textContent
            };
        }

        return restrictions;
    }


    private static xmlGetChildIfExists(element: Element, childName: string, isOptional: boolean = false): Element {

        const elements = BookletService.xmlGetDirectChildrenByTagName(element, [childName]);
        if (!elements.length && !isOptional) {
            throw new Error(`Missing field: '${childName}'`); // TODO hierauf wird irgendwie gar nicht reagiert
        }
        return elements.length ? elements[0] : null;
    }


    private static xmlGetChildTextIfExists(element: Element, childName: string, isOptional: boolean = false) : string {

        const childElement = BookletService.xmlGetChildIfExists(element, childName, isOptional);
        return childElement ? childElement.textContent : "";
    }


    private static xmlGetDirectChildrenByTagName(element: Element, tagNames: string[]): Element[] {

        return [].slice.call(element.childNodes)
            .filter((element: Element) => (element.nodeType === 1))
            .filter((element: Element) => (tagNames.indexOf(element.tagName) > -1));
    }
}




