import Star from "../../assets/elements/star.svg";
import SemiStar from "../../assets/elements/semi-star.svg";
import NullStar from "../../assets/elements/null-star.svg";
import './Stars.scss';

interface StarsProps {
  count: number;
  onChange?: (count: number) => void;
  size?: 'small' | 'medium' | 'large';
  showValue?: boolean; // Добавляем пропс для управления отображением значения
}

function Stars({ count, onChange, size = 'medium', showValue = true }: StarsProps) {
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
        className={`star ${size} ${isClickable ? 'clickable' : ''}`}
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
      {showValue && (
        <span className="rating-value" style={{ marginLeft: '4px' }}>
          {count.toFixed(1)}
        </span>
      )}
    </div>
  );
}

export default Stars;