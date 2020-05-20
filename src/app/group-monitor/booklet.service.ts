import {Injectable} from '@angular/core';
import {Testlet} from '../test-controller/test-controller.classes';
import {BookletConfig} from '../config/booklet-config';
import {MainDataService} from '../maindata.service';
import {BackendService} from './backend.service';
import {BehaviorSubject, of} from 'rxjs';
import {isDefined} from '@angular/compiler/src/util';
import {TestData} from '../test-controller/test-controller.interfaces';
import {map} from 'rxjs/operators';

// TODO find a solution for shared classes

export interface Booklet {
    lastUnitSequenceId: number;
    lastTestletIndex: number;
    allUnitIds;
    testlet: Testlet
    config: BookletConfig
}



@Injectable()
export class BookletService {


    public booklets: BehaviorSubject<Booklet>[] = [];


    constructor(
        private bs: BackendService
    ) { }


    public getBooklet(testId: string): BehaviorSubject<Booklet|boolean> {

        if (isDefined(this.booklets[testId])) {

            console.log('FORWARDING testlet data for ' + testId + '');
            return this.booklets[testId];
        }

        if (parseInt(testId) < 1) {

            this.booklets[testId] = new BehaviorSubject<Booklet|boolean>(false);

        } else {

            console.log('LOADING testlet data for ' + testId + ' not available. loading');

            const loadingTestData = new BehaviorSubject<Booklet|boolean>(true);
            const TODO_unsubscribeMe = this.bs.getTestData(testId)
                .pipe(map((testData: TestData): string => testData.xml))
                .pipe(map(BookletService.getBookletFromXml))
                .subscribe(loadingTestData);

            this.booklets[testId] = loadingTestData;
        }

        return this.booklets[testId];
    }


    // TODO those functions are more or less copies from test.controller.component. avoid duplicate doce
    private static getBookletFromXml(xmlString: string): Booklet|boolean {

        let rootTestlet: Testlet = null;
        let booklet: Booklet = null;

        try {
            const oParser = new DOMParser();
            const oDOM = oParser.parseFromString(xmlString, 'text/xml');
            if (oDOM.documentElement.nodeName === 'Booklet') {
                // ________________________
                const metadataElements = oDOM.documentElement.getElementsByTagName('Metadata');
                if (metadataElements.length > 0) {
                    const metadataElement = metadataElements[0];
                    const IdElement = metadataElement.getElementsByTagName('Id')[0];
                    const LabelElement = metadataElement.getElementsByTagName('Label')[0];
                    rootTestlet = new Testlet(0, IdElement.textContent, LabelElement.textContent);
                    const unitsElements = oDOM.documentElement.getElementsByTagName('Units');
                    if (unitsElements.length > 0) {
                        const customTextsElements = oDOM.documentElement.getElementsByTagName('CustomTexts');
                        if (customTextsElements.length > 0) {
                            const customTexts = BookletService.getChildElements(customTextsElements[0]);
                            const customTextsForBooklet = {};
                            for (let childIndex = 0; childIndex < customTexts.length; childIndex++) {
                                if (customTexts[childIndex].nodeName === 'Text') {
                                    const customTextKey = customTexts[childIndex].getAttribute('key');
                                    if ((typeof customTextKey !== 'undefined') && (customTextKey !== null)) {
                                        customTextsForBooklet[customTextKey] = customTexts[childIndex].textContent;
                                    }
                                }
                            }
                            // this.cts.addCustomTexts(customTextsForBooklet);
                        }

                        const bookletConfigElements = oDOM.documentElement.getElementsByTagName('BookletConfig');

                        const bookletConfig = new BookletConfig();

                        bookletConfig.setFromKeyValuePairs(MainDataService.getTestConfig());
                        if (bookletConfigElements.length > 0) {
                            bookletConfig.setFromXml(bookletConfigElements[0]);
                        }

                        // this.tcs.testMode = new TestMode(loginMode);

                        // recursive call through all testlets

                        booklet = {
                            lastUnitSequenceId: 1,
                            lastTestletIndex: 1,
                            allUnitIds: [],
                            testlet: rootTestlet,
                            config: bookletConfig
                        };

                        BookletService.addTestletContentFromBookletXml(booklet, unitsElements[0]);
                    }
                }
            }
        } catch (error) {
            console.log('error reading booklet XML:');
            console.log(error);

            booklet = null;
        }

        if (booklet == null) {
            return false;
        }

        return booklet;
    }


