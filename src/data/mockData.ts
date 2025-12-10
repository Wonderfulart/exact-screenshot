// Hand AI Mock Data - Oregon Tourism Publications

export interface Title {
  id: string;
  name: string;
  region: string;
  revenue_goal: number;
  revenue_booked: number;
  pages_goal: number;
  pages_sold: number;
  deadline: string;
  rates: {
    full: number;
    half: number;
    quarter: number;
    spread: number;
  };
}

export interface Account {
  id: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
  business_type: string;
  city: string;
  budget_range_low: number;
  budget_range_high: number;
  waffling_score: number;
  decision_certainty: "firm" | "leaning" | "waffling" | "at_risk";
  last_contact_date: string;
}

export interface Deal {
  id: string;
  account_id: string;
  title_id: string;
  ad_size: "quarter_page" | "half_page" | "full_page" | "two_page_spread";
  value: number;
  stage: "prospect" | "pitched" | "negotiating" | "verbal_yes" | "contract_sent" | "signed" | "lost";
  is_at_risk: boolean;
  probability: number;
}

export const titles: Title[] = [
  {
    id: "1",
    name: "Eugene, Cascades & Coast Visitor Guide",
    region: "Lane County / Oregon Coast",
    revenue_goal: 65000,
    revenue_booked: 42500,
    pages_goal: 48,
    pages_sold: 31,
    deadline: "2025-02-15",
    rates: { full: 2200, half: 1400, quarter: 850, spread: 3800 },
  },
  {
    id: "2",
    name: "Willamette Valley Visitor Guide",
    region: "Willamette Valley",
    revenue_goal: 55000,
    revenue_booked: 31000,
    pages_goal: 40,
    pages_sold: 22,
    deadline: "2025-02-28",
    rates: { full: 1950, half: 1250, quarter: 750, spread: 3400 },
  },
  {
    id: "3",
    name: "Travel Salem",
    region: "Salem / Mid-Valley",
    revenue_goal: 48000,
    revenue_booked: 28500,
    pages_goal: 36,
    pages_sold: 21,
    deadline: "2025-03-01",
    rates: { full: 1800, half: 1150, quarter: 700, spread: 3100 },
  },
  {
    id: "4",
    name: "Taste Newberg",
    region: "Newberg / Dundee Hills",
    revenue_goal: 38000,
    revenue_booked: 22000,
    pages_goal: 28,
    pages_sold: 16,
    deadline: "2025-03-15",
    rates: { full: 1650, half: 1050, quarter: 650, spread: 2900 },
  },
  {
    id: "5",
    name: "Oregon Coast Magazine",
    region: "Oregon Coast",
    revenue_goal: 72000,
    revenue_booked: 51000,
    pages_goal: 52,
    pages_sold: 37,
    deadline: "2025-02-01",
    rates: { full: 2400, half: 1550, quarter: 950, spread: 4200 },
  },
];

