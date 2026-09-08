import { tr } from '../src/i18n/tr';

describe('i18n', () => {
  it('exposes the app name in Turkish', () => {
    expect(tr.appName).toBe('Rıfkı');
  });

  it('provides labels for all seven contracts', () => {
    expect(Object.keys(tr.contracts)).toHaveLength(7);
  });
});
