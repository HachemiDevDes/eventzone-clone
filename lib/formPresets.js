// Pre-made Form Fields and Smart Suggestions for Eventzone Forms Builder
import { 
  Users, Globe, MapPin, Camera, Briefcase, 
  Award, Megaphone, Target, UserCheck, Sparkles 
} from "lucide-react";

export const COUNTRY_CITIES_MAP = {
  "Algeria": [
    "Algiers", "Oran", "Constantine", "Annaba", "Blida", "Batna", 
    "Setif", "Sidi Bel Abbes", "Biskra", "Tlemcen", "Bejaia", 
    "Mostaganem", "Ouargla", "Ghardaia", "Tizi Ouzou", "Skikda", 
    "Chlef", "Bordj Bou Arreridj", "Jijel", "Medea", "Other"
  ],
  "United States": [
    "New York", "San Francisco", "Los Angeles", "Chicago", "Austin", 
    "Seattle", "Boston", "Miami", "Dallas", "Atlanta", "Denver", 
    "Washington D.C.", "Houston", "San Diego", "Phoenix", "Philadelphia", "Other"
  ],
  "United Kingdom": [
    "London", "Manchester", "Birmingham", "Edinburgh", "Glasgow", 
    "Bristol", "Leeds", "Liverpool", "Cambridge", "Oxford", 
    "Newcastle", "Belfast", "Cardiff", "Sheffield", "Other"
  ],
  "France": [
    "Paris", "Lyon", "Marseille", "Toulouse", "Nice", "Nantes", 
    "Bordeaux", "Strasbourg", "Lille", "Rennes", "Montpellier", 
    "Grenoble", "Toulon", "Angers", "Other"
  ],
  "Germany": [
    "Berlin", "Munich", "Frankfurt", "Hamburg", "Cologne", 
    "Stuttgart", "Düsseldorf", "Leipzig", "Dresden", "Hannover", 
    "Nuremberg", "Bonn", "Bremen", "Other"
  ],
  "United Arab Emirates": [
    "Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", 
    "Fujairah", "Umm Al Quwain", "Al Ain", "Other"
  ],
  "Saudi Arabia": [
    "Riyadh", "Jeddah", "Dammam", "Mecca", "Medina", "Khobar", 
    "Dhahran", "Tabuk", "Abha", "Taif", "Jubail", "Yanbu", "Other"
  ],
  "Qatar": [
    "Doha", "Al Rayyan", "Al Wakrah", "Lusail", "Al Khor", "Umm Salal", "Other"
  ],
  "Kuwait": [
    "Kuwait City", "Hawalli", "Salmiya", "Al Ahmadi", "Farwaniya", "Jahra", "Other"
  ],
  "Bahrain": [
    "Manama", "Riffa", "Muharraq", "Hamad Town", "A'ali", "Isa Town", "Other"
  ],
  "Oman": [
    "Muscat", "Salalah", "Sohar", "Nizwa", "Sur", "Seeb", "Bawshar", "Other"
  ],
  "Egypt": [
    "Cairo", "Alexandria", "Giza", "Sharm El Sheikh", "Hurghada", 
    "Luxor", "Aswan", "Mansoura", "Tanta", "Port Said", "Suez", "Other"
  ],
  "Morocco": [
    "Casablanca", "Rabat", "Marrakech", "Tangier", "Fes", 
    "Agadir", "Meknes", "Oujda", "Kenitra", "Tetouan", "Other"
  ],
  "Tunisia": [
    "Tunis", "Sfax", "Sousse", "Kairouan", "Bizerte", 
    "Gabes", "Ariana", "La Marsa", "Monastir", "Other"
  ],
  "Canada": [
    "Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa", 
    "Edmonton", "Quebec City", "Winnipeg", "Halifax", "Waterloo", "Other"
  ],
  "Spain": [
    "Madrid", "Barcelona", "Valencia", "Seville", "Bilbao", 
    "Malaga", "Zaragoza", "Palma", "Alicante", "Cordoba", "Other"
  ],
  "Italy": [
    "Rome", "Milan", "Turin", "Florence", "Bologna", 
    "Naples", "Venice", "Genoa", "Verona", "Palermo", "Other"
  ],
  "Switzerland": [
    "Zurich", "Geneva", "Basel", "Bern", "Lausanne", 
    "Lucerne", "Lugano", "St. Gallen", "Winterthur", "Other"
  ],
  "Netherlands": [
    "Amsterdam", "Rotterdam", "The Hague", "Utrecht", "Eindhoven", 
    "Groningen", "Tilburg", "Almere", "Breda", "Other"
  ],
  "Turkey": [
    "Istanbul", "Ankara", "Izmir", "Bursa", "Antalya", 
    "Adana", "Gaziantep", "Konya", "Mersin", "Diyarbakir", "Other"
  ],
  "India": [
    "Bengaluru", "Mumbai", "Delhi", "Hyderabad", "Chennai", 
    "Pune", "Kolkata", "Ahmedabad", "Gurugram", "Noida", "Other"
  ],
  "China": [
    "Beijing", "Shanghai", "Shenzhen", "Guangzhou", "Hangzhou", 
    "Chengdu", "Hong Kong", "Wuhan", "Nanjing", "Xi'an", "Other"
  ],
  "Japan": [
    "Tokyo", "Osaka", "Kyoto", "Yokohama", "Nagoya", 
    "Fukuoka", "Sapporo", "Kobe", "Sendai", "Hiroshima", "Other"
  ],
  "Australia": [
    "Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", 
    "Canberra", "Gold Coast", "Hobart", "Darwin", "Other"
  ],
  "Brazil": [
    "São Paulo", "Rio de Janeiro", "Brasília", "Belo Horizonte", 
    "Curitiba", "Porto Alegre", "Salvador", "Recife", "Fortaleza", "Other"
  ]
};

