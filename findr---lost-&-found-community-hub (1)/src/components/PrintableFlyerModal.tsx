import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { X, Printer, Download, Copy, Check, QrCode, Sparkles, MapPin, Tag } from 'lucide-react';
import { Item } from '../types';

interface PrintableFlyerModalProps {
  item: Item | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PrintableFlyerModal({ item, isOpen, onClose }: PrintableFlyerModalProps) {
  if (!isOpen || !item) return null;

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [format, setFormat] = useState<'flyer' | 'sticker'>('flyer');
  const [copied, setCopied] = useState(false);
  const printableRef = useRef<HTMLDivElement>(null);

  // Direct scan URL for this item
  const itemUrl = `${window.location.origin}${window.location.pathname}?item=${item.id}`;

  useEffect(() => {
    QRCode.toDataURL(itemUrl, {
      width: 400,
      margin: 1.5,
      color: {
        dark: '#111827',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then(url => {
        setQrDataUrl(url);
      })
      .catch(err => {
        console.error('Failed to generate QR code:', err);
      });
  }, [item.id, itemUrl]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(itemUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `lost_item_qr_${item.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[92vh] transition-colors">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 flex items-center justify-center">
              <QrCode className="w-4 h-4 text-amber-800 dark:text-amber-300" />
            </div>
            <div className="text-left">
              <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 font-display">
                Printable QR Code & Recovery Flyer
              </h2>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Generate scan codes for community bulletin boards, bike posts, or physical sticker tags
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar Controls */}
        <div className="px-6 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          {/* Format selector */}
          <div className="flex items-center gap-1 p-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
            <button
              onClick={() => setFormat('flyer')}
              className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                format === 'flyer'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Community Flyer Poster
            </button>
            <button
              onClick={() => setFormat('sticker')}
              className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                format === 'sticker'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Adhesive Sticker Tag
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg font-medium text-neutral-700 dark:text-neutral-200 flex items-center gap-1.5 transition cursor-pointer"
              title="Copy scan link to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />}
              <span>{copied ? 'Copied Link' : 'Copy Link'}</span>
            </button>

            <button
              onClick={handleDownloadQr}
              className="px-3 py-1.5 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg font-medium text-neutral-700 dark:text-neutral-200 flex items-center gap-1.5 transition cursor-pointer"
              title="Download standalone high-resolution QR Code image"
            >
              <Download className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
              <span>PNG QR</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded-lg font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Flyer</span>
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Preview Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-neutral-100/80 dark:bg-neutral-950/60 flex justify-center">
          {/* Printable Container */}
          <div
            id="printable-area"
            ref={printableRef}
            className={`bg-white shadow-xl border border-neutral-300 transition-all ${
              format === 'flyer'
                ? 'w-full max-w-[480px] p-6 rounded-xl flex flex-col justify-between'
                : 'w-[320px] p-5 rounded-2xl flex flex-col items-center text-center border-2 border-neutral-900'
            }`}
          >
            {format === 'flyer' ? (
              /* ================= FLYER FORMAT ================= */
              <div className="space-y-4 text-left">
                {/* Header Title Banner */}
                <div className="border-b-2 border-neutral-950 pb-3 text-center">
                  <div className="inline-block px-4 py-1 bg-amber-950 text-white text-sm font-extrabold uppercase tracking-widest rounded-xs mb-1">
                    LOST ITEM REPORT
                  </div>
                  <h1 className="text-xl font-bold font-display text-neutral-950 leading-tight">
                    {item.title}
                  </h1>
                  {item.reward && (
                    <div className="mt-1.5 inline-block px-3 py-0.5 bg-amber-100 text-amber-900 font-extrabold text-xs uppercase tracking-wider rounded border border-amber-300">
                      ★ {item.reward} ★
                    </div>
                  )}
                </div>

                {/* Photo & Core Information */}
                <div className="grid grid-cols-2 gap-4 items-center">
                  <div className="aspect-[4/3] rounded-lg overflow-hidden border border-neutral-200 bg-neutral-50">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* QR Code */}
                  <div className="flex flex-col items-center justify-center p-2 bg-neutral-50 rounded-lg border border-neutral-200 text-center">
                    {qrDataUrl && (
                      <img
                        src={qrDataUrl}
                        alt="Scan QR Code to return item"
                        className="w-28 h-28 object-contain"
                      />
                    )}
                    <span className="text-[10px] font-bold text-neutral-800 uppercase tracking-wider mt-1">
                      Scan to Return
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-1.5 text-xs text-neutral-800 bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                  <div className="flex items-center gap-1.5 font-bold text-neutral-900">
                    <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>Last Seen: {item.location.name}</span>
                  </div>
                  <div className="text-[11px] text-neutral-600">
                    <strong>Date:</strong> {new Date(item.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                  <p className="text-[11px] text-neutral-700 leading-relaxed pt-1 border-t border-neutral-200">
                    {item.description}
                  </p>
                </div>

                {/* Safety & Verification Notice */}
                <div className="p-2 bg-neutral-900 text-white rounded text-[10px] flex items-center justify-between px-3">
                  <span>Report ID: #{item.id.slice(-6)}</span>
                  <span>🔒 Ownership Evidence Verification Protected</span>
                </div>

                {/* Tear-Off Strips Simulation at Bottom */}
                <div className="pt-3 border-t-2 border-dashed border-neutral-300">
                  <div className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold text-center mb-2">
                    ✂ Tear-off contact strips
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-center font-mono text-[9px] text-neutral-600">
                    {[1, 2, 3, 4].map(idx => (
                      <div key={idx} className="p-1 border-r border-dashed border-neutral-300 last:border-r-0 truncate">
                        <div className="font-bold text-neutral-900 truncate">Scan QR</div>
                        <div className="text-[8px] text-neutral-400 truncate">Findr Hub</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* ================= STICKER / ADHESIVE FORMAT ================= */
              <div className="space-y-3 flex flex-col items-center">
                <div className="text-center">
                  <span className="px-2.5 py-0.5 bg-neutral-900 text-white text-[10px] font-extrabold uppercase tracking-widest rounded-xs">
                    LOST PROPERTY TAG
                  </span>
                  <h3 className="text-sm font-bold font-display text-neutral-900 mt-1 line-clamp-1">
                    {item.title}
                  </h3>
                </div>

                {qrDataUrl && (
                  <div className="p-2 bg-white rounded-xl shadow-xs border border-neutral-200">
                    <img
                      src={qrDataUrl}
                      alt="Scan to return"
                      className="w-36 h-36 object-contain"
                    />
                  </div>
                )}

                <div className="text-center space-y-0.5">
                  <div className="text-xs font-bold text-neutral-950 uppercase tracking-wider">
                    SCAN TO RETURN SAFELY
                  </div>
                  <div className="text-[10px] text-neutral-500 font-mono">
                    ID: {item.id.slice(-8)} · Findr Verified
                  </div>
                </div>

                {item.reward && (
                  <div className="px-3 py-1 bg-amber-100 text-amber-900 rounded font-bold text-[11px] border border-amber-300">
                    Reward: {item.reward}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 shrink-0">
          <span>Anyone who scans this QR code will instantly view this report and submit proof of ownership.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg transition font-medium cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
