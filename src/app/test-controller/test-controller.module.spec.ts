import {TestControllerModule} from "./test-controller.module";

describe('TestControllerModule', () => {
  let testControllerModule: TestControllerModule;

  beforeEach(() => {
    testControllerModule = new TestControllerModule();
  });

  it('should create an instance', () => {
    expect(testControllerModule).toBeTruthy();
  });
});
