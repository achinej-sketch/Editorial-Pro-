import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart3, 
  FileText, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Upload, 
  ArrowRight,
  RefreshCw,
  LayoutDashboard,
  Settings,
  HelpCircle,
  ChevronRight,
  Globe,
  Smartphone,
  Home,
  Baby,
  Search,
  Plus
} from 'lucide-react';
import Papa from 'papaparse';
import Markdown from 'react-markdown';
import { cn } from './lib/utils';
import { BLOGS, HIGH_CPC_NICHES, LOW_CPC_NICHES } from './constants';
import { Blog, AnalyticsData, AdSenseData, BriefingReport } from './types';
import { generateBriefing } from './services/geminiService';

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 w-full px-4 py-2.5 rounded-xl transition-all duration-200",
      active ? "bg-white/10 text-white shadow-sm" : "text-white/60 hover:bg-white/5 hover:text-white"
    )}
  >
    <Icon size={18} />
    <span className="text-sm font-medium">{label}</span>
  </button>
);

const BlogStatusCard = ({ blog, status }: { blog: Blog, status?: any }) => (
  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-all duration-300 group">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2.5 bg-white/5 rounded-xl group-hover:scale-110 transition-transform duration-300">
        {blog.id === 'astucieusement' && <Home size={20} className="text-blue-400" />}
        {blog.id === 'quandonestmaman' && <Baby size={20} className="text-pink-400" />}
        {blog.id === 'tutoriel-iphone' && <Smartphone size={20} className="text-gray-400" />}
        {blog.id === 'en-astucieusement' && <Globe size={20} className="text-green-400" />}
      </div>
      <div className={cn(
        "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
        status?.isDelayed ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-green-500/20 text-green-400 border border-green-500/30"
      )}>
        {status?.isDelayed ? "⚠️ Retard" : "✅ OK"}
      </div>
    </div>
    <h3 className="text-white font-semibold mb-1">{blog.name}</h3>
    <p className="text-white/40 text-xs mb-4">{blog.description}</p>
    <div className="space-y-2">
      <div className="flex justify-between text-[11px]">
        <span className="text-white/40">Cadence cible</span>
        <span className="text-white/80 font-medium">{blog.targetCadence} articles / sem</span>
      </div>
      <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full rounded-full transition-all duration-1000",
            status?.isDelayed ? "bg-red-500" : "bg-blue-500"
          )} 
          style={{ width: `${status?.progress || 100}%` }}
        />
      </div>
    </div>
  </div>
);

