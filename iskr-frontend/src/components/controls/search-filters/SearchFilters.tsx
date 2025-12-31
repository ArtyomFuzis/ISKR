import './SearchFilters.scss';
import PrimaryButton from "../primary-button/PrimaryButton.tsx";
import SelectWithSearch from "../select-with-search/SelectWithSearch.tsx";

interface SearchFiltersProps {
  selectedTypes: string[];
  onTypeChange: (type: string) => void;
  selectedGenre: string;
  onGenreChange: (genre: string) => void;
  onReset: () => void;
  genres: string[];
  loadingGenres: boolean;
}

function SearchFilters({ 
  selectedTypes, 
  onTypeChange, 
  selectedGenre, 
  onGenreChange, 
  onReset,
  genres,
  loadingGenres 
}: SearchFiltersProps) {
  const types = [
    { id: 'books', label: 'Книги' },
    { id: 'users', label: 'Пользователи' },
    { id: 'collections', label: 'Коллекции' }
  ];

  return (
    <div className="search-filters">
      <div className="filters-group">
        <div className="filter-types">
          {types.map(type => (
            <label key={type.id} className="checkbox-label">
              <input
                type="checkbox"
                checked={selectedTypes.includes(type.id)}
                onChange={() => onTypeChange(type.id)}
              />
              <span>{type.label}</span>
            </label>
          ))}
        </div>

        <div className="filter-genre">
          <SelectWithSearch
            value={selectedGenre}
            options={genres}
            onChange={onGenreChange}
            placeholder="Выберите жанр"
            disabled={loadingGenres}
          />
          {loadingGenres && <div className="loading-genres">Загрузка жанров...</div>}
        </div>
      </div>

      <PrimaryButton label="Сбросить фильтры" onClick={onReset} />
    </div>
  );
}

export default SearchFilters;