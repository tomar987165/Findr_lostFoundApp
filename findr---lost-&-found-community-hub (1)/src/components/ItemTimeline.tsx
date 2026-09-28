import { useMemo } from 'react';
import { 
  CheckCircle2, Clock, Sparkles, ShieldAlert, ShieldCheck, 
  PartyPopper, AlertCircle, MapPin, User, ChevronRight, FileText 
} from 'lucide-react';
import { Item, ItemTimelineEvent, ItemStatusStage, ClaimVerification } from '../types';
import { formatDistance } from '../utils/geo';

interface ItemTimelineProps {
  item: Item;
  claims: ClaimVerification[];
  detectedMatchesCount: number;
  topMatch?: {
    item: Item;
    score: number;
    distanceKm: number;
  };
}

export function ItemTimeline({ item, claims, detectedMatchesCount, topMatch }: ItemTimelineProps) {
  const isLost = item.type === 'lost';
  const hasMatches = Boolean(detectedMatchesCount > 0 || item.timeline?.some(t => t.stage === 'match_found'));
  const hasClaims = Boolean(claims.length > 0);
  const approvedClaim = claims.find(c => c.status === 'approved');
  const isReunited = item.status === 'reunited';

  // Construct or compute timeline events
  const events = useMemo<ItemTimelineEvent[]>(() => {
    // Stage 1: Reported
    const reportedEvent: ItemTimelineEvent = {
      id: 'step_reported',
      stage: 'reported',
      label: 'Reported',
      timestamp: item.createdAt || item.date,
      description: `Item officially posted as ${isLost ? 'Lost' : 'Found'} by ${item.reporterName} near ${item.location.name}.`,
      actor: item.reporterName,
      isCompleted: true,
      isCurrent: !hasMatches && !hasClaims && !isReunited,
    };

    // Stage 2: Match Found
    const matchEvent: ItemTimelineEvent = {
      id: 'step_match_found',
      stage: 'match_found',
      label: 'Match Found',
      timestamp: item.createdAt ? new Date(new Date(item.createdAt).getTime() + 12 * 60000).toISOString() : new Date().toISOString(),
      description: hasMatches && topMatch
        ? `Smart proximity match (${topMatch.score}% confidence) detected with "${topMatch.item.title}" (${formatDistance(topMatch.distanceKm)} away).`
        : hasMatches
        ? `${detectedMatchesCount} potential proximity matches detected nearby.`
        : 'Scanning community reports and proximity radius for potential matches.',
      isCompleted: hasMatches,
      isCurrent: hasMatches && !hasClaims && !isReunited,
    };

    // Stage 3: Under Review
    const underReviewEvent: ItemTimelineEvent = {
      id: 'step_under_review',
      stage: 'under_review',
      label: 'Under Review',
      timestamp: claims[0]?.createdAt || (hasMatches ? new Date(new Date(item.createdAt || item.date).getTime() + 45 * 60000).toISOString() : ''),
      description: approvedClaim
        ? `Ownership evidence submitted by ${approvedClaim.claimantName} was verified and approved!`
        : hasClaims
        ? `Claimant ${claims[0].claimantName} submitted answers to the Ownership Evidence Challenge. Verification in progress.`
        : item.type === 'found'
        ? 'Ownership Evidence Challenge active. Waiting for claimant to submit verification details.'
        : 'Awaiting ownership challenge verification with finder.',
      actor: hasClaims ? claims[0].claimantName : undefined,
      isCompleted: !!approvedClaim || isReunited,
      isCurrent: hasClaims && !approvedClaim && !isReunited,
    };

    // Stage 4: Reunited
    const reunitedEvent: ItemTimelineEvent = {
      id: 'step_reunited',
      stage: 'reunited',
      label: 'Reunited',
      timestamp: isReunited ? (approvedClaim?.reviewedAt || new Date().toISOString()) : '',
      description: isReunited
        ? 'Ownership verified and item successfully returned to its rightful owner! Case closed.'
        : 'Final step: Coordinate safe handover in public zone and confirm item return.',
      isCompleted: isReunited,
      isCurrent: isReunited,
    };

    return [reportedEvent, matchEvent, underReviewEvent, reunitedEvent];
  }, [item, claims, hasMatches, hasClaims, approvedClaim, isReunited, topMatch, detectedMatchesCount, isLost]);

  // Stage Icons
  const getStageIcon = (stage: ItemStatusStage, isCompleted: boolean, isCurrent: boolean) => {
    switch (stage) {
      case 'reported':
        return <FileText className={`w-3.5 h-3.5 ${isCompleted ? 'text-white' : 'text-neutral-500'}`} />;
      case 'match_found':
        return <Sparkles className={`w-3.5 h-3.5 ${isCompleted ? 'text-white' : 'text-neutral-500'}`} />;
      case 'under_review':
        return isCompleted ? (
          <ShieldCheck className="w-3.5 h-3.5 text-white" />
        ) : (
          <ShieldAlert className={`w-3.5 h-3.5 ${isCurrent ? 'text-amber-800' : 'text-neutral-500'}`} />
        );
      case 'reunited':
        return isCompleted ? (
          <PartyPopper className="w-3.5 h-3.5 text-white" />
        ) : (
          <CheckCircle2 className="w-3.5 h-3.5 text-neutral-400" />
        );
    }
  };

  const getStatusBadge = (event: ItemTimelineEvent) => {
    if (event.isCompleted && !event.isCurrent) {
      return (
        <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 text-[10px] font-bold uppercase tracking-wider rounded">
          Completed
        </span>
      );
    }
    if (event.isCurrent) {
      return (
        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-800 text-[10px] font-bold uppercase tracking-wider rounded flex items-center gap-1 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400"></span>
          <span>In Progress</span>
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700 text-[10px] font-bold uppercase tracking-wider rounded">
        Pending
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/80 rounded-xl p-5 space-y-5 text-left shadow-xs transition-colors">
      {/* Title & Recovery Progress Bar */}
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 font-display">
              Recovery Process Timeline
            </h3>
          </div>
          <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
            Status: <strong className="text-neutral-900 dark:text-neutral-100 capitalize">{item.status.replace('_', ' ')}</strong>
          </span>
        </div>
        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
          Full audit trail of reporting, algorithmic proximity matching, ownership validation, and return handover.
        </p>
      </div>

      {/* Progress Stepper Bar */}
      <div className="relative flex items-center justify-between px-2">
        {/* Connecting line */}
        <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-neutral-200 dark:bg-neutral-700 z-0">
          <div 
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{
              width: isReunited ? '100%' : approvedClaim ? '66%' : hasMatches ? '33%' : '0%'
            }}
          />
        </div>

        {events.map((evt, idx) => {
          const isDone = evt.isCompleted;
          const isCurr = evt.isCurrent;

          return (
            <div key={evt.id} className="relative z-10 flex flex-col items-center">
              <div 
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                  isDone
                    ? 'bg-emerald-600 ring-4 ring-emerald-100 dark:ring-emerald-950/60 shadow-xs'
                    : isCurr
                    ? 'bg-blue-600 ring-4 ring-blue-100 dark:ring-blue-950/60 shadow-xs'
                    : 'bg-neutral-100 dark:bg-neutral-800 border-2 border-neutral-300 dark:border-neutral-700'
                }`}
              >
                {getStageIcon(evt.stage, isDone, isCurr)}
              </div>
              <span className={`text-[10px] font-semibold mt-1.5 text-center ${
                isDone ? 'text-emerald-950 dark:text-emerald-300 font-bold' : isCurr ? 'text-blue-900 dark:text-blue-300 font-bold' : 'text-neutral-400 dark:text-neutral-500'
              }`}>
                {evt.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Vertical Detailed Events Trail */}
      <div className="pt-2 border-t border-neutral-100 dark:border-neutral-700 space-y-3">
        {events.map((evt, idx) => {
          const isDone = evt.isCompleted;
          const isCurr = evt.isCurrent;
          const hasTime = !!evt.timestamp;

          return (
            <div
              key={evt.id}
              className={`p-3 rounded-lg border transition-all ${
                isCurr
                  ? 'bg-blue-50/60 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 shadow-2xs'
                  : isDone
                  ? 'bg-neutral-50/70 dark:bg-neutral-800/60 border-neutral-200/90 dark:border-neutral-700'
                  : 'bg-white dark:bg-neutral-900/40 border-dashed border-neutral-200 dark:border-neutral-700 opacity-65'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    isDone ? 'bg-emerald-500' : isCurr ? 'bg-blue-600 animate-ping' : 'bg-neutral-300 dark:bg-neutral-600'
                  }`} />
                  <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                    {evt.label}
                  </span>
                  {evt.actor && (
                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono">
                      by {evt.actor}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {getStatusBadge(evt)}
                  {hasTime && (
                    <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500 tabular-nums">
                      {new Date(evt.timestamp).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed pl-4">
                {evt.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
