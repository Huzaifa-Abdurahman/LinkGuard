"use client"
import { useState, FormEvent, JSX } from 'react';
import Head from 'next/head';
import Link from 'next/link';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
// Type definitions
interface ThreatResult {
  is_malicious: boolean;
  risk_level: string;
  confidence_score?: number;
  threats_detected?: string[];
  recommendations?: string[];
}

interface HistoryEntry {
  url: string;
  result: ThreatResult;
  timestamp: string;
}

type RiskLevel = 'high' | 'medium' | 'low';

export default function Home(): JSX.Element {
  const [url, setUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ThreatResult | null>(null);
  const [error, setError] = useState<string>('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const checkUrl = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    if (!validateUrl(url)) {
      setError('Please enter a valid URL');
      return;
    }

    setLoading(true);
    setError(''); 
    setResult(null);

    try {
      const response = await fetch(`${API_BASE_URL}/check-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url }),
      });

      if (!response.ok) {
        throw new Error('Failed to check URL');
      }

      const data: ThreatResult = await response.json();
      setResult(data);
      
      // Add to history
      const newEntry: HistoryEntry = {
        url: url,
        result: data,
        timestamp: new Date().toLocaleString(),
      };
      setHistory(prev => [newEntry, ...prev.slice(0, 9)]); // Keep last 10
      
    } catch (err) {
      setError('Error checking URL. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = (): void => {
    setHistory([]);
  };

  const getRiskColor = (risk: string | undefined): string => {
    switch (risk?.toLowerCase() as RiskLevel) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getThreatIcon = (risk: string | undefined): string => {
    switch (risk?.toLowerCase() as RiskLevel) {
      case 'high': return '🚨';
      case 'medium': return '⚠️';
      case 'low': return '✅';
      default: return '❓';
    }
  };

  return (
    <>
      <Head>
        <title>Malicious URL Detector </title>
        <meta name="description" content="Advanced URL security scanner for detecting malicious links" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
<div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-slate-700">
      
        {/* Header */}
        <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">🛡️</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Malicious URL Detector</h1>
                <p className="text-gray-300 text-sm">🛡️ LinkGuard –Secure your Web Experience</p>
                <button className=''>
                <Link href="/downloads" className="bg-gradient-to-br from-cyan-400 via-blue-900 to-purple-700 text-white p-2 font-bold bg-cyan-600 rounded-full text-xl hover:text-gray-800 ml-100">
        Downloads
      </Link>
              </button>  
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Main Scanner */}
            <div className="lg:col-span-2">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-white mb-2">URL Security Scanner</h2>
                  <p className="text-gray-300">Enter a URL to check for malicious content, phishing attempts, and security threats.</p>
                </div>

                <form onSubmit={checkUrl} className="space-y-4">
                  <div>
                    <label htmlFor="url" className="block text-sm font-medium text-gray-200 mb-2">
                      Enter URL to analyze
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://example.com"
                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
                        disabled={loading}
                      />
                      <div className="absolute right-3 top-3">
                        <span className="text-gray-400">🔗</span>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
                      <p className="text-red-200 text-sm">⚠️ {error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Analyzing URL...</span>
                      </>
                    ) : (
                      <>
                        <span>🔍</span>
                        <span>Scan URL for Threats</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Results */}
                {result && (
                  <div className="mt-8 space-y-4">
                    <div className={`p-6 rounded-xl border-2 ${getRiskColor(result.risk_level)}`}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold flex items-center space-x-2">
                          <span className="text-2xl">{getThreatIcon(result.risk_level)}</span>
                          <span>Security Analysis Results</span>
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(result.risk_level)}`}>
                          {result.risk_level?.toUpperCase()} RISK
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium mb-1">Status</p>
                          <p className="text-lg font-semibold">
                            {result.is_malicious ? 'MALICIOUS ⚠️' : 'SAFE ✅'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-1">Confidence Score</p>
                          <p className="text-lg font-semibold">
                            {result.confidence_score ? `${(result.confidence_score * 100).toFixed(1)}%` : 'N/A'}
                          </p>
                        </div>
                      </div>

                      {result.threats_detected && result.threats_detected.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-medium mb-2">Threats Detected:</p>
                          <div className="flex flex-wrap gap-2">
                            {result.threats_detected.map((threat: string, index: number) => (
                              <span key={index} className="px-2 py-1 bg-red-100 text-red-800 rounded-md text-xs">
                                {threat}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {result.recommendations && result.recommendations.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-medium mb-2">Security Recommendations:</p>
                          <ul className="text-sm space-y-1">
                            {result.recommendations.map((rec: string, index: number) => (
                              <li key={index} className="flex items-start space-x-2">
                                <span>•</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-4">Session Statistics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-300">URLs Scanned</span>
                    <span className="text-white font-semibold">{history.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Threats Found</span>
                    <span className="text-red-400 font-semibold">
                      {history.filter(h => h.result.is_malicious).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Safe URLs</span>
                    <span className="text-green-400 font-semibold">
                      {history.filter(h => !h.result.is_malicious).length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent Scans */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Recent Scans</h3>
                  {history.length > 0 && (
                    <button
                      onClick={clearHistory}
                      className="text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
                
                {history.length === 0 ? (
                  <p className="text-gray-400 text-sm">No scans yet</p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {history.map((entry: HistoryEntry, index: number) => (
                      <div key={index} className="bg-white/5 rounded-lg p-3 border border-white/10">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-400">{entry.timestamp}</span>
                          <span className={`text-xs px-2 py-1 rounded ${getRiskColor(entry.result.risk_level)}`}>
                            {entry.result.is_malicious ? 'THREAT' : 'SAFE'}
                          </span>
                        </div>
                        <p className="text-sm text-white truncate" title={entry.url}>
                          {entry.url}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Security Tips */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-4">Security Tips</h3>
                <div className="space-y-3 text-sm text-gray-300">
                  <div className="flex items-start space-x-2">
                    <span>🔒</span>
                    <p>Always verify URLs before clicking, especially in emails</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span>👀</span>
                    <p>Check for typos in domain names (typosquatting)</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span>🛡️</span>
                    <p>Use HTTPS whenever possible</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span>⚠️</span>
                    <p>Be cautious of shortened URLs from unknown sources</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-black/20 backdrop-blur-sm border-t border-white/10 mt-12">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="text-center text-gray-400 text-sm">
              <p>Information Security Project By Team Alpha</p>
              <p className="mt-1">Developed for network security and threat detection research</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
  
}
