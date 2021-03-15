import { Injectable } from '@angular/core';
import {
  CheckConfig,
  NetworkCheckStatus,
  ReportEntry,
  StepDef,
  UnitAndPlayerContainer
} from './sys-check.interfaces';

@Injectable({
  providedIn: 'root'
})
export class SysCheckDataService {
  private steps: string[] = [];
  public stepLabels: string[] = [];
  private currentStep = 0;
  public nextStep = '';
  public prevStep = '';
  private stepDefs: StepDef[] = [
    {
      route: 'w',
      label: 'Ermitteln von Systemdaten (Betriebssystem, Browser)'
    },
    {
      route: 'n',
      label: 'Schätzung der Qualität der Internetverbindung'
    },
    {
      route: 'u',
      label: 'Prüfen von typischen Eingabe-Elementen'
    },
    {
      route: 'q',
      label: 'Beantworten einiger Fragen'
    },
    {
      route: 'r',
      label: 'Senden eines Berichtes (Kennwort erforderlich)'
    }
  ];

  public checkConfig: CheckConfig = null;
  public loadConfigComplete = false;
  public unitAndPlayerContainer: UnitAndPlayerContainer = null;
  public environmentReport: ReportEntry[] = [];
  public networkReport: ReportEntry[] = [];
  public questionnaireReport: ReportEntry[] = [];
  public networkCheckStatus: NetworkCheckStatus = {
    done: true,
    message: 'Messung noch nicht gestartet',
    avgUploadSpeedBytesPerSecond: -1,
    avgDownloadSpeedBytesPerSecond: -1
  };

  public setSteps(): void {
    this.steps = [];
    this.stepLabels = [];
    this.stepDefs.forEach(step => {
      if (this.checkConfig) {
        if ((step.route === 'w') ||
         (step.route === 'n' && !this.checkConfig.skipNetwork) ||
         (step.route === 'u' && this.checkConfig.hasUnit) ||
         (step.route === 'q' && this.checkConfig.questions.length > 0) ||
         (step.route === 'r' && this.checkConfig.canSave)) {
          this.steps.push(step.route);
          this.stepLabels.push(step.label);
        }
      }
    });
  }

  public setNewCurrentStep(newStep: string): void {
    for (let stepIndex = 0; stepIndex < this.steps.length; stepIndex++) {
      if (this.steps[stepIndex] === newStep) {
        this.currentStep = stepIndex;
        this.nextStep = stepIndex < this.steps.length - 1 ? this.steps[this.currentStep + 1] : '';
        this.prevStep = stepIndex > 0 ? this.steps[this.currentStep - 1] : '';
        break;
      }
    }
  }
}