export const accounts: Account[] = [
  { id: "1", company_name: "Valley River Inn", contact_name: "Sarah Mitchell", contact_email: "sarah.mitchell@valleyriverinn.com", business_type: "Hotel", city: "Eugene", budget_range_low: 4000, budget_range_high: 8000, waffling_score: 15, decision_certainty: "firm", last_contact_date: "2024-12-08" },
  { id: "2", company_name: "Willamette Valley Vineyards", contact_name: "Jim Bernau Jr.", contact_email: "jim@wvv.com", business_type: "Winery", city: "Turner", budget_range_low: 6000, budget_range_high: 12000, waffling_score: 35, decision_certainty: "leaning", last_contact_date: "2024-12-05" },
  { id: "3", company_name: "The Allison Inn & Spa", contact_name: "Liz Brennan", contact_email: "lbrennan@theallison.com", business_type: "Luxury Hotel", city: "Newberg", budget_range_low: 8000, budget_range_high: 15000, waffling_score: 45, decision_certainty: "waffling", last_contact_date: "2024-12-01" },
  { id: "4", company_name: "Mo's Seafood & Chowder", contact_name: "Cindy McEntee", contact_email: "cindy@moschowder.com", business_type: "Restaurant Chain", city: "Newport", budget_range_low: 5000, budget_range_high: 10000, waffling_score: 20, decision_certainty: "firm", last_contact_date: "2024-12-09" },
  { id: "5", company_name: "Salishan Coastal Lodge", contact_name: "Tom Harris", contact_email: "tharris@salishan.com", business_type: "Resort", city: "Gleneden Beach", budget_range_low: 10000, budget_range_high: 18000, waffling_score: 55, decision_certainty: "waffling", last_contact_date: "2024-11-28" },
  { id: "6", company_name: "Evergreen Aviation Museum", contact_name: "Katie Reynolds", contact_email: "kreynolds@evergreenmuseum.org", business_type: "Museum", city: "McMinnville", budget_range_low: 3000, budget_range_high: 6000, waffling_score: 25, decision_certainty: "leaning", last_contact_date: "2024-12-06" },
  { id: "7", company_name: "Oregon Garden Resort", contact_name: "David Chen", contact_email: "dchen@oregongarden.org", business_type: "Resort", city: "Silverton", budget_range_low: 4000, budget_range_high: 7500, waffling_score: 70, decision_certainty: "at_risk", last_contact_date: "2024-11-20" },
  { id: "8", company_name: "Stoller Family Estate", contact_name: "Michelle Kaufmann", contact_email: "michelle@stollerwine.com", business_type: "Winery", city: "Dayton", budget_range_low: 5000, budget_range_high: 9000, waffling_score: 30, decision_certainty: "leaning", last_contact_date: "2024-12-07" },
  { id: "9", company_name: "Inn at Spanish Head", contact_name: "Robert Alvarez", contact_email: "ralvarez@spanishhead.com", business_type: "Hotel", city: "Lincoln City", budget_range_low: 3500, budget_range_high: 6500, waffling_score: 40, decision_certainty: "waffling", last_contact_date: "2024-12-03" },
  { id: "10", company_name: "Fifth Street Public Market", contact_name: "Amy Patterson", contact_email: "amy@5stmarket.com", business_type: "Shopping", city: "Eugene", budget_range_low: 2500, budget_range_high: 5000, waffling_score: 10, decision_certainty: "firm", last_contact_date: "2024-12-10" },
  { id: "11", company_name: "Domaine Serene", contact_name: "Grace Evenstad", contact_email: "grace@domaineserene.com", business_type: "Winery", city: "Dayton", budget_range_low: 8000, budget_range_high: 14000, waffling_score: 50, decision_certainty: "waffling", last_contact_date: "2024-11-25" },
  { id: "12", company_name: "Sea Lion Caves", contact_name: "Steve Saubert", contact_email: "steve@sealioncaves.com", business_type: "Attraction", city: "Florence", budget_range_low: 2000, budget_range_high: 4000, waffling_score: 15, decision_certainty: "firm", last_contact_date: "2024-12-09" },
  { id: "13", company_name: "The Grand Hotel", contact_name: "Jennifer Walsh", contact_email: "jwalsh@grandhotelsalem.com", business_type: "Hotel", city: "Salem", budget_range_low: 4500, budget_range_high: 8500, waffling_score: 60, decision_certainty: "at_risk", last_contact_date: "2024-11-22" },
  { id: "14", company_name: "Willamette Jetboat Excursions", contact_name: "Mark Thompson", contact_email: "mark@willamettejet.com", business_type: "Tour Operator", city: "Portland", budget_range_low: 3000, budget_range_high: 5500, waffling_score: 20, decision_certainty: "leaning", last_contact_date: "2024-12-04" },
  { id: "15", company_name: "Sylvia Beach Hotel", contact_name: "Lisa Moffat", contact_email: "lisa@sylviabeachhotel.com", business_type: "Boutique Hotel", city: "Newport", budget_range_low: 2500, budget_range_high: 4500, waffling_score: 35, decision_certainty: "leaning", last_contact_date: "2024-12-02" },
];

