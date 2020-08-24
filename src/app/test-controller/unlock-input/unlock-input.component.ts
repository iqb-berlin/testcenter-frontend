import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {CustomtextService} from "iqb-components";
import {CodeInputData} from "../test-controller.interfaces";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {UnitControllerData} from "../test-controller.classes";
import {MatSnackBar} from "@angular/material/snack-bar";
import {TestControllerService} from "../test-controller.service";

@Component({
  selector: 'app-unlock-input',
  templateUrl: './unlock-input.component.html',
  styleUrls: ['./unlock-input.component.css']
})
export class UnlockInputComponent implements OnInit, AfterViewInit {
  @ViewChild('lookup') lookupElement: ElementRef;
  startkeyform: FormGroup;
  returnTo: string;
  newUnit: UnitControllerData;
  codes: CodeInputData[] = [];
  formControls = {};

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    public cts: CustomtextService,
    private tcs: TestControllerService,
    private snackBar: MatSnackBar
  ) {
    const routerStateObject = this.router.getCurrentNavigation();
    if (routerStateObject.extras.state) {
      this.returnTo = routerStateObject.extras.state['returnTo'];
      this.newUnit = routerStateObject.extras.state['newUnit'];
      this.codes = routerStateObject.extras.state['codes'];
    }
  }

  ngOnInit(): void {
    this.codes.forEach(c => {
      this.formControls[c.testletId] = new FormControl(c.value, [Validators.required, Validators.minLength(3)]);
    });
    this.startkeyform = new FormGroup(this.formControls);
  }

  ngAfterViewInit() {
    const formControls = this.lookupElement.nativeElement.getElementsByTagName("input");
    console.log(formControls);
    formControls[0].focus();
  }

  return() {
    if (this.returnTo) {
      this.router.navigate([this.returnTo]);
    }
  }

  continue() {
    if (this.newUnit) {
      let codesOk = true;
      const codeInputs = this.startkeyform.value;
      for (const c of this.codes) {
        const testeeInput = codeInputs[c.testletId];
        if (testeeInput) {
          if (c.code.toUpperCase().trim() !== testeeInput.toUpperCase().trim()) {
            codesOk = false;
            break;
          }
        } else {
          codesOk = false;
          break;
        }
      }
      if (codesOk) {
        this.newUnit.codeRequiringTestlets.forEach(t => {
          t.codeToEnter = '';
        });
        this.router.navigate([`/t/${this.tcs.testId}/u/${this.newUnit.unitDef.sequenceId}`]);
      } else {
        this.snackBar.open(
          'Die Eingabe war nicht korrekt.', this.cts.getCustomText('booklet_codeToEnterTitle'),
          {duration: 3000}
        );
      }
    }
  }
}
