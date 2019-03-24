import { CustomTextPipe } from './custom-text.pipe';

describe('CustomTextPipe', () => {
  it('create an instance', () => {
    const pipe = new CustomTextPipe();
    expect(pipe).toBeTruthy();
  });
});