export const deals: Deal[] = [
  { id: "1", account_id: "1", title_id: "1", ad_size: "full_page", value: 2200, stage: "signed", probability: 100, is_at_risk: false },
  { id: "2", account_id: "4", title_id: "5", ad_size: "half_page", value: 1550, stage: "signed", probability: 100, is_at_risk: false },
  { id: "3", account_id: "10", title_id: "1", ad_size: "quarter_page", value: 850, stage: "signed", probability: 100, is_at_risk: false },
  { id: "4", account_id: "12", title_id: "1", ad_size: "quarter_page", value: 850, stage: "signed", probability: 100, is_at_risk: false },
  { id: "5", account_id: "2", title_id: "2", ad_size: "full_page", value: 1950, stage: "contract_sent", probability: 85, is_at_risk: false },
  { id: "6", account_id: "8", title_id: "4", ad_size: "half_page", value: 1050, stage: "contract_sent", probability: 85, is_at_risk: false },
  { id: "7", account_id: "6", title_id: "2", ad_size: "half_page", value: 1250, stage: "verbal_yes", probability: 75, is_at_risk: false },
  { id: "8", account_id: "14", title_id: "3", ad_size: "quarter_page", value: 700, stage: "verbal_yes", probability: 75, is_at_risk: false },
  { id: "9", account_id: "15", title_id: "5", ad_size: "quarter_page", value: 950, stage: "verbal_yes", probability: 75, is_at_risk: false },
  { id: "10", account_id: "3", title_id: "4", ad_size: "full_page", value: 1650, stage: "negotiating", probability: 60, is_at_risk: true },
  { id: "11", account_id: "5", title_id: "5", ad_size: "two_page_spread", value: 4200, stage: "negotiating", probability: 60, is_at_risk: true },
  { id: "12", account_id: "11", title_id: "2", ad_size: "full_page", value: 1950, stage: "negotiating", probability: 60, is_at_risk: true },
  { id: "13", account_id: "7", title_id: "3", ad_size: "half_page", value: 1150, stage: "pitched", probability: 40, is_at_risk: true },
  { id: "14", account_id: "9", title_id: "5", ad_size: "half_page", value: 1550, stage: "pitched", probability: 40, is_at_risk: false },
  { id: "15", account_id: "13", title_id: "3", ad_size: "full_page", value: 1800, stage: "pitched", probability: 40, is_at_risk: true },
  { id: "16", account_id: "3", title_id: "2", ad_size: "half_page", value: 1250, stage: "prospect", probability: 25, is_at_risk: false },
  { id: "17", account_id: "5", title_id: "1", ad_size: "full_page", value: 2200, stage: "prospect", probability: 25, is_at_risk: false },
];

// Helper functions
export const getAccountById = (id: string) => accounts.find(a => a.id === id);
export const getTitleById = (id: string) => titles.find(t => t.id === id);

export const getAccountDeals = (accountId: string) => 
  deals.filter(d => d.account_id === accountId);

export const getTitleDeals = (titleId: string) => 
  deals.filter(d => d.title_id === titleId);

export const getAtRiskDeals = () => 
  deals.filter(d => d.is_at_risk && d.stage !== "signed" && d.stage !== "lost");

export const getNeedsAttentionAccounts = () => {
  const fiveDaysAgo = new Date();
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
  
  return accounts.filter(a => {
    const lastContact = new Date(a.last_contact_date);
    return lastContact < fiveDaysAgo || a.waffling_score > 50;
  });
};

export const formatCurrency = (amount: number) => 
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(amount);

export const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });

export const getDaysUntil = (dateStr: string) => {
  const target = new Date(dateStr);
  const today = new Date();
  const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
};

export const getStageLabel = (stage: Deal["stage"]) => {
  const labels: Record<Deal["stage"], string> = {
    prospect: "Prospect",
    pitched: "Pitched",
    negotiating: "Negotiating",
    verbal_yes: "Verbal Yes",
    contract_sent: "Contract Sent",
    signed: "Signed",
    lost: "Lost",
  };
  return labels[stage];
};

export const getAdSizeLabel = (size: Deal["ad_size"]) => {
  const labels: Record<Deal["ad_size"], string> = {
    quarter_page: "¼ Page",
    half_page: "½ Page",
    full_page: "Full Page",
    two_page_spread: "2-Page Spread",
  };
  return labels[size];
};
