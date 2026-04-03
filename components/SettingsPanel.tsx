
import React, { useRef, useState, ChangeEvent } from 'react';
import { BrandSettings } from '../types';
import { Settings } from './Icons';

interface SettingsPanelProps {
  settings: BrandSettings;
  onUpdate: (settings: BrandSettings) => void;
}

const fonts = [
  { name: 'Inter', value: 'font-sans' },
  { name: 'Poppins', value: 'font-poppins' },
  { name: 'Roboto', value: 'font-roboto' },
];

const colors = ['#7B61FF', '#1E90FF', '#FF4500', '#32CD32', '#FF69B4'];

const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onUpdate }) => {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(settings.logo);

  const handleUpdate = <K extends keyof BrandSettings>(key: K, value: BrandSettings[K]) => {
    onUpdate({ ...settings, [key]: value });
  };
  
  const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setLogoPreview(result);
        handleUpdate('logo', result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
        <Settings />
        Brand Kit
      </h2>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Logo</label>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="max-w-full max-h-full object-contain" />
              ) : (
                <span className="text-xs text-gray-500">None</span>
              )}
            </div>
            <button
                onClick={() => logoInputRef.current?.click()}
                className="text-sm font-medium text-accent hover:underline"
            >
                {logoPreview ? "Change" : "Upload"}
            </button>
            <input type="file" ref={logoInputRef} onChange={handleLogoChange} className="hidden" accept="image/png, image/jpeg" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Accent Color</label>
          <div className="flex gap-2">
            {colors.map(color => (
              <button
                key={color}
                onClick={() => handleUpdate('accentColor', color)}
                className={`w-8 h-8 rounded-full border-2 transition ${settings.accentColor === color ? 'border-accent' : 'border-transparent'}`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Caption Font</label>
          <select
            value={settings.font}
            onChange={(e) => handleUpdate('font', e.currentTarget.value as BrandSettings['font'])}
            className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-accent focus:border-accent"
          >
            {fonts.map(font => (
              <option key={font.value} value={font.value}>{font.name}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
