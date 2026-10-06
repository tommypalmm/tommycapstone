import { WEEKDAYS, type WeeklyHours } from "@/lib/time";

export function HoursFields({ hours, prefix = "" }: { hours: WeeklyHours | null; prefix?: string }) {
  return (
    <div>
      {WEEKDAYS.map((day, i) => {
        const w = hours?.[String(i)];
        return (
          <div className="hours-row" key={day}>
            <label className="check">
              <input type="checkbox" name={`${prefix}open_${i}`} defaultChecked={Boolean(w)} />
              {day.slice(0, 3)}
            </label>
            <input type="time" name={`${prefix}start_${i}`} defaultValue={w?.[0] ?? "09:00"} aria-label={`${day} open`} />
            <input type="time" name={`${prefix}end_${i}`} defaultValue={w?.[1] ?? "17:00"} aria-label={`${day} close`} />
          </div>
        );
      })}
    </div>
  );
}

/** Parses HoursFields back into WeeklyHours, or returns an error message. */
export function parseHours(form: FormData, prefix = ""): WeeklyHours | string {
  const out: WeeklyHours = {};
  for (let i = 0; i < 7; i++) {
    if (!form.get(`${prefix}open_${i}`)) continue;
    const start = String(form.get(`${prefix}start_${i}`) ?? "");
    const end = String(form.get(`${prefix}end_${i}`) ?? "");
    if (!/^\d\d:\d\d$/.test(start) || !/^\d\d:\d\d$/.test(end)) return `Enter open and close times for ${WEEKDAYS[i]}.`;
    if (end <= start) return `${WEEKDAYS[i]}: closing time must be after opening time.`;
    out[String(i)] = [start, end];
  }
  return out;
}
