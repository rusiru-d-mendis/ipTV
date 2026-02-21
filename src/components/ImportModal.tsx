import React, { useState } from 'react';
import { X, Upload, Link as LinkIcon, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { parseM3U, M3UEntry } from '../utils/m3uParser';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (entries: M3UEntry[]) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUrlImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/proxy-m3u?url=${encodeURIComponent(url)}`);
      if (!response.ok) {
        let errorMessage = 'Failed to fetch playlist';
        const errorText = await response.text();
        try {
          const data = JSON.parse(errorText);
          errorMessage = data.error || errorMessage;
        } catch (e) {
          errorMessage = errorText.slice(0, 100) || `Error ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      const content = await response.text();
      const entries = parseM3U(content);
      
      if (entries.length === 0) {
        throw new Error('No valid entries found in M3U file');
      }

      onImport(entries);
      onClose();
      setUrl('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const entries = parseM3U(content);
      if (entries.length > 0) {
        onImport(entries);
        onClose();
      } else {
        setError('Invalid M3U file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
          >
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Import Playlist</h2>
              <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Sample Playlists */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Try Sample Playlists
                </label>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => {
                      setUrl('https://iptv-org.github.io/iptv/categories/news.m3u');
                    }}
                    className="text-left px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-all"
                  >
                    Global News (IPTV-org)
                  </button>
                  <button
                    onClick={() => {
                      setUrl('https://raw.githubusercontent.com/free-greek-tv/m3u/main/free-greek-tv.m3u');
                    }}
                    className="text-left px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-all"
                  >
                    Free Greek TV (GitHub)
                  </button>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-800"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-zinc-900 px-2 text-zinc-600 font-bold">Or</span>
                </div>
              </div>

              {/* URL Import */}
              <form onSubmit={handleUrlImport} className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Import from URL
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                    <input
                      type="url"
                      placeholder="https://example.com/playlist.m3u"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 pl-10 pr-4 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : 'Import'}
                  </button>
                </div>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-800"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-zinc-900 px-2 text-zinc-600 font-bold">Or</span>
                </div>
              </div>

              {/* File Import */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Upload .m3u File
                </label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-800 rounded-xl hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all cursor-pointer group">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-3 text-zinc-500 group-hover:text-emerald-500 transition-colors" />
                    <p className="mb-2 text-sm text-zinc-400">
                      <span className="font-semibold text-zinc-200">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-zinc-600">M3U or M3U8 files</p>
                  </div>
                  <input type="file" className="hidden" accept=".m3u,.m3u8" onChange={handleFileUpload} />
                </label>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
                  {error}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
