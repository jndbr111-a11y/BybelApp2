import { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { translations } from './translations';

// Initialize AI
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

function App() {
  const [language, setLanguage] = useState<'af' | 'en'>('af');
  const t = translations[language];
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  async function analyzeText() {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = language === 'af' 
        ? `Jy is 'n teologiese assistent. Beantwoord hierdie vraag: ${input}`
        : `You are a theological assistant. Answer this question: ${input}`;
      
      const result = await model.generateContent(prompt);
      setResponse(result.response.text());
    } catch (error) {
      setResponse(language === 'af' ? "Fout met KI-verbinding." : "Error connecting to AI.");
    }
    setLoading(false);
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#f0fdf4', minHeight: '100vh' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ color: '#166534' }}>{t.title}</h1>
          <button onClick={() => setLanguage(language === 'af' ? 'en' : 'af')} style={{ padding: '8px', borderRadius: '20px', border: '1px solid #166534', cursor: 'pointer' }}>
            {language === 'af' ? 'Switch to English' : 'Skakel na Afrikaans'}
          </button>
        </div>
        <p style={{ color: '#666' }}>{t.subtitle}</p>
        <textarea 
          value={input} 
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.placeholder}
          style={{ width: '100%', height: '150px', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', marginBottom: '10px' }}
        />
        <button 
          onClick={analyzeText}
          disabled={loading}
          style={{ width: '100%', padding: '12px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {loading ? '...' : t.button}
        </button>
        {response && (
          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f9fafb', borderRadius: '4px', borderLeft: '4px solid #22c55e' }}>
            <p style={{ whiteSpace: 'pre-wrap' }}>{response}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
