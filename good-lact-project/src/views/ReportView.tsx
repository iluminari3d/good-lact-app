import { motion } from 'framer-motion';
import { Printer } from 'lucide-react';
import { SEVERITY_LABEL } from '../lib/diary';
import { formatPills, pillsLabel } from '../lib/format';
import type { Report } from '../lib/report';
import type { Experience } from '../types';
import { BackButton } from './ui';

interface Props {
  report: Report;
  experiences: Experience[];
  severe: boolean;
  sensitivity: number;
  lactaseName: string;
  onBack: () => void;
}

const dateLabel = (key: string) =>
  new Date(`${key}T12:00:00`).toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'long' });

export function ReportView({ report, experiences, severe, sensitivity, lactaseName, onBack }: Props) {
  const bad = experiences.filter((e) => e.verdict === 'bad');
  const ok = experiences.filter((e) => e.verdict === 'ok');
  const avg = report.daysWithData > 0 ? report.totalPills / report.daysWithData : 0;

  return (
    <motion.div key="report" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }} className="space-y-8">
      <div className="print:hidden space-y-6">
        <BackButton label="Menu" onClick={onBack} />
        <button type="button" onClick={() => window.print()} className="w-full py-4 bg-primary text-white font-black rounded-3xl flex items-center justify-center gap-2">
          <Printer size={18} /> Stampa o salva in PDF
        </button>
      </div>

      <article className="space-y-6 text-slate-800">
        <header className="space-y-1">
          <h2 className="text-3xl font-black">Report degli ultimi 30 giorni</h2>
          <p className="text-sm text-slate-600 font-medium">
            Generato il {new Date().toLocaleDateString('it-IT')} da Good Lact. Sono dati inseriti dalla persona, non misure cliniche.
          </p>
        </header>

        <section className="p-5 bg-slate-50 rounded-3xl text-sm space-y-1 print:border print:border-slate-300">
          <p><strong>Enzima usato:</strong> {lactaseName || 'non indicato'}</p>
          <p><strong>Profilo:</strong> {severe ? 'intolleranza severa' : 'standard'}, fattore di sensibilità {sensitivity.toFixed(1).replace('.', ',')}x</p>
          <p><strong>Compresse totali:</strong> {formatPills(report.totalPills)} in {report.daysWithData} giorni con registrazioni (media {avg.toFixed(1).replace('.', ',')} al giorno)</p>
          <p>
            <strong>Sintomi dichiarati:</strong>{' '}
            {([0, 1, 2, 3] as const).map((s) => `${SEVERITY_LABEL[s]}: ${report.symptomCounts[s]}`).join(' · ')}
          </p>
        </section>

        {(bad.length > 0 || ok.length > 0) && (
          <section className="text-sm space-y-1">
            {bad.length > 0 && <p><strong>Cibi che danno fastidio:</strong> {bad.map((e) => e.name).join(', ')}</p>}
            {ok.length > 0 && <p><strong>Cibi ben tollerati:</strong> {ok.map((e) => e.name).join(', ')}</p>}
          </section>
        )}

        {report.days.length === 0 ? (
          <p className="text-center py-10 text-slate-600 font-bold">Nessun dato registrato negli ultimi 30 giorni.</p>
        ) : (
          <div className="space-y-4">
            {report.days.map((d) => (
              <section key={d.date} className="space-y-2 break-inside-avoid border-t border-slate-100 pt-3">
                <h3 className="font-black capitalize">{dateLabel(d.date)} <span className="text-slate-600 font-bold text-sm">· {formatPills(d.totalPills)} {pillsLabel(d.totalPills)}</span></h3>
                <ul className="text-sm space-y-1">
                  {d.consumptions.map((c) => (
                    <li key={c.id}>{c.time} — {c.foodNames.join(', ')} ({formatPills(c.pills)} {pillsLabel(c.pills)})</li>
                  ))}
                  {d.symptoms.map((s) => (
                    <li key={s.id} className="font-semibold">Sintomi dopo {s.foodNames.join(', ') || 'il pasto'}: {SEVERITY_LABEL[s.severity]}</li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </article>
    </motion.div>
  );
}
