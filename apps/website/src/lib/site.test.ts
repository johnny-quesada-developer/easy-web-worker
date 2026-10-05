import { PACKAGE_VERSION, SITE_NAME, links } from './site';

describe('site configuration from .env', () => {
  it('defines a name and a semver package version', () => {
    expect(SITE_NAME).toBeTruthy();
    expect(PACKAGE_VERSION).toMatch(/^\d+\.\d+\.\d+(-[\w.]+)?$/);
  });

  it.each(Object.entries(links))('link %s is an absolute https URL', (_name, url) => {
    expect(new URL(url).protocol).toBe('https:');
  });
});
