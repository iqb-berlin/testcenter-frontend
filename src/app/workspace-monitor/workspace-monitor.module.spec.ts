import { WorkspaceMonitorModule } from './workspace-monitor.module';

describe('WorkspaceMonitorModule', () => {
  let workspaceMonitorModule: WorkspaceMonitorModule;

  beforeEach(() => {
    workspaceMonitorModule = new WorkspaceMonitorModule();
  });

  it('should create an instance', () => {
    expect(workspaceMonitorModule).toBeTruthy();
  });
});
