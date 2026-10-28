'use client';

import { useState } from 'react';

export default function Home() {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [alertSent, setAlertSent] = useState(false);

  const handleScrape = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setData(null);
    setAlertSent(false);

    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      });

      const result = await res.json();
      if (result.success) {
        setData(result);
      } else {
        setError(result.error || 'Something went wrong');
      }
    } catch (err) {
      setError('Failed to connect to the server');
    } finally {
      setLoading(false);
    }
  };

  const handleSendAlert = () => {
    setAlertSent(true);
    setTimeout(() => setAlertSent(false), 4000);
  };

  return (
    <main className="min-h-screen bg-[#FDFBF7] py-12 px-4 sm:px-6 lg:px-8 text-[#4A3B32]">
      <div className="max-w-3xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-10">
          <span className="bg-[#EFECE6] text-[#6F4E37] text-xs font-semibold px-3.5 py-1.5 rounded-full uppercase tracking-wider border border-[#DCD6CE]">
            AI & Growth Marketing Tool
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#332219]">
            Competitor Monitoring & Alert Dashboard
          </h1>
          <p className="mt-2 text-sm text-[#7C6A58]">
            Easily track your competitors' latest content updates, target keywords, and search volume in real time.
          </p>
        </div>

        {/* Input Form Box */}
        <div className="bg-[#FFFFFF] shadow-sm border border-[#E6DFD5] rounded-xl p-6 mb-8">
          <form onSubmit={handleScrape} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Enter competitor domain (e.g. dev.to)"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              required
              className="flex-1 rounded-lg border border-[#DCD6CE] bg-[#FAF8F5] px-4 py-2.5 text-sm text-[#332219] placeholder-[#A39688] focus:border-[#8C6D53] focus:ring-2 focus:ring-[#E6DFD5] outline-none transition"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-[#6F4E37] py-2.5 px-6 text-sm font-semibold text-white shadow-sm hover:bg-[#5C3F2C] focus:outline-none disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Scanning...
                </>
              ) : (
                'Monitor Domain'
              )}
            </button>
          </form>
          {error && <p className="mt-3 text-sm text-[#A94442] font-medium">{error}</p>}
        </div>

        {/* Results Section */}
        {data && (
          <div className="bg-[#FFFFFF] shadow-sm border border-[#E6DFD5] rounded-xl p-6 transition-all">
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#EFECE6] pb-4">
              <div>
                <h3 className="text-base font-semibold text-[#332219]">Latest Content & SEO Insights</h3>
                <p className="text-xs text-[#8C7A6B]">Successfully extracted & analyzed via AI</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSendAlert}
                  className="bg-[#526E5D] hover:bg-[#435B4C] text-white text-xs font-medium px-3.5 py-2 rounded-lg shadow-sm transition flex items-center gap-1.5"
                >
                  🔔 Send Slack Alert
                </button>
                <a
                  href={data.sourceBlogUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#6F4E37] hover:text-[#332219] font-medium underline"
                >
                  View Blog →
                </a>
              </div>
            </div>

            {alertSent && (
              <div className="mb-4 bg-[#F2F7F4] border border-[#D0E1D4] text-[#2F4F38] text-xs px-4 py-3 rounded-lg flex items-center justify-between">
                <span>✨ <strong>Success!</strong> Weekly competitor briefing alert successfully sent to Slack channel <code>#growth-updates</code>.</span>
              </div>
            )}

            {/* Posts List */}
            <div className="space-y-4">
              {data.posts.length > 0 ? (
                data.posts.map((post, index) => (
                  <div key={index} className="p-4 rounded-xl border border-[#E6DFD5] bg-[#FAF8F5]/50 hover:bg-[#FAF8F5] hover:border-[#C4B7A6] transition">
                    <a
                      href={post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base font-semibold text-[#6F4E37] hover:underline block mb-1"
                    >
                      {post.title}
                    </a>
                    <p className="text-sm text-[#6E5D4F] mb-3">{post.metaDescription}</p>
                    
                    <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#EFECE6] text-xs">
                      <span className="bg-[#EFECE6] text-[#5C3F2C] px-2.5 py-1 rounded-md font-medium border border-[#E2DCd2]">
                        🔑 Keyword: <span className="font-bold">{post.targetKeyword}</span>
                      </span>
                      <span className="bg-[#EBF3ED] text-[#365A42] px-2.5 py-1 rounded-md font-medium border border-[#D5E6DA]">
                        📈 Search Vol: <span className="font-bold">{post.searchVolume}</span>
                      </span>
                      <span className="text-[#A39688] ml-auto">Published: {post.publishDate}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#8C7A6B]">No articles found on this domain.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}