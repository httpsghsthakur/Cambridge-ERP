import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';
import { getGradeBg, getGradeColor } from '../../utils/helpers';
import { generateReportCard } from '../../utils/pdfGenerator';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Avatar from '../../components/common/Avatar';
import toast from 'react-hot-toast';

export default function ReportCard() {
  const { user } = useAuth();
  const student  = user?.linkedStudent;
  const [results, setResults]       = useState([]);
  const [selected, setSelected]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!student?.id) return;
    API.get(`/results/student/${student.id}`)
      .then(r => { const d = r.data || []; setResults(d); if (d.length) setSelected(d[0]); })
      .catch(() => toast.error('Failed to load results'))
      .finally(() => setLoading(false));
  }, [student?.id]);

  const handleDownload = async () => {
    setDownloading(true);
    try { generateReportCard(student, selected); toast.success('Downloaded!'); }
    catch { toast.error('PDF generation failed.'); }
    finally { setDownloading(false); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Exam selector */}
      {results.length > 1 && (
        <select
          value={selected?.id}
          onChange={e => setSelected(results.find(r => r.id === parseInt(e.target.value)))}
          className="w-full sm:w-auto border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 bg-white"
        >
          {results.map(r => <option key={r.id} value={r.id}>{r.exam_name}</option>)}
        </select>
      )}

      {!selected ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm">
          No results published yet.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* School header */}
          <div className="bg-[#1a1f2e] text-white text-center py-5 px-4">
            <h2 className="text-base sm:text-lg font-bold">EduSmart Public School</h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">Report Card — 2024-25</p>
            <p className="text-blue-300 text-xs sm:text-sm mt-0.5">{selected.exam_name}</p>
          </div>

          {/* Student info */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 border-b border-gray-100">
            <Avatar name={`${student?.first_name} ${student?.last_name}`} size="lg" />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-800 text-base">
                {student?.first_name} {student?.last_name}
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {selected.class} — Section {selected.section} · {student?.student_id}
              </p>
            </div>
            <div className="sm:text-right">
              <div className={`text-2xl font-bold ${getGradeColor(selected.grade)}`}>
                {selected.grade}
              </div>
              <div className="text-xs text-gray-400">Overall</div>
            </div>
          </div>

          {/* Marks table — scrollable on mobile */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: '360px' }}>
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Subject', 'Max', 'Marks', '%', 'Grade'].map(h => (
                    <th key={h} className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(selected.subjects || []).map((s, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-800">{s.subject}</td>
                    <td className="py-3 px-4 text-gray-400">{s.max_marks}</td>
                    <td className="py-3 px-4 font-semibold">{s.obtained_marks}</td>
                    <td className="py-3 px-4">{Math.round((s.obtained_marks / s.max_marks) * 100)}%</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${getGradeBg(s.grade)}`}>
                        {s.grade}
                      </span>
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-bold">
                  <td className="py-3 px-4">Total</td>
                  <td className="py-3 px-4 text-gray-500">{selected.total_marks}</td>
                  <td className="py-3 px-4">{selected.total_obtained}</td>
                  <td className="py-3 px-4">{selected.percentage}%</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${getGradeBg(selected.grade)}`}>
                      {selected.grade}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-100 border-t border-gray-100">
            {[
              { label: 'Marks',  val: `${selected.total_obtained}/${selected.total_marks}` },
              { label: '%',      val: `${selected.percentage}%` },
              { label: 'Rank',   val: selected.rank ? `#${selected.rank}` : '—' },
              { label: 'Result', val: selected.percentage >= 40 ? 'PASS' : 'FAIL',
                color: selected.percentage >= 40 ? 'text-green-600' : 'text-red-500' },
            ].map(item => (
              <div key={item.label} className="py-4 text-center">
                <p className="text-xs text-gray-400">{item.label}</p>
                <p className={`font-bold text-base mt-0.5 ${item.color || 'text-gray-800'}`}>{item.val}</p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="px-4 sm:px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white text-sm font-semibold px-5 py-3 rounded-xl transition-colors"
            >
              {downloading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating...
                </>
              ) : ' Download PDF'}
            </button>
            <button
              onClick={() => window.print()}
              className="flex-1 sm:flex-none border border-gray-200 text-gray-600 text-sm font-medium px-5 py-3 rounded-xl hover:bg-gray-50 transition-colors"
            >
              🖨️ Print
            </button>
          </div>
        </div>
      )}
    </div>
  );
}