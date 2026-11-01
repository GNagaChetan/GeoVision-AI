import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  TreePine,
  Waves,
  Building,
  Calendar,
  Compass,
  FileText,
  Sparkles,
  Layers,
  BarChart3,
  Globe,
  Sliders,
  ChevronRight,
  Eye
} from 'lucide-react';
import { Logo } from '../components/common/Logo';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeUseCase, setActiveUseCase] = useState<'urban' | 'vegetation' | 'water'>('urban');

  const useCases = {
    urban: {
      title: 'Urban Sprawl & Infrastructure Expansion',
      tagline: 'Track how cities grow into surrounding agricultural and green landscapes.',
      metric: '+19.3% Built-up Growth',
      submetric: '+142.3 hectares of new roads & buildings observed',
      desc: 'High-density multi-spectral classification isolates asphalt, concrete, and residential developments from agricultural land, giving planners verified growth vectors.',
      badge: 'Urban Planning'
    },
    vegetation: {
      title: 'Canopy Density & Forest Vitality',
      tagline: 'Measure tree canopy cover and detect drought or rezoning stress.',
      metric: '0.58 Mean Vitality Index',
      submetric: '38.4% of observed landscape retains healthy green canopy',
      desc: 'Near-Infrared (NIR) and Red spectral channels highlight photosynthetically active chlorophyll, allowing environmentalists to monitor canopy health.',
      badge: 'Environmental Research'
    },
    water: {
      title: 'Lakes, Reservoirs & Water Security',
      tagline: 'Map surface water retention and protect critical riparian buffers.',
      metric: '+3.2% Lake Retention',
      submetric: '265.9 hectares of active lake and wetland surface preserved',
      desc: 'Moisture-sensitive spectral bands separate open water and wetlands from dry soil with zero guesswork, supporting municipal watershed stewardship.',
      badge: 'Resource Management'
    }
  };

  return (
    <div className="min-h-screen bg-[#F7FBFD] text-[#08162B] font-sans selection:bg-[#DDF3FA] selection:text-[#102A43]">
      {/* 1. Top Minimal Navigation Bar */}
      <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-50 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left: Logo */}
          <Link to="/" className="flex items-center gap-2">
            <Logo size="md" theme="light" />
          </Link>

          {/* Center: Clean Minimal Links */}
          <nav className="hidden md:flex items-center space-x-8 text-xs font-semibold text-slate-600">
            <a href="#discover" className="hover:text-[#176B87] transition-colors">
              What You Can Discover
            </a>
            <a href="#how-it-works" className="hover:text-[#176B87] transition-colors">
              How It Works
            </a>
            <a href="#use-cases" className="hover:text-[#176B87] transition-colors">
              Use Cases
            </a>
            <a href="#capabilities" className="hover:text-[#176B87] transition-colors">
              Key Capabilities
            </a>
          </nav>

          {/* Right: Auth & Get Started */}
          <div className="flex items-center space-x-3">
            <Link
              to="/auth"
              className="text-xs font-semibold text-[#102A43] hover:text-[#176B87] px-3 py-2 rounded-xl transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/dashboard"
              className="bg-[#176B87] hover:bg-[#135870] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Cinematic Hero Section */}
      <section className="relative overflow-hidden bg-[#08162B] text-white pt-20 pb-28 px-6">
        {/* Ambient Atmospheric Lighting */}
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-[#176B87]/25 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 -left-32 w-[500px] h-[500px] bg-[#2E7D5B]/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* Left Column: Vision Statement & CTAs */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 bg-[#102A43] border border-[#176B87]/50 text-[#DDF3FA] text-xs font-semibold px-3.5 py-1.5 rounded-full shadow-sm">
              <Globe className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>Earth-Observation & Environmental Intelligence</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-white">
              See the Earth.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#38BDF8] via-[#DDF3FA] to-[#78A86B]">
                Understand the Change.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
              Turn satellite imagery into actionable intelligence about land characteristics, vegetation vitality, water security, and regulatory boundaries—empowering landowners, farmers, construction applicants, surveyors, and researchers.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-[#176B87] hover:bg-[#1a7f9f] text-white font-bold text-sm px-6 py-3.5 rounded-xl shadow-lg shadow-[#176B87]/30 transition-all flex items-center gap-2"
              >
                <span>Start Exploring</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href="#how-it-works"
                className="bg-[#102A43] hover:bg-[#163657] text-[#DDF3FA] border border-[#176B87]/40 font-semibold text-sm px-5 py-3.5 rounded-xl transition-all flex items-center gap-2"
              >
                <span>See How It Works</span>
              </a>
            </div>

            {/* Quick Metrics Bar */}
            <div className="pt-6 border-t border-white/10 grid grid-cols-3 gap-4 text-left">
              <div>
                <div className="text-2xl font-black text-white">10m</div>
                <div className="text-[11px] text-slate-400">Sentinel-2 Resolution</div>
              </div>
              <div>
                <div className="text-2xl font-black text-[#78A86B]">5-Year</div>
                <div className="text-[11px] text-slate-400">Temporal Comparison</div>
              </div>
              <div>
                <div className="text-2xl font-black text-[#38BDF8]">100%</div>
                <div className="text-[11px] text-slate-400">Grounded in Data</div>
              </div>
            </div>
          </div>

          {/* Right Column: Original Geospatial Visual Composition */}
          <div className="lg:col-span-5 relative">
            <div className="bg-[#102A43]/90 border border-[#1e3a5f] rounded-3xl p-6 shadow-2xl backdrop-blur-md relative overflow-hidden">
              {/* Satellite Orbit Accent */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-mono font-semibold text-slate-200">ORBIT // SENTINEL-2A</span>
                </div>
                <span className="text-[10px] font-mono bg-[#08162B] text-[#DDF3FA] px-2 py-0.5 rounded border border-[#1e3a5f]">
                  EPSG:4326
                </span>
              </div>

              {/* Multi-spectral Map Preview Simulation */}
              <div className="relative rounded-2xl overflow-hidden aspect-video bg-gradient-to-br from-[#102A43] via-[#0d2238] to-[#08162B] border border-white/10 flex items-center justify-center p-4">
                {/* Simulated Topographic & Land Cover Contours */}
                <svg className="absolute inset-0 w-full h-full opacity-60" viewBox="0 0 400 250">
                  <path d="M 0 180 Q 100 130 200 160 T 400 120 L 400 250 L 0 250 Z" fill="#2E7D5B" opacity="0.35" />
                  <path d="M 0 210 Q 150 170 250 200 T 400 180 L 400 250 L 0 250 Z" fill="#78A86B" opacity="0.4" />
                  <ellipse cx="280" cy="110" rx="60" ry="35" fill="#176B87" opacity="0.6" />
                  <circle cx="280" cy="110" r="15" fill="#38BDF8" opacity="0.5" />
                  <path d="M 30 50 L 140 70 L 120 130 L 20 100 Z" fill="#D6BE8A" opacity="0.3" />
                  <circle cx="240" cy="70" r="4" fill="#FFFFFF" />
                  <line x1="240" y1="70" x2="300" y2="40" stroke="#FFFFFF" strokeWidth="1" strokeDasharray="2 2" />
                </svg>

                {/* Floating Indicators */}
                <div className="absolute top-3 left-3 bg-[#08162B]/85 backdrop-blur-sm border border-white/10 rounded-xl p-2.5 text-[11px] shadow-lg">
                  <div className="text-slate-400 text-[10px]">Study Area</div>
                  <div className="font-bold text-white">Bengaluru IT Corridor</div>
                </div>

                <div className="absolute bottom-3 right-3 bg-[#08162B]/85 backdrop-blur-sm border border-white/10 rounded-xl p-2.5 text-[11px] shadow-lg text-right">
                  <div className="text-[#78A86B] font-bold">38.4% Canopy</div>
                  <div className="text-slate-400 text-[10px]">Healthy Foliage</div>
                </div>
              </div>

              {/* Before & After Map Comparison Strip */}
              <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-[#08162B]/60 border border-[#1e3a5f]">
                  <span className="text-[10px] text-slate-400 font-mono block">BASELINE (2020)</span>
                  <span className="font-bold text-slate-200">737.9 ha Urban</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#08162B]/60 border border-[#1e3a5f]">
                  <span className="text-[10px] text-[#38BDF8] font-mono block">OBSERVED (2025)</span>
                  <span className="font-bold text-white">+142.3 ha Sprawl</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. What You Can Discover Section */}
      <section id="discover" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="text-xs font-bold uppercase tracking-wider text-[#176B87] mb-2">
            Intelligence at a Glance
          </div>
          <h2 className="text-3xl font-extrabold text-[#08162B] tracking-tight">
            What You Can Discover with GeoVision
          </h2>
          <p className="text-slate-600 text-sm mt-2">
            Understand how land, nature, and infrastructure interact over time without manual GIS calculation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-[#2E7D5B]/10 text-[#2E7D5B] flex items-center justify-center mb-4">
              <TreePine className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#08162B] mb-2">Vegetation & Canopy Health</h3>
            <p className="text-slate-600 text-xs leading-relaxed">
              Assess tree density, calculate photosynthetically active canopy scores, and detect agricultural green stress across entire metropolitan districts.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-[#176B87]/10 text-[#176B87] flex items-center justify-center mb-4">
              <Building className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#08162B] mb-2">Urban Sprawl & Land Shift</h3>
            <p className="text-slate-600 text-xs leading-relaxed">
              Identify where roads, commercial hubs, and housing developments have expanded into peripheral forests and open soil between 2020 and 2025.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-[#102A43]/10 text-[#102A43] flex items-center justify-center mb-4">
              <Waves className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#08162B] mb-2">Lakes, Rivers & Wetlands</h3>
            <p className="text-slate-600 text-xs leading-relaxed">
              Delineate surface water retention, track seasonal shoreline desiccation, and observe compliance along designated environmental buffer corridors.
            </p>
          </div>
        </div>
      </section>

      {/* 4. How It Works Section */}
      <section id="how-it-works" className="py-20 px-6 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="text-xs font-bold uppercase tracking-wider text-[#2E7D5B] mb-2">
              Guided Analytical Process
            </div>
            <h2 className="text-3xl font-extrabold text-[#08162B] tracking-tight">
              How GeoVision AI Works
            </h2>
            <p className="text-slate-600 text-sm mt-2">
              From raw orbital bands to plain-English decision briefs in four straightforward stages.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Select Study Area',
                desc: 'Pick a pre-calibrated region or designate a custom coordinate rectangle on the interactive map.',
              },
              {
                step: '02',
                title: 'Ingest Satellite Bands',
                desc: 'Load calibrated multi-spectral Sentinel-2 channels calibrated to 10-meter spatial grids.',
              },
              {
                step: '03',
                title: 'Multi-Spectral AI Pipeline',
                desc: 'Our engine runs atmospheric calibration, NDVI vitality, and 5-class land-cover clustering.',
              },
              {
                step: '04',
                title: 'Plain-Language Reports',
                desc: 'Review interactive charts, download executive briefs, or ask GeoVision AI in plain English.',
              },
            ].map((s, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-[#F7FBFD] border border-slate-200 relative">
                <div className="text-2xl font-black text-[#176B87] font-mono mb-3">{s.step}</div>
                <h3 className="text-base font-bold text-[#08162B] mb-2">{s.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Real Use Cases Section */}
      <section id="use-cases" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="text-xs font-bold uppercase tracking-wider text-[#176B87] mb-2">
            Real Applications
          </div>
          <h2 className="text-3xl font-extrabold text-[#08162B] tracking-tight">
            Explore Practical Use Cases
          </h2>
          <p className="text-slate-600 text-sm mt-2">
            See how real urban planning and environmental researchers apply GeoVision intelligence.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex justify-center gap-2 mb-8">
          {[
            { id: 'urban', label: 'Urban Expansion' },
            { id: 'vegetation', label: 'Vegetation Monitoring' },
            { id: 'water', label: 'Water-Body Preservation' },
          ].map((tab: any) => (
            <button
              key={tab.id}
              onClick={() => setActiveUseCase(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeUseCase === tab.id
                  ? 'bg-[#102A43] text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Selected Use Case Showcase Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#176B87] bg-[#DDF3FA] px-2.5 py-1 rounded-full">
              {useCases[activeUseCase].badge}
            </span>
            <h3 className="text-2xl font-extrabold text-[#08162B]">
              {useCases[activeUseCase].title}
            </h3>
            <p className="text-sm font-medium text-slate-700">
              {useCases[activeUseCase].tagline}
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              {useCases[activeUseCase].desc}
            </p>

            <div className="pt-2">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#176B87] hover:underline"
              >
                <span>Try this analysis on live map</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 bg-[#F7FBFD] border border-slate-200 rounded-2xl p-6 text-center space-y-3">
            <div className="text-xs text-slate-400 uppercase font-semibold">Observed Indicator</div>
            <div className="text-3xl font-black text-[#102A43]">
              {useCases[activeUseCase].metric}
            </div>
            <p className="text-xs text-slate-600 font-medium">
              {useCases[activeUseCase].submetric}
            </p>
          </div>
        </div>
      </section>

      {/* 6. Call to Action Banner */}
      <section className="py-16 px-6 bg-[#08162B] text-white text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Ready to explore your landscape?
          </h2>
          <p className="text-slate-300 text-sm max-w-xl mx-auto">
            Experience beginner-friendly satellite intelligence and land-change analytics today.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/dashboard"
              className="bg-[#176B87] hover:bg-[#1a7f9f] text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl transition-all shadow-md"
            >
              Start Exploring
            </Link>
            <Link
              to="/auth"
              className="bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm px-5 py-3 rounded-xl transition-all border border-white/10"
            >
              Sign In to Account
            </Link>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="px-6 py-8 border-t border-slate-200 bg-white text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo size="sm" theme="light" />
            <span className="text-slate-400">&bull;</span>
            <span>See the Earth. Understand the Change.</span>
          </div>
          <div>GeoVision AI &copy; 2025. All analytical rights reserved.</div>
        </div>
      </footer>
    </div>
  );
};
export default LandingPage;
