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
    title: 'inilla Residence',
    category: 'residential',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&h=400&fit=crop',
    description: ' luxury residential compound featuring modern villas with private gardens and premium amenities in New Cairo.',
    location: '6th of October City',
    year: 2023,
    gallery: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600607687942-ce8236c918db?w=800&h=600&fit=crop',
    ],
  },
  {
    id: '2',
    title: 'Nile Business Tower',
    category: 'commercial',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop',
    description: 'A 25-story commercial office tower with advanced business facilities and panoramic Nile views in Cairo.',
    location: 'Cairo Downtown',
    year: 2023,
    gallery: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
    ],
  },
  {
    id: '3',
    title: 'Alexandria Port Warehouse',
    category: 'industrial',
    image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&h=400&fit=crop',
    description: 'Modern industrial warehouse complex with advanced logistics systems and storage facilities at Alexandria Port.',
    location: 'Alexandria Port',
    year: 2022,
    gallery: [
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&h=600&fit=crop',
    ],
  },
  {
    id: '4',
    title: 'Ministry of Technology Building',
    category: 'government',
    image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&h=400&fit=crop',
    description: 'State-of-the-art government facility housing technology departments with modern infrastructure and security systems.',
    location: 'New Administrative Capital',
    year: 2022,
    gallery: [
      'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1494627314577-a87b1ef2b742?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
    ],
  },
  {
    id: '5',
    title: 'Cairo Mall Expansion',
    category: 'commercial',
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop',
    description: 'Major expansion of Cairo Mall featuring new retail spaces, entertainment zones, and modern parking facilities.',
    location: 'Nasr City',
    year: 2023,
    gallery: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600607687942-ce8236c918db?w=800&h=600&fit=crop',
    ],
  },
  {
    id: '6',
    title: 'Garden City Apartments',
    category: 'residential',
    image: 'https://images.unsplash.com/photo-1600607687942-ce8236c918db?w=600&h=400&fit=crop',
    description: 'Premium residential apartment complex with modern amenities, swimming pools, and landscaped gardens in Garden City.',
    location: 'Garden City, Cairo',
    year: 2023,
    gallery: [
      'https://images.unsplash.com/photo-1600607687942-ce8236c918db?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop',
    ],
  },
  {
    id: '7',
    title: 'Suez Canal Logistics Center',
    category: 'industrial',
    image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=600&h=400&fit=crop',
    description: 'Strategic logistics and distribution center serving Suez Canal operations with advanced cargo handling facilities.',
    location: 'Suez Canal Zone',
    year: 2022,
    gallery: [
      'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&h=600&fit=crop',
    ],
  },
  {
    id: '8',
    title: 'Cairo University Faculty Building',
    category: 'government',
    image: 'https://images.unsplash.com/photo-1494627314577-a87b1ef2b742?w=600&h=400&fit=crop',
    description: 'Modern educational facility with advanced lecture halls, laboratories, and administrative spaces for Cairo University.',
    location: 'Giza, Cairo',
    year: 2023,
    gallery: [
      'https://images.unsplash.com/photo-1494627314577-a87b1ef2b742?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop',
    ],
  },
  {
    id: '9',
    title: 'Hurghada Beach Resort',
    category: 'commercial',
    image: 'https://images.unsplash.com/photo-1571003123894-1f05e4d68dfe?w=600&h=400&fit=crop',
    description: 'Luxury beachfront resort development with hotels, restaurants, and recreational facilities on the Red Sea coast.',
    location: 'Hurghada, Red Sea',
    year: 2022,
    gallery: [
      'https://images.unsplash.com/photo-1571003123894-1f05e4d68dfe?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop',
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
