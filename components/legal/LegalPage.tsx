'use client';

import Link from 'next/link';
import {ArrowLeft, ArrowRight, ChevronDown, Download, Mail, Printer} from 'lucide-react';
import SiteShell, {useSiteLocale} from '@/components/SiteShell';
import {getLegalDocument, LEGAL_CONTACT, legalPath, type LegalKind} from '@/lib/legal-documents';
import type {Locale} from '@/lib/booking';
import './legal.css';

// Plain text from the original documents, with clickable email / HTTPS links.
function Paragraph({text}: {text: string}) {
 const parts = text.split(/(office@personaltaxi\.pl|https?:\/\/[^\s<>]+)/g);
 return <p>{parts.map((part, index) => part === LEGAL_CONTACT
  ? <a key={index} href={`mailto:${part}`}>{part}</a>
  : /^https?:\/\//.test(part)
   ? <a key={index} href={part} target="_blank" rel="noopener noreferrer">{part}</a>
   : part)}</p>;
}

function LegalContent({kind}: {kind: LegalKind}) {
 const lang = useSiteLocale();
 const pl = lang === 'pl';
 const document = getLegalDocument(kind, lang);
 const sibling: LegalKind = kind === 'terms' ? 'privacy' : 'terms';
 const contents = <ol>{document.sections.map((section, index) => <li key={section.id}><a href={`#${section.id}`}><span>{String(index + 1).padStart(2, '0')}</span>{section.title}</a></li>)}</ol>;
 return <main id="legal-main" className="legal-main">
  <div className="legal-container legal-heading">
   <Link className="legal-back" href={`/?lang=${lang}`}><ArrowLeft size={14}/>{pl ? 'Strona główna' : 'Home'}</Link>
   <div className="legal-heading-row"><div><span className="legal-eyebrow">PERSONAL TAXI</span><h1>{document.title}</h1><p>{document.description}</p></div>
    <div className="legal-tools"><button onClick={() => window.print()}><Printer size={16}/>{pl ? 'Drukuj / PDF' : 'Print / PDF'}</button><a href={`${kind === 'terms' ? '/regulamin' : '/rodo'}/pobierz?lang=${lang}`} download><Download size={16}/>{pl ? 'Pobierz TXT' : 'Download TXT'}</a></div>
   </div>
   <nav className="legal-tabs" aria-label={pl ? 'Dokumenty' : 'Documents'}><Link href={legalPath('terms', lang)} aria-current={kind === 'terms' ? 'page' : undefined}>{pl ? 'Regulamin' : 'Terms & conditions'}</Link><Link href={legalPath('privacy', lang)} aria-current={kind === 'privacy' ? 'page' : undefined}>{pl ? 'RODO i prywatność' : 'Privacy & personal data'}</Link></nav>
  </div>
  <div className="legal-container legal-layout">
   <aside className="legal-sidebar"><nav className="legal-desktop-contents" aria-label={pl ? 'Spis treści' : 'Contents'}><span className="legal-eyebrow">{pl ? 'W TYM DOKUMENCIE' : 'IN THIS DOCUMENT'}</span>{contents}</nav><div className="legal-contact"><span className="legal-eyebrow">{kind === 'privacy' ? (pl ? 'ADMINISTRATOR DANYCH' : 'DATA CONTROLLER') : (pl ? 'USŁUGODAWCA' : 'SERVICE PROVIDER')}</span><strong>Inter-Dywiz sp. z o.o.</strong><address>ul. Lotnicza 6/2<br/>31-462 Kraków<br/>NIP 6751496482</address><a href={`mailto:${LEGAL_CONTACT}`}><Mail size={14}/>{LEGAL_CONTACT}</a></div></aside>
   <article className="legal-document" aria-label={document.title}>
    <details className="legal-mobile-contents"><summary>{pl ? 'Spis treści' : 'Contents'}<ChevronDown size={17}/></summary><nav aria-label={pl ? 'Spis treści' : 'Contents'}>{contents}</nav></details>
    {kind === 'terms' && <div className="legal-document-meta">{pl ? 'Data wejścia w życie regulaminu: 31 października 2023 r.' : 'Terms effective from 31 October 2023.'}</div>}
    {kind === 'terms' && !pl && <p className="legal-translation-note">The existing English translation covers sections I–VI. <Link href="/regulamin?lang=pl">Read the complete Polish terms (sections I–X).</Link></p>}
    {document.intro.length > 0 && <div className="legal-introduction">{document.intro.map((paragraph, index) => <Paragraph key={index} text={paragraph}/>)}</div>}
    {document.sections.map((section, index) => <section id={section.id} key={section.id} className="legal-section" aria-labelledby={`${section.id}-title`}><h2 id={`${section.id}-title`}><span>{String(index + 1).padStart(2, '0')}</span>{section.title}</h2>{section.paragraphs.map((paragraph, index) => <Paragraph key={index} text={paragraph}/>)}</section>)}
    <div className="legal-document-end"><a href="#legal-main">{pl ? 'Wróć na górę' : 'Back to top'} ↑</a><Link href={legalPath(sibling, lang)}>{sibling === 'terms' ? (pl ? 'Regulamin' : 'Terms & conditions') : (pl ? 'RODO i prywatność' : 'Privacy & personal data')}<ArrowRight size={15}/></Link></div>
   </article>
  </div>
 </main>;
}

export default function LegalPage({kind, initialLocale}: {kind: LegalKind; initialLocale: Locale}) {
 return <SiteShell className="legal-site" initialLocale={initialLocale}><LegalContent kind={kind}/></SiteShell>;
}
