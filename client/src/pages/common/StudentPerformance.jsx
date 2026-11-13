import { useState, useEffect, useCallback, useMemo } from 'react';
import API from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import Avatar from '../../components/common/Avatar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import {
  formatDate,
  getGradeBg,
  getGradeColor,
  getAttendancePercColor,
  getAttendanceBarColor,
} from '../../utils/helpers';
import {
  generateConsolidatedMarksheet,
  generateComprehensivePerformanceReport,
  generateReportCard,
} from '../../utils/pdfGenerator';
import { CLASSES, SECTIONS } from '../../constants/roles';
import toast from 'react-hot-toast';

export default function StudentPerformance() {
  const { user } = useAuth();
  const { settings } = useSettings() || {};
  const isTeacher = user?.role === 'teacher';

  // Data states
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState({
    total_students: 0,
    avg_attendance: 0,
    avg_marks: 0,
    top_performers: 0,
    attention_needed: 0,
  });
  const [allowedClasses, setAllowedClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterClass, setFilterClass] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'

  // Detailed Student Modal
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'marks' | 'attendance' | 'achievements' | 'info'
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);

  // Load Teacher's Allowed Classes
  useEffect(() => {
    if (isTeacher) {
      API.get('/attendance/assigned-classes')
        .then((res) => {
          const clsList = res.data?.classes || [];
          setAllowedClasses(clsList);
          if (clsList.length === 1) {
            setFilterClass(clsList[0]);
          }
        })
        .catch(() => {
          setAllowedClasses([]);
        });
    }
  }, [isTeacher]);

  // Fetch overview data
  const fetchOverview = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterClass) params.append('class', filterClass);
    if (filterSection) params.append('section', filterSection);
    if (search.trim()) params.append('search', search.trim());
    if (statusFilter && statusFilter !== 'all') params.append('status_filter', statusFilter);

    API.get(`/students/performance/overview?${params.toString()}`)
      .then((res) => {
        setStudents(res.data?.students || []);
        setStats(res.data?.stats || {
          total_students: 0,
          avg_attendance: 0,
          avg_marks: 0,
          top_performers: 0,
          attention_needed: 0,
        });
        if (res.data?.allowed_classes && res.data.allowed_classes.length > 0) {
          setAllowedClasses(res.data.allowed_classes);
        }
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Failed to load student performance data');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [filterClass, filterSection, search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOverview();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchOverview]);

  // Open Detailed Modal
  const handleViewDetail = (studentId) => {
    setSelectedStudentId(studentId);
    setDetailLoading(true);
    setActiveTab('overview');
    API.get(`/students/${studentId}/performance`)
      .then((res) => {
        setDetailData(res.data);
        if (res.data?.academics?.exams?.length > 0) {
          setSelectedExamId(res.data.academics.exams[0].id);
        } else {
          setSelectedExamId(null);
        }
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Failed to load detailed performance');
        setSelectedStudentId(null);
      })
      .finally(() => {
        setDetailLoading(false);
      });
  };

  const closeDetail = () => {
    setSelectedStudentId(null);
    setDetailData(null);
    setSelectedExamId(null);
  };

  // Selected Exam for Marks Tab
  const activeExam = useMemo(() => {
    if (!detailData?.academics?.exams) return null;
    return detailData.academics.exams.find((e) => e.id === selectedExamId) || detailData.academics.exams[0] || null;
  }, [detailData, selectedExamId]);

  // Available classes for dropdown
  const availableClasses = isTeacher ? allowedClasses : CLASSES;

  // ── PDF Actions ─────────────────────────────────────────────────────────────
  const handleDownloadAllMarksheets = async () => {
    if (!detailData) return;
    setPdfGenerating(true);
    try {
      await generateConsolidatedMarksheet(detailData.student, detailData, settings);
      toast.success('Consolidated marksheet for all exams downloaded!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate marksheet PDF.');
    } finally {
      setPdfGenerating(false);
    }
  };

  const handleDownloadFullReport = async () => {
    if (!detailData) return;
    setPdfGenerating(true);
    try {
      await generateComprehensivePerformanceReport(detailData.student, detailData, settings);
      toast.success('Comprehensive student performance report downloaded!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate performance report PDF.');
    } finally {
      setPdfGenerating(false);
    }
  };

  const handleDownloadSingleExam = async (exam) => {
    if (!detailData || !exam) return;
    try {
      await generateReportCard(detailData.student, exam, settings);
      toast.success(`Marksheet for ${exam.exam_name} downloaded!`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate exam marksheet.');
    }
  };

  // Quick download from list row
  const handleQuickDownloadMarksheet = async (e, studentId) => {
    e.stopPropagation();
    const toastId = toast.loading('Generating consolidated marksheet...');
    try {
      const res = await API.get(`/students/${studentId}/performance`);
      await generateConsolidatedMarksheet(res.data.student, res.data, settings);
      toast.success('Marksheet downloaded!', { id: toastId });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to download marksheet', { id: toastId });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner - Cambridge Navy with Gold Accent */}
      <div className="bg-gradient-to-r from-[#0a1226] via-[#101e42] to-[#1e3a8a] text-white rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden border-b-4 border-yellow-400">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-yellow-400/5 skew-x-12 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-yellow-400/20 text-yellow-300 border border-yellow-400/40 uppercase tracking-wider">
                {isTeacher ? 'Teacher Academic Portal' : 'Admin Academic Analytics'}
              </span>
              {isTeacher && (
                <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Scoped to Assigned Classes
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Student Performance &amp; Academic Profiles
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Search students by name or ID to inspect examination history, tests, attendance progression, and download official marksheets &amp; reports.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={fetchOverview}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition backdrop-blur-sm border border-white/10"
              title="Refresh"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Teacher notice if no classes */}
      {isTeacher && allowedClasses.length === 0 && !loading && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h4 className="text-sm font-semibold text-amber-900">No Assigned Classes Found</h4>
            <p className="text-xs text-amber-700 mt-0.5">
              Your teacher account is not yet linked to any active classes or class incharge assignments. Please contact the administrator to assign classes to your profile.
            </p>
          </div>
        </div>
      )}

      {/* KPI Stats Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Students */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Students Tracked</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.total_students}</div>
          <p className="text-xs text-gray-400 mt-1">
            {filterClass ? `In ${filterClass}` : 'Across all assigned classes'}
          </p>
        </div>

        {/* Avg Attendance */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Avg. Attendance</span>
            <div className={`p-2 rounded-lg ${stats.avg_attendance >= 75 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${getAttendancePercColor(stats.avg_attendance)}`}>
              {stats.avg_attendance}%
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${getAttendanceBarColor(stats.avg_attendance)}`}
              style={{ width: `${Math.min(stats.avg_attendance, 100)}%` }}
            />
          </div>
        </div>

        {/* Avg Academic Score */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Avg. Academic Score</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{stats.avg_marks}%</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
              {stats.avg_marks >= 90 ? 'A+' : stats.avg_marks >= 80 ? 'A' : stats.avg_marks >= 70 ? 'B' : stats.avg_marks >= 60 ? 'C' : stats.avg_marks >= 40 ? 'D' : 'F'}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Overall examinations</p>
        </div>

        {/* Top Performers */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'top_performer' ? 'all' : 'top_performer')}
          className={`bg-white rounded-xl p-4 border transition cursor-pointer shadow-sm ${
            statusFilter === 'top_performer' ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-gray-100 hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Top Performers</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-700">{stats.top_performers}</div>
          <p className="text-xs text-gray-400 mt-1">≥80% marks &amp; ≥85% att.</p>
        </div>

        {/* Attention Needed */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'needs_attention' ? 'all' : 'needs_attention')}
          className={`col-span-2 sm:col-span-1 bg-white rounded-xl p-4 border transition cursor-pointer shadow-sm ${
            statusFilter === 'needs_attention' ? 'border-rose-500 ring-2 ring-rose-100' : 'border-gray-100 hover:border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-700">Needs Attention</span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-700">{stats.attention_needed}</div>
          <p className="text-xs text-gray-400 mt-1">&lt;75% att. or &lt;40% marks</p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search box - Supports Name and Student ID */}
          <div className="flex-1 relative">
            <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search student by name, student ID, roll number, or parent name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Class Filter */}
          <div className="w-full md:w-48">
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="w-full py-2.5 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 transition"
            >
              <option value="">All Classes {isTeacher ? '(Assigned)' : ''}</option>
              {availableClasses.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Section Filter */}
          <div className="w-full md:w-36">
            <select
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
              className="w-full py-2.5 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 transition"
            >
              <option value="">All Sections</option>
              {SECTIONS.map((s) => (
                <option key={s} value={s}>Section {s}</option>
              ))}
            </select>
          </div>

          {/* View toggle */}
          <div className="flex items-center justify-center gap-1 bg-gray-100 p-1 rounded-xl self-stretch sm:self-auto">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg text-sm transition ${viewMode === 'table' ? 'bg-white shadow-sm text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
              title="Table View"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg text-sm transition ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
              title="Card Grid View"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Quick Filter Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-100 text-xs">
          <span className="text-gray-400 font-medium mr-1">Filter by status:</span>
          {[
            { id: 'all', label: 'All Students' },
            { id: 'top_performer', label: '⭐ Top Performers' },
            { id: 'needs_attention', label: '⚠️ Needs Attention' },
            { id: 'low_attendance', label: '🔴 Low Attendance (<75%)' },
            { id: 'low_marks', label: '📉 Low Marks (<40%)' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                statusFilter === f.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 flex flex-col items-center justify-center">
          <LoadingSpinner />
          <p className="text-sm text-gray-400 mt-4">Loading student performance data...</p>
        </div>
      ) : students.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-gray-800">No Students Found</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
            {isTeacher && allowedClasses.length > 0
              ? 'No students found matching your filters in your assigned classes.'
              : 'Try searching by a different student name or registration ID.'}
          </p>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Class &amp; Roll</th>
                  <th className="py-3.5 px-4">Attendance Rate</th>
                  <th className="py-3.5 px-4">Academic Score</th>
                  <th className="py-3.5 px-4">Overall Grade</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {students.map((s) => {
                  const att = s.attendance;
                  const acad = s.academics;
                  const isLowAtt = att?.percentage !== null && att?.percentage < 75;
                  const isTop = s.performance_status === 'excellent';

                  return (
                    <tr
                      key={s.id}
                      onClick={() => handleViewDetail(s.id)}
                      className="hover:bg-blue-50/40 transition cursor-pointer group"
                    >
                      {/* Student Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={`${s.first_name} ${s.last_name}`} size="md" />
                          <div className="min-w-0">
                            <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition flex items-center gap-1.5">
                              {s.first_name} {s.last_name}
                              {isTop && (
                                <span title="Top Performer" className="text-xs">⭐</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-400 font-mono">
                              ID: {s.student_id} {s.parent_name ? `· Parent: ${s.parent_name}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Class & Roll */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-gray-800">
                          {s.class} - {s.section}
                        </div>
                        <div className="text-xs text-gray-400">
                          Roll #{s.roll_number || '—'}
                        </div>
                      </td>

                      {/* Attendance */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {att?.total_days > 0 ? (
                          <div className="space-y-1 w-36">
                            <div className="flex items-center justify-between text-xs">
                              <span className={`font-bold ${getAttendancePercColor(att.percentage)}`}>
                                {att.percentage}%
                              </span>
                              <span className="text-gray-400 text-[11px]">
                                {att.present_days}/{att.total_days}d
                              </span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${getAttendanceBarColor(att.percentage)}`}
                                style={{ width: `${Math.min(att.percentage, 100)}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No attendance</span>
                        )}
                      </td>

                      {/* Academic Score */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {acad?.exams_count > 0 ? (
                          <div>
                            <div className="font-bold text-gray-900">
                              {acad.average_percentage}%
                            </div>
                            <div className="text-xs text-gray-400">
                              {acad.latest_exam ? `Latest: ${acad.latest_exam.exam_name}` : `${acad.exams_count} exams`}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No exams recorded</span>
                        )}
                      </td>

                      {/* Grade */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {acad?.overall_grade ? (
                          <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${getGradeBg(acad.overall_grade)}`}>
                            {acad.overall_grade}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isTop ? (
                          <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800">
                            Excellent
                          </span>
                        ) : isLowAtt ? (
                          <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-rose-100 text-rose-800">
                            Low Attendance
                          </span>
                        ) : s.performance_status === 'needs_attention' ? (
                          <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-800">
                            Needs Attention
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                            Normal
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => handleQuickDownloadMarksheet(e, s.id)}
                            className="p-1.5 rounded-lg bg-gray-100 hover:bg-slate-800 hover:text-white text-gray-600 transition"
                            title="Download Consolidated Marksheet PDF"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetail(s.id);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition"
                          >
                            <span>View Details</span>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID / CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((s) => {
            const att = s.attendance;
            const acad = s.academics;
            const isTop = s.performance_status === 'excellent';
            const isAttention = s.performance_status === 'needs_attention';

            return (
              <div
                key={s.id}
                onClick={() => handleViewDetail(s.id)}
                className={`bg-white rounded-2xl p-5 border transition shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between ${
                  isTop ? 'border-emerald-300 ring-1 ring-emerald-100' : isAttention ? 'border-rose-200' : 'border-gray-200'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={`${s.first_name} ${s.last_name}`} size="lg" />
                      <div>
                        <h4 className="font-bold text-gray-900 leading-snug">
                          {s.first_name} {s.last_name}
                        </h4>
                        <p className="text-xs text-gray-400 font-mono">ID: {s.student_id}</p>
                      </div>
                    </div>
                    {acad?.overall_grade && (
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${getGradeBg(acad.overall_grade)}`}>
                        Grade {acad.overall_grade}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-semibold">
                      {s.class} - {s.section}
                    </span>
                    <span className="text-xs text-gray-400">Roll #{s.roll_number || '—'}</span>
                    {s.achievements_count > 0 && (
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-xs font-medium">
                        🏆 {s.achievements_count} Awards
                      </span>
                    )}
                  </div>

                  {/* Dual Performance Metrics */}
                  <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-xl mb-4 text-xs">
                    <div>
                      <div className="text-gray-400 mb-0.5">Attendance</div>
                      {att?.total_days > 0 ? (
                        <div>
                          <div className={`font-bold text-sm ${getAttendancePercColor(att.percentage)}`}>
                            {att.percentage}%
                          </div>
                          <div className="text-[11px] text-gray-500">{att.present_days}/{att.total_days} days</div>
                        </div>
                      ) : (
                        <div className="text-gray-400 italic">No logs</div>
                      )}
                    </div>

                    <div>
                      <div className="text-gray-400 mb-0.5">Exam Average</div>
                      {acad?.exams_count > 0 ? (
                        <div>
                          <div className="font-bold text-sm text-gray-800">
                            {acad.average_percentage}%
                          </div>
                          <div className="text-[11px] text-gray-500">{acad.exams_count} exam(s)</div>
                        </div>
                      ) : (
                        <div className="text-gray-400 italic">No exams</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <button
                    onClick={(e) => handleQuickDownloadMarksheet(e, s.id)}
                    className="text-xs text-gray-500 hover:text-blue-600 font-medium inline-flex items-center gap-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Marksheet PDF
                  </button>
                  <span className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
                    Details →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAILED STUDENT PERFORMANCE MODAL */}
      {selectedStudentId && (
        <Modal
          isOpen={Boolean(selectedStudentId)}
          onClose={closeDetail}
          title={detailData ? `${detailData.student.first_name} ${detailData.student.last_name} — Comprehensive Dossier` : 'Student Performance'}
          size="xl"
        >
          {detailLoading || !detailData ? (
            <div className="p-12 flex flex-col items-center justify-center">
              <LoadingSpinner />
              <p className="text-sm text-gray-400 mt-3">Fetching comprehensive student performance...</p>
            </div>
          ) : (
            <div className="space-y-5 p-1 sm:p-2">
              {/* Profile Card Header with Action Buttons */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white rounded-2xl p-5 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar name={`${detailData.student.first_name} ${detailData.student.last_name}`} size="lg" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-white">
                          {detailData.student.first_name} {detailData.student.last_name}
                        </h3>
                        <span className="px-2 py-0.5 text-xs rounded bg-blue-500/30 text-blue-200 border border-blue-400/30 font-semibold">
                          Class {detailData.student.class} - {detailData.student.section}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 font-mono mt-0.5">
                        ID: {detailData.student.student_id} · Roll #{detailData.student.roll_number || '—'} · Session: {detailData.student.session?.name || 'Active'}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-2">
                        {detailData.student.parent_name && (
                          <span>👨‍👦 Parent: {detailData.student.parent_name}</span>
                        )}
                        {detailData.student.parent_phone && (
                          <span>📞 {detailData.student.parent_phone}</span>
                        )}
                        {detailData.student.blood_group && (
                          <span>🩸 Blood: {detailData.student.blood_group}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick KPIs */}
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10 self-start lg:self-auto">
                    <div className="text-center px-2">
                      <div className={`text-lg font-extrabold ${getAttendancePercColor(detailData.attendance.percentage)}`}>
                        {detailData.attendance.percentage}%
                      </div>
                      <div className="text-[10px] text-slate-300 uppercase tracking-wider">Attendance</div>
                    </div>
                    <div className="h-8 w-px bg-white/20" />
                    <div className="text-center px-2">
                      <div className="text-lg font-extrabold text-white">
                        {detailData.academics.average_percentage}%
                      </div>
                      <div className="text-[10px] text-slate-300 uppercase tracking-wider">Avg. Score</div>
                    </div>
                    <div className="h-8 w-px bg-white/20" />
                    <div className="text-center px-2">
                      <div className="text-lg font-extrabold text-amber-300">
                        {detailData.academics.overall_grade}
                      </div>
                      <div className="text-[10px] text-slate-300 uppercase tracking-wider">Grade</div>
                    </div>
                  </div>
                </div>

                {/* PDF Action Buttons Bar */}
                <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-slate-300">
                    <span>Official Documents &amp; Academic Records Export</span>
                  </div>

                  <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 w-full sm:w-auto">
                    {/* Download Marksheet of All Exams */}
                    <button
                      onClick={handleDownloadAllMarksheets}
                      disabled={pdfGenerating}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-sm disabled:opacity-50 w-full sm:w-auto"
                      title="Download Official Consolidated Marksheet of All Exams"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Download Marksheet (All Exams)</span>
                    </button>

                    {/* Download Performance Report PDF */}
                    <button
                      onClick={handleDownloadFullReport}
                      disabled={pdfGenerating}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm disabled:opacity-50 w-full sm:w-auto"
                      title="Download Full Student Performance Evaluation Dossier"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Download Report PDF</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto text-sm pb-px">
                {[
                  { id: 'overview', label: '📊 Overview & Standing' },
                  { id: 'marks', label: `📝 Examination Marks & Tests (${detailData.academics.total_exams})` },
                  { id: 'attendance', label: `📅 Attendance Details (${detailData.attendance.percentage}%)` },
                  { id: 'achievements', label: `🏆 Achievements (${detailData.achievements.length})` },
                  { id: 'info', label: '👤 Profile & Admin' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`px-4 py-2.5 font-medium whitespace-nowrap transition-all border-b-2 -mb-px text-xs sm:text-sm ${
                      activeTab === t.id
                        ? 'border-blue-600 text-blue-600 font-bold'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  {/* Quick Export Alert Banner */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-blue-900">Official Student Dossier Ready</h4>
                      <p className="text-xs text-blue-700 mt-0.5">
                        Download a consolidated transcript covering all exams and tests or the complete performance evaluation report.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleDownloadAllMarksheets}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition whitespace-nowrap shadow-sm"
                      >
                        📄 Download Marksheet (All Exams)
                      </button>
                      <button
                        onClick={handleDownloadFullReport}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition whitespace-nowrap shadow-sm"
                      >
                        📊 Download Report PDF
                      </button>
                    </div>
                  </div>

                  {/* Attendance Health Alert */}
                  {detailData.attendance.percentage < 75 && detailData.attendance.total_working_days > 0 && (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-start gap-3">
                      <svg className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <h4 className="text-sm font-bold text-rose-900">Attendance Below Mandatory 75%</h4>
                        <p className="text-xs text-rose-700 mt-0.5">
                          This student has attended only {detailData.attendance.percentage}% of classes ({detailData.attendance.present_days} of {detailData.attendance.total_working_days} days). Regular attendance counselling is recommended.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Strengths & Weaknesses Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-4">
                      <div className="text-xs font-semibold uppercase tracking-wider text-emerald-800 mb-1 flex items-center gap-1.5">
                        <span>🌟</span> Top Performing Subject
                      </div>
                      {detailData.academics.best_subject ? (
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-bold text-gray-900 text-base">
                              {detailData.academics.best_subject.subject}
                            </div>
                            <div className="text-xs text-gray-500">
                              Average: {detailData.academics.best_subject.average_percentage}% across {detailData.academics.best_subject.exams_count} exam(s)
                            </div>
                          </div>
                          <span className="px-2.5 py-1 text-sm font-bold rounded-lg bg-emerald-100 text-emerald-800">
                            {detailData.academics.best_subject.grade}
                          </span>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">No exam records available yet.</p>
                      )}
                    </div>

                    <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-4">
                      <div className="text-xs font-semibold uppercase tracking-wider text-amber-800 mb-1 flex items-center gap-1.5">
                        <span>🎯</span> Needs Focus Subject
                      </div>
                      {detailData.academics.needs_improvement_subject ? (
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-bold text-gray-900 text-base">
                              {detailData.academics.needs_improvement_subject.subject}
                            </div>
                            <div className="text-xs text-gray-500">
                              Average: {detailData.academics.needs_improvement_subject.average_percentage}% across {detailData.academics.needs_improvement_subject.exams_count} exam(s)
                            </div>
                          </div>
                          <span className="px-2.5 py-1 text-sm font-bold rounded-lg bg-amber-100 text-amber-800">
                            {detailData.academics.needs_improvement_subject.grade}
                          </span>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">No exam records available yet.</p>
                      )}
                    </div>
                  </div>

                  {/* Subject Mastery Progress Bars */}
                  {detailData.academics.subject_breakdown.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                        Subject-Wise Academic Mastery
                      </h4>
                      <div className="space-y-3">
                        {detailData.academics.subject_breakdown.map((s) => (
                          <div key={s.subject}>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="font-medium text-gray-800">{s.subject}</span>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-900">{s.average_percentage}%</span>
                                <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${getGradeBg(s.grade)}`}>
                                  {s.grade}
                                </span>
                              </div>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  s.average_percentage >= 80 ? 'bg-emerald-500' : s.average_percentage >= 60 ? 'bg-blue-500' : s.average_percentage >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                                }`}
                                style={{ width: `${s.average_percentage}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Summary Breakdown Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <div className="text-xs text-gray-500">Working Days</div>
                      <div className="text-lg font-bold text-gray-900">{detailData.attendance.total_working_days}</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <div className="text-xs text-gray-500">Days Present</div>
                      <div className="text-lg font-bold text-emerald-600">{detailData.attendance.present_days}</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <div className="text-xs text-gray-500">Days Absent</div>
                      <div className="text-lg font-bold text-rose-600">{detailData.attendance.absent_days}</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <div className="text-xs text-gray-500">Days Late</div>
                      <div className="text-lg font-bold text-amber-600">{detailData.attendance.late_days}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: MARKS & EXAMINATIONS */}
              {activeTab === 'marks' && (
                <div className="space-y-4">
                  {detailData.academics.exams.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl">
                      <p className="text-sm">No exam marks or tests entered for this student yet.</p>
                    </div>
                  ) : (
                    <>
                      {/* Top Action Ribbon for Marksheets */}
                      <div className="bg-slate-50 border border-gray-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-700">All Exams Recorded: {detailData.academics.exams.length}</span>
                          <span className="text-xs text-gray-400">· Average: {detailData.academics.average_percentage}%</span>
                        </div>
                        <button
                          onClick={handleDownloadAllMarksheets}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm self-start sm:self-auto"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Download Marksheet (All Exams Till Now)
                        </button>
                      </div>

                      {/* Exam Selector Pills */}
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {detailData.academics.exams.map((exam) => (
                          <button
                            key={exam.id}
                            onClick={() => setSelectedExamId(exam.id)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                              activeExam?.id === exam.id
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {exam.exam_name} ({exam.percentage}%)
                          </button>
                        ))}
                      </div>

                      {/* Active Exam Card */}
                      {activeExam && (
                        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                          <div className="bg-slate-50 border-b border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-gray-900 text-base">{activeExam.exam_name}</h4>
                                <span className="px-2 py-0.5 text-xs rounded bg-blue-100 text-blue-700 font-semibold uppercase">
                                  {activeExam.exam_type?.replace('_', ' ') || 'Examination'}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">
                                Exam recorded: {formatDate(activeExam.created_at)} · {activeExam.class} {activeExam.section}
                              </p>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <div className="text-xl font-black text-gray-900">
                                  {activeExam.total_obtained} <span className="text-xs font-normal text-gray-400">/ {activeExam.total_marks}</span>
                                </div>
                                <div className="text-xs text-gray-500 font-semibold">{activeExam.percentage}% Overall</div>
                              </div>
                              <span className={`px-3 py-1.5 text-sm font-extrabold rounded-xl ${getGradeBg(activeExam.grade)}`}>
                                Grade {activeExam.grade}
                              </span>

                              {/* Download single exam report */}
                              <button
                                onClick={() => handleDownloadSingleExam(activeExam)}
                                className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-blue-50 hover:border-blue-300 text-blue-600 transition shadow-sm"
                                title="Download Report Card for this Exam"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          {/* Subjects Marks Table */}
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs sm:text-sm">
                              <thead className="bg-gray-100/70 border-b border-gray-200 text-gray-600 uppercase text-[11px] font-semibold">
                                <tr>
                                  <th className="py-2.5 px-4">Subject</th>
                                  <th className="py-2.5 px-4 text-center">Max Marks</th>
                                  <th className="py-2.5 px-4 text-center">Obtained</th>
                                  <th className="py-2.5 px-4 text-center">Percentage</th>
                                  <th className="py-2.5 px-4 text-center">Grade</th>
                                  <th className="py-2.5 px-4">Performance Bar</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {(activeExam.subjects || []).map((sub, idx) => {
                                  const subPct = sub.max_marks > 0 ? Math.round((sub.obtained_marks / sub.max_marks) * 100) : 0;
                                  return (
                                    <tr key={idx} className="hover:bg-gray-50">
                                      <td className="py-3 px-4 font-semibold text-gray-800">{sub.subject}</td>
                                      <td className="py-3 px-4 text-center text-gray-500">{sub.max_marks}</td>
                                      <td className="py-3 px-4 text-center font-bold text-gray-900">{sub.obtained_marks}</td>
                                      <td className="py-3 px-4 text-center font-semibold text-gray-700">{subPct}%</td>
                                      <td className="py-3 px-4 text-center">
                                        <span className={`px-2 py-0.5 text-xs font-bold rounded ${getGradeBg(sub.grade)}`}>
                                          {sub.grade}
                                        </span>
                                      </td>
                                      <td className="py-3 px-4 w-40">
                                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                          <div
                                            className={`h-full rounded-full ${
                                              subPct >= 80 ? 'bg-emerald-500' : subPct >= 60 ? 'bg-blue-500' : subPct >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                                            }`}
                                            style={{ width: `${subPct}%` }}
                                          />
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* TAB 3: ATTENDANCE DETAILS */}
              {activeTab === 'attendance' && (
                <div className="space-y-4">
                  {/* Monthly Attendance Breakdown */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-3">
                      Monthly Attendance Progression
                    </h4>
                    {detailData.attendance.monthly.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No attendance records found.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-gray-50 border-b border-gray-200 font-semibold text-gray-600 uppercase text-[10px]">
                            <tr>
                              <th className="py-2 px-3">Month</th>
                              <th className="py-2 px-3 text-center">Working Days</th>
                              <th className="py-2 px-3 text-center">Present</th>
                              <th className="py-2 px-3 text-center">Absent</th>
                              <th className="py-2 px-3 text-center">Late</th>
                              <th className="py-2 px-3 text-right">Percentage</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {detailData.attendance.monthly.map((m) => (
                              <tr key={m.key} className="hover:bg-gray-50">
                                <td className="py-2.5 px-3 font-semibold text-gray-800">{m.label}</td>
                                <td className="py-2.5 px-3 text-center text-gray-600">{m.total}</td>
                                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">{m.present}</td>
                                <td className="py-2.5 px-3 text-center text-rose-600 font-bold">{m.absent}</td>
                                <td className="py-2.5 px-3 text-center text-amber-600 font-bold">{m.late}</td>
                                <td className="py-2.5 px-3 text-right">
                                  <span className={`font-bold px-2 py-0.5 rounded text-xs ${getAttendancePercColor(m.percentage)} bg-gray-50`}>
                                    {m.percentage}%
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Multi-Session Comparison if any */}
                  {detailData.attendance.session_comparison?.length > 1 && (
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-3">
                        Year-over-Year Session Attendance
                      </h4>
                      <div className="space-y-2">
                        {detailData.attendance.session_comparison.map((sc, i) => (
                          <div key={i} className="flex items-center justify-between text-xs p-2.5 bg-gray-50 rounded-lg">
                            <div>
                              <span className="font-bold text-gray-800">{sc.session_name}</span>
                              <span className="text-gray-400 ml-2">Class {sc.class_name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-gray-500">{sc.present}/{sc.total} days</span>
                              <span className={`font-bold ${getAttendancePercColor(sc.percentage)}`}>
                                {sc.percentage}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent 30 Days Log */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-3">
                      Recent Attendance Log (Latest Records)
                    </h4>
                    {detailData.attendance.recent_records.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No daily records.</p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                        {detailData.attendance.recent_records.slice(0, 24).map((r, idx) => (
                          <div
                            key={idx}
                            className={`p-2 rounded-lg text-center border text-xs font-medium ${
                              r.status === 'present'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                : r.status === 'absent'
                                ? 'bg-rose-50 border-rose-200 text-rose-800'
                                : r.status === 'late'
                                ? 'bg-amber-50 border-amber-200 text-amber-800'
                                : 'bg-gray-50 border-gray-200 text-gray-600'
                            }`}
                          >
                            <div className="text-[11px] text-gray-500">{r.date}</div>
                            <div className="capitalize font-bold text-xs mt-0.5">{r.status}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: ACHIEVEMENTS */}
              {activeTab === 'achievements' && (
                <div className="space-y-3">
                  {detailData.achievements.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl">
                      <p className="text-sm">No extracurricular achievements recorded yet.</p>
                    </div>
                  ) : (
                    detailData.achievements.map((ach) => (
                      <div key={ach.id} className="p-4 bg-white border border-gray-200 rounded-xl flex items-start gap-3">
                        <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 text-lg">
                          🏆
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-gray-900 text-sm">{ach.title}</h4>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                              {ach.position}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Category: {ach.category} {ach.level ? `· Level: ${ach.level}` : ''} {ach.event_date ? `· Date: ${formatDate(ach.event_date)}` : ''}
                          </p>
                          {ach.description && (
                            <p className="text-xs text-gray-600 mt-2 bg-gray-50 p-2.5 rounded-lg">
                              {ach.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 5: PROFILE & ADMIN */}
              {activeTab === 'info' && (
                <div className="space-y-4 text-xs sm:text-sm">
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-400 text-xs block">Full Name</span>
                      <span className="font-bold text-gray-800">{detailData.student.first_name} {detailData.student.last_name}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs block">Student ID (Registration)</span>
                      <span className="font-mono font-bold text-gray-800">{detailData.student.student_id}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs block">Class &amp; Section</span>
                      <span className="font-semibold text-gray-800">{detailData.student.class} - {detailData.student.section}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs block">Roll Number</span>
                      <span className="font-semibold text-gray-800">{detailData.student.roll_number || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs block">Gender</span>
                      <span className="font-semibold text-gray-800 capitalize">{detailData.student.gender || '—'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs block">Date of Birth</span>
                      <span className="font-semibold text-gray-800">{formatDate(detailData.student.date_of_birth)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs block">Parent / Guardian Name</span>
                      <span className="font-semibold text-gray-800">{detailData.student.parent_name || '—'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs block">Parent Phone Number</span>
                      <span className="font-semibold text-gray-800">{detailData.student.parent_phone || '—'}</span>
                    </div>
                  </div>

                  {/* Fee Summary */}
                  {detailData.fees && (
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
                        Fee &amp; Financial Overview
                      </h4>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800">
                          <div className="font-bold text-base">{detailData.fees.paid_count}</div>
                          <div>Paid Receipts</div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-amber-50 text-amber-800">
                          <div className="font-bold text-base">{detailData.fees.partial_count}</div>
                          <div>Partial Dues</div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-rose-50 text-rose-800">
                          <div className="font-bold text-base">{detailData.fees.unpaid_count}</div>
                          <div>Unpaid Months</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
