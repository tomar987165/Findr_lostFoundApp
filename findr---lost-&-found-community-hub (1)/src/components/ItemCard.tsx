import { useState } from 'react';
import { MapPin, ShieldCheck, Sparkles, AlertCircle, ArrowUpRight, QrCode } from 'lucide-react';
import { Item, User } from '../types';
import { calculateDistanceKm, formatDistance } from '../utils/geo';

interface ItemCardProps {
  item: Item;
  currentUser: User;
  onSelect: (item: Item) => void;
  hasMatchDetected?: boolean;
  onOpenPrintFlyer?: (item: Item) => void;
}

export function ItemCard({ item, currentUser, onSelect, hasMatchDetected, onOpenPrintFlyer }: ItemCardProps) {
  const [imageError, setImageError] = useState(false);

  const isLost = item.type === 'lost';
  const isOwner = item.reporterId === currentUser.id;
  const distanceKm = calculateDistanceKm(currentUser.location, item.location);
  const distanceStr = formatDistance(distanceKm);

  const formattedDate = new Date(item.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });

  return (
    <article 
      onClick={() => onSelect(item)}
      className="group bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-xl overflow-hidden hover:border-neutral-400/80 dark:hover:border-neutral-600 hover:shadow-md transition-all duration-200 flex flex-col cursor-pointer text-left"
    >
      {/* Visual Image Container with Zero-Broken-Image Fallback */}
      <div className="relative aspect-[4/3] w-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
        {!imageError && item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.title}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900 text-neutral-400 dark:text-neutral-500 p-4 text-center">
            <AlertCircle className="w-8 h-8 stroke-1 mb-1" />
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{item.category.replace('_', ' ')}</span>
          </div>
        )}

        {/* Quiet Type Tag - simple clean indicator */}
        <div className="absolute top-3 left-3">
          <div className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded backdrop-blur-md shadow-sm ${
            isLost 
              ? 'bg-amber-900/85 text-amber-100 border border-amber-500/30' 
              : 'bg-emerald-950/85 text-emerald-100 border border-emerald-500/30'
          }`}>
            {isLost ? 'Lost Item' : 'Found Item'}
          </div>
        </div>

        {/* Status flags */}
        {item.status === 'reunited' && (
          <div className="absolute top-3 right-3 bg-neutral-900/90 dark:bg-neutral-800/90 text-white text-[11px] font-semibold px-2 py-0.5 rounded backdrop-blur">
            Reunited
          </div>
        )}

        {hasMatchDetected && item.status !== 'reunited' && (
          <div className="absolute bottom-3 left-3 right-3 bg-blue-950/90 dark:bg-blue-900/90 text-blue-100 text-xs px-2.5 py-1 rounded backdrop-blur flex items-center justify-between shadow-sm">
            <span className="flex items-center gap-1.5 font-medium truncate">
              <Sparkles className="w-3.5 h-3.5 text-blue-300 shrink-0" />
              <span>Nearby potential match detected!</span>
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 shrink-0 opacity-80" />
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Zero-Pill Static Metadata: clean text with typographic separators */}
          <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 mb-1.5 font-mono">
            <span className="capitalize">{item.category.replace('_', ' ')}</span>
            <span aria-hidden="true" className="text-neutral-300 dark:text-neutral-700">·</span>
            <span className="tabular-nums">{distanceStr}</span>
            <span aria-hidden="true" className="text-neutral-300 dark:text-neutral-700">·</span>
            <span>{formattedDate}</span>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {item.title}
          </h3>

          {/* Description snippet */}
          <p className="text-xs text-neutral-600 dark:text-neutral-300 line-clamp-2 mt-1.5 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Card Footer: Location & Verification Indicator */}
        <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-neutral-500 dark:text-neutral-400 truncate max-w-[190px]">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-neutral-400 dark:text-neutral-500" />
            <span className="truncate">{item.location.name}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {item.evidenceQuestion && item.type === 'found' && (
              <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium text-[11px]" title="Finder requires proof of ownership to protect claimant">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Protected</span>
              </span>
            )}
            {item.reward && isLost && (
              <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 font-mono">
                {item.reward}
              </span>
            )}
            {isLost && onOpenPrintFlyer && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenPrintFlyer(item);
                }}
                className="p-1 text-neutral-400 dark:text-neutral-500 hover:text-amber-800 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-neutral-800 rounded transition cursor-pointer"
                title="Print QR flyer or adhesive sticker"
              >
                <QrCode className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