export function getCitiesForCountry(countryName = "") {
  if (!countryName) return [];
  const normalized = countryName.trim();
  
  // Exact match
  if (COUNTRY_CITIES_MAP[normalized]) {
    return COUNTRY_CITIES_MAP[normalized];
  }
  
  // Case-insensitive / partial match
  const foundKey = Object.keys(COUNTRY_CITIES_MAP).find(
    k => k.toLowerCase() === normalized.toLowerCase() ||
         normalized.toLowerCase().includes(k.toLowerCase()) ||
         k.toLowerCase().includes(normalized.toLowerCase())
  );

  return foundKey ? COUNTRY_CITIES_MAP[foundKey] : [];
}

export const PRESET_SMART_FIELDS = [
  {
    id: "preset_gender",
    type: "select",
    label: "Gender",
    placeholder: "Select your gender...",
    description: "Dropdown with standard gender options",
    icon: Users,
    category: "Demographics",
    required: false,
    options: ["Male", "Female", "Prefer not to say"]
  },
  {
    id: "preset_country",
    type: "country",
    label: "Country",
    placeholder: "Select your country of residence...",
    description: "Searchable country selector with flags",
    icon: Globe,
    category: "Location",
    required: true,
    options: []
  },
  {
    id: "preset_city",
    type: "city",
    label: "City",
    placeholder: "Select or enter your city...",
    description: "Dynamic city selection linked to Country",
    icon: MapPin,
    category: "Location",
    required: false,
    options: []
  },
  {
    id: "preset_picture",
    type: "picture",
    label: "Profile Picture / Photo",
    placeholder: "Upload your photo from phone or computer...",
    description: "Direct photo upload from phone camera or PC file",
    icon: Camera,
    category: "Identity",
    required: false,
    options: []
  },
  {
    id: "preset_industry",
    type: "select",
    label: "Industry",
    placeholder: "Select your primary industry...",
    description: "Dropdown with standard business industries",
    icon: Briefcase,
    category: "Professional",
    required: true,
    options: [
      "Technology & Software",
      "Finance & Banking",
      "Healthcare & Biotech",
      "Education & Academia",
      "Energy, Oil & Gas",
      "Retail & E-Commerce",
      "Manufacturing & Hardware",
      "Media & Entertainment",
      "Real Estate & Construction",
      "Government & Public Sector",
      "Telecommunications",
      "Consulting & Professional Services",
      "Agriculture & Food",
      "Transportation & Logistics",
      "Other"
    ]
  },
  {
    id: "preset_function",
    type: "select",
    label: "Job Function / Role",
    placeholder: "Select your professional job function...",
    description: "Dropdown with department and job types",
    icon: Award,
    category: "Professional",
    required: true,
    options: [
      "Executive & C-Suite",
      "Engineering & Software Development",
      "Product Management & UX Design",
      "Sales & Business Development",
      "Marketing, PR & Growth",
      "Operations & Logistics",
      "Human Resources & Talent",
      "Finance, Accounting & Legal",
      "Research & Data Science",
      "Founder & Entrepreneur",
      "Student / Academic Researcher",
      "Consulting & Advisory",
      "Other"
    ]
  },
  {
    id: "preset_referral",
    type: "select",
    label: "How did you hear about us?",
    placeholder: "Select referral channel...",
    description: "Marketing & referral source attribution",
    icon: Megaphone,
    category: "Marketing",
    required: false,
    options: [
      "Social Media (LinkedIn, X, Instagram)",
      "Email Newsletter / Invitation",
      "Friend or Colleague Recommendation",
      "Search Engine (Google, Bing)",
      "Event Sponsor or Exhibitor Partner",
      "Community / Slack / Discord Group",
      "Online Press & News Article",
      "Outdoor / Billboard / Print Flyer",
      "Other"
    ]
  },
  {
    id: "preset_reason",
    type: "checkbox",
    label: "Reason for Attending",
    placeholder: "Select all that apply...",
    description: "Multi-select attendance goals & objectives",
    icon: Target,
    category: "Marketing",
    required: false,
    options: [
      "Networking & Meeting Industry Peers",
      "Learning from Keynotes & Workshops",
      "Finding New Business Partners & Leads",
      "Meeting Investors & Seeking Funding",
      "Exploring Career & Job Opportunities",
      "Discovering Innovative Products & Tech",
      "Evaluating Sponsorship / Exhibitor Booths",
      "Speaking & Presenting Research",
      "Other"
    ]
  }
];
