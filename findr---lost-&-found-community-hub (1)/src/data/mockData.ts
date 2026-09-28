import { Item, User, ClaimVerification, ChatMessage, MatchAlert } from '../types';

// Import generated images
import airpodsImg from '../assets/images/lost_airpods_pro_1790511974671.jpg';
import walletImg from '../assets/images/found_leather_wallet_1790511997499.jpg';
import retrieverImg from '../assets/images/lost_golden_retriever_1790512011538.jpg';
import keysImg from '../assets/images/found_keys_lanyard_1790512023418.jpg';

export const DEMO_USERS: User[] = [
  {
    id: 'user_alex',
    name: 'Alex Morgan',
    email: 'alex.m@campus.edu',
    phone: '+91 98101 23456',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    rating: 4.9,
    returnsCompleted: 3,
    location: {
      name: 'New Delhi, India',
      lat: 28.6139,
      lng: 77.2090
    }
  },
  {
    id: 'user_david',
    name: 'David Chen',
    email: 'david.chen@gmail.com',
    phone: '+91 98102 34567',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    rating: 5.0,
    returnsCompleted: 7,
    location: {
      name: 'Connaught Place Central Hub',
      lat: 28.6315,
      lng: 77.2167
    }
  },
  {
    id: 'user_maya',
    name: 'Maya Lin',
    email: 'maya.lin@metro.org',
    phone: '+91 98103 45678',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
    rating: 4.8,
    returnsCompleted: 2,
    location: {
      name: 'India Gate Central Lawns',
      lat: 28.6129,
      lng: 77.2295
    }
  },
  {
    id: 'user_sam',
    name: 'Sam Taylor',
    email: 'sam.taylor@community.net',
    phone: '+91 98104 56789',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    rating: 4.7,
    returnsCompleted: 1,
    location: {
      name: 'Lodhi Garden Heritage Park',
      lat: 28.5931,
      lng: 77.2197
    }
  }
];

export const INITIAL_ITEMS: Item[] = [
  {
    id: 'item_lost_1',
    type: 'lost',
    title: 'White Wireless Earbuds & Charging Case (AirPods Pro)',
    description: 'Lost my white wireless earbuds while studying near the central reading zone in Connaught Place library. Case has a small green silicon speckle mark near the hinge.',
    category: 'electronics',
    date: '2026-09-26T14:30:00Z',
    location: {
      name: 'Connaught Place Inner Circle Study Hub',
      lat: 28.6315,
      lng: 77.2167,
      address: 'Block A, Connaught Place, New Delhi'
    },
    imageUrl: airpodsImg,
    reporterId: 'user_alex',
    reporterName: 'Alex Morgan',
    reporterAvatar: DEMO_USERS[0].avatar,
    reporterContact: 'alex.m@campus.edu',
    status: 'active',
    tags: ['airpods', 'white', 'earbuds', 'electronics', 'case', 'apple'],
    reward: '₹2,500 Reward',
    createdAt: '2026-09-26T16:00:00Z'
  },
  {
    id: 'item_found_1',
    type: 'found',
    title: 'White Bluetooth Earbuds in Charging Case',
    description: 'Found a pair of white wireless earbuds in their charging case left on a bench outside the Central Plaza. In clean working condition, keeping them safely powered down.',
    category: 'electronics',
    date: '2026-09-26T16:15:00Z',
    location: {
      name: 'Connaught Place Central Park Bench',
      lat: 28.6320,
      lng: 77.2170,
      address: 'Central Park, Connaught Place, New Delhi'
    },
    imageUrl: airpodsImg,
    reporterId: 'user_david',
    reporterName: 'David Chen',
    reporterAvatar: DEMO_USERS[1].avatar,
    reporterContact: 'david.chen@gmail.com',
    evidenceQuestion: 'What unique engraving or Bluetooth pairing name does this unit show when opened?',
    evidenceHint: 'Provide either the serial initials, device name, or describe the subtle speckle mark on the casing.',
    status: 'active',
    tags: ['airpods', 'white', 'earbuds', 'charging case', 'bluetooth', 'audio'],
    createdAt: '2026-09-26T16:45:00Z'
  },
  {
    id: 'item_found_2',
    type: 'found',
    title: 'Vintage Brown Leather Bifold Wallet',
    description: 'Found a brown genuine leather wallet sitting on the wooden bench overlooking the flower garden in Lodhi Garden. Contains some metro cards and receipts.',
    category: 'wallets_bags',
    date: '2026-09-25T11:20:00Z',
    location: {
      name: 'Lodhi Garden Rose Walk Bench',
      lat: 28.5931,
      lng: 77.2197,
      address: 'Lodhi Road, New Delhi'
    },
    imageUrl: walletImg,
    reporterId: 'user_maya',
    reporterName: 'Maya Lin',
    reporterAvatar: DEMO_USERS[2].avatar,
    reporterContact: 'maya.lin@metro.org',
    evidenceQuestion: 'What are the initials or name printed on the internal transit metro card?',
    evidenceHint: 'State the cardholder first name or describe the specific membership barcode inside.',
    status: 'active',
    tags: ['wallet', 'leather', 'brown', 'bifold', 'cards', 'cash'],
    createdAt: '2026-09-25T12:00:00Z'
  },
  {
    id: 'item_lost_2',
    type: 'lost',
    title: 'Friendly Golden Retriever Dog ("Buster")',
    description: 'Our 3-year-old golden retriever Buster slipped out of his leash near India Gate Lawns. Wearing a bright red woven collar with a silver bell. Very sweet, answers to whistle.',
    category: 'pets',
    date: '2026-09-26T18:00:00Z',
    location: {
      name: 'India Gate Lawns (C-Hexagon)',
      lat: 28.6129,
      lng: 77.2295,
      address: 'Rajpath, India Gate, New Delhi'
    },
    imageUrl: retrieverImg,
    reporterId: 'user_sam',
    reporterName: 'Sam Taylor',
    reporterAvatar: DEMO_USERS[3].avatar,
    reporterContact: 'sam.taylor@community.net',
    status: 'active',
    tags: ['dog', 'golden retriever', 'pet', 'red collar', 'buster'],
    reward: '₹10,000 Reward',
    createdAt: '2026-09-26T18:30:00Z'
  },
  {
    id: 'item_found_3',
    type: 'found',
    title: 'House Keys with Car Remote Fob on Navy Lanyard',
    description: 'Found a set of 3 bronze house keys with an electronic push-button car clicker on a navy woven nylon lanyard resting near the ITO transit entrance.',
    category: 'keys',
    date: '2026-09-27T08:15:00Z',
    location: {
      name: 'ITO Transit Plaza Bike Racks',
      lat: 28.6290,
      lng: 77.2340,
      address: 'ITO Crossing, New Delhi'
    },
    imageUrl: keysImg,
    reporterId: 'user_david',
    reporterName: 'David Chen',
    reporterAvatar: DEMO_USERS[1].avatar,
    reporterContact: 'david.chen@gmail.com',
    evidenceQuestion: 'What car brand emblem is stamped on the key fob, and what miniature charm is attached?',
    evidenceHint: 'Specify the car brand and charm shape/color.',
    status: 'active',
    tags: ['keys', 'lanyard', 'car fob', 'keychain', 'brass keys'],
    createdAt: '2026-09-27T08:45:00Z'
  }
];

