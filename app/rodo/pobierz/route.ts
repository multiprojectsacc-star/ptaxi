import {legalDownload} from '@/lib/legal-documents';
export function GET(request: Request) {return legalDownload('privacy', request);}
