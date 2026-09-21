import React, { useState, useRef } from 'react';
import { analyzeFoodImage, FoodNutritionEstimate } from '../services/geminiService';
import { addMealLog } from '../services/scheduleService';
import { MealType } from '../types';
import { Camera, Upload, Sparkles, Check, Edit2, Loader2, AlertCircle, ArrowRight } from 'lucide-react';

interface ScanFoodPageProps {
  userId: string;
  date: string;
  onSaved: () => void;
}

export const ScanFoodPage: React.FC<ScanFoodPageProps> = ({
  userId,
  date,
  onSaved,
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estimate, setEstimate] = useState<FoodNutritionEstimate | null>(null);

  // Editable fields after scan
  const [editedFoodName, setEditedFoodName] = useState('');
  const [editedPortion, setEditedPortion] = useState('');
  const [editedCalories, setEditedCalories] = useState<number>(0);
  const [editedProtein, setEditedProtein] = useState<number>(0);
  const [editedCarbs, setEditedCarbs] = useState<number>(0);
  const [editedFat, setEditedFat] = useState<number>(0);
  const [selectedMealType, setSelectedMealType] = useState<MealType>('lunch');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImageSrc(result);
      // Run automatic analysis
      triggerAnalysis(result, file.type);
    };
    reader.readAsDataURL(file);
  };

  const triggerAnalysis = async (dataUrl: string, mimeType: string) => {
    setAnalyzing(true);
    setError(null);
    setEstimate(null);
    try {
      // Remove data:image/...;base64, prefix
      const base64Data = dataUrl.split(',')[1];
      const result = await analyzeFoodImage(base64Data, mimeType || 'image/jpeg');
      setEstimate(result);
      setEditedFoodName(result.foodName);
      setEditedPortion(result.portion);
      setEditedCalories(result.calories);
      setEditedProtein(result.protein);
      setEditedCarbs(result.carbs);
      setEditedFat(result.fat);
    } catch (err: any) {
      setError(err.message || 'Could not analyze food image. Please try another photo.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveToLog = async () => {
    if (!editedFoodName.trim()) return;
    setSaving(true);
    try {
      await addMealLog({
        userId,
        date,
        mealType: selectedMealType,
        foodName: editedFoodName.trim(),
        portion: editedPortion,
        calories: Number(editedCalories) || 0,
        protein: Number(editedProtein) || 0,
        carbs: Number(editedCarbs) || 0,
        fat: Number(editedFat) || 0,
        notes: estimate?.notes || 'Logged via AI Food Scanner',
        loggedAt: new Date().toISOString(),
        source: 'ai-scan',
      });
      onSaved();
    } catch (err) {
      console.error('Failed to save scanned meal:', err);
      setError('Failed to save to your daily food log.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div id="scan-food-page" className="space-y-6">
      {/* Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 mb-1">
            <Camera className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">AI Vision Nutrition</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900">Scan & Estimate Food</h2>
          <p className="text-xs text-slate-500">
            Upload or snap a photo of your meal. Gemini Vision will estimate nutrition which you can review and save.
          </p>
        </div>
      </div>

      {/* Mandatory Disclaimer Box */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-amber-900">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Notice: </span>
          Nutrition values are AI estimates and may not be exact. You can adjust all values below before saving.
        </div>
      </div>

      {/* Upload/Camera Dropzone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center justify-center min-h-[300px] text-center">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {imageSrc ? (
            <div className="w-full space-y-3">
              <div className="relative rounded-xl overflow-hidden max-h-64 bg-slate-100 flex items-center justify-center">
                <img
                  src={imageSrc}
                  alt="Food snapshot"
                  className="w-full h-auto object-cover max-h-64"
                />
                {analyzing && (
                  <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs flex flex-col items-center justify-center text-white text-xs">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-400 mb-2" />
                    <span>Gemini analyzing food elements...</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-indigo-600 font-semibold hover:underline"
              >
                Choose a different photo
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-64 border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl flex flex-col items-center justify-center p-6 cursor-pointer hover:bg-indigo-50/20 transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold text-slate-800">Upload or Capture Meal Photo</span>
              <span className="text-xs text-slate-400 mt-1">Supports PNG, JPG, WEBP</span>
              <span className="mt-3 px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-semibold shadow-2xs">
                Select Photo
              </span>
            </div>
          )}
        </div>

        {/* Estimation & Edit Panel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Nutrition Breakdown</span>
            </h3>

            {error && (
              <div className="p-3 text-xs bg-rose-50 text-rose-700 rounded-xl border border-rose-200 mb-4">
                {error}
              </div>
            )}

            {!estimate && !analyzing && !error && (
              <div className="text-center py-12 text-slate-400 text-xs">
                Upload an image to see estimated calories, protein, carbs, and fat breakdown.
              </div>
            )}

            {analyzing && (
              <div className="space-y-4 py-8">
                <div className="h-4 bg-slate-100 rounded-md animate-pulse" />
                <div className="h-4 bg-slate-100 rounded-md animate-pulse w-3/4" />
                <div className="grid grid-cols-4 gap-2 pt-4">
                  <div className="h-14 bg-slate-100 rounded-lg animate-pulse" />
                  <div className="h-14 bg-slate-100 rounded-lg animate-pulse" />
                  <div className="h-14 bg-slate-100 rounded-lg animate-pulse" />
                  <div className="h-14 bg-slate-100 rounded-lg animate-pulse" />
                </div>
              </div>
            )}

            {estimate && (
              <div className="space-y-4">
                {/* Food Name & Portion */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Food Name</label>
                    <input
                      type="text"
                      value={editedFoodName}
                      onChange={(e) => setEditedFoodName(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Portion</label>
                    <input
                      type="text"
                      value={editedPortion}
                      onChange={(e) => setEditedPortion(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white text-slate-800"
                    />
                  </div>
                </div>

                {/* Macro Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2.5 bg-amber-50/60 rounded-xl border border-amber-100 text-center">
                    <span className="block text-[10px] uppercase font-bold text-amber-700">Calories</span>
                    <input
                      type="number"
                      value={editedCalories}
                      onChange={(e) => setEditedCalories(Number(e.target.value))}
                      className="w-full text-center text-sm font-bold text-amber-900 bg-transparent"
                    />
                    <span className="text-[10px] text-amber-600">kcal</span>
                  </div>

                  <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100 text-center">
                    <span className="block text-[10px] uppercase font-bold text-emerald-700">Protein</span>
                    <input
                      type="number"
                      value={editedProtein}
                      onChange={(e) => setEditedProtein(Number(e.target.value))}
                      className="w-full text-center text-sm font-bold text-emerald-900 bg-transparent"
                    />
                    <span className="text-[10px] text-emerald-600">g</span>
                  </div>

                  <div className="p-2.5 bg-blue-50/60 rounded-xl border border-blue-100 text-center">
                    <span className="block text-[10px] uppercase font-bold text-blue-700">Carbs</span>
                    <input
                      type="number"
                      value={editedCarbs}
                      onChange={(e) => setEditedCarbs(Number(e.target.value))}
                      className="w-full text-center text-sm font-bold text-blue-900 bg-transparent"
                    />
                    <span className="text-[10px] text-blue-600">g</span>
                  </div>

                  <div className="p-2.5 bg-rose-50/60 rounded-xl border border-rose-100 text-center">
                    <span className="block text-[10px] uppercase font-bold text-rose-700">Fat</span>
                    <input
                      type="number"
                      value={editedFat}
                      onChange={(e) => setEditedFat(Number(e.target.value))}
                      className="w-full text-center text-sm font-bold text-rose-900 bg-transparent"
                    />
                    <span className="text-[10px] text-rose-600">g</span>
                  </div>
                </div>

                {/* Meal Category to save to */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Save into meal slot:</label>
                  <select
                    value={selectedMealType}
                    onChange={(e) => setSelectedMealType(e.target.value as MealType)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="snack">Snacks / Other</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {estimate && (
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveToLog}
                className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{saving ? 'Saving...' : 'Save to Food Log'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
