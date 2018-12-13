import { SyscheckModule } from './syscheck.module';

describe('SyscheckModule', () => {
  let syscheckModule: SyscheckModule;

  beforeEach(() => {
    syscheckModule = new SyscheckModule();
  });

  it('should create an instance', () => {
    expect(syscheckModule).toBeTruthy();
  });
});
