import React, { useState, useEffect } from 'react';
import { 
  Brain, Database, Cpu, MessageSquare, PlusCircle, GitCommit, 
  BarChart3, RefreshCw, CheckCircle2, XCircle, Sparkles, Search, 
  Tag, Clock, User, ArrowRight, ShieldCheck, AlertCircle, Layers,
  TrendingUp, Activity, Check, Filter, Calendar, FileText
} from 'lucide-react';

import { safeFetch } from './api';

const formatDisplayDate = (isoStr) => {
  if (!isoStr) return '';
  const parts = isoStr.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${day} ${months[monthIdx]} ${year}`;
    }
  }
  return isoStr;
};

const getNextSuggestedVersion = (updates) => {
  if (!updates || updates.length === 0) return 'e.g. v2.8';
  let maxMajor = 2, maxMinor = 7;
  updates.forEach(u => {
    const v = u.version || '';
    const match = v.match(/^v?(\d+)\.(\d+)/i);
    if (match) {
      const major = parseInt(match[1], 10);
      const minor = parseInt(match[2], 10);
      if (major > maxMajor || (major === maxMajor && minor > maxMinor)) {
        maxMajor = major;
        maxMinor = minor;
      }
    }
  });
  return `e.g. v${maxMajor}.${maxMinor + 1}`;
};

const parseMemoryDetails = (mem) => {
  const meta = mem.metadata || {};
  let customer = meta.customer || '';
  let source = meta.source || '';
  let product_area = meta.product_area || '';
  let theme = meta.theme || '';
  let sentiment = meta.sentiment || '';
  let date = meta.date || '';
  let type = mem.type || meta.type || 'memory';

  const content = mem.content || '';

  if (!customer && content.includes('Customer:')) {
    const match = content.match(/Customer:\s*([^\|]+)/);
    if (match) customer = match[1].trim();
  }
  if (!source && content.includes('Source:')) {
    const match = content.match(/Source:\s*([^\|]+)/);
    if (match) source = match[1].trim();
  }
  if (!product_area && content.includes('Product Area:')) {
    const match = content.match(/Product Area:\s*([^\|]+)/);
    if (match) product_area = match[1].trim();
  }
  if (!theme && content.includes('Theme:')) {
    const match = content.match(/Theme:\s*([^\|]+)/);
    if (match) theme = match[1].trim();
  }
  if (!sentiment && content.includes('Sentiment:')) {
    const match = content.match(/Sentiment:\s*([^\|]+)/);
    if (match) sentiment = match[1].trim();
  }
  if (!date && content.includes('Date:')) {
    const match = content.match(/Date:\s*([^\|]+)/);
    if (match) date = match[1].trim();
  }

  return { customer, source, product_area, theme, sentiment, date, type, content };
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [health, setHealth] = useState({ 
    hindsight_configured: false, 
    groq_configured: false, 
    hindsight_connected: false, 
    groq_connected: false,
    hindsight: { connected: false, configured: false, message: '' },
    groq: { connected: false, configured: false, message: '' }
  });
  const [insights, setInsights] = useState(null);
  const [recentFeedback, setRecentFeedback] = useState([]);
  const [productUpdates, setProductUpdates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState('');

  // Add Feedback Form state
  const [feedbackForm, setFeedbackForm] = useState({
    customer: 'Rahul',
    source: 'Support',
    product_area: 'Dashboard',
    date: new Date().toISOString().split('T')[0],
    feedback: 'The dashboard takes too long to load.'
  });
  const [feedbackResult, setFeedbackResult] = useState(null);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Product Update Form state & Validation
  const [updateForm, setUpdateForm] = useState({
    version: '',
    product_area: 'Reports',
    date: new Date().toISOString().split('T')[0],
    change: ''
  });
  const [updateFormErrors, setUpdateFormErrors] = useState({});
  const [updateSuccessMsg, setUpdateSuccessMsg] = useState('');
  const [updateErrorMsg, setUpdateErrorMsg] = useState('');
  const [updateResult, setUpdateResult] = useState(null);
  const [submittingUpdate, setSubmittingUpdate] = useState(false);

  // Ask Question state & Errors
  const [question, setQuestion] = useState('Did the latest update improve the dashboard problem?');
  const [askResult, setAskResult] = useState(null);
  const [asking, setAsking] = useState(false);
  const [askError, setAskError] = useState('');

  // Memory View filter & search states
  const [memoryFilter, setMemoryFilter] = useState('all');
  const [memorySearchQuery, setMemorySearchQuery] = useState('');
  const [fetchError, setFetchError] = useState('');

  const fetchAllData = async () => {
    setLoading(true);
    setFetchError('');
    try {
      const [healthRes, insightsRes, fbRes, upRes] = await Promise.allSettled([
        safeFetch('/api/config-status'),
        safeFetch('/api/insights'),
        safeFetch('/api/feedback/recent'),
        safeFetch('/api/product-updates')
      ]);

      if (healthRes.status === 'fulfilled') setHealth(healthRes.value);
      if (insightsRes.status === 'fulfilled') setInsights(insightsRes.value);
      if (fbRes.status === 'fulfilled' && Array.isArray(fbRes.value)) setRecentFeedback(fbRes.value);
      if (upRes.status === 'fulfilled' && Array.isArray(upRes.value)) setProductUpdates(upRes.value);

      const failed = [healthRes, insightsRes, fbRes, upRes].filter(r => r.status === 'rejected');
      if (failed.length > 0) {
        setFetchError('Unable to synchronize data endpoints.');
      }
    } catch (err) {
      setFetchError(err.message || 'Failed to load memories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleSeedData = async () => {
    setSeeding(true);
    setSeedMessage('');
    try {
      const data = await safeFetch('/api/seed', { method: 'POST' });
      setSeedMessage(data.message || 'Synthetic demo data successfully stored in Hindsight Cloud & local database!');
      await fetchAllData();
    } catch (err) {
      setSeedMessage(`Seeding error: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  };

  const handleAddFeedback = async (e) => {
    e.preventDefault();
    setSubmittingFeedback(true);
    setFeedbackResult(null);
    try {
      const data = await safeFetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackForm)
      });
      setFeedbackResult(data);
      await fetchAllData();
    } catch (err) {
      alert(`Submission error: ${err.message}`);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const validateUpdateForm = () => {
    const errors = {};
    if (!updateForm.version || !updateForm.version.trim()) {
      errors.version = 'Release version is required.';
    } else if (!/^v?\d+(\.\d+)+$/i.test(updateForm.version.trim())) {
      errors.version = 'Release version must follow semver format (e.g. v2.8 or v3.0).';
    }

    if (!updateForm.product_area || !updateForm.product_area.trim()) {
      errors.product_area = 'Product area is required.';
    }

    if (!updateForm.date || !updateForm.date.trim()) {
      errors.date = 'Release date is required.';
    }

    if (!updateForm.change || !updateForm.change.trim()) {
      errors.change = 'Change / Fix description cannot be empty.';
    }

    setUpdateFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddProductUpdate = async (e) => {
    e.preventDefault();
    setUpdateSuccessMsg('');
    setUpdateErrorMsg('');

    if (!validateUpdateForm()) {
      return;
    }

    setSubmittingUpdate(true);
    setUpdateResult(null);
    try {
      const data = await safeFetch('/api/product-updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: updateForm.version.trim(),
          product_area: updateForm.product_area.trim(),
          date: updateForm.date.trim(),
          change: updateForm.change.trim()
        })
      });

      setUpdateResult(data);
      setUpdateSuccessMsg('Product update saved to Hindsight Memory.');
      setUpdateForm({
        version: '',
        product_area: 'Reports',
        date: new Date().toISOString().split('T')[0],
        change: ''
      });
      setUpdateFormErrors({});
      await fetchAllData();
    } catch (err) {
      setUpdateErrorMsg(`Failed to save product update: ${err.message}`);
    } finally {
      setSubmittingUpdate(false);
    }
  };

  const handleAskQuestion = async (qText) => {
    const qToAsk = qText || question;
    if (!qToAsk.trim()) return;
    setAsking(true);
    setAskResult(null);
    setAskError('');
    try {
      const data = await safeFetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: qToAsk })
      });
      setAskResult(data);
    } catch (err) {
      setAskError(err.message || 'Failed to query agent');
    } finally {
      setAsking(false);
    }
  };

  const hindsightConnected = health.hindsight_connected || health.hindsight?.connected;
  const hindsightConfigured = health.hindsight_configured || health.hindsight?.configured;
  
  const groqConnected = health.groq_connected || health.groq?.connected;
  const groqConfigured = health.groq_configured || health.groq?.configured;

  const sortedProductUpdates = [...productUpdates].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  // Calculate Key Findings for Ask tab
  const parsedMemories = askResult?.memories_used ? askResult.memories_used.map(parseMemoryDetails) : [];
  const extractedThemes = [...new Set(parsedMemories.map(m => m.theme).filter(Boolean))];
  const extractedAreas = [...new Set(parsedMemories.map(m => m.product_area).filter(Boolean))];
  const posCount = parsedMemories.filter(m => m.sentiment === 'Positive' || m.content.toLowerCase().includes('positive')).length;
  const negCount = parsedMemories.filter(m => m.sentiment === 'Negative' || m.content.toLowerCase().includes('slow') || m.content.toLowerCase().includes('fail')).length;
  const neuCount = Math.max(0, parsedMemories.length - posCount - negCount);

  // Check if query or evidence includes Product Update correlation
  const hasUpdateCorrelation = parsedMemories.some(m => m.type === 'product_update' || m.content.toLowerCase().includes('product update') || m.content.toLowerCase().includes('v2.4') || m.content.toLowerCase().includes('optimized'));

  // Standardized Memory Items with deduplication for Hindsight Memory Explorer
  const memoryItems = React.useMemo(() => {
    const map = new Map();

    // 1. Transform Customer Feedback items
    recentFeedback.forEach((fb) => {
      const key = fb.id || `fb_${fb.customer}_${fb.date}_${fb.feedback}`;
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          type: 'feedback',
          typeLabel: 'Customer Feedback',
          title: fb.customer,
          source: fb.source || 'Support',
          product_area: fb.product_area || 'Dashboard',
          theme: fb.analysis?.theme || 'Performance',
          sentiment: fb.analysis?.sentiment || 'Neutral',
          date: fb.date,
          text: fb.feedback,
          formattedMemory: `Customer Feedback | Date: ${fb.date} | Customer: ${fb.customer} | Source: ${fb.source || 'Support'} | Product Area: ${fb.product_area} | Theme: ${fb.analysis?.theme || 'Performance'} | Sentiment: ${fb.analysis?.sentiment || 'Neutral'} | Raw Feedback: "${fb.feedback}"`,
          status: fb.hindsight_status || 'Memory Stored'
        });
      }
    });

    // 2. Transform Product Update items
    productUpdates.forEach((up) => {
      const key = up.id || `up_${up.version}_${up.date}_${up.change}`;
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          type: 'product_update',
          typeLabel: 'Product Update',
          title: up.version,
          source: 'Release',
          product_area: up.product_area || 'Dashboard',
          theme: 'Engineering Fix',
          sentiment: 'Positive',
          date: up.date,
          text: up.change,
          formattedMemory: `Product Update | Version: ${up.version} | Date: ${up.date} | Product Area: ${up.product_area} | Change Description: "${up.change}"`,
          status: up.hindsight_status || 'Memory Stored'
        });
      }
    });

    const list = Array.from(map.values());
    list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    return list;
  }, [recentFeedback, productUpdates]);

  // Filter by tab filter (all, feedback, updates) and search query
  const filteredMemories = React.useMemo(() => {
    return memoryItems.filter((item) => {
      // 1. Tab filter
      if (memoryFilter === 'feedback' && item.type !== 'feedback') return false;
      if (memoryFilter === 'updates' && item.type !== 'product_update') return false;

      // 2. Search query filter
      if (memorySearchQuery && memorySearchQuery.trim()) {
        const q = memorySearchQuery.toLowerCase().trim();
        const matchable = [
          item.title,
          item.source,
          item.product_area,
          item.theme,
          item.sentiment,
          item.text,
          item.date,
          item.formattedMemory
        ].join(' ').toLowerCase();

        return matchable.includes(q);
      }
      return true;
    });
  }, [memoryItems, memoryFilter, memorySearchQuery]);

  const feedbackCount = memoryItems.filter(m => m.type === 'feedback').length;
  const updatesCount = memoryItems.filter(m => m.type === 'product_update').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-sky-500 to-indigo-600 rounded-xl text-white shadow-lg shadow-sky-500/20">
            <Brain className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">FeedbackMind</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-sky-950 text-sky-400 font-mono border border-sky-800/50">Hindsight Memory</span>
            </div>
            <p className="text-xs text-slate-400">AI Customer Feedback Synthesizer with Persistent Long-Term Memory</p>
          </div>
        </div>

        {/* Live System Status Badges */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
            hindsightConnected 
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300' 
              : hindsightConfigured 
              ? 'bg-amber-950/40 border-amber-800/60 text-amber-300' 
              : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
          }`}>
            <Database className="w-3.5 h-3.5" />
            <span>Hindsight Cloud:</span>
            <span className="font-semibold flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${
                hindsightConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}></span>
              {hindsightConnected ? 'Connected' : hindsightConfigured ? 'Configured (Connection Error)' : 'Not Configured'}
            </span>
          </div>

          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
            groqConnected 
              ? 'bg-indigo-950/40 border-indigo-800/60 text-indigo-300' 
              : groqConfigured 
              ? 'bg-amber-950/40 border-amber-800/60 text-amber-300' 
              : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
          }`}>
            <Cpu className="w-3.5 h-3.5" />
            <span>Groq LLM:</span>
            <span className="font-semibold flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${
                groqConnected ? 'bg-indigo-400 animate-pulse' : 'bg-amber-400'
              }`}></span>
              {groqConnected ? 'Connected' : groqConfigured ? 'Configured (Connection Error)' : 'Not Configured'}
            </span>
          </div>

          <button
            onClick={handleSeedData}
            disabled={seeding}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium transition shadow disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${seeding ? 'animate-spin' : ''}`} />
            {seeding ? 'Seeding Hindsight...' : 'Load Demo Data'}
          </button>
        </div>
      </header>

      {/* Demo Seed Banner Message */}
      {seedMessage && (
        <div className="bg-sky-950/60 border-b border-sky-800/60 px-6 py-2.5 text-xs text-sky-200 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-sky-400" />
            {seedMessage}
          </span>
          <button onClick={() => setSeedMessage('')} className="text-sky-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Navigation Sub-header Tabs */}
      <nav className="bg-slate-900/60 border-b border-slate-800/80 px-6 flex items-center gap-2 overflow-x-auto text-sm">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition whitespace-nowrap ${activeTab === 'dashboard' ? 'border-sky-500 text-sky-400 bg-sky-950/30' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <BarChart3 className="w-4 h-4" />
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('add_feedback')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition whitespace-nowrap ${activeTab === 'add_feedback' ? 'border-sky-500 text-sky-400 bg-sky-950/30' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <PlusCircle className="w-4 h-4" />
          Add Feedback
        </button>
        <button
          onClick={() => setActiveTab('product_updates')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition whitespace-nowrap ${activeTab === 'product_updates' ? 'border-sky-500 text-sky-400 bg-sky-950/30' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <GitCommit className="w-4 h-4" />
          Product Updates
        </button>
        <button
          onClick={() => setActiveTab('ask')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition whitespace-nowrap ${activeTab === 'ask' ? 'border-sky-500 text-sky-400 bg-sky-950/30' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <Sparkles className="w-4 h-4 text-sky-400" />
          Ask FeedbackMind
        </button>
        <button
          onClick={() => setActiveTab('memory')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition whitespace-nowrap ${activeTab === 'memory' ? 'border-sky-500 text-sky-400 bg-sky-950/30' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <Database className="w-4 h-4 text-indigo-400" />
          Hindsight Memory / Evidence
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">

        {/* 1. DASHBOARD VIEW */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* User Journey Workflow Pipeline Banner */}
            <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between overflow-x-auto text-[11px] font-mono text-slate-300 gap-2 shadow">
              <span className="flex items-center gap-1 text-sky-400 font-bold shrink-0">
                <MessageSquare className="w-3.5 h-3.5" /> Multi-Channel Feedback
              </span>
              <span className="text-slate-600">➔</span>
              <span className="flex items-center gap-1 text-emerald-400 font-bold shrink-0">
                <Database className="w-3.5 h-3.5" /> Persistent Hindsight Memory
              </span>
              <span className="text-slate-600">➔</span>
              <span className="flex items-center gap-1 text-amber-400 font-bold shrink-0">
                <TrendingUp className="w-3.5 h-3.5" /> Themes + Sentiment Shifts
              </span>
              <span className="text-slate-600">➔</span>
              <span className="flex items-center gap-1 text-purple-400 font-bold shrink-0">
                <GitCommit className="w-3.5 h-3.5" /> Release Correlation
              </span>
              <span className="text-slate-600">➔</span>
              <span className="flex items-center gap-1 text-emerald-300 font-bold shrink-0">
                <Sparkles className="w-3.5 h-3.5" /> Actionable Insight
              </span>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow">
                <div className="flex justify-between items-center text-slate-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Total Feedback</span>
                  <MessageSquare className="w-4 h-4 text-sky-400" />
                </div>
                <div className="text-3xl font-bold text-white">{insights?.total_feedback ?? recentFeedback.length ?? 0}</div>
                <p className="text-xs text-slate-400 mt-1">Across Support, Surveys, Reviews & Email</p>
              </div>

              <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow">
                <div className="flex justify-between items-center text-slate-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Positive</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-3xl font-bold text-emerald-400">{insights?.positive ?? 0}</div>
                <p className="text-xs text-slate-400 mt-1">Customers satisfied post-release</p>
              </div>

              <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow">
                <div className="flex justify-between items-center text-slate-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Neutral</span>
                  <Tag className="w-4 h-4 text-slate-400" />
                </div>
                <div className="text-3xl font-bold text-slate-200">{insights?.neutral ?? 0}</div>
                <p className="text-xs text-slate-400 mt-1">Informational feedback</p>
              </div>

              <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow">
                <div className="flex justify-between items-center text-slate-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">Negative</span>
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                </div>
                <div className="text-3xl font-bold text-rose-400">{insights?.negative ?? 0}</div>
                <p className="text-xs text-slate-400 mt-1">Issues & feature friction</p>
              </div>
            </div>

            {/* Feedback -> Product Release Correlation Section */}
            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-3 shadow">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <GitCommit className="w-4 h-4 text-indigo-400" />
                  Feedback → Product Release Correlation
                </h3>
                <span className="text-[11px] text-indigo-300 font-mono bg-indigo-950/80 px-2.5 py-0.5 rounded border border-indigo-800/60">
                  Engineering Impact Tracker
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* Correlation 1: Dashboard Performance */}
                <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Area: <strong className="text-sky-300">Dashboard</strong></span>
                    <span className="text-emerald-400 font-bold">Resolved in v2.4</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-200">
                    <span className="text-rose-400 font-semibold shrink-0">Problem:</span>
                    <span className="text-slate-300 truncate">Dashboard latency & load time complaints</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-200">
                    <span className="text-indigo-400 font-semibold shrink-0">Fix (v2.4):</span>
                    <span className="text-slate-300 truncate">v2.4 Dashboard performance optimization & caching</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-200 border-t border-slate-800/60 pt-1.5">
                    <span className="text-emerald-400 font-semibold shrink-0">Impact:</span>
                    <span className="text-emerald-300 font-medium">Positive feedback increased (+85% satisfaction)</span>
                  </div>
                </div>

                {/* Correlation 2: Reports Export Speed */}
                <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Area: <strong className="text-sky-300">Reports</strong></span>
                    <span className="text-emerald-400 font-bold">Resolved in v2.5</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-200">
                    <span className="text-rose-400 font-semibold shrink-0">Problem:</span>
                    <span className="text-slate-300 truncate">Report generation lag & PDF export delays</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-200">
                    <span className="text-indigo-400 font-semibold shrink-0">Fix (v2.5):</span>
                    <span className="text-slate-300 truncate">v2.5 Async PDF generator & export engine patch</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-200 border-t border-slate-800/60 pt-1.5">
                    <span className="text-emerald-400 font-semibold shrink-0">Impact:</span>
                    <span className="text-emerald-300 font-medium">Export speeds sub-2s, 0 active export issues</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sentiment Shift Over Time Visualizer */}
            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-3 shadow">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Sentiment Shift Over Time & Release Impact
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">Monthly Sentiment Trend</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {/* Phase 1: Early Sep */}
                <div className="p-3 bg-slate-950 rounded-lg border border-rose-900/40 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Early Sep (Sep 01 - 15)</span>
                    <span className="text-rose-400 font-bold">High Friction</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden flex">
                    <div className="bg-rose-500 w-[75%] h-full"></div>
                    <div className="bg-slate-600 w-[25%] h-full"></div>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-sans pt-1">
                    Pre-release: 75% negative feedback driven by dashboard latency.
                  </p>
                </div>

                {/* Phase 2: Mid Sep Release Event */}
                <div className="p-3 bg-slate-950 rounded-lg border border-indigo-900/50 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-indigo-300 font-bold">v2.4 Deployed (Sep 18)</span>
                    <span className="text-indigo-400 font-bold">Engineering Fix</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden flex">
                    <div className="bg-indigo-500 w-[100%] h-full"></div>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-sans pt-1">
                    Release v2.4 shipped to production with memory caching.
                  </p>
                </div>

                {/* Phase 3: Late Sep */}
                <div className="p-3 bg-slate-950 rounded-lg border border-emerald-900/40 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Late Sep (Sep 19 - 28)</span>
                    <span className="text-emerald-400 font-bold">Positive Shift</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden flex">
                    <div className="bg-emerald-500 w-[80%] h-full"></div>
                    <div className="bg-slate-600 w-[20%] h-full"></div>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-sans pt-1">
                    Post-release: 80% positive feedback praising snappier performance.
                  </p>
                </div>
              </div>
            </div>

            {/* Middle Grid: Top Themes & Emerging Issues */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Themes */}
              <div className="bg-slate-900 p-5 rounded-xl border border-slate-800">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-400" />
                  Top Feedback Themes (Pattern Identified Across Records)
                </h3>
                <div className="space-y-3">
                  {insights?.top_themes?.length > 0 ? (
                    insights.top_themes.map((t, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-300 font-medium">{t.theme}</span>
                          <span className="px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800/60 font-mono text-[10px]">
                            {t.count} items
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-36 bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-sky-500 h-full rounded-full" 
                              style={{ width: `${Math.min(100, (t.count / (insights.total_feedback || 1)) * 100)}%` }}
                            ></div>
                          </div>
                          <span className="font-mono text-xs text-slate-400 w-6 text-right">{t.count}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500">No feedback themes recorded yet.</p>
                  )}
                </div>
              </div>

              {/* Emerging Issues */}
              <div className="bg-slate-900 p-5 rounded-xl border border-slate-800">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-rose-400">
                    <AlertCircle className="w-4 h-4" />
                    Emerging Customer Issues
                  </span>
                  <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/60 text-[10px] font-mono">
                    Newly Increasing Patterns
                  </span>
                </h3>
                <div className="space-y-2.5">
                  {insights?.emerging_issues?.length > 0 ? (
                    insights.emerging_issues.map((iss, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-start justify-between gap-2 text-xs">
                        <div>
                          <span className="font-medium text-rose-300">{iss.issue}</span>
                          <span className="ml-2 text-slate-500">({iss.product_area})</span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 font-mono text-[10px] border border-rose-800/60">
                          Emerging Pattern
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500">No active negative issues flagged.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Timeline: Recent Activity */}
            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-400" />
                Multi-Channel Recent Activity & Hindsight Storage Log
              </h3>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {recentFeedback.slice(0, 10).map((item) => (
                  <div key={item.id} className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg text-xs flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-200">{item.customer}</span>
                        <span className="text-slate-500">•</span>
                        <span className={`px-2 py-0.5 rounded font-mono text-[10px] border ${
                          item.source === 'Support' ? 'bg-sky-950 text-sky-300 border-sky-800/60' :
                          item.source === 'Survey' ? 'bg-emerald-950 text-emerald-300 border-emerald-800/60' :
                          item.source === 'Review' ? 'bg-purple-950 text-purple-300 border-purple-800/60' :
                          'bg-amber-950 text-amber-300 border-amber-800/60'
                        }`}>
                          {item.source}
                        </span>
                        <span className="text-slate-500">•</span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-sky-300 text-[10px] font-mono">{item.product_area}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${item.analysis?.sentiment === 'Positive' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60' : item.analysis?.sentiment === 'Negative' ? 'bg-rose-950 text-rose-300 border border-rose-800/60' : 'bg-slate-800 text-slate-300 border border-slate-700'}`}>
                          {item.analysis?.sentiment}
                        </span>
                      </div>
                      <p className="text-slate-300 italic">"{item.feedback}"</p>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] shrink-0">
                      <span className="text-slate-500 font-mono">{formatDisplayDate(item.date)}</span>
                      <span className={`px-2 py-1 rounded-md font-semibold border flex items-center gap-1 ${item.hindsight_status === 'Memory Stored' ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' : 'bg-rose-950/40 border-rose-800 text-rose-300'}`}>
                        {item.hindsight_status === 'Memory Stored' ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <XCircle className="w-3 h-3 text-rose-400" />}
                        {item.hindsight_status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. ADD FEEDBACK VIEW */}
        {activeTab === 'add_feedback' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form */}
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-4 shadow">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-sky-400" />
                Ingest Customer Feedback
              </h2>
              <p className="text-xs text-slate-400">
                FeedbackMind will extract themes & sentiment, then retain the memory into Hindsight Cloud.
              </p>

              <form onSubmit={handleAddFeedback} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Customer Name</label>
                  <input
                    type="text"
                    required
                    value={feedbackForm.customer}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, customer: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                    placeholder="e.g. Rahul"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Feedback Source</label>
                    <select
                      value={feedbackForm.source}
                      onChange={(e) => setFeedbackForm({ ...feedbackForm, source: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                    >
                      <option value="Support">Support</option>
                      <option value="Survey">Survey</option>
                      <option value="Review">Review</option>
                      <option value="Email">Email</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Product Area</label>
                    <select
                      value={feedbackForm.product_area}
                      onChange={(e) => setFeedbackForm({ ...feedbackForm, product_area: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                    >
                      <option value="Dashboard">Dashboard</option>
                      <option value="Search">Search</option>
                      <option value="Navigation">Navigation</option>
                      <option value="Reports">Reports</option>
                      <option value="Pricing">Pricing</option>
                      <option value="Reliability">Reliability</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={feedbackForm.date}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Raw Customer Feedback</label>
                  <textarea
                    rows={4}
                    required
                    value={feedbackForm.feedback}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, feedback: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                    placeholder="Enter verbatim customer quotes..."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={submittingFeedback}
                  className="w-full py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-semibold rounded-lg shadow transition flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  {submittingFeedback ? 'Processing & Retaining...' : 'Analyze & Remember'}
                </button>
              </form>
            </div>

            {/* AI Extraction & Hindsight Status Result */}
            <div className="space-y-4">
              {feedbackResult ? (
                <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-4 shadow">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Brain className="w-4 h-4 text-sky-400" />
                      AI Analysis & Retain Confirmation
                    </h3>
                    <span className={`px-3 py-1 rounded-md text-xs font-bold border flex items-center gap-1.5 ${feedbackResult.hindsight_status === 'Memory Stored' ? 'bg-emerald-950 border-emerald-800 text-emerald-300' : 'bg-rose-950 border-rose-800 text-rose-300'}`}>
                      {feedbackResult.hindsight_status === 'Memory Stored' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
                      Hindsight: {feedbackResult.hindsight_status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                      <span className="text-slate-400 block mb-1">Theme</span>
                      <span className="font-semibold text-sky-300 text-sm">{feedbackResult.analysis.theme}</span>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                      <span className="text-slate-400 block mb-1">Sentiment</span>
                      <span className={`font-semibold text-sm ${feedbackResult.analysis.sentiment === 'Positive' ? 'text-emerald-400' : feedbackResult.analysis.sentiment === 'Negative' ? 'text-rose-400' : 'text-slate-200'}`}>
                        {feedbackResult.analysis.sentiment}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs space-y-1">
                    <span className="text-slate-400 font-semibold block">Key Issue Identified</span>
                    <p className="text-slate-200 font-medium">{feedbackResult.analysis.issue}</p>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs space-y-1">
                    <span className="text-slate-400 font-semibold block">Executive Summary</span>
                    <p className="text-slate-300">{feedbackResult.analysis.summary}</p>
                  </div>

                  <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-400">
                    <span className="text-slate-500 block mb-1">Retain Status Detail:</span>
                    {feedbackResult.hindsight_detail}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900/40 p-8 rounded-xl border border-dashed border-slate-800 text-center text-slate-500 space-y-2">
                  <Brain className="w-10 h-10 mx-auto text-slate-700" />
                  <p className="text-sm font-medium">Submit feedback to view live AI extraction & Hindsight RETAIN response.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. PRODUCT UPDATES VIEW */}
        {activeTab === 'product_updates' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-4 shadow">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <GitCommit className="w-5 h-5 text-indigo-400" />
                Record Product Update / Feature Release
              </h2>
              <p className="text-xs text-slate-400">
                Storing updates in Hindsight enables the agent to connect customer complaints with engineering fixes!
              </p>

              {/* Status Message Banners */}
              {updateSuccessMsg && (
                <div className="bg-emerald-950/60 border border-emerald-800 text-emerald-200 px-4 py-3 rounded-lg text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{updateSuccessMsg}</span>
                </div>
              )}
              {updateErrorMsg && (
                <div className="bg-rose-950/60 border border-rose-800 text-rose-200 px-4 py-3 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{updateErrorMsg}</span>
                </div>
              )}

              <form onSubmit={handleAddProductUpdate} className="space-y-4 text-sm" noValidate>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Release Version</label>
                  <input
                    type="text"
                    value={updateForm.version}
                    onChange={(e) => {
                      setUpdateForm({ ...updateForm, version: e.target.value });
                      if (updateFormErrors.version) setUpdateFormErrors({ ...updateFormErrors, version: '' });
                    }}
                    className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-white focus:outline-none ${updateFormErrors.version ? 'border-rose-500 focus:border-rose-400' : 'border-slate-800 focus:border-indigo-500'}`}
                    placeholder={getNextSuggestedVersion(productUpdates)}
                  />
                  {updateFormErrors.version && (
                    <p className="text-rose-400 text-xs mt-1">{updateFormErrors.version}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Product Area</label>
                    <select
                      value={updateForm.product_area}
                      onChange={(e) => {
                        setUpdateForm({ ...updateForm, product_area: e.target.value });
                        if (updateFormErrors.product_area) setUpdateFormErrors({ ...updateFormErrors, product_area: '' });
                      }}
                      className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-white focus:outline-none ${updateFormErrors.product_area ? 'border-rose-500 focus:border-rose-400' : 'border-slate-800 focus:border-indigo-500'}`}
                    >
                      <option value="Dashboard">Dashboard</option>
                      <option value="Search">Search</option>
                      <option value="Navigation">Navigation</option>
                      <option value="Reports">Reports</option>
                      <option value="Pricing">Pricing</option>
                      <option value="Reliability">Reliability</option>
                    </select>
                    {updateFormErrors.product_area && (
                      <p className="text-rose-400 text-xs mt-1">{updateFormErrors.product_area}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Release Date</label>
                    <input
                      type="date"
                      value={updateForm.date}
                      onChange={(e) => {
                        setUpdateForm({ ...updateForm, date: e.target.value });
                        if (updateFormErrors.date) setUpdateFormErrors({ ...updateFormErrors, date: '' });
                      }}
                      className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-white focus:outline-none ${updateFormErrors.date ? 'border-rose-500 focus:border-rose-400' : 'border-slate-800 focus:border-indigo-500'}`}
                    />
                    {updateFormErrors.date && (
                      <p className="text-rose-400 text-xs mt-1">{updateFormErrors.date}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Change / Fix Description</label>
                  <textarea
                    rows={4}
                    value={updateForm.change}
                    onChange={(e) => {
                      setUpdateForm({ ...updateForm, change: e.target.value });
                      if (updateFormErrors.change) setUpdateFormErrors({ ...updateFormErrors, change: '' });
                    }}
                    className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-white focus:outline-none ${updateFormErrors.change ? 'border-rose-500 focus:border-rose-400' : 'border-slate-800 focus:border-indigo-500'}`}
                    placeholder="Describe what was shipped or optimized..."
                  ></textarea>
                  {updateFormErrors.change && (
                    <p className="text-rose-400 text-xs mt-1">{updateFormErrors.change}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submittingUpdate}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Database className={`w-4 h-4 ${submittingUpdate ? 'animate-spin' : ''}`} />
                  {submittingUpdate ? 'Saving to Hindsight...' : 'Remember Update'}
                </button>
              </form>
            </div>

            {/* Product Updates Timeline List */}
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-4 shadow">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                Product Updates Memory Timeline
              </h3>
              <div className="space-y-3 max-h-[620px] overflow-y-auto pr-2">
                {sortedProductUpdates.length > 0 ? (
                  sortedProductUpdates.map((up, idx) => (
                    <div key={up.id || `up_${idx}`} className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2 text-xs hover:border-slate-700 transition">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded bg-indigo-950 text-indigo-300 font-bold text-xs border border-indigo-800/60">{up.version}</span>
                          <span className="text-slate-400 font-medium">{up.product_area}</span>
                        </div>
                        <span className="text-slate-500 font-mono text-[11px]">{formatDisplayDate(up.date)}</span>
                      </div>
                      <p className="text-slate-200 font-medium leading-relaxed">{up.change}</p>
                      <div className="text-[10px] text-emerald-400 flex items-center gap-1 pt-1 border-t border-slate-800/60">
                        <CheckCircle2 className="w-3 h-3" />
                        Retained in Hindsight Memory Bank ({up.hindsight_status})
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 text-center py-6">No product updates recorded yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 4. ASK FEEDBACKMIND VIEW */}
        {activeTab === 'ask' && (
          <div className="space-y-6">
            {/* Quick Ask Suggestion Buttons */}
            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-3 shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                  Recommended Historical Questions
                </span>
                <span className="text-[11px] text-slate-500">Click any question to query memory</span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={() => { setQuestion("Did the latest update improve the dashboard problem?"); handleAskQuestion("Did the latest update improve the dashboard problem?"); }}
                  className="px-3.5 py-2 rounded-lg bg-sky-950/80 hover:bg-sky-900 text-sky-200 border border-sky-800/80 text-xs font-medium transition flex items-center gap-2 shadow"
                >
                  <Sparkles className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  Did the latest update improve the dashboard problem?
                </button>
                <button
                  onClick={() => { setQuestion("What are our biggest customer problems?"); handleAskQuestion("What are our biggest customer problems?"); }}
                  className="px-3.5 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 text-xs font-medium transition flex items-center gap-2"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  What are our biggest customer problems?
                </button>
                <button
                  onClick={() => { setQuestion("What themes are emerging over time?"); handleAskQuestion("What themes are emerging over time?"); }}
                  className="px-3.5 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 text-xs font-medium transition flex items-center gap-2"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  What themes are emerging over time?
                </button>
                <button
                  onClick={() => { setQuestion("How has customer sentiment shifted?"); handleAskQuestion("How has customer sentiment shifted?"); }}
                  className="px-3.5 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 text-xs font-medium transition flex items-center gap-2"
                >
                  <Activity className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  How has customer sentiment shifted?
                </button>
              </div>
            </div>

            {/* Question Input Box */}
            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 flex gap-3 shadow">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500"
                placeholder="Ask any question about customer feedback, sentiment trends, or product releases..."
              />
              <button
                onClick={() => handleAskQuestion()}
                disabled={asking}
                className="px-6 py-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-semibold rounded-lg text-sm transition flex items-center gap-2 shadow disabled:opacity-50"
              >
                <Search className={`w-4 h-4 ${asking ? 'animate-spin' : ''}`} />
                {asking ? 'Analyzing Memory...' : 'Ask Agent'}
              </button>
            </div>

            {/* State 0: Initial Idle State (Before Submitting Question) */}
            {!asking && !askError && !askResult && (
              <div className="bg-slate-900/60 p-10 rounded-xl border border-slate-800/80 text-center space-y-3 shadow">
                <div className="w-12 h-12 rounded-full bg-sky-950/80 border border-sky-800/60 flex items-center justify-center mx-auto text-sky-400 shadow-inner">
                  <Brain className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-200">Ask FeedbackMind about your customer history</h3>
                  <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
                    &ldquo;Connect feedback, product updates, sentiment, and recurring issues across time.&rdquo;
                  </p>
                </div>
              </div>
            )}

            {/* State 1: Loading */}
            {asking && (
              <div className="bg-slate-900/60 p-12 rounded-xl border border-slate-800 text-center space-y-4">
                <Brain className="w-12 h-12 text-sky-400 animate-pulse mx-auto" />
                <div>
                  <h3 className="text-base font-bold text-white">Analyzing Customer Feedback & Product Memories...</h3>
                  <p className="text-xs text-slate-400 mt-1">Recalling historical evidence from Hindsight persistent memory bank and synthesizing AI insights...</p>
                </div>
              </div>
            )}

            {/* State 2: Error with Retry */}
            {askError && (
              <div className="bg-rose-950/60 border border-rose-800/80 p-6 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-rose-300 font-semibold text-sm">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  <span>Failed to process query with agent</span>
                </div>
                <p className="text-xs text-rose-200 font-mono">{askError}</p>
                <div className="pt-1">
                  <button
                    onClick={() => handleAskQuestion()}
                    disabled={asking}
                    className="px-4 py-2 bg-rose-700 hover:bg-rose-600 text-white text-xs font-semibold rounded-lg transition flex items-center gap-2"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${asking ? 'animate-spin' : ''}`} />
                    Retry Query
                  </button>
                </div>
              </div>
            )}

            {/* State 3: Empty Result */}
            {askResult && askResult.recalled_memories_count === 0 && !asking && (
              <div className="bg-slate-900 p-8 rounded-xl border border-slate-800 text-center space-y-2">
                <Database className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-sm font-semibold text-slate-300">No relevant historical feedback was found for this question.</h3>
                <p className="text-xs text-slate-500">Try rephrasing your question or submitting new feedback entries to memory.</p>
              </div>
            )}

            {/* State 4: SUCCESS - Redesigned PM Intelligence Panel */}
            {askResult && askResult.recalled_memories_count > 0 && !asking && (
              <div className="space-y-6">
                {/* Product Story Pipeline Banner */}
                <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between overflow-x-auto text-[11px] font-mono text-slate-300 gap-2 shadow">
                  <span className="flex items-center gap-1 text-sky-400 font-bold shrink-0">
                    <MessageSquare className="w-3.5 h-3.5" /> Customer Feedback
                  </span>
                  <span className="text-slate-600">➔</span>
                  <span className="flex items-center gap-1 text-emerald-400 font-bold shrink-0">
                    <Database className="w-3.5 h-3.5" /> Persistent Memory
                  </span>
                  <span className="text-slate-600">➔</span>
                  <span className="flex items-center gap-1 text-indigo-400 font-bold shrink-0">
                    <Brain className="w-3.5 h-3.5" /> Historical Reasoning
                  </span>
                  <span className="text-slate-600">➔</span>
                  <span className="flex items-center gap-1 text-amber-400 font-bold shrink-0">
                    <TrendingUp className="w-3.5 h-3.5" /> Emerging Patterns
                  </span>
                  <span className="text-slate-600">➔</span>
                  <span className="flex items-center gap-1 text-purple-400 font-bold shrink-0">
                    <GitCommit className="w-3.5 h-3.5" /> Release Correlation
                  </span>
                  <span className="text-slate-600">➔</span>
                  <span className="flex items-center gap-1 text-emerald-300 font-bold shrink-0">
                    <Sparkles className="w-3.5 h-3.5" /> Actionable Insight
                  </span>
                </div>

                {/* 1. PROMINENT AI SUMMARY (1-3 Sentences) */}
                <div className="bg-gradient-to-r from-sky-950/90 via-slate-900 to-indigo-950/90 p-6 rounded-xl border border-sky-500/60 shadow-xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-sky-900/60 pb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-sky-400 shrink-0" />
                      <h3 className="text-base font-bold text-white uppercase tracking-wider">AI Executive Summary</h3>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/80 text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Memory Retrieved & Reasoned ({askResult.recalled_memories_count} Items)
                    </span>
                  </div>

                  <p className="text-sm sm:text-base font-medium text-sky-100 leading-relaxed bg-slate-950/60 p-4 rounded-lg border border-sky-900/40">
                    {askResult.answer.split(/\n{2,}|\n(?=###)/)[0].replace(/^(\*\*Short answer:\*\*|Short answer:|\#+\s*)/i, '').trim() || askResult.answer.slice(0, 280)}
                  </p>
                </div>

                {/* 2. KEY FINDINGS SECTION */}
                <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-4 shadow">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-sky-400" />
                      Key Findings & Emerging Themes
                    </h3>
                    <span className="text-xs text-slate-400 font-mono">Synthesized Trends</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Findings Bullet Points */}
                    <div className="space-y-2 bg-slate-950 p-4 rounded-lg border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans">
                      <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px] pb-1 border-b border-slate-800">
                        Primary Observations
                      </span>
                      <ul className="space-y-1.5 pt-1">
                        <li className="flex items-start gap-2">
                          <span className="text-sky-400 font-bold">•</span>
                          <span><strong>Feedback Shift:</strong> Reversal in customer complaint velocity following recent engineering deployments.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-sky-400 font-bold">•</span>
                          <span><strong>Core Area Impacted:</strong> Performance & latency across {extractedAreas.join(', ') || 'Dashboard'}.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-sky-400 font-bold">•</span>
                          <span><strong>Emerging Themes:</strong> {extractedThemes.join(', ') || 'Performance, Reliability'}.</span>
                        </li>
                      </ul>
                    </div>

                    {/* Full Synthesized Answer Details */}
                    <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2 text-xs text-slate-300 max-h-48 overflow-y-auto font-sans leading-relaxed">
                      <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px] pb-1 border-b border-slate-800">
                        Detailed Historical Synthesis
                      </span>
                      <div className="whitespace-pre-line text-slate-300">
                        {askResult.answer}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. SENTIMENT / FEEDBACK BREAKDOWN SECTION */}
                <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-4 shadow">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-400" />
                      Sentiment / Feedback Breakdown
                    </h3>
                    <span className="text-xs text-slate-400 font-mono">{parsedMemories.length} Analyzed Memories</span>
                  </div>

                  {/* Visual Proportion Bar */}
                  <div className="space-y-2">
                    <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
                      <div
                        style={{ width: `${parsedMemories.length ? Math.round((posCount / parsedMemories.length) * 100) : 0}%` }}
                        className="bg-emerald-500 h-full transition-all duration-500"
                        title={`Positive: ${posCount}`}
                      />
                      <div
                        style={{ width: `${parsedMemories.length ? Math.round((negCount / parsedMemories.length) * 100) : 0}%` }}
                        className="bg-rose-500 h-full transition-all duration-500"
                        title={`Negative: ${negCount}`}
                      />
                      <div
                        style={{ width: `${parsedMemories.length ? Math.round((neuCount / parsedMemories.length) * 100) : 0}%` }}
                        className="bg-slate-600 h-full transition-all duration-500"
                        title={`Neutral: ${neuCount}`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    {/* Positive Card */}
                    <div className="bg-slate-950 p-3.5 rounded-lg border border-emerald-900/50 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-emerald-400 font-bold uppercase block">Positive Feedback</span>
                        <span className="text-lg font-bold text-white font-mono">{posCount}</span>
                      </div>
                      <span className="px-2 py-1 rounded bg-emerald-950 text-emerald-300 font-mono text-xs border border-emerald-800">
                        {parsedMemories.length ? Math.round((posCount / parsedMemories.length) * 100) : 0}%
                      </span>
                    </div>

                    {/* Negative Card */}
                    <div className="bg-slate-950 p-3.5 rounded-lg border border-rose-900/50 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-rose-400 font-bold uppercase block">Negative / Issues</span>
                        <span className="text-lg font-bold text-white font-mono">{negCount}</span>
                      </div>
                      <span className="px-2 py-1 rounded bg-rose-950 text-rose-300 font-mono text-xs border border-rose-800">
                        {parsedMemories.length ? Math.round((negCount / parsedMemories.length) * 100) : 0}%
                      </span>
                    </div>

                    {/* Neutral Card */}
                    <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Neutral Observations</span>
                        <span className="text-lg font-bold text-white font-mono">{neuCount}</span>
                      </div>
                      <span className="px-2 py-1 rounded bg-slate-800 text-slate-300 font-mono text-xs border border-slate-700">
                        {parsedMemories.length ? Math.round((neuCount / parsedMemories.length) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. RELATED PRODUCT UPDATES SECTION */}
                <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-4 shadow">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <GitCommit className="w-4 h-4 text-indigo-400" />
                      Related Product Updates
                    </h3>
                    <span className="text-xs text-indigo-300 bg-indigo-950/80 px-2.5 py-1 rounded border border-indigo-800/80 font-mono">
                      Hindsight Release Correlation
                    </span>
                  </div>

                  {productUpdates.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {productUpdates.slice(0, 4).map((upd, idx) => (
                        <div key={idx} className="p-3.5 bg-slate-950 rounded-lg border border-indigo-900/40 space-y-2 hover:border-indigo-800/80 transition">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/80 font-mono font-bold text-xs">
                              {upd.version}
                            </span>
                            <span className="text-slate-500 font-mono text-xs">{formatDisplayDate(upd.date)}</span>
                          </div>
                          <div className="text-xs text-slate-200 font-semibold">{upd.product_area}</div>
                          <p className="text-slate-300 text-xs leading-relaxed font-mono bg-slate-900/90 p-2.5 rounded border border-slate-800/80">
                            {upd.change}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No specific product updates recorded for this area.</p>
                  )}
                </div>

                {/* 5. EVIDENCE FROM MEMORY SECTION */}
                <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-4 shadow">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Evidence from Memory ({askResult.recalled_memories_count} Recalled Items)
                    </h3>
                    <span className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60 text-xs font-mono">
                      Memory Bank: feedbackmind
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {parsedMemories.slice(0, 8).map((mem, idx) => (
                      <div key={idx} className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 text-xs space-y-2 flex flex-col justify-between hover:border-slate-700 transition">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-2">
                              {mem.customer && <span className="font-bold text-slate-200">{mem.customer}</span>}
                              {mem.source && <span className="text-slate-400">({mem.source})</span>}
                              {mem.product_area && <span className="px-2 py-0.5 rounded bg-slate-800 text-sky-300 text-[10px] font-mono">{mem.product_area}</span>}
                            </div>
                            {mem.date && <span className="text-slate-500 font-mono text-[10px]">{formatDisplayDate(mem.date)}</span>}
                          </div>
                          <p className="text-slate-300 leading-relaxed font-mono text-[11px] bg-slate-900/80 p-2.5 rounded border border-slate-800/80">
                            {mem.content}
                          </p>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-800/60">
                          <span className="flex items-center gap-1 text-emerald-400 font-mono">
                            <CheckCircle2 className="w-3 h-3" /> Hindsight Memory Stored
                          </span>
                          {mem.sentiment && (
                            <span className={`font-semibold ${mem.sentiment === 'Positive' ? 'text-emerald-400' : mem.sentiment === 'Negative' ? 'text-rose-400' : 'text-slate-300'}`}>
                              {mem.sentiment}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 6. RECOMMENDED NEXT STEP SECTION */}
                <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900 to-sky-950/80 p-5 rounded-xl border border-indigo-800/80 space-y-2 shadow-lg">
                  <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    Recommended Next Step for Product Team
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed bg-slate-950/80 p-3.5 rounded-lg border border-indigo-900/50">
                    Continue monitoring latency metrics on newly deployed releases and conduct follow-up customer sentiment checks over the next 2 weeks to ensure sustained satisfaction.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5. HINDSIGHT MEMORY VIEW */}
        {activeTab === 'memory' && (
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-6 shadow">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-indigo-400" />
                  Hindsight Cloud Persistent Memory Explorer
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Memory Bank: <span className="font-mono text-sky-400 font-bold">feedbackmind</span> | Long-term memory store for feedback & product changes
                </p>
              </div>

              {/* Memory Filter Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setMemoryFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 ${
                    memoryFilter === 'all'
                      ? 'bg-sky-600 text-white font-semibold shadow'
                      : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/60'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  All Memories ({memoryItems.length})
                </button>
                <button
                  onClick={() => setMemoryFilter('feedback')}
                  className={`px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 ${
                    memoryFilter === 'feedback'
                      ? 'bg-sky-600 text-white font-semibold shadow'
                      : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/60'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Customer Feedback ({feedbackCount})
                </button>
                <button
                  onClick={() => setMemoryFilter('updates')}
                  className={`px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 ${
                    memoryFilter === 'updates'
                      ? 'bg-sky-600 text-white font-semibold shadow'
                      : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/60'
                  }`}
                >
                  <GitCommit className="w-3.5 h-3.5" />
                  Product Updates ({updatesCount})
                </button>
              </div>
            </div>

            {/* Search Box */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={memorySearchQuery}
                  onChange={(e) => setMemorySearchQuery(e.target.value)}
                  placeholder="Search memories..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-8 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                />
                {memorySearchQuery && (
                  <button
                    onClick={() => setMemorySearchQuery('')}
                    className="absolute right-2.5 top-2 text-slate-500 hover:text-slate-300"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="text-xs text-slate-400 flex items-center gap-2 self-end sm:self-auto font-mono">
                <span>Showing <strong>{filteredMemories.length}</strong> of {memoryItems.length} stored memories</span>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="p-12 text-center space-y-3 bg-slate-950/40 rounded-xl border border-slate-800">
                <RefreshCw className="w-8 h-8 text-sky-400 animate-spin mx-auto" />
                <p className="text-xs text-slate-400 font-mono">Loading memories from Hindsight Cloud...</p>
              </div>
            )}

            {/* Error State */}
            {!loading && fetchError && (
              <div className="p-6 bg-rose-950/60 border border-rose-800 rounded-xl flex items-center justify-between text-xs text-rose-200">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  <span>Unable to load memories from Hindsight Cloud: {fetchError}</span>
                </div>
                <button
                  onClick={fetchAllData}
                  className="px-3 py-1.5 bg-rose-800 hover:bg-rose-700 text-white rounded font-semibold transition"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Empty State */}
            {!loading && !fetchError && filteredMemories.length === 0 && (
              <div className="p-12 text-center space-y-3 bg-slate-950/40 rounded-xl border border-slate-800">
                <Database className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-sm font-bold text-slate-300">No memories found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {memorySearchQuery
                    ? `No records matched "${memorySearchQuery}". Try clearing search or resetting filters.`
                    : 'No memory records available in Hindsight persistent memory bank.'}
                </p>
                {memorySearchQuery && (
                  <button
                    onClick={() => setMemorySearchQuery('')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded text-xs transition"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            )}

            {/* Memory Cards Grid */}
            {!loading && !fetchError && filteredMemories.length > 0 && (
              <div className="space-y-3.5">
                {filteredMemories.map((mem) => (
                  <div
                    key={mem.id}
                    className="p-4 bg-slate-950 rounded-lg border border-slate-800/90 text-xs space-y-3 hover:border-slate-700 transition shadow"
                  >
                    {/* Memory Card Top Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {mem.type === 'feedback' ? (
                          <span className="px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800/60 font-mono text-[10px] font-bold flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" /> Customer Feedback
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60 font-mono text-[10px] font-bold flex items-center gap-1">
                            <GitCommit className="w-3 h-3" /> Product Update
                          </span>
                        )}

                        <span className="font-bold text-slate-100 text-sm">{mem.title}</span>
                        <span className="text-slate-400 font-medium text-xs">({mem.source})</span>
                      </div>

                      <span className="text-slate-400 font-mono text-xs flex items-center gap-1 self-start sm:self-auto">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {formatDisplayDate(mem.date)}
                      </span>
                    </div>

                    {/* Badges Bar */}
                    <div className="flex items-center gap-2 flex-wrap text-[11px]">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-sky-300 font-mono">
                        Area: {mem.product_area}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-indigo-300 font-mono">
                        Theme: {mem.theme}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded font-semibold border ${
                          mem.sentiment === 'Positive'
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60'
                            : mem.sentiment === 'Negative'
                            ? 'bg-rose-950/80 text-rose-300 border-rose-800/60'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        Sentiment: {mem.sentiment}
                      </span>
                    </div>

                    {/* Original Text */}
                    <p className="text-slate-200 leading-relaxed font-sans text-xs bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                      "{mem.text}"
                    </p>

                    {/* Retained Semantic Memory String */}
                    <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1 overflow-x-auto">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Hindsight Retained Semantic Memory</span>
                      <span className="text-slate-300">{mem.formattedMemory}</span>
                    </div>

                    {/* Card Footer Status */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>Hindsight Memory Bank: <code className="text-sky-400 font-bold font-mono">feedbackmind</code></span>
                      <span className="text-emerald-400 flex items-center gap-1 font-mono font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Hindsight Memory Retained
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 px-6 py-4 text-center text-xs text-slate-500 mt-auto">
        FeedbackMind Prototype — Powered by <a href="https://hindsight.vectorize.io/" target="_blank" rel="noreferrer" className="text-sky-400 hover:underline">Hindsight Cloud Memory</a> & <a href="https://groq.com/" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">Groq LLM</a>
      </footer>
    </div>
  );
}
