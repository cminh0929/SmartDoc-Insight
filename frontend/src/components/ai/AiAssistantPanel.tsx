'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

interface Source {
  documentId: string;
  title: string;
  similarity: number;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
}

interface AskResponse {
  answer: string;
  sources: Source[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.1.206:3001';

async function askAI(question: string): Promise<AskResponse> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const res = await fetch(`${API_BASE_URL}/rag/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) throw new Error('AI request failed');
  return res.json();
}

export default function AiAssistantPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async () => {
    const question = input.trim();
    if (!question || loading) return;

    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setInput('');
    setLoading(true);

    try {
      const res = await askAI(question);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: res.answer, sources: res.sources },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '❌ Không thể kết nối đến AI. Vui lòng thử lại sau.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        title="Hỏi AI Trợ Lý"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '22px',
          boxShadow: '0 4px 20px rgba(99,102,241,0.5)',
          zIndex: 1000,
          transition: 'transform 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        💡
      </button>

      {/* Sliding Panel */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            right: 0,
            top: 0,
            bottom: 0,
            width: '420px',
            background: '#0f0f1a',
            borderLeft: '1px solid rgba(99,102,241,0.3)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 999,
            boxShadow: '-8px 0 40px rgba(0,0,0,0.6)',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid rgba(99,102,241,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '22px' }}>🤖</span>
              <div>
                <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '15px' }}>
                  AI Trợ Lý IT
                </div>
                <div style={{ color: '#6366f1', fontSize: '12px' }}>
                  Hỏi về tài liệu nội bộ
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '18px',
                padding: '4px',
              }}
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {messages.length === 0 && (
              <div
                style={{
                  color: '#475569',
                  textAlign: 'center',
                  marginTop: '40px',
                  fontSize: '14px',
                  lineHeight: 1.6,
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>💬</div>
                Hỏi AI bất kỳ điều gì về tài liệu kỹ thuật,
                <br />
                quy trình IT, hoặc hướng dẫn xử lý sự cố.
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div
                  style={{
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '90%',
                    background:
                      msg.role === 'user'
                        ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                        : 'rgba(30,32,60,0.8)',
                    border: msg.role === 'assistant' ? '1px solid rgba(99,102,241,0.2)' : 'none',
                    borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    padding: '10px 14px',
                    color: '#e2e8f0',
                    fontSize: '14px',
                    lineHeight: 1.6,
                  }}
                >
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p style={{ margin: '4px 0' }}>{children}</p>,
                      ul: ({ children }) => <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>{children}</ul>,
                      li: ({ children }) => <li style={{ margin: '2px 0' }}>{children}</li>,
                      strong: ({ children }) => <strong style={{ color: '#a5b4fc' }}>{children}</strong>,
                      code: ({ children }) => (
                        <code style={{ background: 'rgba(99,102,241,0.2)', borderRadius: '4px', padding: '2px 5px', fontSize: '12px' }}>
                          {children}
                        </code>
                      ),
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>

                {/* Source Citations */}
                {msg.sources && msg.sources.length > 0 && (
                  <div
                    style={{
                      alignSelf: 'flex-start',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px',
                      paddingLeft: '4px',
                    }}
                  >
                    {msg.sources.map((s) => (
                      <span
                        key={s.documentId}
                        title={`Độ tương đồng: ${(s.similarity * 100).toFixed(0)}%`}
                        style={{
                          background: 'rgba(99,102,241,0.15)',
                          border: '1px solid rgba(99,102,241,0.3)',
                          borderRadius: '999px',
                          padding: '3px 10px',
                          fontSize: '12px',
                          color: '#818cf8',
                          cursor: 'default',
                        }}
                      >
                        📄 {s.title}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Loading skeleton */}
            {loading && (
              <div style={{ alignSelf: 'flex-start', maxWidth: '80%' }}>
                <div
                  style={{
                    background: 'rgba(30,32,60,0.8)',
                    border: '1px solid rgba(99,102,241,0.2)',
                    borderRadius: '18px 18px 18px 4px',
                    padding: '12px 16px',
                    display: 'flex',
                    gap: '6px',
                    alignItems: 'center',
                  }}
                >
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#6366f1',
                        animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: '12px 16px',
              borderTop: '1px solid rgba(99,102,241,0.2)',
              display: 'flex',
              gap: '10px',
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Hỏi về tài liệu kỹ thuật..."
              disabled={loading}
              style={{
                flex: 1,
                background: 'rgba(30,32,60,0.8)',
                border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: '12px',
                padding: '10px 14px',
                color: '#e2e8f0',
                fontSize: '14px',
                outline: 'none',
              }}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              style={{
                background: loading || !input.trim()
                  ? 'rgba(99,102,241,0.3)'
                  : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                border: 'none',
                borderRadius: '12px',
                padding: '10px 16px',
                color: '#fff',
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                transition: 'all 0.2s',
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
}