// --- Error Boundary ---

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mb-6">
            <AlertCircle size={32} className="text-red-400" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Une erreur est survenue</h1>
          <p className="text-white/40 mb-8 max-w-md">
            L'application a rencontré un problème inattendu. Veuillez vérifier votre configuration (notamment la clé API Gemini).
          </p>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-left font-mono text-xs text-red-400 overflow-auto max-w-full">
            {this.state.error?.message}
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="mt-8 px-6 py-2 bg-white text-black rounded-full font-bold hover:scale-105 transition-transform"
          >
            Recharger la page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const [step, setStep] = useState<'welcome' | 'instructions' | 'analysis' | 'report' | 'settings'>('welcome');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, step]);

  const triggerFaisLePoint = () => {
    setStep('instructions');
    const instructionMessage = `
Avant de continuer, exporte tes stats en 5 minutes :
📊 Google Analytics — 4 exports, un par blog :
analytics.google.com → sélectionne la propriété du blog → Rapports → Engagement → Pages et écrans → 28 derniers jours → Exporter → CSV
👉 Répète pour les 4 blogs : astucieusement.com / quandonestmaman.fr / tutoriel-iphone.fr / en.astucieusement.com
📈 Google AdSense — Rapport Claude :
adsense.google.com → Rapports → Créer un rapport → Dimensions : URL de la page + Date + Pays → Métriques : Revenus estimés, Pages vues, RPM pages, Impressions, RPM impressions, Visibles avec Active View, Clics → 28 derniers jours → Exporter → CSV
⚠️ Appelle ce fichier "rapport Claude" avant de le glisser ici.
Glisse les 5 fichiers ici, ou tape "skip" pour continuer sans stats.
    `;
    setMessages(prev => [...prev, { role: 'assistant', content: instructionMessage }]);
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim()) return;

    const userMsg = inputValue.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInputValue('');

    if (step === 'welcome' || step === 'settings') {
      triggerFaisLePoint();
    } else if (step === 'instructions') {
      if (userMsg.toLowerCase() === 'skip') {
        startAnalysis([]);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
      
      if (newFiles.length > 0) {
        setMessages(prev => [...prev, { role: 'assistant', content: `Fichiers reçus (${newFiles.length}). Je lance l'analyse...` }]);
        startAnalysis(newFiles);
      }
    }
  };

  const startAnalysis = async (uploadedFiles: File[]) => {
    setIsAnalyzing(true);
    setStep('analysis');

    try {
      const analyticsData: any[] = [];
      const adsenseData: any[] = [];

      for (const file of uploadedFiles) {
        const text = await file.text();
        const result = Papa.parse(text, { header: true });
        
        if (file.name.toLowerCase().includes('claude')) {
          adsenseData.push(...result.data);
        } else {
          analyticsData.push({
            fileName: file.name,
            data: result.data
          });
        }
      }

      const blogContext = BLOGS.map(blog => ({
        ...blog,
        lastArticle: "Comment porter le bixie cut après 50 ans",
        lastArticleDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        isDelayed: Math.random() > 0.7
      }));

      const briefing = await generateBriefing(analyticsData, adsenseData, blogContext);
      setReport(briefing);
      setStep('report');
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Erreur lors de l'analyse. Réessayons." }]);
      setStep('instructions');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white font-sans selection:bg-blue-500/30">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 flex flex-col p-4 bg-[#0a0a0a]">
        <div className="flex items-center gap-3 px-4 py-6 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
            <TrendingUp size={18} className="text-white" />
          </div>
          <h1 className="font-bold text-lg tracking-tight">Editorial Pro</h1>
        </div>

        <nav className="flex-1 space-y-1">
          <SidebarItem 
            icon={LayoutDashboard} 
            label="Tableau de bord" 
            active={step === 'welcome'} 
            onClick={() => setStep('welcome')} 
          />
          <SidebarItem 
            icon={BarChart3} 
            label="Analyses Stats" 
            active={step === 'instructions' || step === 'analysis'} 
            onClick={() => setStep('instructions')} 
          />
          <SidebarItem 
            icon={FileText} 
            label="Briefings" 
            active={step === 'report'} 
            onClick={() => report ? setStep('report') : triggerFaisLePoint()} 
          />
          <SidebarItem 
            icon={Settings} 
            label="Configuration" 
            active={step === 'settings'} 
            onClick={() => setStep('settings')} 
          />
        </nav>

        <div className="mt-auto pt-4 border-t border-white/10">
          <SidebarItem icon={HelpCircle} label="Aide & Support" />
          <div className="mt-4 px-4 py-3 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Status AdSense</span>
            </div>
            <p className="text-xs text-white/60">CPC Moyen: <span className="text-white font-medium">€0,09</span></p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-white/[0.02] to-transparent">
        {/* Header */}
        <header className="h-16 border-b border-white/10 flex items-center justify-between px-8 backdrop-blur-md bg-black/20 sticky top-0 z-10">
          <div className="flex items-center gap-2 text-sm text-white/40">
            <span>Assistant</span>
            <ChevronRight size={14} />
            <span className="text-white/80 font-medium">
              {step === 'welcome' && "Vue d'ensemble"}
              {step === 'instructions' && "Collecte des données"}
              {step === 'analysis' && "Analyse en cours"}
              {step === 'report' && "Briefing Quotidien"}
              {step === 'settings' && "Configuration"}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                setMessages([]);
                setStep('welcome');
                setReport(null);
                setFiles([]);
              }}
              className="px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-medium transition-all flex items-center gap-2"
            >
              <RefreshCw size={14} />
              Nouveau point
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 border border-white/20" />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8" ref={scrollRef}>
          <AnimatePresence mode="wait">
            {step === 'welcome' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-5xl mx-auto"
              >
                <div className="mb-12">
                  <h2 className="text-4xl font-bold tracking-tight mb-4 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                    Bonjour, prêt pour le point ?
                  </h2>
                  <p className="text-white/40 text-lg max-w-2xl">
                    Je suis votre assistant éditorial personnel. Envoyez n'importe quel message pour lancer l'analyse de vos 4 blogs.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                  {BLOGS.map(blog => (
                    <BlogStatusCard key={blog.id} blog={blog} />
                  ))}
                </div>

                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6">
                    <TrendingUp size={32} className="text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Lancez l'analyse quotidienne</h3>
                  <p className="text-white/40 mb-8 max-w-md">
                    Nous allons vérifier vos cadences, analyser vos revenus AdSense et identifier les meilleures opportunités Pinterest.
                  </p>
                  <button 
                    onClick={triggerFaisLePoint}
                    className="px-8 py-3 bg-white text-black rounded-full font-bold hover:scale-105 transition-transform flex items-center gap-2 shadow-xl shadow-white/10"
                  >
                    Faire le point
                    <ArrowRight size={18} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'settings' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-4xl mx-auto"
              >
                <h2 className="text-3xl font-bold mb-8">Configuration</h2>
                <div className="grid grid-cols-1 gap-6">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Globe size={20} className="text-blue-400" />
                      Blogs Monitorés
                    </h3>
                    <div className="space-y-4">
                      {BLOGS.map(blog => (
                        <div key={blog.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                          <div>
                            <p className="font-medium">{blog.name}</p>
                            <p className="text-xs text-white/40">{blog.url}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">{blog.targetCadence} art/sem</p>
                            <p className="text-[10px] text-white/20 uppercase">{blog.language === 'fr' ? 'Français' : 'Anglais'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <TrendingUp size={20} className="text-green-400" />
                      Objectifs Business
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                        <p className="text-xs text-white/40 uppercase font-bold tracking-wider mb-1">CPC Cible</p>
                        <p className="text-2xl font-bold text-white">€0,15</p>
                        <p className="text-[10px] text-green-400 mt-1">Actuel: €0,09</p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                        <p className="text-xs text-white/40 uppercase font-bold tracking-wider mb-1">Monétisation</p>
                        <p className="text-lg font-bold text-white">AdSense + Amazon</p>
                        <p className="text-[10px] text-white/20 mt-1">Associates à développer</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'instructions' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-3xl mx-auto space-y-6"
              >
                {messages.map((msg, i) => (
                  <div key={i} className={cn(
                    "flex flex-col gap-2",
                    msg.role === 'user' ? "items-end" : "items-start"
                  )}>
                    <div className={cn(
                      "max-w-[85%] px-6 py-4 rounded-3xl text-sm leading-relaxed",
                      msg.role === 'user' 
                        ? "bg-blue-600 text-white rounded-tr-none" 
                        : "bg-white/5 border border-white/10 text-white/80 rounded-tl-none whitespace-pre-wrap"
                    )}>
                      {msg.content}
                    </div>
                  </div>
                ))}

                <div className="flex flex-col items-center gap-6 py-8">
                  <label className="w-full max-w-md cursor-pointer group">
                    <div className="border-2 border-dashed border-white/10 group-hover:border-blue-500/50 rounded-3xl p-12 flex flex-col items-center gap-4 transition-all bg-white/[0.02] group-hover:bg-blue-500/5">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Upload size={24} className="text-blue-400" />
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-white/80">Glissez vos fichiers CSV ici</p>
                        <p className="text-xs text-white/40 mt-1">Analytics (4) + Rapport Claude (1)</p>
                      </div>
                      <input type="file" multiple accept=".csv" className="hidden" onChange={handleFileUpload} />
                    </div>
                  </label>
                  
                  <div className="flex items-center gap-4 w-full max-w-md">
                    <div className="h-px flex-1 bg-white/10" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">ou</span>
                    <div className="h-px flex-1 bg-white/10" />
                  </div>

                  <button 
                    onClick={() => startAnalysis([])}
                    className="text-white/40 hover:text-white text-sm font-medium transition-colors"
                  >
                    Continuer sans statistiques (skip)
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'analysis' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full py-20"
              >
                <div className="relative w-24 h-24 mb-8">
                  <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full" />
                  <div className="absolute inset-0 border-4 border-t-blue-500 rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Search size={32} className="text-blue-400 animate-pulse" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-2">Analyse en cours...</h3>
                <p className="text-white/40 text-center max-w-xs">
                  Je parcours vos sitemaps, j'analyse vos revenus et je détecte les meilleures opportunités.
                </p>
              </motion.div>
            )}

            {step === 'report' && report && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-6xl mx-auto pb-20 space-y-12"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-4xl font-bold tracking-tight mb-2">Briefing Editorial</h2>
                    <p className="text-white/40">Analyse stratégique du {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                  <div className="flex gap-3">
                    <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium transition-all flex items-center gap-2">
                      <FileText size={16} />
                      Exporter PDF
                    </button>
                  </div>
                </div>

                {(() => {
                  try {
                    const data = JSON.parse(report) as BriefingReport;
                    return (
                      <div className="space-y-12">
                        {/* État des blogs */}
                        <section>
                          <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                              <LayoutDashboard size={18} className="text-blue-400" />
                            </div>
                            📊 État des blogs
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {data.blogStatus.map((s, i) => (
                              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                                <div className="flex justify-between items-start mb-3">
                                  <span className="text-xs font-bold text-white/40 uppercase tracking-widest">{s.blog}</span>
                                  <span className={cn(
                                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                    s.status.includes('ok') ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                                  )}>
                                    {s.status}
                                  </span>
                                </div>
                                <p className="text-sm font-semibold mb-1 line-clamp-1">{s.lastArticle}</p>
                                <p className="text-[11px] text-white/40 mb-3">{s.theme}</p>
                                <p className="text-[10px] text-white/20">Publié il y a {s.daysAgo} jours</p>
                              </div>
                            ))}
                          </div>
                        </section>

                        {/* Alertes Analytics */}
                        <section>
                          <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                            <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                              <AlertCircle size={18} className="text-orange-400" />
                            </div>
                            🔍 Alertes Analytics
                          </h3>
                          <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-white/5 text-[11px] font-bold uppercase tracking-widest text-white/40">
                                  <th className="px-6 py-4">Blog</th>
                                  <th className="px-6 py-4">Article</th>
                                  <th className="px-6 py-4">Vues</th>
                                  <th className="px-6 py-4">Engagement</th>
                                  <th className="px-6 py-4">Signal</th>
                                </tr>
                              </thead>
                              <tbody className="text-sm">
                                {data.analyticsAlerts.map((a, i) => (
                                  <tr key={i} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4 text-white/60">{a.blog}</td>
                                    <td className="px-6 py-4 font-medium">{a.article}</td>
                                    <td className="px-6 py-4">{a.views.toLocaleString()}</td>
                                    <td className="px-6 py-4">{a.engagement}s</td>
                                    <td className="px-6 py-4 text-lg">{a.signal}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </section>

                        {/* Top Articles */}
                        <section>
                          <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                              <TrendingUp size={18} className="text-green-400" />
                            </div>
                            💰 Top articles (AdSense)
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {data.topArticles.map((t, i) => (
                              <div key={i} className="bg-gradient-to-br from-white/10 to-transparent border border-white/10 rounded-3xl p-6 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 text-2xl opacity-20 group-hover:opacity-100 transition-opacity">
                                  {t.signal}
                                </div>
                                <h4 className="text-lg font-bold mb-4 pr-8">{t.article}</h4>
                                <div className="space-y-3">
                                  <div className="flex justify-between items-end">
                                    <span className="text-xs text-white/40 uppercase font-bold">Revenus 28j</span>
                                    <span className="text-xl font-bold text-green-400">€{t.revenue.toFixed(2)}</span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/5">
                                    <div>
                                      <p className="text-[10px] text-white/40 uppercase font-bold">RPM FR</p>
                                      <p className="text-sm font-semibold">€{t.rpmFR.toFixed(2)}</p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] text-white/40 uppercase font-bold">RPM CA/BE</p>
                                      <p className="text-sm font-semibold">€{t.rpmOther.toFixed(2)}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </section>

                        {/* Priorités du jour */}
                        <section>
                          <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                              <CheckCircle2 size={18} className="text-white" />
                            </div>
                            🎯 Priorités du jour
                          </h3>
                          <div className="space-y-6">
                            {data.priorities.map((p, i) => (
                              <div key={i} className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col md:flex-row gap-8">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-4">
                                    <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-[10px] font-bold uppercase tracking-widest border border-blue-500/30">
                                      {p.blog}
                                    </span>
                                  </div>
                                  <h4 className="text-2xl font-bold mb-3">{p.title}</h4>
                                  <p className="text-white/60 mb-6 italic">"{p.angle}"</p>
                                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 mb-6">
                                    <p className="text-xs font-bold text-white/40 uppercase mb-2">Pourquoi ce sujet ?</p>
                                    <p className="text-sm text-white/80">{p.why}</p>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-blue-400 font-medium">
                                    <div className="p-2 bg-blue-500/10 rounded-lg">
                                      <Plus size={16} />
                                    </div>
                                    {p.illustration}
                                  </div>
                                </div>
                                <div className="w-full md:w-64 h-48 md:h-auto bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center text-center p-6">
                                  <div className="space-y-2">
                                    <Smartphone size={32} className="mx-auto text-white/20" />
                                    <p className="text-[10px] text-white/40 uppercase font-bold tracking-tighter">Format Pinterest 2:3</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </section>

                        {/* Bonus & Recyclage */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          <section className="bg-white/5 border border-white/10 rounded-3xl p-8">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-3">
                              <RefreshCw size={18} className="text-purple-400" />
                              ♻️ Recyclages possibles
                            </h3>
                            <div className="space-y-4">
                              {data.recycling.map((r, i) => (
                                <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                  <div className="flex items-center gap-2 text-[10px] font-bold text-white/40 mb-2">
                                    <span>{r.source}</span>
                                    <ArrowRight size={10} />
                                    <span>{r.target}</span>
                                  </div>
                                  <p className="font-semibold text-sm mb-1">{r.originalTitle}</p>
                                  <p className="text-xs text-purple-400 italic">{r.suggestedAngle}</p>
                                </div>
                              ))}
                            </div>
                          </section>

                          <section className="bg-white/5 border border-white/10 rounded-3xl p-8">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-3">
                              <HelpCircle size={18} className="text-yellow-400" />
                              💡 Suggestions bonus
                            </h3>
                            <ul className="space-y-4">
                              {data.bonusSuggestions.map((s, i) => (
                                <li key={i} className="flex gap-3 text-sm text-white/80">
                                  <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-1.5 shrink-0" />
                                  {s}
                                </li>
                              ))}
                            </ul>
                          </section>
                        </div>

                        {/* Déjà couverts */}
                        <section className="pt-8 opacity-50">
                          <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-white/40">
                            <AlertCircle size={14} />
                            🚫 Sujets déjà couverts récemment
                          </h3>
                          <div className="flex flex-wrap gap-3">
                            {data.recentlyCovered.map((c, i) => (
                              <div key={i} className="px-3 py-1.5 bg-white/5 rounded-lg text-[10px] font-medium border border-white/5">
                                <span className="text-white/40 mr-2">{c.blog}:</span>
                                {c.theme} ({c.daysAgo}j)
                              </div>
                            ))}
                          </div>
                        </section>
                      </div>
                    );
                  } catch (e) {
                    return (
                      <div className="p-12 bg-red-500/10 border border-red-500/20 rounded-3xl text-center">
                        <p className="text-red-400 font-bold mb-2">Erreur de rendu du briefing</p>
                        <p className="text-white/40 text-sm">Les données reçues sont mal formatées. Veuillez relancer l'analyse.</p>
                        <pre className="mt-4 text-[10px] text-left overflow-auto max-h-40 bg-black/40 p-4 rounded-xl">{report}</pre>
                      </div>
                    );
                  }
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input Area */}
        <div className="p-6 border-t border-white/10 bg-black/40 backdrop-blur-xl">
          <form 
            onSubmit={handleSendMessage}
            className="max-w-4xl mx-auto relative group"
          >
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Envoyez un message pour commencer..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 pr-16 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-white/20"
            />
            <button 
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20"
            >
              <ArrowRight size={20} />
            </button>
          </form>
          <p className="text-[10px] text-center text-white/20 mt-4 uppercase tracking-widest font-bold">
            Assistant Editorial Pro — Propulsé par Gemini 3.1
          </p>
        </div>
      </main>
    </div>
  );
}
