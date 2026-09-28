import { Item, User } from '../types';
import { formatDistance } from '../utils/geo';

export interface SentEmail {
  id: string;
  to: string;
  toName: string;
  from: string;
  subject: string;
  snippet: string;
  htmlContent: string;
  matchedItemId: string;
  lostItemId: string;
  matchScore: number;
  distanceKm: number;
  sentAt: string;
  isRead: boolean;
}

export interface EmailPreferences {
  enabled: boolean;
  minScoreThreshold: number; // e.g. 50%
  maxDistanceKm: number;     // e.g. 8 km
  emailAddress: string;
}

const STORAGE_KEYS = {
  EMAILS: 'findr_mock_emails_v1',
  PREFERENCES: 'findr_email_preferences_v1',
};

function getStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(e);
  }
}

export class MockEmailService {
  /**
   * Returns list of sent emails
   */
  static getSentEmails(recipientEmail?: string): SentEmail[] {
    const raw = localStorage.getItem(STORAGE_KEYS.EMAILS);
    if (!raw) {
      // Seed initial sample email for Alex Morgan regarding found AirPods Pro
      const seedEmails: SentEmail[] = [
        {
          id: 'email_seed_1',
          to: 'alex.m@campus.edu',
          toName: 'Alex Morgan',
          from: 'alerts@findr-recovery.org',
          subject: '🎯 Proximity Match Alert: "White Bluetooth Earbuds in Charging Case" found 100 m from your report!',
          snippet: 'Findr automated alert: High-confidence 94% match detected for your lost item "White Wireless Earbuds (AirPods Pro)" near Central Library North Plaza Bench.',
          htmlContent: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; color: #1f2937;">
              <div style="background: #0f172a; padding: 24px; text-align: center; color: #ffffff;">
                <h1 style="margin: 0; font-size: 22px; font-weight: 800;">Findr Recovery Network</h1>
                <p style="margin: 6px 0 0 0; font-size: 13px; color: #94a3b8;">Automated Proximity Match Alert</p>
              </div>
              <div style="padding: 24px;">
                <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                  <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #1d4ed8;">94% Correlation Match</span>
                  <h3 style="margin: 4px 0 0 0; font-size: 16px; font-weight: 700; color: #1e3a8a;">White Bluetooth Earbuds Found Within 100m</h3>
                  <p style="margin: 6px 0 0 0; font-size: 12px; color: #1e40af;">Reported by David Chen near Central Library North Plaza Bench.</p>
                </div>
                <div style="background: #f9fafb; border: 1px solid #f3f4f6; border-radius: 8px; padding: 14px; margin-bottom: 20px;">
                  <h5 style="margin: 0 0 8px 0; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #4b5563;">Matched Criteria:</h5>
                  <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #374151; line-height: 1.6;">
                    <li>Matching Category: Electronics & Audio</li>
                    <li>Shared Identifiers: "airpods, white, earbuds"</li>
                    <li>Proximity: Within 100 meters</li>
                  </ul>
                </div>
                <div style="background: #fdf2f8; border: 1px solid #fbcfe8; border-radius: 8px; padding: 14px; margin-bottom: 24px;">
                  <strong style="color: #9d174d; font-size: 12px;">🔒 Ownership Evidence Challenge Active:</strong>
                  <p style="margin: 4px 0 0 0; font-size: 12px; color: #831843;">The finder has asked: "What unique engraving or Bluetooth pairing name does this unit show when opened?"</p>
                </div>
                <div style="text-align: center;">
                  <a href="?item=item_found_1" style="display: inline-block; background: #0f172a; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 13px; font-weight: 700;">View Found Item in Findr</a>
                </div>
              </div>
            </div>
          `,
          matchedItemId: 'item_found_1',
          lostItemId: 'item_lost_1',
          matchScore: 94,
          distanceKm: 0.1,
          sentAt: new Date(Date.now() - 3600000).toISOString(),
          isRead: false,
        }
      ];
      setStored(STORAGE_KEYS.EMAILS, seedEmails);
      return seedEmails;
    }
    const emails = getStored<SentEmail[]>(STORAGE_KEYS.EMAILS, []);
    if (!recipientEmail) return emails;
    return emails.filter(e => e.to.toLowerCase() === recipientEmail.toLowerCase());
  }

  /**
   * Get email notification preferences for a user
   */
  static getPreferences(user: User): EmailPreferences {
    const all = getStored<Record<string, EmailPreferences>>(STORAGE_KEYS.PREFERENCES, {});
    return all[user.id] || {
      enabled: true,
      minScoreThreshold: 50,
      maxDistanceKm: 10,
      emailAddress: user.email,
    };
  }

  /**
   * Save user email notification preferences
   */
  static savePreferences(userId: string, prefs: EmailPreferences): void {
    const all = getStored<Record<string, EmailPreferences>>(STORAGE_KEYS.PREFERENCES, {});
    all[userId] = prefs;
    setStored(STORAGE_KEYS.PREFERENCES, all);
  }

  /**
   * Mark an email as read
   */
  static markAsRead(emailId: string): void {
    const emails = this.getSentEmails();
    const updated = emails.map(e => e.id === emailId ? { ...e, isRead: true } : e);
    setStored(STORAGE_KEYS.EMAILS, updated);
  }

  /**
   * Formats and dispatches a proximity match email alert
   */
  static dispatchProximityMatchAlert(params: {
    recipient: User;
    lostItem: Item;
    foundItem: Item;
    matchScore: number;
    distanceKm: number;
    reasons: string[];
  }): SentEmail | null {
    const { recipient, lostItem, foundItem, matchScore, distanceKm, reasons } = params;
    const prefs = this.getPreferences(recipient);

    if (!prefs.enabled) return null;
    if (matchScore < prefs.minScoreThreshold) return null;
    if (distanceKm > prefs.maxDistanceKm) return null;

    const formattedDist = formatDistance(distanceKm);
    const subject = `🎯 Proximity Match Alert: "${foundItem.title}" found ${formattedDist} from your report!`;
    const snippet = `Findr automated alert: High-confidence ${matchScore}% match detected for your lost item "${lostItem.title}" near ${foundItem.location.name}.`;

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; color: #1f2937;">
        <!-- Header Banner -->
        <div style="background: #0f172a; padding: 24px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">Findr Recovery Network</h1>
          <p style="margin: 6px 0 0 0; font-size: 13px; color: #94a3b8;">Automated Proximity & Description Match Dispatch</p>
        </div>

        <div style="padding: 24px;">
          <!-- Match Score Callout -->
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #1d4ed8; letter-spacing: 0.5px;">High Correlation Alert</span>
                <h3 style="margin: 4px 0 0 0; font-size: 16px; font-weight: 700; color: #1e3a8a;">${matchScore}% Match Confidence</h3>
              </div>
              <div style="font-size: 14px; font-weight: 600; color: #2563eb; background: #dbeafe; padding: 4px 10px; border-radius: 6px;">
                ${formattedDist}
              </div>
            </div>
            <p style="margin: 8px 0 0 0; font-size: 12px; color: #1e40af; line-height: 1.5;">
              A newly reported item closely matches the category, keywords, and geographic vicinity of your report.
            </p>
          </div>

          <!-- Side by side comparison overview -->
          <div style="margin-bottom: 20px;">
            <h4 style="margin: 0 0 10px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #6b7280;">Item Overview</h4>
            
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr style="background: #fef3c7; border: 1px solid #fde68a;">
                <td style="padding: 10px; font-weight: 700; color: #92400e; width: 30%;">Your Lost Item</td>
                <td style="padding: 10px; color: #78350f;"><strong>${lostItem.title}</strong><br/><span style="font-size: 11px; color: #b45309;">Reported at ${lostItem.location.name}</span></td>
              </tr>
              <tr style="background: #ecfdf5; border: 1px solid #a7f3d0;">
                <td style="padding: 10px; font-weight: 700; color: #065f46;">Found Item</td>
                <td style="padding: 10px; color: #064e3b;"><strong>${foundItem.title}</strong><br/><span style="font-size: 11px; color: #047857;">Found by ${foundItem.reporterName} near ${foundItem.location.name}</span></td>
              </tr>
            </table>
          </div>

          <!-- Matching Criteria Breakdown -->
          <div style="background: #f9fafb; border: 1px solid #f3f4f6; border-radius: 8px; padding: 14px; margin-bottom: 20px;">
            <h5 style="margin: 0 0 8px 0; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #4b5563;">Algorithmic Detection Criteria:</h5>
            <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #374151; line-height: 1.6;">
              ${reasons.map(r => `<li>${r}</li>`).join('')}
            </ul>
          </div>

          <!-- Ownership Evidence Challenge reminder -->
          <div style="background: #fdf2f8; border: 1px solid #fbcfe8; border-radius: 8px; padding: 14px; margin-bottom: 24px;">
            <strong style="color: #9d174d; font-size: 12px;">🔒 Ownership Evidence Verification:</strong>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #831843; line-height: 1.4;">
              To protect both parties, your contact details remain private. You can submit answers to the finder's Ownership Challenge in Findr before coordinating safe handover.
            </p>
          </div>

          <!-- CTA Button -->
          <div style="text-align: center; margin-bottom: 20px;">
            <a href="?item=${foundItem.id}" style="display: inline-block; background: #0f172a; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 13px; font-weight: 700; letter-spacing: 0.2px;">
              View Found Item & Submit Ownership Proof
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px; text-align: center; font-size: 11px; color: #64748b;">
          <p style="margin: 0;">Sent to ${recipient.email} based on your Findr Proximity Alert preferences.</p>
          <p style="margin: 4px 0 0 0;">Findr Community Safety & Recovery Service · Automated Notification System</p>
        </div>
      </div>
    `;

    const newEmail: SentEmail = {
      id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      to: recipient.email,
      toName: recipient.name,
      from: 'alerts@findr-recovery.org',
      subject,
      snippet,
      htmlContent,
      matchedItemId: foundItem.id,
      lostItemId: lostItem.id,
      matchScore,
      distanceKm,
      sentAt: new Date().toISOString(),
      isRead: false,
    };

    const emails = this.getSentEmails();
    emails.unshift(newEmail);
    setStored(STORAGE_KEYS.EMAILS, emails);

    console.log(`[MockEmailService] Dispatched proximity alert email to ${recipient.email}: "${subject}"`);
    return newEmail;
  }

  /**
   * Clear all simulated emails
   */
  static clearAll(): void {
    localStorage.removeItem(STORAGE_KEYS.EMAILS);
  }
}