    private static getChildElements(element) {
        return Array.prototype.slice.call(element.childNodes)
            .filter(function (e) { return e.nodeType === 1; });
    }


    private static addTestletContentFromBookletXml(booklet: Booklet, node: Element) {

        const targetTestlet = booklet.testlet;

        const childElements = BookletService.getChildElements(node);
        if (childElements.length > 0) {
            let codeToEnter = '';
            let codePrompt = '';
            let maxTime = -1;

            let restrictionElement: Element = null;
            for (let childIndex = 0; childIndex < childElements.length; childIndex++) {
                if (childElements[childIndex].nodeName === 'Restrictions') {
                    restrictionElement = childElements[childIndex];
                    break;
                }
            }
            if (restrictionElement !== null) {
                const restrictionElements = BookletService.getChildElements(restrictionElement);
                for (let childIndex = 0; childIndex < restrictionElements.length; childIndex++) {
                    if (restrictionElements[childIndex].nodeName === 'CodeToEnter') {
                        const restrictionParameter = restrictionElements[childIndex].getAttribute('parameter');
                        if ((typeof restrictionParameter !== 'undefined') && (restrictionParameter !== null)) {
                            codeToEnter = restrictionParameter.toUpperCase();
                            codePrompt = restrictionElements[childIndex].textContent;
                        }
                    } else if (restrictionElements[childIndex].nodeName === 'TimeMax') {
                        const restrictionParameter = restrictionElements[childIndex].getAttribute('parameter');
                        if ((typeof restrictionParameter !== 'undefined') && (restrictionParameter !== null)) {
                            maxTime = Number(restrictionParameter);
                            if (isNaN(maxTime)) {
                                maxTime = -1;
                            }
                        }
                    }
                }
            }

            if (codeToEnter.length > 0) {
                targetTestlet.codeToEnter = codeToEnter;
                targetTestlet.codePrompt = codePrompt;
            }
            targetTestlet.maxTimeLeft = maxTime;
            // if (this.tcs.LastMaxTimerState) {
            //     if (this.tcs.LastMaxTimerState.hasOwnProperty(targetTestlet.id)) {
            //         targetTestlet.maxTimeLeft = this.tcs.LastMaxTimerState[targetTestlet.id];
            //     }
            // }

            for (let childIndex = 0; childIndex < childElements.length; childIndex++) {
                if (childElements[childIndex].nodeName === 'Unit') {
                    const myUnitId = childElements[childIndex].getAttribute('id');
                    let myUnitAlias = childElements[childIndex].getAttribute('alias');
                    if (!myUnitAlias) {
                        myUnitAlias = myUnitId;
                    }
                    let myUnitAliasClear = myUnitAlias;
                    let unitIdSuffix = 1;
                    while (booklet.allUnitIds.indexOf(myUnitAliasClear) > -1) {
                        myUnitAliasClear = myUnitAlias + '-' + unitIdSuffix.toString();
                        unitIdSuffix += 1;
                    }
                    booklet.allUnitIds.push(myUnitAliasClear);

                    targetTestlet.addUnit(booklet.lastUnitSequenceId, myUnitId,
                        childElements[childIndex].getAttribute('label'), myUnitAliasClear,
                        childElements[childIndex].getAttribute('labelshort'));
                    booklet.lastUnitSequenceId += 1;

                } else if (childElements[childIndex].nodeName === 'Testlet') {
                    let testletId: string = childElements[childIndex].getAttribute('id');
                    if (!testletId) {
                        testletId = 'Testlet' + booklet.lastTestletIndex.toString();
                        booklet.lastTestletIndex += 1;
                    }
                    let testletLabel: string = childElements[childIndex].getAttribute('label');
                    testletLabel = testletLabel ? testletLabel.trim() : '';

                    booklet.testlet.addTestlet(testletId, testletLabel);
                    this.addTestletContentFromBookletXml(booklet, childElements[childIndex]);
                }
            }
        }
    }


}




