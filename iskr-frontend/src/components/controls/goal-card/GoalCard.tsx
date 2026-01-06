import React from 'react';
import './GoalCard.scss';
import PrimaryButton from '../primary-button/PrimaryButton';
import SecondaryButton from '../secondary-button/SecondaryButton';
import { type Goal, getPeriodDisplayName, getGoalTypeDisplayName, calculateGoalProgress } from '../../../api/goalService';
import EditIcon from '../../../assets/elements/change-pink.svg';
import DeleteIcon from '../../../assets/elements/delete-pink.svg';

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (goalId: number) => void;
}

const GoalCard: React.FC<GoalCardProps> = ({ goal, onEdit, onDelete }) => {
  const { percentage, isOverdue } = calculateGoalProgress(goal);
  const endDate = new Date(goal.endDate);
  const startDate = new Date(goal.startDate);
  
  const getStatusLabel = () => {
    if (goal.isCompleted) return 'Выполнено';
    if (isOverdue) return 'Просрочено';
    return 'В процессе';
  };
  
  const getStatusClass = () => {
    if (goal.isCompleted) return 'goal-status-completed';
    if (isOverdue) return 'goal-status-failed';
    return 'goal-status-in-progress';
  };

  return (
    <div className="goal-card">
      <div className="goal-card-header">
        <div className="goal-info">
          <span className={`goal-status ${getStatusClass()}`}>{getStatusLabel()}</span>
          <h3 className="goal-title">
            {goal.amount} {goal.goalType === 'pages_read' ? 'страниц' : 'книг'} за {getPeriodDisplayName(goal.period)}
          </h3>
        </div>
        <div className="goal-actions">
          {!goal.isCompleted && !isOverdue && (
            <button 
              className="goal-action-btn" 
              onClick={() => onEdit(goal)}
              title="Редактировать"
            >
              <img src={EditIcon} alt="Редактировать" />
            </button>
          )}
          <button 
            className="goal-action-btn" 
            onClick={() => onDelete(goal.pgoalId)}
            title="Удалить"
          >
            <img src={DeleteIcon} alt="Удалить" />
          </button>
        </div>
      </div>
      
      <div className="goal-card-content">
        <div className="goal-progress">
          <div className="goal-progress-bar">
            <div 
              className="goal-progress-fill"
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          <div className="goal-progress-text">
            <span>{goal.currentProgress} / {goal.amount}</span>
            <span>{percentage}%</span>
          </div>
        </div>
        
        <div className="goal-details">
          <div className="goal-detail">
            <span className="goal-detail-label">Тип цели:</span>
            <span className="goal-detail-value">{getGoalTypeDisplayName(goal.goalType)}</span>
          </div>
          <div className="goal-detail">
            <span className="goal-detail-label">Период:</span>
            <span className="goal-detail-value">{getPeriodDisplayName(goal.period)}</span>
          </div>
          <div className="goal-detail">
            <span className="goal-detail-label">Начало:</span>
            <span className="goal-detail-value">{startDate.toLocaleDateString('ru-RU')}</span>
          </div>
          <div className="goal-detail">
            <span className="goal-detail-label">Конец:</span>
            <span className="goal-detail-value">{endDate.toLocaleDateString('ru-RU')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoalCard;