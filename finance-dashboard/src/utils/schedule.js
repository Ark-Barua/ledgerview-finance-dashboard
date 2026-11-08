export function nextOccurrence(day, cadence, anchorDay) {
  const date = new Date(day + "T00:00:00Z");
  if (cadence === "Monthly") {
    date.setUTCDate(1);
    date.setUTCMonth(date.getUTCMonth() + 2, 0);
    date.setUTCDate(Math.min(anchorDay, date.getUTCDate()));
  } else {
    date.setUTCDate(date.getUTCDate() + (cadence === "Weekly" ? 7 : 1));
  }
  return date.toISOString().slice(0, 10);
}

// Each checkpoint includes posted entries and outstanding scheduled occurrences once.
export function forecast(transactions, recurring, asOf, horizons = [30, 60, 90], includeHistory = false) {
  const cutoff = new Date(asOf + "T00:00:00Z");
  cutoff.setUTCDate(cutoff.getUTCDate() - 89);
  const since = cutoff.toISOString().slice(0,10);
  const history = includeHistory ? transactions.filter(t => !t.recurringId && t.date >= since && t.date <= asOf) : [];
  const dailyNetCents = history.reduce((sum,t) => sum + Math.round(t.amount*100) * (t.type === "income" ? 1 : -1),0) / 90;
  return horizons.map(days => {
    const end = new Date(asOf + "T00:00:00Z");
    end.setUTCDate(end.getUTCDate() + days);
    const until = end.toISOString().slice(0, 10);
    let balance = Math.round(dailyNetCents * days);
    const apply = row => { balance += Math.round(row.amount * 100) * (row.type === "income" ? 1 : -1); };
    for (const row of transactions) if (row.date <= until) apply(row);
    for (const rule of recurring) {
      for (let day = rule.nextDate; day <= until; day = nextOccurrence(day, rule.cadence, rule.anchorDay)) apply(rule);
    }
    return { days, until, balance: balance / 100 };
  });
}

