/**
 * Project type definition
 */
export interface Project {
  id: string;
  title: string;
  category: 'residential' | 'commercial' | 'industrial' | 'government';
  image: string;
  description: string;
  location: string;
  year: number;
  gallery: string[];
  scope_of_work?: string[];
  is_featured?: boolean;
}

/**
 * Service type definition
 */
export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
}

/**
 * Team member type definition
 */
export interface TeamMember {
  id: string;
  name: string;
  title: string;
  image: string;
}

/**
 * Statistic type definition
 */
export interface Statistic {
  number: string;
  label: string;
}

/**
 * Hero props type definition
 */
export interface HeroProps {
  title: string;
  subtitle?: string;
  backgroundImage?: string;
  cta?: {
    text: string;
    href: string;
  };
}

/**
 * Service card props type definition
 */
export interface ServiceCardProps {
  service: Service;
}

/**
 * Project card props type definition
 */
export interface ProjectCardProps {
  project: Project;
}

/**
 * Project gallery props type definition
 */
export interface ProjectGalleryProps {
  images: string[];
  title: string;
}

/**
 * Contact form data type definition
 */
export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}
