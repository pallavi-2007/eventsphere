import mongoose from 'mongoose';
import { config } from '../config/env.js';
import { User } from '../models/User.js';
import { Event } from '../models/Event.js';

export const demoAccounts = [
  {
    name: 'Demo Organizer',
    email: 'organizer@eventsphere.com',
    password: 'Password123!',
    role: 'organizer'
  },
  {
    name: 'Demo Attendee',
    email: 'user@eventsphere.com',
    password: 'Password123!',
    role: 'user'
  },
  {
    name: 'Demo Gate Staff',
    email: 'gate@eventsphere.com',
    password: 'Password123!',
    role: 'gate'
  }
];

export const sampleEvents = (organizerId) => [
  {
    title: 'Live Music Night',
    description: 'An unforgettable night with your favorite artists, food stalls, and amazing vibes. Don\'t miss this premier live music experience!',
    category: 'Music',
    dateTime: new Date('2026-11-22T18:00:00.000Z'),
    venue: 'Sardar Patel Stadium, Ahmedabad',
    bannerUrl: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1200&q=80',
    organizer: organizerId,
    ticketTypes: [
      {
        name: 'General Admission',
        price: 799,
        quantity: 500,
        remainingQuantity: 500,
        holdQuantity: 0
      },
      {
        name: 'VIP Pass',
        price: 1999,
        quantity: 100,
        remainingQuantity: 100,
        holdQuantity: 0
      }
    ],
    status: 'published'
  },
  {
    title: 'Tech & AI Summit 2026',
    description: 'Join industry pioneers, researchers, and innovators discussing generative AI, agents, distributed systems, and real-time computing.',
    category: 'Conferences',
    dateTime: new Date('2026-11-15T09:00:00.000Z'),
    venue: 'Exhibition Center, Vadodara',
    bannerUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
    organizer: organizerId,
    ticketTypes: [
      {
        name: 'Standard Conference Pass',
        price: 499,
        quantity: 350,
        remainingQuantity: 350,
        holdQuantity: 0
      },
      {
        name: 'VIP Executive Access',
        price: 1499,
        quantity: 60,
        remainingQuantity: 60,
        holdQuantity: 0
      }
    ],
    status: 'published'
  },
  {
    title: 'Web Development Workshop',
    description: 'Intensive, hands-on masterclass covering React 19, Node.js concurrency, Redis caching, and real-time web applications.',
    category: 'Workshops',
    dateTime: new Date('2026-11-28T10:00:00.000Z'),
    venue: 'Tech Innovation Hub, Ahmedabad',
    bannerUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
    organizer: organizerId,
    ticketTypes: [
      {
        name: 'Early Bird Pass',
        price: 299,
        quantity: 75,
        remainingQuantity: 75,
        holdQuantity: 0
      },
      {
        name: 'Regular Developer Seat',
        price: 599,
        quantity: 125,
        remainingQuantity: 125,
        holdQuantity: 0
      }
    ],
    status: 'published'
  },
  {
    title: 'Food & Culture Fest',
    description: 'Experience regional delicacies, live artisan cooking demonstrations, music stages, and cultural exhibitions along the riverfront.',
    category: 'Festivals',
    dateTime: new Date('2026-12-05T16:00:00.000Z'),
    venue: 'Riverfront Promenade, Surat',
    bannerUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80',
    organizer: organizerId,
    ticketTypes: [
      {
        name: 'Fest General Entry',
        price: 399,
        quantity: 800,
        remainingQuantity: 800,
        holdQuantity: 0
      },
      {
        name: 'Gourmet VIP Tasting Pass',
        price: 1299,
        quantity: 120,
        remainingQuantity: 120,
        holdQuantity: 0
      }
    ],
    status: 'published'
  },
  {
    title: 'Stand-up Comedy Showcase',
    description: 'An evening of laughs with top touring stand-up comedians performing live in an intimate theatre atmosphere.',
    category: 'Comedy',
    dateTime: new Date('2026-12-12T19:30:00.000Z'),
    venue: 'Laugh Lounge Arena, Pune',
    bannerUrl: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&w=1200&q=80',
    organizer: organizerId,
    ticketTypes: [
      {
        name: 'Balcony Seating',
        price: 499,
        quantity: 200,
        remainingQuantity: 200,
        holdQuantity: 0
      },
      {
        name: 'Front Row Seats',
        price: 899,
        quantity: 40,
        remainingQuantity: 40,
        holdQuantity: 0
      }
    ],
    status: 'published'
  },
  {
    title: 'Startup Pitch & Venture Gala',
    description: 'High-energy founder pitches in front of angel investors, venture capitalists, and ecosystem mentors followed by a networking dinner.',
    category: 'Networking',
    dateTime: new Date('2026-12-18T17:00:00.000Z'),
    venue: 'Grand Hyatt Ballroom, Bengaluru',
    bannerUrl: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=80',
    organizer: organizerId,
    ticketTypes: [
      {
        name: 'Founder Delegate Pass',
        price: 1199,
        quantity: 150,
        remainingQuantity: 150,
        holdQuantity: 0
      },
      {
        name: 'Investor & Partner Access',
        price: 2999,
        quantity: 50,
        remainingQuantity: 50,
        holdQuantity: 0
      }
    ],
    status: 'published'
  }
];

export const seedDatabase = async () => {
  if (!config.mongoUri) {
    console.error('[Seed Error] MONGODB_URI is not set in server/.env. Please configure your MongoDB Atlas connection string before running the seed script.');
    process.exit(1);
  }

  try {
    console.log('[Seed] Connecting to MongoDB Atlas...');
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`[Seed] Connected to database: ${mongoose.connection.name}`);

    console.log('[Seed] Clearing existing Users and Events...');
    await User.deleteMany({});
    await Event.deleteMany({});

    console.log('[Seed] Creating demo accounts...');
    const createdUsers = [];
    for (const acc of demoAccounts) {
      const user = await User.create(acc);
      createdUsers.push(user);
      console.log(`  ✓ Created [${user.role}]: ${user.email} (Password: ${acc.password})`);
    }

    const organizerUser = createdUsers.find(u => u.role === 'organizer');

    console.log('[Seed] Creating sample events...');
    const events = sampleEvents(organizerUser?._id);
    for (const evt of events) {
      const createdEvt = await Event.create(evt);
      console.log(`  ✓ Created event: "${createdEvt.title}" (${createdEvt.category}) with ${createdEvt.ticketTypes.length} ticket tiers`);
    }

    console.log('[Seed] Database successfully seeded with 3 demo accounts and 6 sample events!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error] Failed to seed database:', error.message);
    process.exit(1);
  }
};

// Run directly if invoked via CLI
if (process.argv[1]?.endsWith('seed.js')) {
  seedDatabase();
}
