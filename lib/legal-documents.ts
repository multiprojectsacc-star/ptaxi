import source from './legal-content.json';
import type {Locale} from './booking';

export type LegalKind = 'terms' | 'privacy';
export type LegalSection = {id: string; title: string; sourceHeading: string; paragraphs: string[]};
export const LEGAL_CONTACT = 'office@personaltaxi.pl';
export const legalPath = (kind: LegalKind, lang: Locale = 'pl') => `${kind === 'terms' ? '/regulamin' : '/rodo'}?lang=${lang}`;
export const legalLocale = (value: unknown): Locale => value === 'en' ? 'en' : 'pl';

// Keep the operator's existing provisions. Only the contact address was updated
// with the owner's approval; the original JSON remains an unmodified source.
export function legalText(kind: LegalKind, lang: Locale) {
 return source[kind][lang].replaceAll('biuro@personaltaxi.pl', LEGAL_CONTACT).replaceAll('biuro@inter-dywiz.pl', LEGAL_CONTACT);
}

const termsTitles: Record<Locale, string[]> = {
 pl: ['Definicje', 'Postanowienia ogólne', 'Zakup usług', 'Ceny i płatności', 'Realizacja usług', 'Odstąpienie od umowy', 'Reklamacje', 'Odpowiedzialność', 'Ochrona danych osobowych', 'Postanowienia końcowe'],
 en: ['Definitions', 'General provisions', 'Purchase of services', 'Prices and payment', 'Realization of services', 'Withdrawal from the contract'],
};
const privacyTitles: Record<Locale, string[]> = {
 pl: ['Administrator i gromadzenie danych', 'Twoje prawa', 'Zgoda na przetwarzanie danych', 'Odbiorcy danych', 'Bezpieczeństwo danych', 'Kontakt'],
 en: ['Controller and data collection', 'Your rights', 'Consent to data processing', 'Data recipients', 'Data security', 'Contact'],
};

export function getLegalDocument(kind: LegalKind, lang: Locale) {
 const text = legalText(kind, lang);
 const blocks = text.split(/\n\n+/);
 const intro: string[] = [];
 const sections: LegalSection[] = [];
 const add = (sourceHeading: string, title: string) => {
  const section = {id: `section-${sections.length + 1}`, title, sourceHeading, paragraphs: [] as string[]};
  sections.push(section);
  return section;
 };
 let current: LegalSection | undefined;
 if (kind === 'terms') {
  for (const block of blocks) {
   const heading = block.match(/^([IVX]+\. [^\n]+)(?:\n([\s\S]*))?$/);
   if (heading) {
    current = add(heading[1], termsTitles[lang][sections.length] ?? heading[1]);
    if (heading[2]) current.paragraphs.push(heading[2]);
   } else if (current) current.paragraphs.push(block);
   else intro.push(block);
  }
 } else {
  // The English source omits three headings. Restore only navigational labels;
  // keep every source paragraph and its original numbering in place.
  const starts = lang === 'pl' ? [1, 26, 37, 42, 61, 64] : [1, 17, 22, 27, 42, 45];
  blocks.forEach((block, index) => {
   const sectionIndex = starts.indexOf(index);
   if (sectionIndex !== -1) {
    const hasHeading = lang === 'pl' || sectionIndex >= 3;
    current = add(hasHeading ? block : '', privacyTitles[lang][sectionIndex]);
    if (!hasHeading) current.paragraphs.push(block);
   } else if (current) current.paragraphs.push(block);
   else intro.push(block);
  });
 }
 return {
  kind, lang, text, intro, sections,
  title: kind === 'terms' ? (lang === 'pl' ? 'Regulamin' : 'Terms & conditions') : (lang === 'pl' ? 'RODO i polityka prywatności' : 'Privacy & personal data'),
  description: kind === 'terms'
   ? (lang === 'pl' ? 'Zasady rezerwacji, realizacji usług, płatności i reklamacji w Personal Taxi.' : 'Personal Taxi booking, service, payment and complaint terms.')
   : (lang === 'pl' ? 'Informacje o administratorze danych, ich przetwarzaniu i przysługujących Ci prawach.' : 'Information about the data controller, processing of personal data and your rights.'),
 };
}

export function legalDownload(kind: LegalKind, request: Request) {
 const lang = legalLocale(new URL(request.url).searchParams.get('lang'));
 const document = getLegalDocument(kind, lang);
 const translationNote = kind === 'terms' && lang === 'en'
  ? 'The existing English translation covers sections I–VI. The complete Polish terms (I–X) are available at /regulamin?lang=pl.\n\n'
  : '';
 return new Response(`${document.title}\nPersonal Taxi · Inter-Dywiz sp. z o.o.\n\n${translationNote}${document.text}\n`, {
  headers: {
   'Content-Type': 'text/plain; charset=utf-8',
   'Content-Disposition': `attachment; filename="personal-taxi-${kind === 'terms' ? 'regulamin' : 'rodo'}-${lang}.txt"`,
   'Cache-Control': 'no-store',
   'X-Content-Type-Options': 'nosniff',
  },
 });
}
