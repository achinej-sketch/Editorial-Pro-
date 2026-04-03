
export interface Blog {
  id: string;
  name: string;
  url: string;
  sitemap: string;
  targetCadence: number; // articles per week
  language: 'fr' | 'en';
  description: string;
}

export interface AnalyticsData {
  blogId: string;
  pagePath: string;
  views: number;
  engagementTime: number; // seconds
}

export interface AdSenseData {
  url: string;
  date: string;
  country: string;
  revenue: number;
  pageViews: number;
  rpm: number;
  clicks: number;
}

export interface BriefingReport {
  blogStatus: {
    blog: string;
    lastArticle: string;
    theme: string;
    daysAgo: number;
    status: 'ok' | 'retard';
  }[];
  analyticsAlerts: {
    blog: string;
    article: string;
    views: number;
    engagement: number;
    signal: string;
  }[];
  topArticles: {
    article: string;
    revenue: number;
    rpmFR: number;
    rpmOther: number;
    signal: string;
  }[];
  priorities: {
    blog: string;
    title: string;
    angle: string;
    why: string;
    illustration: string;
  }[];
  recentlyCovered: {
    blog: string;
    theme: string;
    daysAgo: number;
  }[];
  bonusSuggestions: string[];
  recycling: {
    source: string;
    target: string;
    originalTitle: string;
    suggestedAngle: string;
  }[];
}
