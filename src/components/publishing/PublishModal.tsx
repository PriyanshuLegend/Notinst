'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  X,
  Upload,
  Image as ImageIcon,
  Video,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { publishMedia } from '@/lib/api';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultType?: 'IMAGE' | 'REELS';
}

export default function PublishModal({
  isOpen,
  onClose,
  onSuccess,
  defaultType = 'IMAGE',
}: PublishModalProps) {
  const [mediaType, setMediaType] = useState<'IMAGE' | 'REELS'>(defaultType);
  const [mediaUrl, setMediaUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepStatus, setStepStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaUrl.trim()) {
      setError('Please provide a media URL.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    setStepStatus('Step 1/2: Creating Meta media container...');

    try {
      const res = await publishMedia({
        mediaType,
        mediaUrl: mediaUrl.trim(),
        caption: caption.trim(),
      });

      if (!res.success) {
        setError(res.error || 'Failed to publish media.');
        setIsSubmitting(false);
        setStepStatus(null);
        return;
      }

      setStepStatus('Step 2/2: Published successfully!');
      setSuccessMessage(
        res.message || 'Media successfully published to Instagram!'
      );
      setIsSubmitting(false);

      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Publishing failed.');
      setIsSubmitting(false);
      setStepStatus(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-purple-600 dark:text-purple-400" />
            <h2 className="text-[16px] font-bold text-zinc-900 dark:text-white">
              Create & Publish
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handlePublish} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Post Type Selector */}
          <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
            <button
              type="button"
              onClick={() => setMediaType('IMAGE')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[13px] font-semibold transition-all ${
                mediaType === 'IMAGE'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <ImageIcon size={16} />
              Photo Post
            </button>
            <button
              type="button"
              onClick={() => setMediaType('REELS')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[13px] font-semibold transition-all ${
                mediaType === 'REELS'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Video size={16} />
              Reel (Video)
            </button>
          </div>

          {/* Public URL Notice */}
          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[12px] text-purple-700 dark:text-purple-300 leading-relaxed">
            <p className="font-semibold flex items-center gap-1.5 mb-1">
              <Upload size={14} />
              Official Content Publishing API Requirement
            </p>
            <p className="opacity-90">
              Meta’s servers require a publicly accessible URL (HTTPS/HTTP) to download media files directly during container creation. Localhost and blob files cannot be ingested by Instagram.
            </p>
          </div>

          {/* Media URL Input */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-zinc-700 dark:text-zinc-300">
              Public {mediaType === 'IMAGE' ? 'Image' : 'Video'} URL
            </label>
            <input
              type="url"
              placeholder={
                mediaType === 'IMAGE'
                  ? 'https://images.unsplash.com/photo-...'
                  : 'https://example.com/video.mp4'
              }
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 text-[13px] text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          {/* Media Live Preview */}
          {mediaUrl && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                Media Preview
              </span>
              <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
                {mediaType === 'IMAGE' ? (
                  <Image
                    src={mediaUrl}
                    alt="Preview"
                    fill
                    className="object-cover"
                    unoptimized
                    onError={() => setError('Unable to load preview image URL.')}
                  />
                ) : (
                  <video
                    src={mediaUrl}
                    controls
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            </div>
          )}

          {/* Caption Textarea */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-zinc-700 dark:text-zinc-300">
              Caption
            </label>
            <textarea
              placeholder="Write a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 text-[13px] text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
          </div>

          {/* Step Progress / Messages */}
          {stepStatus && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-[12px] text-zinc-700 dark:text-zinc-300">
              <Loader2 size={14} className="animate-spin text-purple-600" />
              <span>{stepStatus}</span>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[12px] text-rose-600 dark:text-rose-400 leading-snug">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[12px] text-emerald-600 dark:text-emerald-400 leading-snug">
              <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Footer Action */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !mediaUrl.trim()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-md disabled:opacity-50 active:scale-[0.98] transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Publishing...
                </>
              ) : (
                'Publish to Instagram'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
