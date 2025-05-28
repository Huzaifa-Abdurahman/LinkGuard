import React from 'react'
import Link from 'next/link'

export default function Header() {
  return (
    <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-xl"><Link href="/" className="text-blue-600 underline hover:text-blue-800">🛡️</Link></span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Malicious URL Detector</h1>
          <p className="text-gray-300 text-sm">Information Security Term Project - Air University</p>
        </div>
      </div>
    </div>
  </div>

  )
}

