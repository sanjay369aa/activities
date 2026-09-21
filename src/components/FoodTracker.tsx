import React, { useState, useEffect } from 'react';
import { subscribeMealLogs, addMealLog, deleteMealLog } from '../services/scheduleService';
import { MealLog, MealType } from '../types';
import { Utensils, Plus, Trash2, Check, Flame } from 'lucide-react';

interface FoodTrackerProps {
  userId: string;
  date: string;
  onNavigateToScan?: () => void;
}

const MEAL_TYPES: { id: MealType; label: string; defaultTime: string }[] = [
  { id: 'breakfast', label: 'Breakfast', defaultTime: '08:00' },
  { id: 'lunch', label: 'Lunch', defaultTime: '13:00' },
  { id: 'dinner', label: 'Dinner', defaultTime: '20:00' },
  { id: 'snack', label: 'Snacks / Beverages', defaultTime: '16:00' },
];

export const FoodTracker: React.FC<FoodTrackerProps> = ({
  userId,
  date,
  onNavigateToScan,
}) => {
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [activeMealType, setActiveMealType] = useState<MealType>('breakfast');
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [portion, setPortion] = useState('');
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const unsub = subscribeMealLogs(userId, date, (data) => {
      setMeals(data);
    });
    return () => unsub();
  }, [userId, date]);

  const totalCalories = meals.reduce((acc, m) => acc + (m.calories || 0), 0);

  const handleAddMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName.trim()) return;
    setSaving(true);
    try {
      await addMealLog({
        userId,
        date,
        mealType: activeMealType,
        foodName: foodName.trim(),
        portion: portion.trim() || undefined,
        calories: calories ? parseInt(calories, 10) : undefined,
        loggedAt: new Date().toISOString(),
        source: 'manual',
      });
      setFoodName('');
      setCalories('');
      setPortion('');
      setShowAddForm(false);
    } catch (err) {
      console.error('Failed to log meal:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (mealId: string) => {
    try {
      await deleteMealLog(mealId);
    } catch (err) {
      console.error('Failed to delete meal:', err);
    }
  };

  return (
    <div id="food-tracker" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Food & Nutrition Log</h2>
            <p className="text-xs text-slate-500">Date: {date}</p>
          </div>
        </div>

        {/* Calories pill & Actions */}
        <div className="flex items-center gap-3">
          {totalCalories > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-800">
              <Flame className="w-4 h-4 text-amber-600 fill-amber-500" />
              <span>{totalCalories} kcal logged</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Log Meal</span>
          </button>
        </div>
      </div>

      {/* Optional Log Form */}
      {showAddForm && (
        <form onSubmit={handleAddMeal} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800">Log a Meal or Snack</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {MEAL_TYPES.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setActiveMealType(type.id)}
                className={`p-2.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                  activeMealType === type.id
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Food Description *</label>
              <input
                type="text"
                required
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                placeholder="e.g. Oatmeal with blueberries, Grilled Chicken Salad"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Calories (kcal)</label>
              <input
                type="number"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="e.g. 450"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 text-slate-800"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save Entry'}
            </button>
          </div>
        </form>
      )}

      {/* Categorized Meal Cards: Breakfast, Lunch, Dinner, Snack */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['breakfast', 'lunch', 'dinner'] as MealType[]).map((mealType) => {
          const typeMeals = meals.filter((m) => m.mealType === mealType);
          const isLogged = typeMeals.length > 0;
          const label = mealType.charAt(0).toUpperCase() + mealType.slice(1);

          return (
            <div
              key={mealType}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                    {label}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      isLogged
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {isLogged ? (
                      <>
                        <Check className="w-3 h-3 stroke-[3]" />
                        {label} logged
                      </>
                    ) : (
                      `☐ ${label} not logged`
                    )}
                  </span>
                </div>

                {/* Items in this meal */}
                {typeMeals.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">No meals logged yet for {label.toLowerCase()}.</p>
                ) : (
                  <div className="space-y-2 my-2">
                    {typeMeals.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs"
                      >
                        <div>
                          <span className="font-semibold text-slate-800">{item.foodName}</span>
                          {item.portion && <span className="text-slate-400 ml-1">({item.portion})</span>}
                          {item.calories && (
                            <span className="block text-[11px] text-amber-600 font-medium">
                              {item.calories} kcal
                              {item.protein ? ` • ${item.protein}g protein` : ''}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveMealType(mealType);
                  setShowAddForm(true);
                }}
                className="mt-4 w-full py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50/70 border border-dashed border-indigo-200 rounded-xl transition-colors cursor-pointer"
              >
                + Add {label}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
