import React, { useState, useEffect } from 'react';
import './GoalForm.scss';
import PrimaryButton from '../primary-button/PrimaryButton';
import SecondaryButton from '../secondary-button/SecondaryButton';
import type { Goal, GoalPeriod, GoalType, CreateGoalRequest, UpdateGoalRequest } from '../../../api/goalService';

interface GoalFormProps {
  goal?: Goal | null;
  onSubmit: (data: CreateGoalRequest | UpdateGoalRequest) => Promise<void>;
  onCancel: () => void;
}

const GoalForm: React.FC<GoalFormProps> = ({ goal, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<CreateGoalRequest>({
    period: '1d',
    amount: 50,
    goalType: 'pages_read'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const periodOptions: Array<{ value: GoalPeriod; label: string }> = [
    { value: '1d', label: '1 день' },
    { value: '3d', label: '3 дня' },
    { value: 'week', label: 'Неделя' },
    { value: 'month', label: 'Месяц' },
    { value: 'quarter', label: 'Квартал' },
    { value: 'year', label: 'Год' }
  ];

  const goalTypeOptions: Array<{ value: GoalType; label: string }> = [
    { value: 'pages_read', label: 'Количество страниц' },
    { value: 'books_read', label: 'Количество книг' }
  ];

  useEffect(() => {
    if (goal) {
      setFormData({
        period: goal.period,
        amount: goal.amount,
        goalType: goal.goalType
      });
    }
  }, [goal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.amount <= 0) {
      setError('Количество должно быть больше 0');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSubmit(formData);
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  const handleAmountChange = (value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      setFormData(prev => ({ ...prev, amount: numValue }));
    } else if (value === '') {
      setFormData(prev => ({ ...prev, amount: 0 }));
    }
  };

  return (
    <div className="goal-form-modal">
      <div className="goal-form-header">
        <h2>{goal ? 'Редактировать цель' : 'Создать новую цель'}</h2>
      </div>
      
      <form className="goal-form-content" onSubmit={handleSubmit}>
        <div className="form-section">
          <div className="form-group">
            <label className="form-label required">
              Тип цели
            </label>
            <div className="goal-type-options">
              {goalTypeOptions.map((option) => (
                <label 
                  key={option.value} 
                  className={`goal-type-option ${formData.goalType === option.value ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="goalType"
                    value={option.value}
                    checked={formData.goalType === option.value}
                    onChange={(e) => {
                      setFormData(prev => ({ 
                        ...prev, 
                        goalType: e.target.value as GoalType 
                      }));
                      setError(null);
                    }}
                    disabled={loading}
                  />
                  <span className="option-label">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label required">
              Период выполнения
            </label>
            <div className="custom-select">
              <select
                value={formData.period}
                onChange={(e) => {
                  setFormData(prev => ({ 
                    ...prev, 
                    period: e.target.value as GoalPeriod 
                  }));
                  setError(null);
                }}
                disabled={loading}
                className="period-select"
              >
                {periodOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="select-arrow">▼</div>
            </div>
            <div className="form-hint">
              {formData.period === '1d' && 'Цель на один день'}
              {formData.period === '3d' && 'Цель на три дня'}
              {formData.period === 'week' && 'Цель на неделю'}
              {formData.period === 'month' && 'Цель на месяц'}
              {formData.period === 'quarter' && 'Цель на квартал (3 месяца)'}
              {formData.period === 'year' && 'Цель на год'}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label required">
              {formData.goalType === 'pages_read' ? 'Количество страниц' : 'Количество книг'}
            </label>
            <div className="amount-input-container">
              <input
                type="number"
                value={formData.amount || ''}
                onChange={(e) => {
                  handleAmountChange(e.target.value);
                  setError(null);
                }}
                min="1"
                className="amount-input"
                placeholder={formData.goalType === 'pages_read' ? 'Например: 100' : 'Например: 5'}
                disabled={loading}
              />
              <span className="amount-unit">
                {formData.goalType === 'pages_read' ? 'страниц' : 'книг'}
              </span>
            </div>
            <div className="form-hint">
              {formData.goalType === 'pages_read' 
                ? `Сколько страниц вы планируете прочитать за ${periodOptions.find(p => p.value === formData.period)?.label.toLowerCase()}`
                : `Сколько книг вы планируете прочитать за ${periodOptions.find(p => p.value === formData.period)?.label.toLowerCase()}`}
            </div>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠</span>
            <span>{error}</span>
          </div>
        )}

        <div className="modal-actions">
          <SecondaryButton
            label="Отмена"
            onClick={onCancel}
            disabled={loading}
          />
          <PrimaryButton
            label={loading ? "Сохранение..." : (goal ? "Обновить цель" : "Создать цель")}
            type="submit"
            disabled={loading || formData.amount <= 0}
          />
        </div>
      </form>
    </div>
  );
};

export default GoalForm;