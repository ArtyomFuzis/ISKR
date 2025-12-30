/**
 * Форматирует рейтинг из 10-балльной шкалы в 5-балльную
 * @param rating Рейтинг от 0 до 10 или null
 * @returns Рейтинг от 0 до 5, округленный до 1 знака после запятой
 */
export const formatRatingFrom10to5 = (rating: number | null): number => {
  if (rating === null) {
    return 0;
  }
  // Преобразуем из 10-балльной шкалы в 5-балльную и округляем до 1 знака
  const converted = rating / 2;
  return Math.round(converted * 10) / 10;
};

/**
 * Форматирует рейтинг для отображения
 * @param rating Рейтинг от 0 до 5
 * @returns Строка с рейтингом (например, "4.5")
 */
export const formatRatingForDisplay = (rating: number): string => {
  return rating.toFixed(1);
};