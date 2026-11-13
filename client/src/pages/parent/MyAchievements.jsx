import { useState, useEffect, useMemo } from 'react';
import API from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const getPositionStyle = (pos = '') => {
  const lower = String(pos).toLowerCase();
  if (lower.includes('1st') || lower.includes('first') || lower.includes('winner') || lower.includes('gold')) {
    return 'bg-amber-50 text-amber-700 border-amber-200';
  }
  if (lower.includes('2nd') || lower.includes('second') || lower.includes('runner') || lower.includes('silver')) {
    return 'bg-slate-100 text-slate-700 border-slate-300';
  }
  if (lower.includes('3rd') || lower.includes('third') || lower.includes('bronze')) {
    return 'bg-orange-50 text-orange-700 border-orange-200';
  }
  return 'bg-indigo-50 text-indigo-700 border-indigo-200';
};

export default function MyAchievements() {
  const { user } = useAuth();
  const studentId = user?.linkedStudent?.id || user?.linked_student_id;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }
    let active = true;
    API.get(`/achievements/student/${studentId}`)
      .then((res) => {
        if (active) setData(res.data);
      })
      .catch(() => {
        if (active) toast.error('Failed to load achievements & recognition.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [studentId]);

  const categories = useMemo(() => {
    const list = data?.achievements || [];
    const unique = [...new Set(list.map((a) => a.category).filter(Boolean))];
    return ['All', ...unique];
  }, [data]);

  const filteredCompetitions = useMemo(() => {
    const list = data?.achievements || [];
    if (selectedCategory === 'All') return list;
    return list.filter((a) => a.category === selectedCategory);
  }, [data, selectedCategory]);

  if (loading) return <LoadingSpinner />;

  const metrics = data?.metrics || {};
  const attendance = metrics.attendance || {};
  const exams = metrics.exams || [];
  const topSubjects = metrics.topSubjects || [];
  const bestRank = metrics.bestRank;
  const highestOverall = metrics.highestOverallScore;
  const competitions = data?.achievements || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            Student Honor Roll
          </span>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight mt-2">
            Achievements &amp; Recognition
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Verified academic milestones, exam ranks, attendance excellence, and co-curricular awards.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="px-4 py-2.5 rounded-2xl bg-blue-50/70 border border-blue-100 text-center min-w-[100px]">
            <p className="text-[10px] font-bold uppercase text-blue-500">Attendance</p>
            <p className="text-lg font-extrabold text-blue-800">
              {attendance.percentage !== null && attendance.percentage !== undefined ? `${attendance.percentage}%` : '—'}
            </p>
          </div>
          <div className="px-4 py-2.5 rounded-2xl bg-purple-50/70 border border-purple-100 text-center min-w-[100px]">
            <p className="text-[10px] font-bold uppercase text-purple-500">Best Rank</p>
            <p className="text-lg font-extrabold text-purple-800">
              {bestRank ? `#${bestRank.rank}` : '—'}
            </p>
          </div>
          <div className="px-4 py-2.5 rounded-2xl bg-amber-50/70 border border-amber-100 text-center min-w-[100px]">
            <p className="text-[10px] font-bold uppercase text-amber-600">Competitions</p>
            <p className="text-lg font-extrabold text-amber-800">{competitions.length}</p>
          </div>
        </div>
      </div>

      {/* Live Academic & Attendance Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Milestones */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-800">Attendance Excellence</h2>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Live Data
            </span>
          </div>

          {attendance.totalWorking > 0 ? (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                <p className="text-xs font-bold text-emerald-900">
                  Overall Attendance: {attendance.percentage}%
                </p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Present {attendance.attendedCount} out of {attendance.totalWorking} school working days.
                </p>
              </div>

              {attendance.perfectMonths?.length > 0 ? (
                attendance.perfectMonths.map((pm) => (
                  <div key={pm.monthKey} className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/70 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-amber-900">100% Attendance in {pm.label}</p>
                      <p className="text-[11px] text-amber-700">{pm.attendedDays}/{pm.workingDays} working days</p>
                    </div>
                    <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">100%</span>
                  </div>
                ))
              ) : attendance.bestMonth ? (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <p className="text-xs font-bold text-slate-800">
                    Highest Attendance Month: {attendance.bestMonth.label} ({attendance.bestMonth.percentage}%)
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Attended {attendance.bestMonth.attendedDays} of {attendance.bestMonth.workingDays} working days.
                  </p>
                </div>
              ) : null}

              {attendance.longestStreak > 0 && (
                <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100">
                  <p className="text-xs font-bold text-blue-900">
                    Longest Attendance Streak: {attendance.longestStreak} consecutive days
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic py-4">No attendance records marked yet.</p>
          )}
        </div>

        {/* Highest Marks by Subject */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-800">Top Subject Marks</h2>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Published Results
            </span>
          </div>

          {topSubjects.length > 0 ? (
            <div className="space-y-2.5">
              {topSubjects.map((sub, idx) => (
                <div
                  key={`${sub.subject}-${idx}`}
                  className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-extrabold text-slate-800 truncate">{sub.subject}</p>
                      {sub.isClassHighest && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                          Class Highest
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{sub.exam_name}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-extrabold text-indigo-700">
                      {sub.marks_obtained}/{sub.max_marks}
                    </p>
                    <p className="text-[11px] font-bold text-slate-400">{sub.percentage}%</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic py-4">No published exam subject marks yet.</p>
          )}
        </div>

        {/* Exam Ranks */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-800">Class Exam Ranks</h2>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              By Exam Score
            </span>
          </div>

          {exams.length > 0 ? (
            <div className="space-y-3">
              {highestOverall && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100">
                  <p className="text-[11px] font-bold uppercase text-indigo-600">Highest Exam Score</p>
                  <p className="text-sm font-extrabold text-slate-800 mt-0.5">
                    {highestOverall.percentage}% ({highestOverall.obtained_marks}/{highestOverall.total_marks}) in {highestOverall.exam_name}
                  </p>
                </div>
              )}

              {exams.map((ex) => (
                <div
                  key={ex.id}
                  className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-xs font-extrabold text-slate-800">{ex.exam_name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Score: {ex.obtained_marks}/{ex.total_marks} ({ex.percentage}% · Grade {ex.grade})
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block text-xs font-extrabold px-3 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                      {ex.rankLabel} Rank
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">of {ex.totalStudents} students</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic py-4">No published exam ranks computed yet.</p>
          )}
        </div>
      </div>

      {/* Co-Curricular & Competition Achievements Added by Class Incharge */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-slate-800">Competitions &amp; Co-Curricular Activities</h2>
            <p className="text-xs text-slate-500">
              Participation, awards, and prizes recorded by your Class Incharge (Painting, Quiz, Sports, Cultural, etc.).
            </p>
          </div>
          {categories.length > 1 && (
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    selectedCategory === cat
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {filteredCompetitions.length === 0 ? (
          <div className="p-10 rounded-2xl bg-slate-50/70 border border-dashed border-slate-200 text-center">
            <p className="text-sm font-bold text-slate-600">No competition or co-curricular achievements added yet.</p>
            <p className="text-xs text-slate-400 mt-1">
              When you participate in Painting, Quiz, Sports, or Cultural competitions, your Class Incharge can record them here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCompetitions.map((ach) => (
              <div
                key={ach.id}
                className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/60 p-5 flex flex-col justify-between gap-4 hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {ach.category}
                    </span>
                    <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full border ${getPositionStyle(ach.position)}`}>
                      {ach.position}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-800 mt-3">{ach.title}</h3>
                  {ach.description && (
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{ach.description}</p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <span>
                    {[ach.level, ach.event_date ? new Date(`${ach.event_date}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : null]
                      .filter(Boolean)
                      .join(' · ') || 'School Activity'}
                  </span>
                  {ach.addedByTeacher?.name && (
                    <span className="text-slate-500 font-semibold">By {ach.addedByTeacher.name}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

