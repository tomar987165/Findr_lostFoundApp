import { useState } from 'react';
import { X, ShieldCheck, Lock, Upload, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import { Item, User, ClaimVerification } from '../types';
import { StorageService } from '../services/storage';

interface ClaimEvidenceModalProps {
  item: Item;
  currentUser: User;
  isOpen: boolean;
  onClose: () => void;
  onClaimSubmitted: () => void;
}

export function ClaimEvidenceModal({
  item,
  currentUser,
  isOpen,
  onClose,
  onClaimSubmitted
}: ClaimEvidenceModalProps) {
  if (!isOpen) return null;

  const [evidenceAnswer, setEvidenceAnswer] = useState('');
  const [evidencePhoto, setEvidencePhoto] = useState<string | null>(null);
  const [claimantContact, setClaimantContact] = useState(currentUser.phone || currentUser.email);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setEvidencePhoto(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidenceAnswer.trim()) return;

    setIsSubmitting(true);

    const newClaim: ClaimVerification = {
      id: `claim_${Date.now()}`,
      itemId: item.id,
      itemTitle: item.title,
      itemType: item.type,
      finderId: item.reporterId,
      claimantId: currentUser.id,
      claimantName: currentUser.name,
      claimantAvatar: currentUser.avatar,
      claimantContact,
      questionAsked: item.evidenceQuestion || 'Please provide proof of ownership',
      evidenceAnswer: evidenceAnswer.trim(),
      evidencePhotoUrl: evidencePhoto || undefined,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    StorageService.submitClaim(newClaim);
    setIsSubmitting(false);
    setHasSubmitted(true);

    setTimeout(() => {
      onClaimSubmitted();
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 font-display">Proof of Ownership Challenge</h2>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Ownership verification before exchanging sensitive details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {hasSubmitted ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 font-display">Evidence Submitted Securely</h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 max-w-sm mx-auto leading-relaxed">
              Your answer has been sent privately to the finder ({item.reporterName}). As soon as they confirm ownership, sensitive contact information and Return Chat will unlock!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5 text-left">
            {/* Peace of mind guarantee callout */}
            <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl flex items-start gap-3">
              <Lock className="w-4 h-4 text-neutral-700 dark:text-neutral-300 shrink-0 mt-0.5" />
              <div className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">Peace of Mind Guarantee:</span> Your answers are private. Neither party's phone numbers or exact private contact info will be revealed until the finder reviews and validates your ownership claim.
              </div>
            </div>

            {/* Found Item Summary */}
            <div className="flex items-center gap-3 p-3 bg-neutral-100/70 dark:bg-neutral-800/70 rounded-xl">
              {item.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-12 h-12 rounded-lg object-cover border border-neutral-200 dark:border-neutral-700 shrink-0"
                />
              )}
              <div className="overflow-hidden">
                <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">{item.title}</h4>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">Found by {item.reporterName} · {item.location.name}</p>
              </div>
            </div>

            {/* Finder's Question */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-emerald-950 dark:text-emerald-200 uppercase tracking-wide">
                Finder's Verification Challenge:
              </label>
              <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/90 dark:border-emerald-800 rounded-xl text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                "{item.evidenceQuestion || 'What unique serial, color, or distinguishing feature proves this is yours?'}"
              </div>
              {item.evidenceHint && (
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 italic">
                  Finder's hint: {item.evidenceHint}
                </p>
              )}
            </div>

            {/* Claimant Evidence Answer Input */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Your Answer / Specific Identifying Proof *
              </label>
              <textarea
                required
                rows={3}
                value={evidenceAnswer}
                onChange={(e) => setEvidenceAnswer(e.target.value)}
                placeholder="Give exact details only you would know (e.g., exact lockscreen picture, engraving initials, brand of cards inside, purchase date)..."
                className="w-full px-3 py-2 text-xs bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white text-neutral-900 dark:text-neutral-100 leading-relaxed"
              />
            </div>

            {/* Optional Evidence Photo Attachment */}
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Optional Supporting Photo Evidence (Receipt, serial number, past photo)
              </label>
              <div className="flex items-center gap-3">
                <label className="px-3 py-1.5 border border-neutral-300 dark:border-neutral-700 rounded-lg text-xs font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300 transition">
                  <Upload className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
                  <span>Attach Document or Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
                {evidencePhoto && (
                  <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Evidence image attached</span>
                  </span>
                )}
              </div>
            </div>

            {/* Contact details held in escrow */}
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Preferred Handover Contact (Held in escrow until verified)
              </label>
              <input
                type="text"
                value={claimantContact}
                onChange={(e) => setClaimantContact(e.target.value)}
                placeholder="Email or mobile number for handover coordinates"
                className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:bg-white dark:focus:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
              />
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !evidenceAnswer.trim()}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg transition shadow-sm cursor-pointer"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Evidence for Verification'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
