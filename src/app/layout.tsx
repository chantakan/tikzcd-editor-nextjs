import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'TikZCD Editor developed by Nextjs - Online Commutative Diagram Editor | 可換図式エディタ',
  description: 'Create and edit commutative diagrams with LaTeX/TikZCD. Visual editor for mathematicians and researchers. This is fetched from tikzcd-editor. | LaTeX/TikZCDで可換図式を簡単に作成・編集できるオンラインエディタ',
  keywords: [
    'TikZCD',
    'LaTeX',
    'commutative diagram',
    'diagram editor',
    'category theory',
    'mathematics',
    'math editor',
    'online editor',
    '可換図式',
    '圏論',
    '数学'
  ].join(','),
  openGraph: {
    title: 'TikZCD Editor developed by Nextjs - Online Commutative Diagram Editor',
    description: 'Create and edit commutative diagrams with LaTeX/TikZCD. Visual editor for mathematicians and researchers. This is fetched from tikzcd-editor.',
    type: 'website',
    locale: 'en_US',
    alternateLocale: 'ja_JP',
    url: 'https://your-domain.com',
    siteName: 'TikZCD Editor'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TikZCD Editor developed by Nextjs - Online Commutative Diagram Editor',
    description: 'Create and edit commutative diagrams with LaTeX/TikZCD. This is fetched from tikzcd-editor.'
  },
  robots: {
    index: true,
    follow: true
  }
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
