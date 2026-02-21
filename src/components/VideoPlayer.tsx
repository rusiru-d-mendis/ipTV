import React, { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { Play, AlertCircle, RefreshCw, Loader2, Settings2 } from 'lucide-react';
import { M3UEntry } from '../utils/m3uParser';

interface QualityLevel {
  id: number;
  height: number;
  bitrate: number;
}

interface VideoPlayerProps {
  entry: M3UEntry | null;
  autoPlay?: boolean;
  forceProxy?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ entry, autoPlay = true, forceProxy = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isMixedContent, setIsMixedContent] = useState(false);
  const [useProxy, setUseProxy] = useState(forceProxy);
  const [levels, setLevels] = useState<QualityLevel[]>([]);
  const [currentLevel, setCurrentLevel] = useState<number>(-1); // -1 is Auto
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  useEffect(() => {
    setError(null);
    setUseProxy(forceProxy);
    setLoading(false);
    setLevels([]);
    setCurrentLevel(-1);
    setShowQualityMenu(false);
    
    if (entry?.url.startsWith('http:')) {
      setIsMixedContent(window.location.protocol === 'https:');
    } else {
      setIsMixedContent(false);
    }
  }, [entry]);

  useEffect(() => {
    if (!entry || !videoRef.current) return;

    const video = videoRef.current;
    const streamUrl = useProxy 
      ? `/api/proxy-manifest?url=${encodeURIComponent(entry.url)}` 
      : entry.url;

    setLoading(true);
    setError(null);

    // Clean up previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    let isSubscribed = true;

    if (Hls.isSupported() && (entry.url.includes('.m3u8') || useProxy)) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        xhrSetup: (xhr) => {
          xhr.withCredentials = false;
        }
      });

      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hlsRef.current = hls;

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        if (!isSubscribed) return;
        setLoading(false);
        
        // Extract quality levels
        const availableLevels = hls.levels.map((level, index) => ({
          id: index,
          height: level.height,
          bitrate: level.bitrate
        })).sort((a, b) => b.height - a.height);
        
        setLevels(availableLevels);

        if (autoPlay) {
          video.play().catch(e => {
            if (e.name !== 'AbortError') {
              console.error("Auto-play failed:", e);
            }
          });
        }
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (!isSubscribed) return;
        console.error("HLS Error:", data);
        if (data.fatal) {
          setLoading(false);
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setError(`Network error (${data.details}): The stream could not be reached. Check if the URL is correct and the stream is online.`);
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              setError("Media error: The stream format is incompatible or corrupted.");
              hls.recoverMediaError();
              break;
            default:
              setError(`Playback error: ${data.details || 'Unknown error'}`);
              hls.destroy();
              break;
          }
        }
      });
    } else {
      // Fallback for non-HLS or native support
      video.src = streamUrl;
      video.load();
      if (autoPlay) {
        video.play().then(() => {
          if (!isSubscribed) return;
          setLoading(false);
        }).catch(e => {
          if (!isSubscribed) return;
          if (e.name !== 'AbortError') {
            console.error("Native playback failed:", e);
            setLoading(false);
            setError("Playback failed. This stream might require a specific player or is currently unavailable.");
          }
        });
      } else {
        setLoading(false);
      }
    }

    return () => {
      isSubscribed = false;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      video.pause();
      video.removeAttribute('src');
      video.load();
    };
  }, [entry, useProxy, autoPlay]);

  const handleLevelChange = (levelId: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelId;
      setCurrentLevel(levelId);
      setShowQualityMenu(false);
    }
  };

  if (!entry) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-zinc-900 text-zinc-500">
        <Play size={64} className="mb-4 opacity-20" />
        <p className="text-lg font-medium">Select a channel to start playing</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black group">
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        controls
        playsInline
      />

      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={48} className="text-emerald-500 animate-spin" />
            <p className="text-zinc-300 text-sm font-medium">Loading stream...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 p-8 text-center z-20">
          <AlertCircle size={48} className="text-red-500 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Playback Error</h3>
          <p className="text-zinc-400 max-w-md mb-6 text-sm">{error}</p>
          
          <div className="flex flex-col gap-3 w-full max-w-xs">
            {isMixedContent && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 text-xs text-left">
                <strong>Mixed Content:</strong> Secure sites (HTTPS) block insecure (HTTP) streams.
              </div>
            )}
            
            {!useProxy && (
              <button 
                onClick={() => { setError(null); setUseProxy(true); }}
                className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-full transition-all font-medium"
              >
                <RefreshCw size={18} />
                Try with Proxy
              </button>
            )}

            <button 
              onClick={() => { setError(null); setUseProxy(false); }}
              className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2 rounded-full transition-all font-medium"
            >
              <RefreshCw size={18} />
              Retry Original
            </button>
          </div>
        </div>
      )}
      
      {/* Custom Overlay for Channel Info and Quality */}
      <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="flex items-start justify-between w-full">
          <div className="flex items-center gap-4">
            {entry.logo && (
              <img 
                src={entry.logo} 
                alt={entry.name} 
                className="w-12 h-12 object-contain bg-white/10 rounded p-1"
                referrerPolicy="no-referrer"
              />
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">{entry.name}</h2>
                {useProxy && (
                  <span className="px-1.5 py-0.5 bg-emerald-500 text-zinc-950 text-[10px] font-bold rounded uppercase tracking-tighter">
                    Proxy Active
                  </span>
                )}
              </div>
              {entry.group && (
                <span className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">
                  {entry.group}
                </span>
              )}
            </div>
          </div>

          {/* Quality Selector */}
          {levels.length > 0 && (
            <div className="relative pointer-events-auto">
              <button 
                onClick={() => setShowQualityMenu(!showQualityMenu)}
                className="flex items-center gap-2 bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10 rounded-lg px-3 py-1.5 text-xs font-bold text-white transition-all"
              >
                <Settings2 size={14} />
                {currentLevel === -1 ? 'Auto' : `${levels.find(l => l.id === currentLevel)?.height}p`}
              </button>

              {showQualityMenu && (
                <div className="absolute right-0 mt-2 w-32 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-50">
                  <div className="p-2 border-b border-zinc-800 text-[10px] uppercase tracking-widest text-zinc-500 font-bold text-center">
                    Quality
                  </div>
                  <div className="max-h-48 overflow-y-auto custom-scrollbar">
                    <button
                      onClick={() => handleLevelChange(-1)}
                      className={`w-full text-left px-4 py-2 text-xs transition-colors ${currentLevel === -1 ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
                    >
                      Auto
                    </button>
                    {levels.map((level) => (
                      <button
                        key={level.id}
                        onClick={() => handleLevelChange(level.id)}
                        className={`w-full text-left px-4 py-2 text-xs transition-colors ${currentLevel === level.id ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
                      >
                        {level.height}p
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
