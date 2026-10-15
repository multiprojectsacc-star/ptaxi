import type {Metadata} from 'next';
import LegalPage from '@/components/legal/LegalPage';
import {getLegalDocument, legalLocale} from '@/lib/legal-documents';

type Props = {searchParams: Promise<{lang?: string | string[]}>};
export async function generateMetadata({searchParams}: Props): Promise<Metadata> {
 const doc = getLegalDocument('terms', legalLocale((await searchParams).lang));
 return {title: `${doc.title} | Personal Taxi`, description: doc.description};
}
export default async function TermsPage({searchParams}: Props) {
 return <LegalPage kind="terms" initialLocale={legalLocale((await searchParams).lang)}/>;
}
