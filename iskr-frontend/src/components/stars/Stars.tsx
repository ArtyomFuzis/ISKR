import Star from "../../assets/elements/star.svg";
import SemiStar from "../../assets/elements/semi-star.svg";
import NullStar from "../../assets/elements/null-star.svg";
import './Stars.scss';

interface StarsProps {
  count: number; // теперь принимает дробные значения от 0 до 5
  onChange?: (count: number) => void;
}

function Stars({ count, onChange }: StarsProps) {
  // Округляем до ближайшего 0.5 для отображения
  const roundedCount = Math.round(count * 2) / 2;
  
  const handleStarClick = (starValue: number) => {
    if (onChange) {
      onChange(starValue);
    }
  };

  const renderStar = (position: number) => {
    const isClickable = !!onChange;
    
    // Определяем тип звезды для отображения
    let starElement;
    if (roundedCount >= position) {
      starElement = <img src={Star} alt="star" />;
    } else if (roundedCount >= position - 0.5) {
      starElement = <img src={SemiStar} alt="half-star" />;
    } else {
      starElement = <img src={NullStar} alt="empty-star" />;
    }

    return (
      <div
        className={`star ${isClickable ? 'clickable' : ''}`}
        onClick={() => isClickable && handleStarClick(position)}
        key={position}
      >
        {starElement}
      </div>
    );
  };

  return (
    <div className="stars-container">
      {[1, 2, 3, 4, 5].map(renderStar)}
      {/* Дополнительно можно отображать числовое значение рейтинга */}
      <span className="rating-value">{count.toFixed(1)}</span>
    </div>
  );
}

export default Stars;