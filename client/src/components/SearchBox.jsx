export function SearchBox({ value, onChange }) {
  return (
    <input
      className="search-input"
      placeholder="Search todos..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
