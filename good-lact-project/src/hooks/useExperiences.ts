import { useCallback, useEffect, useState } from 'react';
import { isExperience, upsertExperience } from '../lib/experiences';
import { load, newId, save } from '../lib/storage';
import type { Experience, ExperienceVerdict } from '../types';

const isList = (v: unknown): v is unknown[] => Array.isArray(v);

export function useExperiences() {
  const [experiences, setExperiences] = useState<Experience[]>(() => load<unknown[]>('experiences', [], isList).filter(isExperience));

  useEffect(() => save('experiences', experiences), [experiences]);

  const add = useCallback((name: string, verdict: ExperienceVerdict) => {
    setExperiences((prev) => upsertExperience(prev, name, verdict, newId(), Date.now()));
  }, []);

  const remove = useCallback((id: string) => setExperiences((prev) => prev.filter((e) => e.id !== id)), []);

  return { experiences, add, remove };
}
