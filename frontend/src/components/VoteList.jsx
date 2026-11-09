export default function VoteList({ options, selectedOption, onSelect }) {
  return (
    <div className="options">
      {options.map((option) => (
        <button
          type="button"
          className={selectedOption?.id === option.id ? 'option selected' : 'option'}
          key={option.id}
          onClick={() => onSelect(option)}
        >
          <strong>{option.name}</strong>
          <span>{option.descr}</span>
        </button>
      ))}
    </div>
  );
}
