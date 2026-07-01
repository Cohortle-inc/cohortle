'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CollectionLink,
  getCollectionLink,
  createCollectionLink,
  updateCollectionLink,
  revokeCollectionLink,
  regenerateCollectionLink,
} from '@/lib/api/convener';

interface Props {
  cohortId: number;
}

type Status = 'active' | 'expired' | 'revoked' | 'none';

function getStatus(link: CollectionLink | null): Status {
  if (!link) return 'none';
  if (link.revoked_at || link.revokedAt) return 'revoked';
  const exp = link.expires_at || link.expiresAt;
  if (exp && new Date(exp) < new Date()) return 'expired';
  return 'active';
}

const STATUS_BADGE: Record<Status, string> = {
  active: 'bg-green-100 text-green-800',
  expired: 'bg-yellow-100 text-yellow-800',
  revoked: 'bg-red-100 text-red-800',
  none: 'bg-gray-100 text-gray-600',
};

export default function TestimonialCollectionLinkSection({ cohortId }: Props) {
  const [link, setLink] = useState<CollectionLink | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<'regenerate' | 'revoke' | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getCollectionLink(cohortId);
      setLink(result);
      setUrl(result?.url ?? null);
    } catch {
      // no link yet — that's fine
    } finally {
      setLoading(false);
    }
  }, [cohortId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleGenerate = async () => {
    setBusy(true);
    setError(null);
    try {
      const { link: newLink, url: newUrl } = await createCollectionLink(cohortId);
      setLink(newLink);
      setUrl(newUrl);
    } catch {
      setError('Failed to generate link. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleRegenerate = async () => {
    setConfirmAction(null);
    setBusy(true);
    setError(null);
    try {
      const { link: newLink, url: newUrl } = await regenerateCollectionLink(cohortId);
      setLink(newLink);
      setUrl(newUrl);
    } catch {
      setError('Failed to regenerate link. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleRevoke = async () => {
    setConfirmAction(null);
    setBusy(true);
    setError(null);
    try {
      await revokeCollectionLink(cohortId);
      await load();
    } catch {
      setError('Failed to revoke link. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleAutoApproveToggle = async () => {
    if (!link) return;
    const current = link.auto_approve ?? link.autoApprove ?? false;
    setBusy(true);
    setError(null);
    try {
      const updated = await updateCollectionLink(cohortId, { auto_approve: !current });
      setLink(updated);
    } catch {
      setError('Failed to update setting. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select text
    }
  };

  const status = getStatus(link);
  const autoApprove = link?.auto_approve ?? link?.autoApprove ?? false;
  const submissionCount = link?.submission_count ?? link?.submissionCount ?? 0;

  return (
    <section className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Testimonial Collection Link</h2>
      <p className="text-sm text-gray-500 mb-4">
        Share this link with enrolled learners so they can submit a testimonial for this cohort.
      </p>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : (
        <>
          {/* Status row */}
          <div className="flex items-center gap-3 mb-4">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[status]}`}>
              {status === 'none' ? 'No link yet' : status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
            {link && status !== 'none' && (
              <span className="text-sm text-gray-500">{submissionCount} submission{submissionCount !== 1 ? 's' : ''}</span>
            )}
          </div>

          {/* URL display */}
          {url && status === 'active' && (
            <div className="flex items-center gap-2 mb-4">
              <input
                readOnly
                value={url}
                className="flex-1 text-sm border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-700 truncate"
                aria-label="Collection link URL"
              />
              <button
                onClick={handleCopy}
                className="shrink-0 px-3 py-2 text-sm font-medium rounded-md border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          )}

          {/* Auto-approve toggle */}
          {link && status === 'active' && (
            <div className="flex items-center justify-between mb-4 py-3 border-t border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-700">Auto-approve submissions</p>
                <p className="text-xs text-gray-500">Testimonials will be featured immediately without manual review</p>
              </div>
              <button
                role="switch"
                aria-checked={autoApprove}
                onClick={handleAutoApproveToggle}
                disabled={busy}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  autoApprove ? 'bg-indigo-600' : 'bg-gray-200'
                } disabled:opacity-50`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoApprove ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
            {status === 'none' && (
              <button
                onClick={handleGenerate}
                disabled={busy}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {busy ? 'Generating…' : 'Generate Link'}
              </button>
            )}

            {status === 'active' && (
              <>
                <button
                  onClick={() => setConfirmAction('regenerate')}
                  disabled={busy}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Regenerate
                </button>
                <button
                  onClick={() => setConfirmAction('revoke')}
                  disabled={busy}
                  className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-md hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  Revoke
                </button>
              </>
            )}

            {(status === 'expired' || status === 'revoked') && (
              <button
                onClick={handleGenerate}
                disabled={busy}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {busy ? 'Generating…' : 'Generate New Link'}
              </button>
            )}
          </div>
        </>
      )}

      {/* Confirmation dialog */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              {confirmAction === 'regenerate' ? 'Regenerate link?' : 'Revoke link?'}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {confirmAction === 'regenerate'
                ? 'The current link will stop working immediately. A new link will be created.'
                : 'The current link will stop working immediately. Learners will no longer be able to submit testimonials via this link.'}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction === 'regenerate' ? handleRegenerate : handleRevoke}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                  confirmAction === 'revoke'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {confirmAction === 'regenerate' ? 'Yes, regenerate' : 'Yes, revoke'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
