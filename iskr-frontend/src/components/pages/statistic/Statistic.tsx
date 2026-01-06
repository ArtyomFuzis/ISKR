import React, { useState, useEffect } from 'react';
import './Statistic.scss';
import PrimaryButton from "../../controls/primary-button/PrimaryButton";
import Modal from "../../controls/modal/Modal";
import GoalForm from "../../controls/goal-form/GoalForm";
import GoalCard from "../../controls/goal-card/GoalCard";
import ConfirmDialog from "../../controls/confirm-dialog/ConfirmDialog";
import type { Goal, GoalStats, ReadingStats } from '../../../api/goalService';
import goalService from '../../../api/goalService';

function Statistic() {
  // Состояния для целей
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Состояния для статистики
  const [goalStats, setGoalStats] = useState<GoalStats | null>(null);
  const [readingStats, setReadingStats] = useState<ReadingStats | null>(null);
  
  // Состояния для модальных окон
  const [isGoalFormOpen, setIsGoalFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<number | null>(null);

  // Загрузка данных
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [goalsData, goalStatsData, readingStatsData] = await Promise.all([
        goalService.getGoals(),
        goalService.getGoalStats(),
        goalService.getReadingStats()
      ]);
      
      setGoals(goalsData);
      setGoalStats(goalStatsData);
      setReadingStats(readingStatsData);
    } catch (err: any) {
      console.error('Error loading statistics:', err);
      setError(err.message || 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Классификация целей
  const now = new Date();
  const currentGoals = goals.filter(goal => {
    const endDate = new Date(goal.endDate);
    return !goal.isCompleted && endDate >= now;
  });

  const completedGoals = goals.filter(goal => goal.isCompleted);

  const failedGoals = goals.filter(goal => {
    const endDate = new Date(goal.endDate);
    return !goal.isCompleted && endDate < now;
  });

  // Обработчики целей
  const handleCreateGoal = () => {
    setEditingGoal(null);
    setIsGoalFormOpen(true);
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setIsGoalFormOpen(true);
  };

  const handleDeleteGoal = (goalId: number) => {
    setGoalToDelete(goalId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteGoal = async () => {
    if (!goalToDelete) return;

    try {
      await goalService.deleteGoal(goalToDelete);
      await loadData(); // Перезагружаем данные
      setIsDeleteDialogOpen(false);
      setGoalToDelete(null);
    } catch (err: any) {
      console.error('Error deleting goal:', err);
      setError(err.message || 'Ошибка удаления цели');
    }
  };

  const handleGoalSubmit = async (data: any) => {
    try {
      if (editingGoal) {
        await goalService.updateGoal(editingGoal.pgoalId, data);
      } else {
        await goalService.createGoal(data);
      }
      
      setIsGoalFormOpen(false);
      setEditingGoal(null);
      await loadData(); // Перезагружаем данные
    } catch (err: any) {
      console.error('Error saving goal:', err);
      throw err;
    }
  };

  // Рендер состояния загрузки
  const renderLoadingState = () => (
    <div className="loading-state">
      <div className="loading-spinner"></div>
      <p>Загрузка статистики...</p>
    </div>
  );

  // Рендер состояния ошибки
  const renderErrorState = () => (
    <div className="error-state">
      <p>Ошибка: {error}</p>
      <PrimaryButton
        label="Попробовать снова"
        onClick={loadData}
      />
    </div>
  );

  if (loading) {
    return (
      <main>
        <div className="statistic-page-container container">
          {renderLoadingState()}
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main>
        <div className="statistic-page-container container">
          {renderErrorState()}
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="statistic-page-container">
        {/* Блок целей */}
        <div className="goals-section">
          <div className="section-header">
            <h2>Цели чтения</h2>
            <PrimaryButton
              label="Создать цель"
              onClick={handleCreateGoal}
            />
          </div>

          <div className="goals-container">
            {/* Текущие цели */}
            <div className="goals-column">
              <h3 className="goals-column-title">Текущие цели</h3>
              <div className="goals-list">
                {currentGoals.length > 0 ? (
                  currentGoals.map(goal => (
                    <GoalCard
                      key={goal.pgoalId}
                      goal={goal}
                      onEdit={handleEditGoal}
                      onDelete={handleDeleteGoal}
                    />
                  ))
                ) : (
                  <p className="no-goals-message">Нет текущих целей</p>
                )}
              </div>
            </div>

            {/* Успешные цели */}
            <div className="goals-column">
              <h3 className="goals-column-title">Успешные цели</h3>
              <div className="goals-list">
                {completedGoals.length > 0 ? (
                  completedGoals.map(goal => (
                    <GoalCard
                      key={goal.pgoalId}
                      goal={goal}
                      onEdit={() => {}} // Не редактируем выполненные цели
                      onDelete={handleDeleteGoal}
                    />
                  ))
                ) : (
                  <p className="no-goals-message">Нет выполненных целей</p>
                )}
              </div>
            </div>

            {/* Проваленные цели */}
            <div className="goals-column">
              <h3 className="goals-column-title">Проваленные цели</h3>
              <div className="goals-list">
                {failedGoals.length > 0 ? (
                  failedGoals.map(goal => (
                    <GoalCard
                      key={goal.pgoalId}
                      goal={goal}
                      onEdit={() => {}} // Не редактируем проваленные цели
                      onDelete={handleDeleteGoal}
                    />
                  ))
                ) : (
                  <p className="no-goals-message">Нет проваленных целей</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Блок статистики */}
        <div className="statistics-section">
          <h2>Статистика чтения</h2>
          
          <div className="stats-container">
            {/* Статистика по целям */}
            <div className="stats-card goal-stats">
              <h3>Статистика по целям</h3>
              {goalStats && (
                <div className="stats-grid">
                  <div className="stat-item">
                    <span className="stat-label">Всего целей</span>
                    <span className="stat-value">{goalStats.totalGoals}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Выполнено</span>
                    <span className="stat-value stat-success">{goalStats.completedGoals}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">В процессе</span>
                    <span className="stat-value stat-in-progress">{goalStats.inProgressGoals}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Провалено</span>
                    <span className="stat-value stat-failed">{goalStats.failedGoals}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Общая статистика чтения */}
            <div className="stats-card reading-stats">
              <h3>Общая статистика</h3>
              {readingStats && (
                <div className="stats-grid">
                  <div className="stat-item">
                    <span className="stat-label">Всего книг прочитано</span>
                    <span className="stat-value">{readingStats.totalBooksRead}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Всего страниц прочитано</span>
                    <span className="stat-value">{readingStats.totalPagesRead}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Читаю сейчас</span>
                    <span className="stat-value">{readingStats.currentlyReadingBooks}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Планирую прочитать</span>
                    <span className="stat-value">{readingStats.planningToReadBooks}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Отложено</span>
                    <span className="stat-value">{readingStats.delayedBooks}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Брошено</span>
                    <span className="stat-value">{readingStats.gaveUpBooks}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно создания/редактирования цели */}
      <Modal open={isGoalFormOpen} onClose={() => {
        setIsGoalFormOpen(false);
        setEditingGoal(null);
      }}>
        <GoalForm
          goal={editingGoal}
          onSubmit={handleGoalSubmit}
          onCancel={() => {
            setIsGoalFormOpen(false);
            setEditingGoal(null);
          }}
        />
      </Modal>

      {/* Диалог подтверждения удаления */}
      <Modal open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
        <ConfirmDialog
          title="Удаление цели"
          message="Вы уверены, что хотите удалить эту цель?"
          onConfirm={confirmDeleteGoal}
          onCancel={() => {
            setIsDeleteDialogOpen(false);
            setGoalToDelete(null);
          }}
        />
      </Modal>
    </main>
  );
}

export default Statistic;