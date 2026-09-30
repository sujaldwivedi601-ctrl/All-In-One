import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Leaf, 
  ShieldAlert, 
  Sparkles, 
  LogIn, 
  Check, 
  Eye, 
  Info, 
  Lock,
  Activity,
  Bot,
  CheckCircle2,
  HelpCircle,
  FileText,
  Sliders,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Copy,
  Clock,
  ShieldCheck,
  Droplet,
  HeartPulse
} from 'lucide-react';
import { CropAnalysisRecord, FarmerProfile } from '../types';
import { SAMPLE_CROP_IMAGES, SampleCropImage } from '../data/sampleCrops';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface AICropAnalysisProps {
  profile: FarmerProfile | null;
  analyses: CropAnalysisRecord[];
  isLoggedIn: boolean;
  onRequireLogin: () => void;
  idToken: string | null;
  onAnalysisComplete: (record: CropAnalysisRecord) => void;
}

export const AICropAnalysis: React.FC<AICropAnalysisProps> = ({
  profile,
  analyses,
  isLoggedIn,
  onRequireLogin,
  idToken,
  onAnalysisComplete,
}) => {
  const { getIdToken } = useAuth();
  const { language } = useLanguage();
  const isHindi = language === 'hi';
  
  // Clean initialization: No dummy forced images; user can upload or choose a test sample
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [cropName, setCropName] = useState<string>(profile?.primaryCrop || '');
  const [cropStage, setCropStage] = useState<string>(profile?.cropStage || '');
  const [farmerNote, setFarmerNote] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [activeResult, setActiveResult] = useState<CropAnalysisRecord | null>(analyses[0] || null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [copiedReport, setCopiedReport] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'structured' | 'fullText'>('structured');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectSample = (sample: SampleCropImage) => {
    setSelectedImage(sample.imageUrl);
    setCropName(sample.crop);
    setFarmerNote(`Suspected: ${sample.suspectedIssue}`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const runAnalysis = async () => {
    if (!isLoggedIn) {
      onRequireLogin();
      return;
    }

    if (!selectedImage) {
      alert('Please upload a leaf photo or choose a sample test leaf to analyze.');
      return;
    }

    setIsAnalyzing(true);
    setStatusNotice(null);
    try {
      let base64 = selectedImage;
      if (selectedImage.startsWith('http')) {
        const response = await fetch(selectedImage);
        const blob = await response.blob();
        base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      }

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const token = (await getIdToken()) || idToken;
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      let res = await fetch('/api/crop-analysis', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          imageBase64: base64,
          cropName: cropName || 'Unspecified',
          cropStage: cropStage || 'Unspecified',
          farmerNote,
        }),
      });

      if (res.status === 401) {
        const freshToken = await getIdToken(true);
        if (freshToken) {
          headers['Authorization'] = `Bearer ${freshToken}`;
          res = await fetch('/api/crop-analysis', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              imageBase64: base64,
              cropName: cropName || 'Unspecified',
              cropStage: cropStage || 'Unspecified',
              farmerNote,
            }),
          });
        }
      }

      const data = await res.json();
      if (data.success && data.analysis) {
        setActiveResult(data.analysis);
        onAnalysisComplete(data.analysis);
        if (data.analysis.providerNotice) {
          setStatusNotice(data.analysis.providerNotice);
        }
      } else {
        setStatusNotice('AI vision service is experiencing high traffic. Please retry in a few moments.');
      }
    } catch (err) {
      console.error(err);
      setStatusNotice('Network connection was interrupted. Please retry.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyFullReportToClipboard = () => {
    if (!activeResult) return;
    const text = activeResult.formattedReport || `
1. 📊 CROP HEALTH ASSESSMENT
Health Status: ${activeResult.healthStatus || 'Under Review'}
Confidence: ${activeResult.confidence || 'Moderate'}
Crop: ${activeResult.identifiedCrop}
Leading Diagnosis: ${activeResult.leadingDiagnosis}

2. 🔍 WHAT I CAN SEE
Visible Evidence:
${(activeResult.visibleEvidence || []).map(e => `- ${e}`).join('\n')}
Image Quality: ${activeResult.imageQuality || 'Good'}

3. 🧠 POSSIBLE CAUSES
Leading possibility: ${activeResult.leadingPossibility?.cause} - ${activeResult.leadingPossibility?.explanation}
Other possibilities:
${(activeResult.otherPossibilities || []).map(p => `- ${p}`).join('\n')}
Primary vs Secondary: ${activeResult.primaryVsSecondary}

4. ❓ INFORMATION NEEDED
${(activeResult.informationNeeded || []).map(q => `- ${q}`).join('\n')}

5. 🛠️ ACTION PLAN
Immediate low-risk actions:
${(activeResult.actionPlan?.immediateActions || []).map(a => `- ${a}`).join('\n')}
Monitoring:
${(activeResult.actionPlan?.monitoring || []).map(m => `- ${m}`).join('\n')}
Professional assistance:
${(activeResult.actionPlan?.professionalAssistance || []).map(p => `- ${p}`).join('\n')}
Chemical/biological control:
${(activeResult.actionPlan?.chemicalBiologicalControl || []).map(c => `- ${c}`).join('\n')}

6. 🌿 CROP CARE
Water: ${activeResult.cropCare?.water}
Nutrition: ${activeResult.cropCare?.nutrition}
Other care: ${activeResult.cropCare?.otherCare}

7. 👨‍🌾 FARMER SUMMARY
What should I do first today?
${activeResult.farmerSummary}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2500);
  };

  // Helper colors for health status
  const getHealthBadge = (status?: string) => {
    switch (status) {
      case 'Healthy':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'Minor Issue':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'Severe Threat':
        return 'bg-rose-100 text-rose-900 border-rose-300';
      case 'Harvest Ready':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'Insufficient Evidence':
      default:
        return 'bg-stone-100 text-stone-800 border-stone-300';
    }
  };

  const getConfidenceBadge = (confidence?: string) => {
    switch (confidence) {
      case 'High':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Moderate':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Low':
      default:
        return 'bg-rose-50 text-rose-800 border-rose-200';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5 pb-24 md:pb-8 max-w-full overflow-hidden">
      
      {/* Top Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200 shadow-xs flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-1">
            <HeartPulse className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span>{isHindi ? 'AgriDoctor AI • फसल स्वास्थ्य जांच (Crop Health)' : 'AgriDoctor AI • Crop Health Diagnostic Engine'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 font-['Outfit'] truncate">
            Clinical Crop Health Assessment
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 truncate">
            {isHindi ? 'पत्ते की फोटो से सटीक रोग पहचान, फफूंद व कीट निदान और सुरक्षित उपचार नुस्खे' : 'Evidence-based diagnosis, symptom inspection, and safe management protocols'}
          </p>
        </div>
      </div>

      {/* Status Notice Indicator */}
      {statusNotice && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 flex items-start sm:items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <Activity className="w-5 h-5 text-amber-700 shrink-0 animate-pulse" />
            <div className="min-w-0">
              <span className="font-bold text-amber-900 block sm:inline mr-1">Notice:</span>
              <span className="text-amber-800">{statusNotice}</span>
            </div>
          </div>
          <button
            onClick={() => setStatusNotice(null)}
            className="p-1 rounded-lg text-amber-700 hover:bg-amber-200/50 shrink-0 cursor-pointer"
            title="Dismiss notice"
          >
            <Check className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Guest Notice */}
      {!isLoggedIn && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2 min-w-0">
            <Lock className="w-4 h-4 text-amber-700 shrink-0" />
            <span className="truncate text-xs sm:text-sm font-medium">
              Guest preview mode • Choose reference samples below or sign in to analyze your real crops.
            </span>
          </div>
          <button
            onClick={onRequireLogin}
            className="font-bold text-amber-900 bg-white px-3 sm:px-4 py-1.5 rounded-xl border border-amber-300 shrink-0 cursor-pointer hover:bg-amber-100 transition-colors"
          >
            Sign In
          </button>
        </div>
      )}

      {/* 2-Column Responsive Layout: Photo Input on Left, AgriDoctor Report on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Column: Image Upload & Context Controls */}
        <div className="lg:col-span-5 bg-white p-4 sm:p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4 overflow-hidden">
          
          {/* Photo Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative aspect-16/10 rounded-2xl border-2 border-dashed border-stone-300 hover:border-emerald-600 bg-stone-50 overflow-hidden cursor-pointer flex flex-col items-center justify-center p-3 transition-colors group"
          >
            {selectedImage ? (
              <img src={selectedImage} alt="Crop Leaf" className="w-full h-full object-cover rounded-xl" />
            ) : (
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
                  <Camera className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-stone-800">
                  Tap to Take Photo or Upload Image
                </div>
                <div className="text-xs text-stone-400">
                  Leaves, stems, fruits, roots, soil, or insects (JPG / PNG)
                </div>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </div>

          {/* Quick Benchmark Reference Samples */}
          <div>
            <div className="text-xs font-bold text-stone-600 mb-2">Or test with reference sample:</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SAMPLE_CROP_IMAGES.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => handleSelectSample(sample)}
                  className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                    selectedImage === sample.imageUrl
                      ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-600/30'
                      : 'bg-stone-50 border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <img src={sample.imageUrl} alt={sample.crop} className="w-9 h-9 rounded-lg object-cover shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-stone-900 truncate">{sample.crop}</div>
                    <div className="text-[10px] text-stone-500 truncate">{sample.suspectedIssue}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Farmer Context Parameters */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">Crop Type</label>
              <input
                type="text"
                placeholder="e.g. Wheat, Tomato, Paddy"
                value={cropName}
                onChange={(e) => setCropName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm font-bold bg-stone-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">Growth Stage</label>
              <input
                type="text"
                placeholder="e.g. Vegetative, Flowering"
                value={cropStage}
                onChange={(e) => setCropStage(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm bg-stone-50"
              />
            </div>
          </div>

          {/* Field Observations Input */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">
              Field Observations & Visible Symptoms
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Yellow stripes along leaf veins, curling edges, saw tiny aphids underneath"
              value={farmerNote}
              onChange={(e) => setFarmerNote(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-stone-50 resize-none"
            />
          </div>

          {/* Run Diagnostic Button */}
          <button
            onClick={runAnalysis}
            disabled={isAnalyzing}
            className="w-full py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm sm:text-base shadow-md shadow-emerald-900/10 flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin shrink-0" />
                <span>AgriDoctor AI Analyzing Plant Health...</span>
              </>
            ) : !isLoggedIn ? (
              <>
                <Lock className="w-4 h-4 shrink-0" />
                <span>{isHindi ? 'Sign In / फसल जांच के लिए लॉगिन करें' : 'Sign In to Run AgriDoctor Assessment'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>{isHindi ? 'Run AgriDoctor Assessment (फसल रोग जांचें)' : 'Run AgriDoctor Assessment'}</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Exact 7-Section AgriDoctor AI Report Card */}
        <div className="lg:col-span-7">
          {activeResult ? (
            <div className="bg-white p-5 sm:p-7 rounded-3xl border border-stone-200 shadow-sm space-y-6 overflow-hidden max-w-full">
              
              {/* Header Bar with Copy Button */}
              <div className="flex items-center justify-between border-b border-stone-100 pb-3 gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-sm">
                    👨‍⚕️
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-stone-900 font-['Outfit']">
                      AgriDoctor Diagnostic Report
                    </h3>
                    <div className="text-[11px] text-stone-500">
                      Generated {new Date(activeResult.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={copyFullReportToClipboard}
                    className="px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                    title="Copy full clinical report to clipboard"
                  >
                    {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedReport ? 'Copied!' : 'Copy Report'}</span>
                  </button>
                </div>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* SECTION 1: 📊 CROP HEALTH ASSESSMENT */}
              {/* ------------------------------------------------------------- */}
              <div className="p-4 sm:p-5 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                    <span>1. 📊 CROP HEALTH ASSESSMENT</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getHealthBadge(activeResult.healthStatus)}`}>
                      {activeResult.healthStatus || 'Minor Issue'}
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getConfidenceBadge(activeResult.confidence)}`}>
                      {activeResult.confidence || 'Moderate'} Confidence
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-[11px] text-stone-500 font-bold uppercase block">Crop Identified</span>
                    <div className="text-sm font-black text-stone-900 font-['Outfit']">
                      {activeResult.identifiedCrop || activeResult.cropName || 'Field Plant'}
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] text-stone-500 font-bold uppercase block">Leading Diagnosis</span>
                    <div className="text-sm font-black text-emerald-900 font-['Outfit']">
                      {activeResult.leadingDiagnosis || activeResult.condition || 'Cannot determine from image'}
                    </div>
                  </div>
                </div>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* SECTION 7 PROMINENT CALLOUT: 👨‍🌾 FARMER SUMMARY */}
              {/* "What should I do first today?" (Highlighting priority action) */}
              {/* ------------------------------------------------------------- */}
              <div className="p-4 sm:p-5 rounded-2xl bg-linear-to-r from-emerald-800 to-green-900 text-white shadow-sm space-y-2">
                <div className="text-xs font-black uppercase tracking-wider text-emerald-200 flex items-center gap-1.5">
                  <span>7. 👨‍🌾 FARMER SUMMARY</span>
                  <span className="bg-emerald-500/30 px-2 py-0.5 rounded-full text-[10px] text-white">
                    {isHindi ? 'आज सबसे पहले क्या करें (Do This First)' : 'Do This First Today'}
                  </span>
                </div>
                <div className="text-sm sm:text-base font-bold text-white leading-relaxed">
                  "{activeResult.farmerSummary || activeResult.summary || 'Inspect the foliage closely, avoid excessive watering, and verify symptoms on nearby plants.'}"
                </div>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* SECTION 2: 🔍 WHAT I CAN SEE */}
              {/* ------------------------------------------------------------- */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                    <span>2. 🔍 WHAT I CAN SEE</span>
                  </div>
                  <span className="text-[11px] font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md">
                    Image Quality: {activeResult.imageQuality || 'Good'}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
                  <ul className="text-xs sm:text-sm text-stone-700 space-y-1.5 pl-4 list-disc">
                    {activeResult.visibleEvidence && activeResult.visibleEvidence.length > 0 ? (
                      activeResult.visibleEvidence.map((item, idx) => (
                        <li key={idx} className="leading-relaxed">{item}</li>
                      ))
                    ) : (
                      <li>Visible lesion patterns and foliar discoloration present on leaf surface.</li>
                    )}
                  </ul>
                  {activeResult.imageQualityNotes && (
                    <div className="mt-2 text-[11px] text-stone-500 italic border-t border-stone-200/60 pt-1.5">
                      Quality Note: {activeResult.imageQualityNotes}
                    </div>
                  )}
                </div>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* SECTION 3: 🧠 POSSIBLE CAUSES */}
              {/* ------------------------------------------------------------- */}
              <div className="space-y-2">
                <div className="text-xs font-extrabold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                  <span>3. 🧠 POSSIBLE CAUSES</span>
                </div>
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                  <div>
                    <span className="text-xs font-bold text-emerald-900 block mb-0.5">
                      Leading Possibility:
                    </span>
                    <div className="text-xs sm:text-sm text-stone-800 leading-relaxed font-semibold">
                      {activeResult.leadingPossibility?.cause}
                    </div>
                    {activeResult.leadingPossibility?.explanation && (
                      <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                        {activeResult.leadingPossibility.explanation}
                      </p>
                    )}
                  </div>

                  {activeResult.otherPossibilities && activeResult.otherPossibilities.length > 0 && (
                    <div className="pt-2 border-t border-stone-200">
                      <span className="text-xs font-bold text-stone-700 block mb-1">
                        Other Differential Possibilities Considered:
                      </span>
                      <ul className="text-xs text-stone-600 pl-4 list-disc space-y-1">
                        {activeResult.otherPossibilities.map((opt, idx) => (
                          <li key={idx}>{opt}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {activeResult.primaryVsSecondary && (
                    <div className="pt-2 border-t border-stone-200 text-xs text-stone-600">
                      <strong className="text-stone-800">Primary vs Secondary: </strong>
                      <span>{activeResult.primaryVsSecondary}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* SECTION 4: ❓ INFORMATION NEEDED */}
              {/* ------------------------------------------------------------- */}
              {activeResult.informationNeeded && activeResult.informationNeeded.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                    <span>4. ❓ INFORMATION NEEDED TO CONFIRM</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs sm:text-sm text-amber-950 space-y-1.5">
                    <p className="text-xs text-amber-900 font-semibold mb-1">
                      Check your field for these critical context clues:
                    </p>
                    <ul className="pl-4 list-disc space-y-1 text-stone-700">
                      {activeResult.informationNeeded.map((q, idx) => (
                        <li key={idx}>{q}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* SECTION 5: 🛠️ ACTION PLAN */}
              {/* ------------------------------------------------------------- */}
              <div className="space-y-2">
                <div className="text-xs font-extrabold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                  <span>5. 🛠️ ACTION PLAN</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  
                  {/* Immediate low-risk actions */}
                  <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5">
                    <div className="text-xs font-extrabold text-stone-900 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Immediate Low-Risk Actions</span>
                    </div>
                    <ul className="text-xs text-stone-600 pl-4 list-disc space-y-1">
                      {activeResult.actionPlan?.immediateActions?.map((a, i) => (
                        <li key={i}>{a}</li>
                      )) || <li>Isolate affected plants and prevent overhead water splash.</li>}
                    </ul>
                  </div>

                  {/* Monitoring */}
                  <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5">
                    <div className="text-xs font-extrabold text-stone-900 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-blue-700 shrink-0" />
                      <span>Monitoring Routine</span>
                    </div>
                    <ul className="text-xs text-stone-600 pl-4 list-disc space-y-1">
                      {activeResult.actionPlan?.monitoring?.map((m, i) => (
                        <li key={i}>{m}</li>
                      )) || <li>Inspect crop margins every 2 days to check for spread.</li>}
                    </ul>
                  </div>

                  {/* Professional / Extension Assistance */}
                  <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5">
                    <div className="text-xs font-extrabold text-stone-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>Professional / Extension Advisory</span>
                    </div>
                    <ul className="text-xs text-stone-600 pl-4 list-disc space-y-1">
                      {activeResult.actionPlan?.professionalAssistance?.map((p, i) => (
                        <li key={i}>{p}</li>
                      )) || <li>Consult local Krishi Vigyan Kendra (KVK) if symptoms escalate.</li>}
                    </ul>
                  </div>

                  {/* Chemical / Biological Control */}
                  <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1.5">
                    <div className="text-xs font-extrabold text-emerald-950 flex items-center gap-1.5">
                      <Leaf className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Biological & Chemical Control</span>
                    </div>
                    <ul className="text-xs text-emerald-900 pl-4 list-disc space-y-1">
                      {activeResult.actionPlan?.chemicalBiologicalControl?.map((c, i) => (
                        <li key={i}>{c}</li>
                      )) || <li>Apply bio-protective neem oil formulation (3 ml/L).</li>}
                    </ul>
                  </div>

                </div>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* SECTION 6: 🌿 CROP CARE */}
              {/* ------------------------------------------------------------- */}
              <div className="space-y-2">
                <div className="text-xs font-extrabold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                  <span>6. 🌿 CROP CARE</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-2xl bg-cyan-50/60 border border-cyan-200 space-y-1">
                    <span className="font-extrabold text-cyan-900 block flex items-center gap-1">
                      <Droplet className="w-3.5 h-3.5 text-cyan-700" />
                      <span>Water Management</span>
                    </span>
                    <p className="text-stone-700 leading-relaxed">
                      {activeResult.cropCare?.water || 'Irrigate in early morning; avoid overhead foliage wetting.'}
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-1">
                    <span className="font-extrabold text-amber-900 block flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                      <span>Nutrition & Soil</span>
                    </span>
                    <p className="text-stone-700 leading-relaxed">
                      {activeResult.cropCare?.nutrition || 'Maintain balanced potassium and micronutrients; avoid surplus nitrogen.'}
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
                    <span className="font-extrabold text-stone-800 block flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Preventative Care</span>
                    </span>
                    <p className="text-stone-700 leading-relaxed">
                      {activeResult.cropCare?.otherCare || 'Maintain weed-free field borders to eliminate insect vectors.'}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white p-8 rounded-3xl border border-dashed border-stone-300 text-center text-stone-400 space-y-2 flex flex-col items-center justify-center min-h-[360px]">
              <HeartPulse className="w-10 h-10 text-stone-300" />
              <div className="text-base font-bold text-stone-600">
                Ready to Analyze Crop Health
              </div>
              <div className="text-xs text-stone-500 max-w-sm">
                Upload your crop leaf photo on the left or tap one of the benchmark samples, then click <strong>"Run AgriDoctor Assessment"</strong> to view the full clinical assessment.
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
