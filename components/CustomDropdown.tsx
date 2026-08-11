import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronDown, 
  Check, 
  Monitor, 
  Smartphone, 
  Square, 
  GraduationCap, 
  Palette, 
  Globe, 
  Cpu, 
  Sparkles,
  Zap
} from 'lucide-react';
import { AspectRatio, ComplexityLevel, VisualStyle, Language, DEFAULT_IMAGE_MODEL } from '../types';
import { useModelOptions } from '@/hooks/useModelOptions';

interface DropdownOption<T extends string> {
  value: T;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
}

interface GenericDropdownProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: DropdownOption<T>[];
  className?: string;
  placeholder?: string;
}

export function GenericDropdown<T extends string>({
  value,
  onChange,
  options,
  className = '',
  placeholder = 'Select option...'
}: GenericDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value) || options[0];

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-50 dark:bg-slate-950/50 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-2.5 flex items-center justify-between gap-3 transition-all cursor-pointer shadow-sm group"
      >
        <div className="flex items-center gap-2.5 truncate">
          {selectedOption?.icon && (
            <div className="p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-white/5 shrink-0 text-cyan-600 dark:text-cyan-400">
              {selectedOption.icon}
            </div>
          )}
          <div className="flex flex-col text-left truncate">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 font-display truncate">
              {selectedOption ? selectedOption.label : placeholder}
              {selectedOption && selectedOption.sublabel && (
                <span className="text-[10px] font-mono text-slate-400 ml-1.5 font-normal">({selectedOption.value})</span>
              )}
            </span>
            {selectedOption?.sublabel && (
              <span className="text-[10px] text-slate-400 truncate">{selectedOption.sublabel}</span>
            )}
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-cyan-500' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl z-50 p-1.5 space-y-1 max-h-[220px] overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-150">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                  isSelected 
                    ? 'bg-cyan-500/15 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-bold border border-cyan-500/30' 
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  {opt.icon && (
                    <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-cyan-500 text-white shadow' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                      {opt.icon}
                    </div>
                  )}
                  <div className="truncate">
                    <p className="text-xs font-bold font-display truncate">{opt.label}</p>
                    {opt.sublabel && <p className="text-[10px] text-slate-400 truncate">{opt.sublabel}</p>}
                  </div>
                </div>
                {isSelected && <Check className="w-4 h-4 text-cyan-500 shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface CustomDropdownProps {
  value: AspectRatio;
  onChange: (value: AspectRatio) => void;
  className?: string;
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({ value, onChange, className = '' }) => {
  const options: DropdownOption<AspectRatio>[] = [
    {
      value: '16:9',
      label: 'Landscape',
      sublabel: '16:9 Widescreen display',
      icon: <Monitor className="w-4 h-4 text-cyan-400" />
    },
    {
      value: '9:16',
      label: 'Portrait',
      sublabel: '9:16 Vertical mobile story',
      icon: <Smartphone className="w-4 h-4 text-purple-400" />
    },
    {
      value: '1:1',
      label: 'Square',
      sublabel: '1:1 Standard social badge',
      icon: <Square className="w-4 h-4 text-amber-400" />
    }
  ];

  return <GenericDropdown value={value} onChange={onChange} options={options} className={className} />;
};

interface ComplexityDropdownProps {
  value: ComplexityLevel;
  onChange: (value: ComplexityLevel) => void;
  className?: string;
}

export const ComplexityDropdown: React.FC<ComplexityDropdownProps> = ({ value, onChange, className = '' }) => {
  const options: DropdownOption<ComplexityLevel>[] = [
    { value: 'Default', label: 'Adaptive / Follow Prompt', sublabel: 'Dynamic AI reasoning', icon: <Zap className="w-4 h-4 text-cyan-400" /> },
    { value: 'Elementary', label: 'Elementary', sublabel: 'Ages 6-10 friendly explanations', icon: <GraduationCap className="w-4 h-4 text-emerald-400" /> },
    { value: 'High School', label: 'High School', sublabel: 'Standard textbook style', icon: <GraduationCap className="w-4 h-4 text-blue-400" /> },
    { value: 'College', label: 'College', sublabel: 'Scientific & analytical depth', icon: <GraduationCap className="w-4 h-4 text-purple-400" /> },
    { value: 'Expert', label: 'Expert', sublabel: 'Technical schematic & professional', icon: <Cpu className="w-4 h-4 text-amber-400" /> }
  ];

  return <GenericDropdown value={value} onChange={onChange} options={options} className={className} />;
};

interface StyleDropdownProps {
  value: VisualStyle;
  onChange: (value: VisualStyle) => void;
  className?: string;
}

export const StyleDropdown: React.FC<StyleDropdownProps> = ({ value, onChange, className = '' }) => {
  const options: DropdownOption<VisualStyle>[] = [
    { value: 'Default', label: 'Adaptive / Follow Prompt', sublabel: 'Context-aware aesthetic', icon: <Sparkles className="w-4 h-4 text-cyan-400" /> },
    { value: 'Realistic', label: 'Photorealistic Composite', sublabel: 'Lifelike cinematic render', icon: <Palette className="w-4 h-4 text-emerald-400" /> },
    { value: 'Sketch', label: 'Technical Blueprint', sublabel: 'Architectural line drawing', icon: <Palette className="w-4 h-4 text-blue-400" /> },
    { value: 'Minimalist', label: 'Minimalist Graphic', sublabel: 'Clean negative space layout', icon: <Palette className="w-4 h-4 text-slate-400" /> },
    { value: '3D Render', label: '3D Isometric / Claymorphism', sublabel: 'Modern tactile 3D style', icon: <Palette className="w-4 h-4 text-purple-400" /> },
    { value: 'Cartoon', label: 'Graphic Novel / Comic', sublabel: 'Stylized inked illustration', icon: <Palette className="w-4 h-4 text-pink-400" /> },
    { value: 'Vintage', label: 'Vintage Scientific Lithograph', sublabel: 'Antique educational plate', icon: <Palette className="w-4 h-4 text-amber-400" /> },
    { value: 'Futuristic', label: 'Cyberpunk Interface HUD', sublabel: 'Neon high-tech sci-fi overlay', icon: <Palette className="w-4 h-4 text-cyan-500" /> }
  ];

  return <GenericDropdown value={value} onChange={onChange} options={options} className={className} />;
};

interface LanguageDropdownProps {
  value: Language;
  onChange: (value: Language) => void;
  className?: string;
}

export const LanguageDropdown: React.FC<LanguageDropdownProps> = ({ value, onChange, className = '' }) => {
  const options: DropdownOption<Language>[] = [
    { value: 'Default', label: 'Adaptive / Follow Prompt', sublabel: 'Auto-detected language', icon: <Globe className="w-4 h-4 text-cyan-400" /> },
    { value: 'English', label: 'English', sublabel: 'Global Standard', icon: <Globe className="w-4 h-4 text-blue-400" /> },
    { value: 'Spanish', label: 'Español (Spanish)', sublabel: 'Spanish language output', icon: <Globe className="w-4 h-4 text-amber-400" /> },
    { value: 'French', label: 'Français (French)', sublabel: 'French language output', icon: <Globe className="w-4 h-4 text-indigo-400" /> },
    { value: 'German', label: 'Deutsch (German)', sublabel: 'German language output', icon: <Globe className="w-4 h-4 text-emerald-400" /> },
    { value: 'Mandarin', label: '中文 (Mandarin)', sublabel: 'Mandarin Chinese output', icon: <Globe className="w-4 h-4 text-rose-400" /> },
    { value: 'Japanese', label: '日本語 (Japanese)', sublabel: 'Japanese language output', icon: <Globe className="w-4 h-4 text-purple-400" /> },
    { value: 'Hindi', label: 'हिन्दी (Hindi)', sublabel: 'Hindi language output', icon: <Globe className="w-4 h-4 text-orange-400" /> },
    { value: 'Arabic', label: 'العربية (Arabic)', sublabel: 'Arabic language output', icon: <Globe className="w-4 h-4 text-teal-400" /> },
    { value: 'Portuguese', label: 'Português (Portuguese)', sublabel: 'Portuguese language output', icon: <Globe className="w-4 h-4 text-sky-400" /> },
    { value: 'Russian', label: 'Русский (Russian)', sublabel: 'Russian language output', icon: <Globe className="w-4 h-4 text-violet-400" /> }
  ];

  return <GenericDropdown value={value} onChange={onChange} options={options} className={className} />;
};

export const CAMPAIGN_AI_MODELS = [
  { value: 'gemini-3.6-flash', label: 'Gemini 3.6 Flash', sublabel: 'Fast & Intelligent (Recommended)', badge: 'Recommended' },
  { value: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro', sublabel: 'High Reasoning & Creative Depth', badge: 'High Reasoning' },
  { value: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite', sublabel: 'Ultra-Fast Execution', badge: 'Ultra Fast' },
  { value: 'gemini-flash-latest', label: 'Gemini Flash Latest', sublabel: 'Latest Flash Build Alias', badge: 'Latest' },
];

interface AIModelDropdownProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const AIModelDropdown: React.FC<AIModelDropdownProps> = ({ value, onChange, className = '' }) => {
  const { options: curatedOptions } = useModelOptions('text', value);
  const options: DropdownOption<string>[] = (curatedOptions.length > 0 ? curatedOptions : [
    { id: 'gemini-3.6-flash', label: 'Gemini 3.6 Flash', backend: 'gemini' as const },
    { id: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro', backend: 'gemini' as const },
    { id: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite', backend: 'gemini' as const },
  ]).map(m => ({
    value: m.id,
    label: m.label,
    sublabel: m.backend === 'gateway' ? m.provider || 'AI Gateway model' : undefined,
    icon: m.backend === 'gateway' ? <Sparkles className="w-4 h-4 text-indigo-400" /> : <Sparkles className="w-4 h-4 text-purple-400" />
  }));

  return <GenericDropdown value={value || 'gemini-3.6-flash'} onChange={onChange} options={options} className={className} />;
};

interface ImageModelDropdownProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const ImageModelDropdown: React.FC<ImageModelDropdownProps> = ({ value, onChange, className = '' }) => {
  const { options: curatedOptions } = useModelOptions('image', value);
  const options: DropdownOption<string>[] = (curatedOptions.length > 0 ? curatedOptions : [
    { id: DEFAULT_IMAGE_MODEL, label: 'Gemini 3.1 Flash Image', backend: 'gemini' as const },
  ]).map(m => ({
    value: m.id,
    label: m.label,
    sublabel: m.backend === 'gateway' ? m.provider || 'AI Gateway model' : undefined,
    icon: <Sparkles className="w-4 h-4 text-cyan-400" />
  }));

  return <GenericDropdown value={value || DEFAULT_IMAGE_MODEL} onChange={onChange} options={options} className={className} />;
};


