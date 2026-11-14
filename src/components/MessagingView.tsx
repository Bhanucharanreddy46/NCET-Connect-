import React, { useEffect, useState } from 'react';
import { Lock, Send, ShieldCheck } from 'lucide-react';
import { CONTACT_THREADS } from '../data/seedData';
import type { ContactThread, DirectMessage } from '../types/ncet';

interface MessagingViewProps {
  currentUserId: string;
  messages: DirectMessage[];
  onSendMessage: (threadId: string, recipientId: string, plaintext: string) => Promise<unknown>;
  onDecryptMessage: (msg: DirectMessage) => Promise<string>;
}

export const MessagingView: React.FC<MessagingViewProps> = ({
  currentUserId,
  messages,
  onSendMessage,
  onDecryptMessage,
}) => {
  const [selectedThread, setSelectedThread] = useState<ContactThread>(CONTACT_THREADS[0]);
  const [draft, setDraft] = useState('');
  const [decryptedMap, setDecryptedMap] = useState<Record<string, string>>({});
  const [showCiphertext, setShowCiphertext] = useState(false);
  const [sending, setSending] = useState(false);

  const threadMessages = messages.filter((m) => m.threadId === selectedThread.threadId);

  useEffect(() => {
    let active = true;
    async function decryptAll() {
      const next: Record<string, string> = {};
      for (const m of threadMessages) {
        try {
          next[m.id] = await onDecryptMessage(m);
        } catch {
          next[m.id] = '[Unable to decrypt with current session key]';
        }
      }
      if (active) setDecryptedMap(next);
    }
    void decryptAll();
    return () => {
      active = false;
    };
  }, [messages, selectedThread.threadId, onDecryptMessage, threadMessages.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setSending(true);
    try {
      await onSendMessage(selectedThread.threadId, selectedThread.peerId, text);
      setDraft('');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[560px]">
      {/* Thread Roster */}
      <aside className="lg:col-span-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h1 className="text-base font-bold text-slate-900 dark:text-white">
            Direct Recruiter & Club Messages
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            End-to-end encrypted with Web Crypto AES-GCM 256
          </p>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {CONTACT_THREADS.map((thread) => {
            const active = thread.threadId === selectedThread.threadId;
            return (
              <button
                key={thread.threadId}
                type="button"
                onClick={() => setSelectedThread(thread)}
                className={`w-full text-left p-4 flex items-center gap-3 transition-colors ${
                  active
                    ? 'bg-blue-50/70 dark:bg-blue-950/40'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                {thread.avatarUrl ? (
                  <img
                    src={thread.avatarUrl}
                    alt={thread.peerName}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-700 dark:text-slate-200 shrink-0">
                    {thread.peerName
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {thread.peerName}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {thread.peerRole} · {thread.peerOrg}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Active Conversation */}
      <section className="lg:col-span-8 flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              {selectedThread.peerName}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {selectedThread.peerOrg} · {selectedThread.peerRole}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowCiphertext((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            {showCiphertext ? 'Show Decrypted Text' : 'Inspect E2EE Ciphertext'}
          </button>
        </div>

        <div className="flex-1 p-5 space-y-4 overflow-y-auto max-h-[400px] bg-slate-50/50 dark:bg-slate-950/30">
          {threadMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-10">
              <Lock className="w-6 h-6 text-slate-400 mb-2" aria-hidden="true" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Encrypted Channel Ready
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                Messages with {selectedThread.peerName} are encrypted client-side before sync.
              </p>
            </div>
          ) : (
            threadMessages.map((msg) => {
              const isMine = msg.senderId === currentUserId;
              const bodyText = showCiphertext
                ? `[${msg.algorithm}] IV:${msg.iv.slice(0, 12)}… | ${msg.ciphertext.slice(0, 72)}…`
                : decryptedMap[msg.id] || 'Decrypting…';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                    {msg.senderName} · {msg.createdAt.slice(11, 16)}
                  </div>
                  <div
                    className={`max-w-lg rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                      isMine
                        ? 'bg-blue-600 text-white'
                        : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                    } ${showCiphertext ? 'font-mono text-xs break-all' : ''}`}
                  >
                    {bodyText}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3"
        >
          <label htmlFor="e2ee-message-input" className="sr-only">
            Write an encrypted message
          </label>
          <input
            id="e2ee-message-input"
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`Message ${selectedThread.peerName} (AES-GCM encrypted)...`}
            className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2.5 text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0"
          >
            <Send className="w-3.5 h-3.5" aria-hidden="true" />
            Send Encrypted
          </button>
        </form>
      </section>
    </div>
  );
};
