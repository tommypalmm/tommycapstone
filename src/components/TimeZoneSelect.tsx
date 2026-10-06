const ZONES = [
  ["America/New_York", "Eastern"],
  ["America/Chicago", "Central"],
  ["America/Denver", "Mountain"],
  ["America/Phoenix", "Arizona"],
  ["America/Los_Angeles", "Pacific"],
  ["America/Anchorage", "Alaska"],
  ["Pacific/Honolulu", "Hawaii"],
];

export function TimeZoneSelect({ name, value }: { name: string; value: string }) {
  const known = ZONES.some(([z]) => z === value);
  return (
    <select id={name} name={name} defaultValue={value}>
      {!known && <option value={value}>{value}</option>}
      {ZONES.map(([z, label]) => (
        <option key={z} value={z}>
          {label} ({z})
        </option>
      ))}
    </select>
  );
}
