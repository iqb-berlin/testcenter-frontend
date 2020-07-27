import LoginPage from './app.po';

describe('Testcenter Frontend', () => {
  it('should display title texts', async () => {
    await LoginPage.navigateTo();
    await expect(LoginPage.getFirstCardTitle()).toEqual('Anmelden');
    await expect(LoginPage.getSecondCardTitle()).toEqual('IQB-Testcenter');
  });
});
