import { useCallback, useEffect, useState } from 'react';
import { isSymptomEntry, MAX_SYMPTOM_ENTRIES } from '../lib/diary';
import { load, newId, save } from '../lib/storage';
import type { Consumption, SymptomEntry, SymptomSeverity } from '../types';

const isList = (v: unknown): v is unknown[] => Array.isArray(v);

export function useSymptoms() {
  const [entries, setEntries] = useState<SymptomEntry[]>(() => load<unknown[]>('symptoms', [], isList).filter(isSymptomEntry));

  useEffect(() => save('symptoms', entries), [entries]);

  const push = useCallback((entry: SymptomEntry) => {
    setEntries((prev) => [entry, ...prev].slice(0, MAX_SYMPTOM_ENTRIES));
  }, []);

  const answer = useCallback(
    (consumption: Consumption, severity: SymptomSeverity) =>
      push({ id: newId(), at: Date.now(), severity, consumptionId: consumption.id, foodNames: consumption.foodNames, pills: consumption.pills }),
    [push],
  );

  const skip = useCallback(
    (consumption: Consumption) =>
      push({ id: newId(), at: Date.now(), severity: 0, consumptionId: consumption.id, foodNames: consumption.foodNames, pills: consumption.pills, skipped: true }),
    [push],
  );

  const remove = useCallback((id: string) => setEntries((prev) => prev.filter((e) => e.id !== id)), []);

  return { entries, answer, skip, remove };
}
