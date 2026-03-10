import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { BookOpen, Loader2, Send, Copy, Mic, Square, History, ThumbsUp, ThumbsDown, Link, FileText, Download, ChevronLeft, ChevronRight, Search, ArrowUpDown, Sparkles, Pin, Trash2, Scissors, Upload, FileJson, Languages } from 'lucide-react';
import { translations } from './translations';

// Initialize AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

type HistoryItem = { id: string; input: string; response: string; timestamp: number; rating?: number };
type Note = { id: string; passage: string; content: string; timestamp: number; tags: string[] };

export default function App() {
  const [language, setLanguage] = useState<'af' | 'en'>('af');
  const t = translations[language];
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [activeModelName, setActiveModelName] = useState('Gemini 3.1 Pro');
  const [copied, setCopied] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [googleDocUrl, setGoogleDocUrl] = useState<string | null>(null);
  const [pinnedResponses, setPinnedResponses] = useState<HistoryItem[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [clips, setClips] = useState<{id: string, text: string, timestamp: number}[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [selectedTranslations, setSelectedTranslations] = useState<string[]>(['1933/1953', '1983']);
  const [historySearch, setHistorySearch] = useState('');
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');
  const [clipSearch, setClipSearch] = useState('');
  const [noteSearch, setNoteSearch] = useState('');
  const [clipStartDate, setClipStartDate] = useState('');
  const [clipEndDate, setClipEndDate] = useState('');
  const [historySort, setHistorySort] = useState<'newest' | 'oldest' | 'rating'>('newest');
  const [rating, setRating] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('bible-study-history');
    if (saved) setHistory(JSON.parse(saved));
    const savedPinned = localStorage.getItem('bible-study-pinned');
    if (savedPinned) setPinnedResponses(JSON.parse(savedPinned));
    const savedNotes = localStorage.getItem('bible-study-notes');
    if (savedNotes) setNotes(JSON.parse(savedNotes));
    const savedClips = localStorage.getItem('bible-study-clips');
    if (savedClips) setClips(JSON.parse(savedClips));
  }, []);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setActiveModelName('Gemini 3.1 Pro');
    setLoadingStatus('Besig om navraag te ontleed...');
    setResponse('');
    setRating(null);
    setFeedbackText('');
    
    try {
      setTimeout(() => setLoadingStatus('Raadpleeg teologiese raamwerke (Barth, MacArthur, Kuyper)...'), 1500);
      setTimeout(() => setLoadingStatus('Besig met grondtaal-analise...'), 3500);
      setTimeout(() => setLoadingStatus('Struktureer eksegetiese antwoord...'), 5500);

      const result = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: "Tree op as 'n hoogs opgeleide, akademiese teoloog en eksegeet. Ontleed die volgende teks of vraag in Afrikaans: \"" + input + "\". \n\nGebruik Karl Barth se eksegese as primêre raamwerk. Integreer ook insigte van John MacArthur en Abraham Kuyper as addisionele teologiese verwysings.\n\nStruktureer die antwoord in die volgende afdelings met Markdown-opskrifte:\n\n# A. Teks en Vertalings\n# B. Grondtaal-analise (Griekse/Hebreeuse Eksegese)\n# C. Historiese en Kulturele Agtergrond\n# D. Skrif-met-Skrif Vergelyking (Hermeneutiek)\n# E. Teologiese Besinning\n# F. Praktiese Toepassing en Prediking\n\nIdentifiseer sleutel teologiese terme en wrap hulle in die formaat `[term](term:verduideliking)`.\n\nVoeg voetnote by vir sleutelterme of konsepte. Gebruik die formaat [^1] in die teks en lys die voetnote aan die einde van die antwoord onder die opskrif '# Voetnote'. Verwys spesifiek na bybelvertalings of teologiese werke in hierdie voetnote.",
      });
      const text = result.text || "Geen antwoord ontvang nie.";
      setResponse(text);
      
      const newHistoryItem: HistoryItem = { id: Date.now().toString(), input, response: text, timestamp: Date.now(), rating: undefined };
      const newHistory = [newHistoryItem, ...history];
      setHistory(newHistory);
      setActiveHistoryId(newHistoryItem.id);
      localStorage.setItem('bible-study-history', JSON.stringify(newHistory));
    } catch (error) {
      console.error(error);
      setResponse("Kon nie die teks ontleed nie. Probeer asseblief weer.");
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setActiveModelName('Gemini 3.1 Pro');
    setLoadingStatus('Besig om teks te verwerk...');
    setResponse('');
    setRating(null);
    setFeedbackText('');
    
    try {
      setTimeout(() => setLoadingStatus('Identifiseer kernboodskap...'), 1000);
      setTimeout(() => setLoadingStatus('Formuleer teologiese opsomming...'), 2500);

      const result = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: "Tree op as 'n hoogs opgeleide, akademiese teoloog en eksegeet. Gee 'n bondige, kragtige opsomming van die volgende teks in Afrikaans: \"" + input + "\". \n\nFokus op die kernboodskap en die teologiese implikasies.\n\nIdentifiseer sleutel teologiese terme en wrap hulle in die formaat `[term](term:verduideliking)`.\n\nVoeg voetnote by vir sleutelterme of konsepte. Gebruik die formaat [^1] in die teks en lys die voetnote aan die einde van die antwoord onder die opskrif '# Voetnote'. Verwys spesifiek na bybelvertalings of teologiese werke in hierdie voetnote.",
      });
      const text = result.text || "Geen opsomming ontvang nie.";
      setResponse(text);
      
      const newHistoryItem: HistoryItem = { id: Date.now().toString(), input: "Opsomming: " + input.substring(0, 50) + "...", response: text, timestamp: Date.now(), rating: undefined };
      const newHistory = [newHistoryItem, ...history];
      setHistory(newHistory);
      setActiveHistoryId(newHistoryItem.id);
      localStorage.setItem('bible-study-history', JSON.stringify(newHistory));
    } catch (error) {
      console.error(error);
      setResponse("Kon nie die teks opsom nie. Probeer asseblief weer.");
    } finally {
      setLoading(false);
    }
  };

  const handleCrossReferences = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setActiveModelName('Gemini 3.1 Pro');
    setLoadingStatus('Soek na relevante Skrifgedeeltes...');
    setResponse('');
    setRating(null);
    setFeedbackText('');
    
    try {
      setTimeout(() => setLoadingStatus('Vergelyk temas en teologiese verbande...'), 1500);
      setTimeout(() => setLoadingStatus('Struktureer kruisverwysings...'), 3000);

      const result = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: "Tree op as 'n hoogs opgeleide, akademiese teoloog en eksegeet. Identifiseer en verduidelik relevante Skrif-kruisverwysings vir die volgende teks in Afrikaans: \"" + input + "\".\n\nFokus op:\n1. Direkte aanhalings of toespelings.\n2. Tematiese ooreenkomste.\n3. Teologiese verbande.\n\nIdentifiseer sleutel teologiese terme en wrap hulle in die formaat `[term](term:verduideliking)`.\n\nVoeg voetnote by vir sleutelterme of konsepte. Gebruik die formaat [^1] in die teks en lys die voetnote aan die einde van die antwoord onder die opskrif '# Voetnote'. Verwys spesifiek na bybelvertalings of teologiese werke in hierdie voetnote.\n\nGebruik die volgende bybelvertalings vir kruisverwysings: " + selectedTranslations.join(', ') + ".\n\nStruktureer die antwoord duidelik met die teksverwysing en 'n kort verduideliking van die verband.",
      });
      const text = result.text || "Geen kruisverwysings gevind nie.";
      setResponse(text);
      
      const newHistoryItem: HistoryItem = { id: Date.now().toString(), input: "Kruisverwysings: " + input.substring(0, 50) + "...", response: text, timestamp: Date.now(), rating: undefined };
      const newHistory = [newHistoryItem, ...history];
      setHistory(newHistory);
      setActiveHistoryId(newHistoryItem.id);
      localStorage.setItem('bible-study-history', JSON.stringify(newHistory));
    } catch (error) {
      console.error(error);
      setResponse("Kon nie kruisverwysings vind nie. Probeer asseblief weer.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToDocs = async () => {
    if (!response) return;
    
    try {
      // 1. Get Auth URL
      const origin = window.location.origin;
      const authUrlRes = await fetch("/api/auth/google/url?origin=" + encodeURIComponent(origin));
      const { url } = await authUrlRes.json();
      
      if (!url) {
        alert('Kon nie met Google verbind nie. Maak seker die API sleutels is gestel.');
        return;
      }

      // 2. Open Popup
      const width = 500;
      const height = 600;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const popup = window.open(
        url,
        'google_auth',
        'width=' + width + ',height=' + height + ',top=' + top + ',left=' + left
      );

      if (!popup) {
        alert('Laat asseblief opspring-vensters toe om met Google te verbind.');
        return;
      }

      // 3. Listen for success
      const handleMessage = async (event: MessageEvent) => {
        if (event.origin !== origin) return;
        
        if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
          popup.close();
          window.removeEventListener('message', handleMessage);
          
          const tokens = event.data.tokens;
          
          // 4. Save Doc
          setLoading(true);
          try {
            const saveRes = await fetch('/api/save-doc', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                content: response,
                tokens,
                title: "Bybelstudie: " + input.substring(0, 30) + "..."
              })
            });
            
            const saveData = await saveRes.json();
            
            if (saveData.success) {
              alert('Suksesvol gestoor in Google Docs!');
              window.open(saveData.url, '_blank');
            } else {
              alert('Kon nie dokument stoor nie.');
            }
          } catch (err) {
            console.error(err);
            alert('Fout tydens stoor.');
          } finally {
            setLoading(false);
          }
        }
      };

      window.addEventListener('message', handleMessage);

    } catch (error) {
      console.error(error);
      alert('Kon nie die proses begin nie.');
    }
  };

  const handleDownloadText = () => {
    if (!response) return;
    const element = document.createElement("a");
    const file = new Blob([response], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "bybelstudie-" + new Date().toISOString().split('T')[0] + ".txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const filteredHistory = history
    .filter(item => {
      const matchesSearch = item.input.toLowerCase().includes(historySearch.toLowerCase()) || 
                            item.response.toLowerCase().includes(historySearch.toLowerCase());
      const matchesDate = (!historyStartDate || item.timestamp >= new Date(historyStartDate).getTime()) &&
                          (!historyEndDate || item.timestamp <= new Date(historyEndDate).getTime() + 86400000);
      return matchesSearch && matchesDate;
    })
    .sort((a, b) => {
      if (historySort === 'newest') return b.timestamp - a.timestamp;
      if (historySort === 'oldest') return a.timestamp - b.timestamp;
      if (historySort === 'rating') {
        const ratingA = a.rating || 0;
        const ratingB = b.rating || 0;
        return ratingB - ratingA;
      }
      return 0;
    });

  const handleClipSelection = () => {
    const selection = window.getSelection()?.toString();
    if (!selection || selection.trim().length === 0) {
      showToast("Kies asseblief eers teks om te knip");
      return;
    }
    const newClip = { id: Date.now().toString(), text: selection, timestamp: Date.now() };
    const newClips = [newClip, ...clips];
    setClips(newClips);
    localStorage.setItem('bible-study-clips', JSON.stringify(newClips));
    showToast("Teks geknip!");
  };

  const handleUnclip = (id: string) => {
    const newClips = clips.filter(c => c.id !== id);
    setClips(newClips);
    localStorage.setItem('bible-study-clips', JSON.stringify(newClips));
    showToast("Teks verwyder uit knipsels");
  };

  const handleExport = () => {
    const data = { history, pinnedResponses, clips };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "bible-study-data-" + new Date().toISOString().slice(0,10) + ".json";
    a.click();
    URL.revokeObjectURL(url);
    showToast("Data uitgevoer!");
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.history) { setHistory(data.history); localStorage.setItem('bible-study-history', JSON.stringify(data.history)); }
        if (data.pinnedResponses) { setPinnedResponses(data.pinnedResponses); localStorage.setItem('bible-study-pinned', JSON.stringify(data.pinnedResponses)); }
        if (data.clips) { setClips(data.clips); localStorage.setItem('bible-study-clips', JSON.stringify(data.clips)); }
        showToast("Data suksesvol ingevoer!");
      } catch (err) {
        showToast("Fout met invoer van data");
      }
    };
    reader.readAsText(file);
  };

  const handlePinResponse = () => {
    if (!response || !activeHistoryId) return;
    const currentItem = history.find(item => item.id === activeHistoryId);
    if (currentItem && !pinnedResponses.find(p => p.id === currentItem.id)) {
      const newPinned = [currentItem, ...pinnedResponses];
      setPinnedResponses(newPinned);
      localStorage.setItem('bible-study-pinned', JSON.stringify(newPinned));
      showToast("Gespeld na Vinnige Verwysing");
    }
  };

  const handleUnpinResponse = (id: string) => {
    const newPinned = pinnedResponses.filter(p => p.id !== id);
    setPinnedResponses(newPinned);
    localStorage.setItem('bible-study-pinned', JSON.stringify(newPinned));
    showToast("Verwyder uit Vinnige Verwysing");
  };

  const navigateHistory = (direction: 'prev' | 'next') => {
    if (!activeHistoryId || history.length === 0) return;
    
    const currentIndex = history.findIndex(item => item.id === activeHistoryId);
    if (currentIndex === -1) return;
    
    let newIndex = direction === 'prev' ? currentIndex + 1 : currentIndex - 1;
    
    // Bounds check
    if (newIndex < 0 || newIndex >= history.length) return;
    
    const newItem = history[newIndex];
    setInput(newItem.input);
    setResponse(newItem.response);
    setRating(newItem.rating || null);
    setActiveHistoryId(newItem.id);
  };

  const handleRating = (newRating: number) => {
    setRating(newRating);
    // Update history item if it matches current response
    const updatedHistory = history.map(item => {
      if (item.response === response) {
        return { ...item, rating: newRating };
      }
      return item;
    });
    setHistory(updatedHistory);
    localStorage.setItem('bible-study-history', JSON.stringify(updatedHistory));
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];
    setTranscribedText('');

    mediaRecorder.ondataavailable = (event) => {
      audioChunksRef.current.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        setIsTranscribing(true);
        try {
          const result = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: {
              parts: [
                {
                  inlineData: {
                    mimeType: "audio/webm",
                    data: base64Audio,
                  },
                },
                { text: "Transcribe this audio accurately to Afrikaans. Only return the transcribed text." },
              ],
            },
          });
          const text = result.text || "";
          setTranscribedText(text);
          setInput(prev => prev + (prev ? " " : "") + text);
        } catch (error) {
          console.error(error);
          alert("Kon nie transkribeer nie.");
        } finally {
          setIsTranscribing(false);
        }
      };
    };

    mediaRecorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 md:p-12">
      <header className="mb-10 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-3 text-emerald-400">
            <BookOpen className="w-10 h-10" /> {t.title}
          </h1>
          <p className="text-zinc-400 mt-2 text-lg">{t.subtitle}</p>
        </div>
        <button
          onClick={() => setLanguage(language === 'af' ? 'en' : 'af')}
          className="flex items-center gap-2 bg-zinc-800 text-zinc-300 px-4 py-2 rounded-full hover:bg-zinc-700 transition"
        >
          <Languages className="w-5 h-5" />
          {language === 'af' ? 'English' : 'Afrikaans'}
        </button>
      </header>

      <main className="max-w-4xl mx-auto space-y-8">
        <div className="bg-zinc-900/50 p-8 rounded-3xl shadow-2xl border border-zinc-800 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-3">
            <label className="block text-sm font-medium text-zinc-300">
              {t.inputLabel}
            </label>
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={"p-2 rounded-full transition " + (isRecording ? 'bg-red-600 text-white animate-pulse' : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600')}
              title={isRecording ? 'Stop Opname' : 'Stem na Teks'}
            >
              {isRecording ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          </div>
          {isRecording && (
            <div className="flex items-center gap-2 mb-2 p-2 bg-zinc-950 rounded-xl border border-emerald-500/30">
              <span className="text-xs text-emerald-400 font-medium">Besig om op te neem...</span>
              <div className="flex items-center gap-0.5">
                <div className="w-1 h-4 bg-emerald-500 animate-pulse"></div>
                <div className="w-1 h-6 bg-emerald-500 animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-1 h-3 bg-emerald-500 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1 h-5 bg-emerald-500 animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                <div className="w-1 h-2 bg-emerald-500 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full h-48 bg-zinc-950 border border-zinc-700 rounded-2xl p-5 text-zinc-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:outline-none transition-all"
            placeholder={t.placeholder}
          />
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-zinc-300 mb-2">Kies Bybelvertalings vir kruisverwysings:</label>
            <div className="flex flex-wrap gap-2">
              {['1933/1953', '1983', '2020', 'NIV', 'ESV'].map(t => (
                <button
                  key={t}
                  onClick={() => setSelectedTranslations(prev => prev.includes(t) ? prev.filter(p => p !== t) : [...prev, t])}
                  className={"px-3 py-1 rounded-full text-xs font-medium transition " + (selectedTranslations.includes(t) ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700')}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          
          {isTranscribing && (
            <div className="mt-2 flex items-center gap-2 text-emerald-400 text-sm">
              <Loader2 className="animate-spin w-4 h-4" />
              Besig om spraak te verwerk...
            </div>
          )}
          
          {transcribedText && !isTranscribing && (
            <div className="mt-2 p-3 bg-zinc-950 border border-zinc-700 rounded-xl text-zinc-300 text-sm flex items-center gap-2">
              <span className="font-semibold text-emerald-500 flex items-center gap-1">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                Getranskribeer:
              </span> 
              {transcribedText}
            </div>
          )}
            <div className="flex flex-col gap-3 mt-4">
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition disabled:opacity-50 shadow-lg shadow-emerald-900/20"
            >
              {loading ? <Loader2 className="animate-spin w-6 h-6" /> : <Send className="w-6 h-6" />}
              {t.analyzeButton}
            </button>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <button
                onClick={handleSummarize}
                disabled={loading}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50 border border-zinc-700 hover:border-zinc-600"
              >
                {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                {t.summarizeButton}
              </button>
              <button
                onClick={handleCrossReferences}
                disabled={loading}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50 border border-zinc-700 hover:border-zinc-600"
              >
                {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Link className="w-4 h-4" />}
                {t.crossReferencesButton}
              </button>
              {response && (
                <>
                  <button
                    onClick={handleSaveToDocs}
                    disabled={loading}
                    className="bg-zinc-800 hover:bg-zinc-700 text-orange-400 font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50 border border-zinc-700 hover:border-orange-900/50"
                  >
                    <FileText className="w-4 h-4" />
                    {t.saveToDocsButton}
                  </button>
                  {googleDocUrl && (
                    <button
                      onClick={() => window.open(googleDocUrl, '_blank')}
                      className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition border border-orange-500"
                    >
                      <FileText className="w-4 h-4" />
                      {t.openDocButton}
                    </button>
                  )}
                  <button
                    onClick={handleDownloadText}
                    disabled={loading}
                    className="bg-zinc-800 hover:bg-zinc-700 text-emerald-400 font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50 border border-zinc-700 hover:border-emerald-900/50"
                  >
                    <Download className="w-4 h-4" />
                    {t.downloadTextButton}
                  </button>
                </>
              )}
            </div>
          </div>

        </div>

        {loading && !isTranscribing && (
          <div className="mt-12 p-10 bg-zinc-900/30 rounded-3xl border border-zinc-800/50 backdrop-blur-sm flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full animate-pulse" />
              <div className="relative bg-zinc-900 p-6 rounded-2xl border border-zinc-700 shadow-2xl">
                <Sparkles className="w-12 h-12 text-emerald-500 animate-pulse" />
              </div>
              <div className="absolute -top-2 -right-2">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
              </div>
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-zinc-100 flex items-center justify-center gap-2">
                {activeModelName} <span className="text-xs bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full border border-emerald-500/20">Aktief</span>
              </h3>
              <p className="text-zinc-400 font-medium animate-pulse min-h-[1.5rem]">
                {loadingStatus}
              </p>
            </div>

            <div className="w-64 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 animate-progress origin-left" />
            </div>
          </div>
        )}

        {response && !loading && (
          <div className="mt-10 bg-zinc-900 p-8 rounded-2xl border border-zinc-800 prose prose-invert max-w-none relative">
            
            {/* History Navigation */}
            {history.length > 1 && activeHistoryId && (
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-zinc-800">
                <button 
                  onClick={() => navigateHistory('prev')}
                  disabled={history.findIndex(item => item.id === activeHistoryId) >= history.length - 1}
                  className="flex items-center gap-2 text-sm text-zinc-400 hover:text-emerald-400 disabled:opacity-30 disabled:hover:text-zinc-400 transition"
                >
                  <ChevronLeft className="w-4 h-4" /> Vorige
                </button>
                <span className="text-xs text-zinc-600 font-mono">
                  {history.length - history.findIndex(item => item.id === activeHistoryId)} / {history.length}
                </span>
                <button 
                  onClick={() => navigateHistory('next')}
                  disabled={history.findIndex(item => item.id === activeHistoryId) <= 0}
                  className="flex items-center gap-2 text-sm text-zinc-400 hover:text-emerald-400 disabled:opacity-30 disabled:hover:text-zinc-400 transition"
                >
                  Volgende <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="absolute top-4 right-4 flex items-center gap-2">
              <button
                onClick={handleClipSelection}
                className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-emerald-400 transition"
                title="Knip geselekteerde teks"
              >
                <Scissors className="w-4 h-4" />
              </button>
              <button
                onClick={handlePinResponse}
                className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-emerald-400 transition"
                title="Speld vas vir vinnige verwysing"
              >
                <Pin className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleCopy(response)}
                className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-emerald-400 transition"
                title="Kopieer na knipbord"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  const noteContent = prompt("Voer jou nota in:");
                  if (noteContent) {
                    const newNote: Note = {
                      id: Date.now().toString(),
                      passage: input,
                      content: noteContent,
                      timestamp: Date.now(),
                      tags: []
                    };
                    const updatedNotes = [...notes, newNote];
                    setNotes(updatedNotes);
                    localStorage.setItem('bible-study-notes', JSON.stringify(updatedNotes));
                    showToast("Nota gestoor!");
                  }
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-emerald-400 transition"
                title="Voeg nota by"
              >
                <FileText className="w-4 h-4" />
              </button>
            </div>
            {copied && <span className="absolute top-4 right-28 text-emerald-400 text-sm">Gekopieer!</span>}
            <ReactMarkdown
              components={{
                a: ({ node, href, children, ...props }) => {
                  if (href?.startsWith('term:')) {
                    return (
                      <span className="group relative cursor-help text-emerald-400 border-b border-dotted border-emerald-500">
                        {children}
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-zinc-800 text-zinc-200 text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                          {href.substring(5)}
                        </span>
                      </span>
                    );
                  }
                  return <a href={href} className="text-emerald-400 hover:underline" target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
                }
              }}
            >
              {response}
            </ReactMarkdown>
            
            <div className="mt-8 pt-6 border-t border-zinc-800">
              <p className="text-sm font-medium text-zinc-400 mb-3">Hoe was hierdie ontleding?</p>
              <div className="flex items-center gap-4 mb-4">
                <button 
                  onClick={() => handleRating(1)} 
                  className={"flex items-center gap-2 px-4 py-2 rounded-full transition " + (rating === 1 ? 'bg-emerald-900 text-emerald-400 ring-1 ring-emerald-500' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700')}
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span className="text-sm font-medium">Nuttig</span>
                </button>
                <button 
                  onClick={() => handleRating(-1)} 
                  className={"flex items-center gap-2 px-4 py-2 rounded-full transition " + (rating === -1 ? 'bg-red-900 text-red-400 ring-1 ring-red-500' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700')}
                >
                  <ThumbsDown className="w-4 h-4" />
                  <span className="text-sm font-medium">Nie Nuttig</span>
                </button>
              </div>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-zinc-100 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                placeholder="Gee asseblief enige addisionele terugvoer..."
              />
              <button 
                onClick={() => {
                  console.log('Feedback submitted:', { rating, feedbackText });
                  alert('Dankie vir jou terugvoer!');
                  setFeedbackText('');
                }}
                className="mt-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm py-2 px-4 rounded-lg transition"
              >
                Dien terugvoer in
              </button>

              <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-zinc-800">
                <button
                  onClick={handleSaveToDocs}
                  disabled={loading}
                  className="bg-zinc-800 hover:bg-zinc-700 text-orange-400 font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition disabled:opacity-50 border border-zinc-700 hover:border-orange-900/50 text-sm"
                >
                  <FileText className="w-4 h-4" />
                  Stoor in Docs
                </button>
                <button
                  onClick={handleDownloadText}
                  disabled={loading}
                  className="bg-zinc-800 hover:bg-zinc-700 text-emerald-400 font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition disabled:opacity-50 border border-zinc-700 hover:border-emerald-900/50 text-sm"
                >
                  <Download className="w-4 h-4" />
                  Laai af as Teks
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Vinnige Verwysing */}
        {(pinnedResponses.length > 0 || clips.length > 0) && (
          <section className="bg-zinc-900/30 p-8 rounded-3xl border border-emerald-500/20">
            <h2 className="text-2xl font-bold flex items-center gap-3 text-zinc-100 mb-6">
              <Pin className="w-6 h-6 text-emerald-500" /> Vinnige Verwysing
            </h2>
            
            {pinnedResponses.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-zinc-300 mb-4">Gespelde Antwoorde</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pinnedResponses.map(item => (
                    <div key={item.id} className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 flex justify-between items-center group hover:border-emerald-500/50 transition cursor-pointer" onClick={() => {
                      setInput(item.input);
                      setResponse(item.response);
                      setActiveHistoryId(item.id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}>
                      <p className="text-sm font-medium text-zinc-300 truncate flex-1 group-hover:text-emerald-400 transition">{item.input}</p>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleUnpinResponse(item.id); }}
                        className="text-zinc-500 hover:text-red-400 transition ml-2"
                        title="Verwyder uit vinnige verwysing"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {clips.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-zinc-300">Geknipte Teks</h3>
                  <div className="flex items-center gap-2">
                    <div className="relative w-48">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-zinc-500" />
                      <input
                        type="text"
                        placeholder="Soek..."
                        value={clipSearch}
                        onChange={(e) => setClipSearch(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-1 pl-7 pr-2 text-xs text-zinc-200 focus:ring-1 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <input type="date" value={clipStartDate} onChange={(e) => setClipStartDate(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded-lg py-1 px-2 text-[10px] text-zinc-400 focus:ring-1 focus:ring-emerald-500 outline-none" />
                      <span className="text-zinc-500 text-[10px]">-</span>
                      <input type="date" value={clipEndDate} onChange={(e) => setClipEndDate(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded-lg py-1 px-2 text-[10px] text-zinc-400 focus:ring-1 focus:ring-emerald-500 outline-none" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {clips.filter(c => {
                    const matchesSearch = c.text.toLowerCase().includes(clipSearch.toLowerCase());
                    const matchesDate = (!clipStartDate || c.timestamp >= new Date(clipStartDate).getTime()) &&
                                        (!clipEndDate || c.timestamp <= new Date(clipEndDate).getTime() + 86400000);
                    return matchesSearch && matchesDate;
                  }).map(clip => (
                    <div key={clip.id} className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 flex justify-between items-start group hover:border-emerald-500/50 transition">
                      <p className="text-sm text-zinc-300 flex-1 group-hover:text-emerald-400 transition">{clip.text}</p>
                      <button 
                        onClick={() => handleUnclip(clip.id)}
                        className="text-zinc-500 hover:text-red-400 transition ml-2"
                        title="Verwyder knipsel"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {notes.length > 0 && (
              <div className="mt-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-zinc-300">Notas</h3>
                  <div className="relative w-48">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Soek notas..."
                      value={noteSearch}
                      onChange={(e) => setNoteSearch(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-1 pl-7 pr-2 text-xs text-zinc-200 focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {notes.filter(n => n.content.toLowerCase().includes(noteSearch.toLowerCase()) || n.passage.toLowerCase().includes(noteSearch.toLowerCase())).map(note => (
                    <div key={note.id} className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 flex justify-between items-start group hover:border-emerald-500/50 transition">
                      <div>
                        <p className="text-xs text-zinc-500 mb-1">{note.passage}</p>
                        <p className="text-sm text-zinc-300">{note.content}</p>
                      </div>
                      <button 
                        onClick={() => {
                          const updatedNotes = notes.filter(n => n.id !== note.id);
                          setNotes(updatedNotes);
                          localStorage.setItem('bible-study-notes', JSON.stringify(updatedNotes));
                        }}
                        className="text-zinc-500 hover:text-red-400 transition ml-2"
                        title="Verwyder nota"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        <section className="bg-zinc-900/50 p-8 rounded-3xl shadow-lg border border-zinc-800">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <h2 className="text-2xl font-bold flex items-center gap-3 text-zinc-100">
              <History className="w-6 h-6 text-emerald-500" /> Geskiedenis
            </h2>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <button onClick={handleExport} className="flex items-center gap-2 text-xs text-zinc-400 hover:text-emerald-400 transition">
                <FileJson className="w-4 h-4" /> Uitvoer
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 text-xs text-zinc-400 hover:text-emerald-400 transition">
                <Upload className="w-4 h-4" /> Invoer
              </button>
              <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />

              <div className="relative w-full sm:w-48">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Soek..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-sm text-zinc-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <input type="date" value={historyStartDate} onChange={(e) => setHistoryStartDate(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-400 focus:ring-2 focus:ring-emerald-500 outline-none" />
                <span className="text-zinc-500">-</span>
                <input type="date" value={historyEndDate} onChange={(e) => setHistoryEndDate(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-400 focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-auto">
                  <ArrowUpDown className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                  <select
                    value={historySort}
                    onChange={(e) => setHistorySort(e.target.value as any)}
                    className="w-full sm:w-auto bg-zinc-950 border border-zinc-800 rounded-xl py-2 pl-10 pr-8 text-sm text-zinc-200 focus:ring-2 focus:ring-emerald-500 outline-none appearance-none cursor-pointer transition-all"
                  >
                    <option value="newest">Nuutste eers</option>
                    <option value="oldest">Oudste eers</option>
                    <option value="rating">Beste gradering</option>
                  </select>
                </div>
                
                {history.length > 0 && (
                  <button 
                    onClick={() => { 
                      if(confirm('Is u seker u wil die hele geskiedenis uitvee?')) {
                        setHistory([]); 
                        localStorage.removeItem('bible-study-history'); 
                      }
                    }}
                    className="text-sm text-red-400 hover:text-red-300 transition font-medium px-2"
                  >
                    Maak skoon
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {filteredHistory.length > 0 ? (
              filteredHistory.map(item => (
                <div 
                  key={item.id} 
                  className={"p-4 rounded-xl border transition-all cursor-pointer group " + (activeHistoryId === item.id ? 'bg-zinc-800 border-emerald-500 shadow-lg shadow-emerald-900/10' : 'bg-zinc-950 border-zinc-800 hover:border-emerald-500/50')}
                  onClick={() => { 
                    setInput(item.input); 
                    setResponse(item.response); 
                    setRating(item.rating || null);
                    setActiveHistoryId(item.id);
                    showToast("Vorige navraag gelaai");
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <div className="flex justify-between items-start">
                    <p className="text-md font-medium text-zinc-200 group-hover:text-emerald-400 transition truncate flex-1">{item.input}</p>
                    {item.rating === 1 && <ThumbsUp className="w-4 h-4 text-emerald-500 ml-2" />}
                    {item.rating === -1 && <ThumbsDown className="w-4 h-4 text-red-500 ml-2" />}
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">{new Date(item.timestamp).toLocaleString()}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-zinc-500 italic">
                {historySearch ? 'Geen resultate gevind vir u soektog nie.' : 'Geen geskiedenis beskikbaar nie.'}
              </div>
            )}
          </div>
        </section>
      </main>

      {toastMessage && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-zinc-800 text-emerald-400 px-6 py-3 rounded-full shadow-2xl border border-zinc-700 flex items-center gap-2 z-50 animate-bounce">
          <History className="w-4 h-4" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
