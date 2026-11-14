import React, { useState } from 'react';
import { Download, Eye, Lock, Plus, Trash2 } from 'lucide-react';
import type { EncryptedVaultDoc } from '../types/ncet';
import { triggerFileDownload } from '../utils/export';

interface VaultViewProps {
  docs: EncryptedVaultDoc[];
  onAddDoc: (
    title: string,
    docType: EncryptedVaultDoc['docType'],
    rawContent: string
  ) => Promise<unknown>;
  onDecryptDoc: (doc: EncryptedVaultDoc) => Promise<string>;
  onDeleteDoc: (docId: string) => void;
}

const DOC_TYPES: EncryptedVaultDoc['docType'][] = [
  'Resume',
  'Transcript',
  'Offer Letter',
  'ID Verification',
  'Certificate',
];

export const VaultView: React.FC<VaultViewProps> = ({
  docs,
  onAddDoc,
  onDecryptDoc,
  onDeleteDoc,
}) => {
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState<EncryptedVaultDoc['docType']>('Resume');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [decryptedPreview, setDecryptedPreview] = useState<{
    id: string;
    title: string;
    text: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 150_000) {
      setErrorMsg('Please choose a text/markdown/JSON credential file under 150 KB.');
      return;
    }
    setErrorMsg(null);
    setTitle(file.name);
    const text = await file.text();
    setContent(text);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setErrorMsg('Document title and content are required.');
      return;
    }
    setErrorMsg(null);
    setSaving(true);
    try {
      await onAddDoc(title.trim(), docType, content.trim());
      setTitle('');
      setContent('');
    } finally {
      setSaving(false);
    }
  };

  const handleInspect = async (docItem: EncryptedVaultDoc) => {
    const text = await onDecryptDoc(docItem);
    setDecryptedPreview({ id: docItem.id, title: docItem.title, text });
  };

  const handleDownloadDecrypted = async (docItem: EncryptedVaultDoc) => {
    const text = await onDecryptDoc(docItem);
    triggerFileDownload(text, docItem.title.endsWith('.txt') ? docItem.title : `${docItem.title}.txt`, 'text/plain;charset=utf-8');
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Encrypted Document Vault
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Sensitive resumes, transcripts, and verification letters are encrypted client-side with AES-GCM 256 before cloud or offline storage.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 shrink-0">
            <Lock className="w-4 h-4" aria-hidden="true" />
            AES-GCM 256 Active
          </div>
        </div>

        <form onSubmit={(e) => void handleAdd(e)} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="vault-title"
                className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
              >
                Document Name
              </label>
              <input
                id="vault-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Semester_5_Grade_Card.txt"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label
                htmlFor="vault-type"
                className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
              >
                Document Category
              </label>
              <select
                id="vault-type"
                value={docType}
                onChange={(e) => setDocType(e.target.value as EncryptedVaultDoc['docType'])}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
              >
                {DOC_TYPES.map((dt) => (
                  <option key={dt} value={dt}>
                    {dt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="vault-file"
                className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
              >
                Load Text / Credential File (Optional)
              </label>
              <input
                id="vault-file"
                type="file"
                accept=".txt,.md,.json,.csv"
                onChange={(e) => void handleFileSelect(e)}
                className="w-full text-xs text-slate-600 dark:text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-200 dark:file:bg-slate-700 file:px-3 file:py-2 file:text-xs file:font-medium file:text-slate-800 dark:file:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="vault-content"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
            >
              Sensitive Credential Payload (Encrypted Before Sync)
            </label>
            <textarea
              id="vault-content"
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste transcript summary, USN verification, offer details, or resume text..."
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
            />
          </div>

          {errorMsg && (
            <p className="text-xs font-medium text-red-600 dark:text-red-400">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 text-xs font-semibold text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            {saving ? 'Encrypting...' : 'Encrypt & Store Document'}
          </button>
        </form>
      </div>

      {/* Stored Encrypted Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {docs.map((docItem) => (
          <article
            key={docItem.id}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between gap-4"
          >
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {docItem.docType} · <span className="font-mono tabular-nums">{docItem.sizeBytes} bytes</span> · {docItem.createdAt.slice(0, 10)}
              </div>
              <h2 className="mt-1 text-base font-semibold text-slate-900 dark:text-white">
                {docItem.title}
              </h2>
              <p className="mt-2 font-mono text-[11px] text-slate-400 break-all">
                IV {docItem.iv.slice(0, 14)}… · Cipher {docItem.ciphertext.slice(0, 48)}…
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => void handleInspect(docItem)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                Decrypt Preview
              </button>
              <button
                type="button"
                onClick={() => void handleDownloadDecrypted(docItem)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                Download
              </button>
              <button
                type="button"
                onClick={() => onDeleteDoc(docItem.id)}
                aria-label={`Delete '${docItem.title}'`}
                className="ml-auto inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>

      {decryptedPreview && (
        <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/40 p-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Decrypted Preview: {decryptedPreview.title}
            </h3>
            <button
              type="button"
              onClick={() => setDecryptedPreview(null)}
              className="text-xs font-medium text-blue-700 dark:text-blue-300 hover:underline"
            >
              Close Preview
            </button>
          </div>
          <pre className="mt-3 whitespace-pre-wrap text-xs font-mono text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
            {decryptedPreview.text}
          </pre>
        </div>
      )}
    </div>
  );
};
