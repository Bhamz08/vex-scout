import type { Location } from '../types';

/** Fictional team names, organizations and places for demo data. Any resemblance to real teams is accidental. */

export const TEAM_NAMES = [
  'Gear Grinders', 'Torque Tide', 'Byte Force', 'Circuit Breakers', 'Iron Owls', 'Pin Pushers', 'Toggle Titans',
  'Midfield Mayhem', 'Quantum Quokkas', 'Stack Attack', 'Neon Nomads', 'Sprocket Rockets', 'Polar Pistons',
  'Delta Drive', 'Cobalt Crew', 'Static Shock', 'Velocity Vipers', 'Lunar Lynx', 'Omni Wheels', 'Red Shift',
  'Blue Print', 'Axle Grease', 'Chain Reaction', 'Pixel Pilots', 'Servo Squad', 'Hex Key Heroes', 'Thunder Bolts',
  'Cyber Cedars', 'Kinetic Koalas', 'Rapid Ratchets', 'Granite Gears', 'Solar Spokes', 'Echo Engineers',
  'Prism Bots', 'Rogue Rivets', 'Atlas Automata', 'Vector Vanguard', 'Nova Nuts', 'Zephyr Zero', 'Mako Motors',
  'Robo Raccoons', 'Clockwork Comets', 'Bolt Brigade', 'Flux Capacitors', 'Ember Engines', 'Orbit Order',
  'Talon Tech', 'Wired Wolves', 'Aurora Assembly', 'Summit Spark', 'Cascade Coders', 'Fjord Force',
] as const;

export const ORGANIZATIONS = [
  'Riverside High School', 'Northgate Academy', 'Lakeview STEM Center', 'Westbrook Middle School', 'Harbor Prep',
  'Cedar Valley High', 'Maple Ridge Secondary', 'Summit Robotics Club', 'Eastwood Collegiate', 'Pinecrest Middle',
  'Bayside Technical Institute', 'Ironwood High School', 'Silver Lake Academy', 'Granite Hills High',
] as const;

export const UNIVERSITIES = [
  'Northfield University', 'Pacific Institute of Technology', 'Lakeshore State University', 'Universidad del Valle',
  'Maple Leaf Polytechnic', 'Southern Cross University of Engineering',
] as const;

export const PLACES: Location[] = [
  { city: 'Austin', region: 'Texas', country: 'United States' },
  { city: 'San Jose', region: 'California', country: 'United States' },
  { city: 'Columbus', region: 'Ohio', country: 'United States' },
  { city: 'Seattle', region: 'Washington', country: 'United States' },
  { city: 'Orlando', region: 'Florida', country: 'United States' },
  { city: 'Toronto', region: 'Ontario', country: 'Canada' },
  { city: 'Vancouver', region: 'British Columbia', country: 'Canada' },
  { city: 'Monterrey', region: 'Nuevo León', country: 'Mexico' },
  { city: 'Auckland', region: 'Auckland', country: 'New Zealand' },
  { city: 'Shenzhen', region: 'Guangdong', country: 'China' },
  { city: 'Singapore', region: 'Singapore', country: 'Singapore' },
  { city: 'Manchester', region: 'England', country: 'United Kingdom' },
];

export const AWARD_TITLES = {
  excellence: 'Excellence Award',
  champions: 'Tournament Champions',
  finalists: 'Tournament Finalists',
  skills: 'Robot Skills Champion',
  design: 'Design Award',
  think: 'Think Award',
  innovate: 'Innovate Award',
  amaze: 'Amaze Award',
  judges: 'Judges Award',
} as const;
