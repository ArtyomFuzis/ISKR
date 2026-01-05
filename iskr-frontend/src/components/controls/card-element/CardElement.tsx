// /src/components/controls/card-element/CardElement.tsx
import './CardElement.scss';
import Stars from "../../stars/Stars.tsx";
import {useState, useEffect} from "react";

interface CardElementProps {
  title: string;
  description: string;
  imageUrl: string;
  onClick?: () => void;
  button: boolean;
  buttonLabel?: string;
  buttonIconUrl?: string;
  onButtonClick?: () => void;
  starsCount?: number;
  infoDecoration?: string;
  buttonChanged?: boolean;
  buttonChangedLabel?: string;
  buttonChangedIconUrl?: string;
  isButtonActive?: boolean;
  isAuthenticated?: boolean;
  onUnauthorized?: () => void;
  buttonClicked?: boolean;
  starsSize?: 'small' | 'medium' | 'large';
  isInCollection?: boolean; // Новый пропс для статуса в коллекции
  removeButtonLabel?: string; // Текст кнопки при удалении
  addButtonLabel?: string; // Текст кнопки при добавлении
}

function CardElement({
  title,
  description,
  imageUrl,
  onClick,
  button,
  buttonLabel,
  buttonIconUrl,
  onButtonClick,
  starsCount,
  infoDecoration,
  buttonChanged,
  buttonChangedLabel,
  buttonChangedIconUrl,
  isAuthenticated = true,
  onUnauthorized,
  buttonClicked = false,
  starsSize = 'small',
  isInCollection = false,
  removeButtonLabel = "Убрать из коллекции",
  addButtonLabel = "Добавить в коллекцию"
}: CardElementProps) {
  const [clicked, setClicked] = useState(buttonClicked);
  const [buttonImg, setButtonImg] = useState(buttonIconUrl);
  const [buttonLbl, setButtonLbl] = useState(buttonLabel || (isInCollection ? removeButtonLabel : addButtonLabel));

  // Обновляем состояние кнопки при изменении isInCollection
  useEffect(() => {
    if (!buttonChanged) {
      // Если не используется buttonChanged, обновляем текст кнопки в зависимости от isInCollection
      const newLabel = isInCollection ? removeButtonLabel : addButtonLabel;
      setButtonLbl(newLabel);
      setClicked(isInCollection);
    }
  }, [isInCollection, buttonChanged, removeButtonLabel, addButtonLabel]);

  // Обновляем состояние при изменении buttonClicked из пропсов
  useEffect(() => {
    setClicked(buttonClicked);
  }, [buttonClicked]);

  // Обновляем состояние при изменении buttonLabel из пропсов
  useEffect(() => {
    if (buttonLabel) {
      setButtonLbl(buttonLabel);
    }
  }, [buttonLabel]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      onUnauthorized?.();
      return;
    }

    if (buttonChanged) {
      // Если используется режим переключения
      setClicked(!clicked);
      setButtonImg(buttonImg === buttonIconUrl ? buttonChangedIconUrl : buttonIconUrl);
      setButtonLbl(buttonLbl === buttonLabel ? buttonChangedLabel : buttonLabel);
    } else {
      // Если не используется режим переключения, просто меняем текст кнопки
      setClicked(!clicked);
      const newLabel = clicked ? addButtonLabel : removeButtonLabel;
      setButtonLbl(newLabel);
    }
    onButtonClick?.();
  }

  return (
    <div className="card-element" onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined}>
      <div className="top-card-container">
        <img src={imageUrl} alt={title} className="card-image" />
      </div>
      <div className="card-info">
        {(starsCount || infoDecoration) &&
          <div className="card-info-decoration">
            {starsCount ? <Stars count={starsCount} size={starsSize} showValue={true}/> : null}
            {infoDecoration ? (
              <span className={`info-decoration-text ${isInCollection ? 'in-collection' : ''}`}>
                {infoDecoration}
              </span>
            ) : null}
          </div>
        }
        <div className="card-text-container">
          <div className="card-title" title={title}>
            {title}
          </div>
          <div className="card-description" title={description}>
            {description}
          </div>
        </div>
        {button && (
          <button 
            className={`card-button ${clicked || isInCollection ? 'card-button--clicked' : ''}`} 
            onClick={handleClick}
            disabled={!isAuthenticated}
          >
            {buttonIconUrl && <img src={buttonImg} alt="icon" className="button-icon" />}
            {buttonLbl}
          </button>
        )}
      </div>
    </div>
  );
}

export default CardElement;