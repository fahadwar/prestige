import type { Metadata } from 'next';
import './globals.css';
import {socialMetadata} from '../lib/seo/metadata';
export const metadata:Metadata={...socialMetadata('home'),icons:{icon:'/prestige-monogram-concept.png',apple:'/prestige-monogram-concept.png'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ar" dir="rtl"><head>
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-VM11900YKP" />
  <script id="google-analytics" dangerouslySetInnerHTML={{__html:`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-VM11900YKP');`}} />
</head><body>{children}</body></html>}
