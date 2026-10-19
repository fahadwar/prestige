import type {Metadata} from 'next';
import pages from './social-pages.json';
export const siteOrigin='https://games.cdlarabic.com';
export function socialMetadata(slug:string):Metadata{
 const page=pages.find(p=>p.slug===slug);if(!page)throw Error('Unknown social page');
 const url=siteOrigin+page.path,image=siteOrigin+'/social/prestige-'+slug+'-v1.png',alt=page.heading+' — برستيج';
 return {metadataBase:new URL(siteOrigin),title:page.title,description:page.description,alternates:{canonical:url},openGraph:{type:'website',locale:'ar_SA',siteName:'برستيج',title:page.title,description:page.description,url,images:[{url:image,width:1200,height:630,type:'image/png',alt}]},twitter:{card:'summary_large_image',site:'@Cdlarabic',title:page.title,description:page.description,images:[{url:image,alt}]}};
}
