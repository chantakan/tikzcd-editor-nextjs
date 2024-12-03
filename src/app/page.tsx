'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { ComponentType } from 'react'

const App = dynamic(() => import('../components/App'), {
    ssr: false
})

export default function Home() {
    return <App />
}
