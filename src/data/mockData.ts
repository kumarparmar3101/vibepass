export type EventType = 'movie' | 'event' | 'sports' | 'stream' | 'play';

export interface Event {
  id: string;
  title: string;
  type: EventType;
  imageUrl: string;
  videoUrl?: string;
  trailerUrl?: string;
  date: string;
  location: string;
  price: number;
  rating?: number;
  format?: string[];
  genre: string[];
  language?: string;
  description: string;
  cast?: string[];
  duration?: string;
  isTrending?: boolean;
  status?: 'Scheduled' | 'Cancelled' | 'Postponed';
}

export const mockEvents: Event[] = [
  // --- MOVIES ---
  {
    id: '1',
    title: 'Dune: Part Two',
    type: 'movie',
    imageUrl: 'https://picsum.photos/seed/dune2/800/1200',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    date: 'Today, 7:30 PM',
    location: 'PVR IMAX, Nexus Mall',
    price: 15,
    rating: 4.8,
    format: ['IMAX', '4DX', '3D'],
    genre: ['Sci-Fi', 'Action'],
    description: 'Paul Atreides unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family.',
    cast: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson'],
    duration: '2h 46m',
    isTrending: true,
  },
  {
    id: '3',
    title: 'Deadpool & Wolverine',
    type: 'movie',
    imageUrl: 'https://picsum.photos/seed/deadpool/800/1200',
    date: 'Tomorrow, 9:00 PM',
    location: 'Cinepolis, Orion Mall',
    price: 12,
    rating: 4.5,
    format: ['2D', '3D', 'IMAX'],
    genre: ['Action', 'Comedy'],
    description: 'Wolverine is recovering from his injuries when he crosses paths with the loudmouth, Deadpool. They team up to defeat a common enemy.',
    cast: ['Ryan Reynolds', 'Hugh Jackman'],
    duration: '2h 7m',
  },
  {
    id: 'm3',
    title: 'Oppenheimer',
    type: 'movie',
    imageUrl: 'https://picsum.photos/seed/oppenheimer/800/1200',
    date: 'Fri, 23 Aug • 6:15 PM',
    location: 'AMC Theatres, City Center',
    price: 18,
    rating: 4.9,
    format: ['IMAX 70mm', 'Standard'],
    genre: ['Biography', 'Drama', 'History'],
    description: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.',
    cast: ['Cillian Murphy', 'Emily Blunt', 'Matt Damon'],
    duration: '3h 0m',
  },
  {
    id: 'm4',
    title: 'A Quiet Place: Day One',
    type: 'movie',
    imageUrl: 'https://picsum.photos/seed/quietplace/800/1200',
    date: 'Sat, 24 Aug • 10:30 PM',
    location: 'Regal Cinemas, Westend',
    price: 14,
    rating: 4.2,
    format: ['2D', 'Dolby Atmos'],
    genre: ['Horror', 'Sci-Fi'],
    description: 'Experience the day the world went quiet. A woman named Sam must survive an invasion in New York City by bloodthirsty alien creatures with ultrasonic hearing.',
    cast: ['Lupita Nyong\'o', 'Joseph Quinn'],
    duration: '1h 40m',
    isTrending: true,
  },

  // --- EVENTS ---
  {
    id: '2',
    title: 'Neon Nights Festival',
    type: 'event',
    imageUrl: 'https://picsum.photos/seed/concert1/800/1200',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    date: 'Sat, 24 Aug • 6:00 PM',
    location: 'Open Air Arena, Downtown',
    price: 45,
    genre: ['EDM', 'Live Music'],
    description: 'The biggest electronic dance music festival of the year featuring top international DJs, immersive light shows, and food stalls.',
    isTrending: true,
  },
  {
    id: '4',
    title: 'Standup Comedy: The Local Joke',
    type: 'event',
    imageUrl: 'https://picsum.photos/seed/comedy/800/1200',
    date: 'Sun, 25 Aug • 8:00 PM',
    location: 'The Laugh Club',
    price: 20,
    genre: ['Comedy'],
    description: 'A night of non-stop laughter with the best local comedians trying out their new material.',
  },
  {
    id: 'e3',
    title: 'Tech Innovators Summit 2024',
    type: 'event',
    imageUrl: 'https://picsum.photos/seed/techconf/800/1200',
    date: 'Mon, 2 Sep • 9:00 AM',
    location: 'Grand Convention Center',
    price: 150,
    genre: ['Technology', 'Networking'],
    description: 'Join industry leaders, founders, and engineers to discuss the future of AI, Web3, and sustainable tech.',
  },
  {
    id: 'e4',
    title: 'Street Food Carnival',
    type: 'event',
    imageUrl: 'https://picsum.photos/seed/foodfest/800/1200',
    date: 'Sat, 31 Aug • 12:00 PM',
    location: 'Central Park Grounds',
    price: 5,
    genre: ['Food', 'Festival'],
    description: 'Taste delicacies from over 50 local vendors. Live music, eating competitions, and fun for the whole family.',
    isTrending: true,
  },

  // --- SPORTS ---
  {
    id: '5',
    title: 'Premier League: City vs United',
    type: 'sports',
    imageUrl: 'https://picsum.photos/seed/football/800/1200',
    date: 'Sun, 1 Sep • 4:30 PM',
    location: 'City Stadium',
    price: 80,
    genre: ['Football', 'Live'],
    description: 'The highly anticipated derby match. Watch the two giants clash in this thrilling encounter.',
    isTrending: true,
  },
  {
    id: 's2',
    title: 'Pro Basketball Finals: Game 7',
    type: 'sports',
    imageUrl: 'https://picsum.photos/seed/basketball/800/1200',
    date: 'Wed, 28 Aug • 8:00 PM',
    location: 'National Arena',
    price: 120,
    genre: ['Basketball', 'Championship'],
    description: 'It all comes down to this. The final game of the championship series. Winner takes all.',
    isTrending: true,
  },
  {
    id: 's3',
    title: 'City Marathon 2024',
    type: 'sports',
    imageUrl: 'https://picsum.photos/seed/marathon/800/1200',
    date: 'Sun, 15 Sep • 5:30 AM',
    location: 'Downtown Starting Line',
    price: 35,
    genre: ['Running', 'Fitness'],
    description: 'Join thousands of runners for the annual city marathon. Includes 5K, 10K, Half, and Full marathon categories.',
  },

  // --- STREAM ---
  {
    id: 'st1',
    title: 'Global E-Sports Championship',
    type: 'stream',
    imageUrl: 'https://picsum.photos/seed/esports/800/1200',
    date: 'Fri, 30 Aug • 10:00 AM',
    location: 'Online Stream',
    price: 0,
    genre: ['Gaming', 'E-Sports'],
    description: 'Watch the top teams from around the world compete for a $5M prize pool in the ultimate MOBA tournament.',
    isTrending: true,
  },
  {
    id: 'st2',
    title: 'Masterclass: Photography Basics',
    type: 'stream',
    imageUrl: 'https://picsum.photos/seed/photography/800/1200',
    date: 'Tue, 27 Aug • 6:00 PM',
    location: 'Zoom Webinar',
    price: 25,
    genre: ['Education', 'Workshop'],
    description: 'Learn the fundamentals of composition, lighting, and editing from award-winning photographer Jane Doe.',
  },
  {
    id: 'st3',
    title: 'Acoustic Sessions: Live from Home',
    type: 'stream',
    imageUrl: 'https://picsum.photos/seed/acoustic/800/1200',
    date: 'Thu, 29 Aug • 9:00 PM',
    location: 'YouTube Live',
    price: 10,
    genre: ['Music', 'Live Stream'],
    description: 'An intimate acoustic performance by indie artist John Smith, broadcasting live from his living room.',
  },

  // --- PLAYS ---
  {
    id: 'p1',
    title: 'Hamilton: An American Musical',
    type: 'play',
    imageUrl: 'https://picsum.photos/seed/hamilton/800/1200',
    date: 'Fri, 6 Sep • 7:00 PM',
    location: 'Majestic Theatre',
    price: 150,
    rating: 4.9,
    genre: ['Musical', 'History'],
    description: 'The story of America then, told by America now. Featuring a score that blends hip-hop, jazz, R&B and Broadway.',
    cast: ['Lin-Manuel Miranda', 'Leslie Odom Jr.'],
    duration: '2h 45m',
    isTrending: true,
  },
  {
    id: 'p2',
    title: 'The Phantom of the Opera',
    type: 'play',
    imageUrl: 'https://picsum.photos/seed/phantom/800/1200',
    date: 'Sat, 7 Sep • 2:00 PM',
    location: 'Royal Opera House',
    price: 95,
    rating: 4.7,
    genre: ['Musical', 'Romance'],
    description: 'A masked figure who lurks beneath the catacombs of the Paris Opera House falls madly in love with an innocent young soprano.',
    duration: '2h 30m',
  },
  {
    id: 'p3',
    title: 'Macbeth - Modern Adaptation',
    type: 'play',
    imageUrl: 'https://picsum.photos/seed/macbeth/800/1200',
    date: 'Wed, 4 Sep • 8:00 PM',
    location: 'The Globe Studio',
    price: 40,
    rating: 4.4,
    genre: ['Drama', 'Tragedy'],
    description: 'A gripping, modern-day retelling of Shakespeare\'s classic tale of ambition, murder, and madness set in a corporate boardroom.',
    duration: '2h 10m',
  }
];

export const categories = [
  { id: 'movies', name: 'Movies', icon: 'Film' },
  { id: 'events', name: 'Events', icon: 'Music' },
  { id: 'sports', name: 'Sports', icon: 'Trophy' },
  { id: 'plays', name: 'Plays', icon: 'Theater' },
];
