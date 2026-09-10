import { expect, it } from 'vitest';
import { pickNamespaces } from '../../i18n/pick-namespaces';
import fr from '../../messages/fr.json';
import en from '../../messages/en.json';
import de from '../../messages/de.json';
import pt from '../../messages/pt.json';
import lb from '../../messages/lb.json';
const languages = { fr, en, de, pt, lb };
it.each([
  { path: '/profil', namespaces: ['accountExport','ownedLinks','dashboardHero'] },
  { path: '/profil/liens-partages', namespaces: ['ownedLinks'] },
  { path: '/estimation', namespaces: ['shareCreation'] },
  { path: '/valorisation', namespaces: ['shareCreation'] },
  { path: '/dcf-multi', namespaces: ['shareCreation'] },
])('ships actual generated messages for $path, including authenticated sections', ({ path, namespaces }) => {
  for (const [language, messages] of Object.entries(languages)) {
    const selected = pickNamespaces(messages, (language === 'fr' ? '' : '/' + language) + path);
    for (const namespace of namespaces) expect(selected[namespace], `${language}${path}: ${namespace}`).toBe(messages[namespace as keyof typeof messages]);
    expect(selected).not.toHaveProperty('pmsRapports');
  }
});
it('includes apostrophe client boundaries in the unknown-route fallback too', () => {
  const selected = pickNamespaces(fr, '/a-route-not-in-the-map');
  for (const namespace of ['accountExport','ownedLinks','shareCreation']) expect(selected).toHaveProperty(namespace);
});
