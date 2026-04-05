
import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title?: string;
    description?: string;
    keywords?: string;
    canonical?: string;
    ogType?: string;
    ogImage?: string;
    schema?: object;
}

export default function SEO({
    title,
    description,
    keywords,
    canonical,
    ogType = 'website',
    ogImage = 'https://idealstay.co.za/og-share.png',
    schema
}: SEOProps) {
    const siteName = 'IdealStay';
    const fullTitle = title ? `${title} | ${siteName}` : 'IdealStay | Best Holiday Accommodation in South Africa';
    const fullDescription = description || "Discover the perfect holiday accommodation in South Africa. Explore verified stays, villas, and apartments on IdealStay.";
    const url = window.location.href;

    return (
        <Helmet>
            {/* Basic Meta Tags */}
            <title>{fullTitle}</title>
            <meta name="description" content={fullDescription} />
            {keywords && <meta name="keywords" content={keywords} />}
            <link rel="canonical" href={canonical || url} />

            {/* Open Graph / Facebook */}
            <meta property="og:site_name" content={siteName} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={fullDescription} />
            <meta property="og:type" content={ogType} />
            <meta property="og:url" content={url} />
            <meta property="og:image" content={ogImage} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={fullDescription} />
            <meta name="twitter:image" content={ogImage} />

            {/* Schema.org JSON-LD */}
            {schema && (
                <script type="application/ld+json">
                    {JSON.stringify(schema)}
                </script>
            )}
        </Helmet>
    );
}
