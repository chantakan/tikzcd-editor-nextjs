'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import Script from 'next/script'

const App = dynamic(() => import('../components/App'), {
    ssr: false
})

export default function Home() {
    return (
        <>
            <Script id="structured-data" type="application/ld+json">
                {JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "WebApplication",
                    "name": "TikZCD Editor developed by Nextjs",
                    "description": "LaTeX/TikZCDで可換図式を簡単に作成・編集できるオンラインエディタ",
                    "applicationCategory": "EducationalApplication",
                    "operatingSystem": "Any",
                    "offers": {
                        "@type": "Offer",
                        "price": "0",
                        "priceCurrency": "USD"
                    },
                    "featureList": [
                        "可換図式の視覚的な作成",
                        "LaTeXコードの生成",
                        "図式の保存と共有",
                        "直感的なインターフェース"
                    ]
                })}
            </Script>
            <App />
        </>
    )
}