export const INITIAL_CLAIMS: ClaimVerification[] = [
  {
    id: 'claim_sample_1',
    itemId: 'item_found_1',
    itemTitle: 'White Bluetooth Earbuds in Charging Case',
    itemType: 'found',
    finderId: 'user_david',
    claimantId: 'user_alex',
    claimantName: 'Alex Morgan',
    claimantAvatar: DEMO_USERS[0].avatar,
    claimantContact: 'alex.m@campus.edu',
    questionAsked: 'What unique engraving or Bluetooth pairing name does this unit show when opened?',
    evidenceAnswer: 'The Bluetooth device name broadcasts as "Alex’s AirPods Pro (Gen 2)", and there is a tiny speck of green paint on the lower right corner of the lid hinge.',
    status: 'pending',
    createdAt: '2026-09-26T17:15:00Z'
  }
];

export const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg_1',
    itemId: 'item_found_1',
    senderId: 'system',
    senderName: 'Findr Safety System',
    senderAvatar: '',
    text: '🔒 Secure return chat initiated. For maximum safety, arrange to exchange items at a designated Safe Exchange Zone such as a campus front desk or police station lobby during daylight hours.',
    timestamp: '2026-09-26T17:30:00Z',
    isSystemNotice: true
  },
  {
    id: 'msg_2',
    itemId: 'item_found_1',
    senderId: 'user_alex',
    senderName: 'Alex Morgan',
    senderAvatar: DEMO_USERS[0].avatar,
    text: 'Hi David! Thank you so much for picking these up. I was panicked after leaving the library. I submitted the verification answer with the Bluetooth name.',
    timestamp: '2026-09-26T17:32:00Z'
  },
  {
    id: 'msg_3',
    itemId: 'item_found_1',
    senderId: 'user_david',
    senderName: 'David Chen',
    senderAvatar: DEMO_USERS[1].avatar,
    text: 'Hey Alex! Yes, the Bluetooth name matches perfectly and the green hinge speckle confirms it. Happy to get them back to you!',
    timestamp: '2026-09-26T17:35:00Z'
  },
  {
    id: 'msg_4',
    itemId: 'item_found_1',
    senderId: 'user_david',
    senderName: 'David Chen',
    senderAvatar: DEMO_USERS[1].avatar,
    text: 'I will be at the Central Library Information Desk today from 2:00 PM to 4:00 PM. Does that work for a quick handover?',
    timestamp: '2026-09-26T17:36:00Z',
    meetingProposal: {
      location: 'Central Library Information Desk (1st Floor)',
      proposedTime: 'Today at 2:00 PM - 4:00 PM',
      isAccepted: true
    }
  }
];

export const INITIAL_MATCH_ALERTS: MatchAlert[] = [
  {
    id: 'match_auto_1',
    recipientId: 'user_alex',
    lostItemId: 'item_lost_1',
    foundItemId: 'item_found_1',
    lostItemTitle: 'White Wireless Earbuds (AirPods Pro)',
    foundItemTitle: 'White Bluetooth Earbuds in Charging Case',
    matchScore: 95,
    distanceKm: 0.1,
    reasons: [
      '✓ Verified Perfect Visual Match (96%)',
      'Matching category: electronics',
      'Shared identifiers: "airpods, white, earbuds"',
      'Within 100m proximity (0.1 km away)',
      'Timeline aligns within discovery window'
    ],
    isVisualMatchVerified: true,
    visualMatchScore: 96,
    visualMatchReason: 'Gemini Multimodal inspection confirmed 100% visual match: Both media samples show identical Apple AirPods Pro 2 white glossy wireless case, horizontal geometry, and silicone ear tips.',
    visualEvidence: [
      'Identical Apple AirPods Pro 2 case form factor & dimensions',
      'Matching glossy pure white polycarbonate finish',
      'Matching black speaker grill & lanyard loop cutout'
    ],
    discrepancies: ['None detected'],
    mediaTypeMatched: 'image',
    isRead: false,
    createdAt: '2026-09-26T16:50:00Z'
  }
];
