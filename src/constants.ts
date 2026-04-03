import { Blog } from './types';

export const BLOGS: Blog[] = [
  {
    id: 'astucieusement',
    name: 'astucieusement.com',
    url: 'https://www.astucieusement.com',
    sitemap: 'https://www.astucieusement.com/post-sitemap.xml',
    targetCadence: 3,
    language: 'fr',
    description: 'lifestyle / beauté / maison'
  },
  {
    id: 'quandonestmaman',
    name: 'quandonestmaman.fr',
    url: 'https://www.quandonestmaman.fr',
    sitemap: 'https://www.quandonestmaman.fr/post-sitemap.xml',
    targetCadence: 2,
    language: 'fr',
    description: 'lifestyle / mode / maison / deco / hacks'
  },
  {
    id: 'tutoriel-iphone',
    name: 'tutoriel-iphone.fr',
    url: 'https://www.tutoriel-iphone.fr',
    sitemap: 'https://www.tutoriel-iphone.fr/post-sitemap.xml',
    targetCadence: 2,
    language: 'fr',
    description: 'wallpapers / accessoires / lifestyle iPhone'
  },
  {
    id: 'en-astucieusement',
    name: 'en.astucieusement.com',
    url: 'https://www.en.astucieusement.com',
    sitemap: 'https://www.en.astucieusement.com/post-sitemap.xml',
    targetCadence: 1,
    language: 'en',
    description: 'lifestyle / maison (phase de démarrage)'
  }
];

export const HIGH_CPC_NICHES = [
  'Coiffure / coloration après 50 ans',
  'Coupes de cheveux tendance (cheveux fins, gris, frange, bixie)',
  'Mode grande taille / curvy',
  'Soins anti-âge / beauté naturelle',
  'Décoration intérieure premium / tendances deco',
  'Mode et style vestimentaire (French girl, looks chic, outfits printemps)',
  'Ongles / nail art tendance',
  'Accessoires de mode'
];

export const LOW_CPC_NICHES = [
  'Recettes de cuisine',
  'Astuces ménage / nettoyage',
  'DIY basique / réparation textile',
  "Remèdes de grand-mère génériques",
  "Contenu purement informatif sans intention d'achat"
];
