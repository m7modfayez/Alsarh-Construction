export interface Project {
  id: string;
  title: string;
  category: 'all' | 'residential' | 'commercial' | 'industrial' | 'government';
  image: string;
  description: string;
  location: string;
  year: number;
  gallery: string[];
}

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface TeamMember {
  id: string;
  name: string;
  title: string;
  image: string;
}

export interface Statistic {
  number: string;
  label: string;
}

export const projects: Project[] = [
  {
    id: '1',
    title: 'Modern Office Complex',
    category: 'commercial',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop',
    description: 'A contemporary office building featuring sustainable design principles and state-of-the-art facilities.',
    location: 'Downtown District',
    year: 2023,
    gallery: [
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop',
    ],
  },
  {
    id: '2',
    title: 'Luxury Residential Tower',
    category: 'residential',
    image: 'https://images.unsplash.com/photo-1500595046891-9c2bcfc83f6b?w=600&h=400&fit=crop',
    description: 'An elegant residential tower offering premium apartments with panoramic city views.',
    location: 'Marina District',
    year: 2023,
    gallery: [
      'https://images.unsplash.com/photo-1500595046891-9c2bcfc83f6b?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1494627314577-a87b1ef2b742?w=800&h=600&fit=crop',
    ],
  },
  {
    id: '3',
    title: 'Industrial Manufacturing Plant',
    category: 'industrial',
    image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&h=400&fit=crop',
    description: 'A state-of-the-art manufacturing facility with advanced automation systems.',
    location: 'Industrial Zone',
    year: 2022,
    gallery: [
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&h=600&fit=crop',
    ],
  },
  {
    id: '4',
    title: 'Government Administration Building',
    category: 'government',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop',
    description: 'A prestigious government building combining classical architecture with modern facilities.',
    location: 'Civic Center',
    year: 2022,
    gallery: [
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop',
    ],
  },
  {
    id: '5',
    title: 'Contemporary Art Museum',
    category: 'commercial',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop',
    description: 'An innovative cultural space designed to showcase contemporary artwork.',
    location: 'Cultural Quarter',
    year: 2023,
    gallery: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1494627314577-a87b1ef2b742?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop',
    ],
  },
  {
    id: '6',
    title: 'Smart Home Development',
    category: 'residential',
    image: 'https://images.unsplash.com/photo-1494627314577-a87b1ef2b742?w=600&h=400&fit=crop',
    description: 'A modern residential community featuring smart home technology and sustainable living.',
    location: 'Tech Park District',
    year: 2023,
    gallery: [
      'https://images.unsplash.com/photo-1494627314577-a87b1ef2b742?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1500595046891-9c2bcfc83f6b?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop',
    ],
  },
  {
    id: '7',
    title: 'Commercial Retail Center',
    category: 'commercial',
    image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&h=400&fit=crop',
    description: 'A premium shopping destination with modern retail spaces and entertainment venues.',
    location: 'Shopping District',
    year: 2022,
    gallery: [
      'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop',
    ],
  },
  {
    id: '8',
    title: 'Eco-Friendly Campus',
    category: 'government',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop',
    description: 'A sustainable educational campus designed with environmental consciousness.',
    location: 'Education Zone',
    year: 2023,
    gallery: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop',
    ],
  },
  {
    id: '9',
    title: 'Industrial Logistics Hub',
    category: 'industrial',
    image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=600&h=400&fit=crop',
    description: 'A cutting-edge logistics facility with advanced warehousing and distribution systems.',
    location: 'Port District',
    year: 2022,
    gallery: [
      'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&h=600&fit=crop',
    ],
  },
];

export const services: Service[] = [
  {
    id: '1',
    title: 'Architectural Design',
    description: 'Innovative design solutions tailored to your vision and requirements.',
    icon: '🏗️',
  },
  {
    id: '2',
    title: 'Project Management',
    description: 'Expert oversight ensuring projects stay on schedule and within budget.',
    icon: '📋',
  },
  {
    id: '3',
    title: 'Construction Services',
    description: 'High-quality construction execution with attention to every detail.',
    icon: '🔨',
  },
  {
    id: '4',
    title: 'Sustainability',
    description: 'Eco-friendly building practices and green certification guidance.',
    icon: '🌱',
  },
];

export const statistics: Statistic[] = [
  {
    number: '+50',
    label: 'Completed Projects',
  },
  {
    number: '+200',
    label: 'Satisfied Clients',
  },
  {
    number: '+15',
    label: 'Years of Experience',
  },
];

export const teamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Ahmed Hassan',
    title: 'Chief Architect',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop',
  },
  {
    id: '2',
    name: 'Fatima Al-Mansouri',
    title: 'Project Director',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop',
  },
  {
    id: '3',
    name: 'Mohammed Al-Rashid',
    title: 'Senior Engineer',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop',
  },
  {
    id: '4',
    name: 'Layla Ahmed',
    title: 'Design Lead',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop',
  },
  {
    id: '5',
    name: 'Omar Khalil',
    title: 'Construction Manager',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop',
  },
];

export const partnerLogos = [
  { name: 'Adidas', logo: '⚽' },
  { name: 'Architecture Alliance', logo: '🏢' },
  { name: 'Green Build', logo: '🌿' },
  { name: 'Tech Solutions', logo: '⚙️' },
  { name: 'Design Hub', logo: '🎨' },
  { name: 'Global Partners', logo: '🌍' },
];
