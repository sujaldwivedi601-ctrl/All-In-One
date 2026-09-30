export interface FarmerProfile {
  name: string;
  phone: string;
  state: string;
  district: string;
  village: string;
  latitude: number;
  longitude: number;
  landAreaAcres: number;
  soilType: string;
  primaryCrop: string;
  cropStage: string;
  secondaryCrops: string[];
  waterSource: string;
  irrigationType: string;
  farmerCategory: string;
  hasSoilCard: boolean;
  hasKisanCreditCard: boolean;
}

export interface CropAnalysisRecord {
  id: string;
  timestamp: string;
  cropName: string;
  imageUrl?: string;
  
  // AgriDoctor AI Core Output Structure:
  healthStatus: 'Healthy' | 'Minor Issue' | 'Severe Threat' | 'Harvest Ready' | 'Insufficient Evidence';
  confidence: 'High' | 'Moderate' | 'Low';
  identifiedCrop: string;
  leadingDiagnosis: string;
  
  visibleEvidence: string[];
  imageQuality: 'Good' | 'Fair' | 'Poor';
  imageQualityNotes?: string;
  
  leadingPossibility: {
    cause: string;
    explanation: string;
  };
  otherPossibilities: string[];
  primaryVsSecondary: string;
  
  informationNeeded: string[];
  
  actionPlan: {
    immediateActions: string[];
    monitoring: string[];
    professionalAssistance: string[];
    chemicalBiologicalControl: string[];
  };
  
  cropCare: {
    water: string;
    nutrition: string;
    otherCare: string;
  };
  
  farmerSummary: string; // "What should I do first today?"
  formattedReport?: string;
  
  // Backward compatibility fields
  isValidCropImage?: boolean;
  condition?: string;
  severity?: 'Healthy' | 'Mild' | 'Moderate' | 'Severe' | 'Unknown';
  confidencePercentage?: number;
  symptoms?: string[];
  causes?: string[];
  immediateSteps?: string[];
  organicRemedies?: string[];
  chemicalTreatments?: string[];
  preventiveAdvice?: string[];
  safetyGuidelines?: string[];
  expertVerificationRequired?: boolean;
  summary?: string;
  sourceMode?: 'gemini-live' | 'botanical-expert-fallback';
  providerNotice?: string;
}

export interface WeatherData {
  location: string;
  fieldCoordinates?: {
    latitude: number;
    longitude: number;
  };
  current: {
    temperature: number;
    feelsLike?: number;
    humidity: number;
    windSpeed: number;
    rainProbability: number;
    rainfallForecastMm: number;
    uvIndex?: number;
    condition: string;
  };
  hourly?: Array<{
    time: string;
    hourLabel: string;
    temperature: number;
    rainProbability: number;
    precipitationMm: number;
  }>;
  forecast: Array<{
    day: string;
    date: string;
    tempMax: number;
    tempMin: number;
    rainProbability: number;
    rainfallMm: number;
    windKmh: number;
    condition: string;
  }>;
  alert?: {
    title: string;
    message: string;
  };
  alerts?: Array<{
    id: string;
    type: 'critical' | 'warning' | 'success' | 'info';
    badge: string;
    title: string;
    message: string;
    action: string;
  }>;
}

export interface WaterPlan {
  landAreaAcres: number;
  crop: string;
  growthStage: string;
  waterSource: string;
  irrigationType: string;
  soilType: string;
  dailyWaterLiters: number;
  weeklyWaterLiters: number;
  dailyWaterMm: number;
  irrigationEfficiencyPercent: number;
  savingPotentialPercent: number;
  waterSavedLitersDaily: number;
  suggestedFrequency: string;
  recommendation: string;
  smartTips: string[];
}

export interface Scheme {
  id: string;
  name: string;
  category: 'Irrigation' | 'Machinery' | 'Crop Protection' | 'Credit & Income' | 'Organic & Soil';
  shortDesc: string;
  benefitAmount: string;
  eligibility: string[];
  documents: string[];
  applicationRoute: string;
  officialPortalUrl: string;
  isMatch?: boolean;
  matchReason?: string;
  tailoredStatus?: string;
}

export interface MarketplaceListing {
  id: string;
  title: string;
  category: 'Produce' | 'Equipment' | 'Waste Exchange' | 'Seeds & Inputs';
  sellerName: string;
  sellerPhone: string;
  sellerVillage: string;
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
  distanceText?: string;
  price: string;
  unit?: string;
  quantity: string;
  description: string;
  imageUrl: string;
  tags?: string[];
  ownerId?: string;
  createdAt?: string;
}
