import test from 'node:test';
import assert from 'node:assert/strict';
import source from '../lib/legal-content.json';
import {getLegalDocument, legalDownload, legalLocale, legalText} from '../lib/legal-documents';

const whitespace = (value: string) => value.replace(/\s+/g, ' ').trim();

for (const kind of ['terms', 'privacy'] as const) {
 for (const lang of ['pl', 'en'] as const) {
  test(`${kind}.${lang}: every original paragraph survives sectioning`, () => {
   const doc = getLegalDocument(kind, lang);
   const reconstructed = [...doc.intro, ...doc.sections.flatMap(section => [section.sourceHeading, ...section.paragraphs])].filter(Boolean).join('\n\n');
   const approvedSource = source[kind][lang].replaceAll('biuro@personaltaxi.pl', 'office@personaltaxi.pl').replaceAll('biuro@inter-dywiz.pl', 'office@personaltaxi.pl');
   assert.equal(whitespace(reconstructed), whitespace(approvedSource));
   assert.equal(doc.sections.length, kind === 'privacy' ? 6 : lang === 'pl' ? 10 : 6);
   assert.equal(new Set(doc.sections.map(section => section.id)).size, doc.sections.length);
  });

  test(`${kind}.${lang}: downloaded document contains the full approved text`, async () => {
   const response = legalDownload(kind, new Request(`https://example.test/pobierz?lang=${lang}`));
   assert.equal(response.headers.get('content-type'), 'text/plain; charset=utf-8');
   assert.match(response.headers.get('content-disposition')!, new RegExp(`-${lang}\\.txt`));
   assert.ok((await response.text()).includes(legalText(kind, lang)));
  });
 }
}

test('Polish cancellation, refunds, complaints and effective date are preserved', () => {
 const doc = getLegalDocument('terms', 'pl');
 assert.match(doc.sections[5].paragraphs.join('\n'), /14 dni/);
 assert.match(doc.sections[4].paragraphs.join('\n'), /15 minut/);
 assert.ok(doc.sections[6].paragraphs.length > 0);
 assert.match(doc.sections[9].paragraphs.join('\n'), /31 października 2023/);
 assert.ok(doc.sections[6].paragraphs[0].startsWith('1.'));
 assert.ok(doc.sections[8].paragraphs[0].startsWith('Zgodnie'));
});

test('Locale input is constrained to supported document languages', () => {
 assert.equal(legalLocale('en'), 'en');
 assert.equal(legalLocale(['en']), 'pl');
 assert.equal(legalLocale(undefined), 'pl');
 assert.equal(legalLocale('de'), 'pl');
});
