import { useState, useEffect } from 'react';
import API from '../../utils/api';
import Modal from '../../components/common/Modal';
import MarksForm from '../../components/forms/MarksForm';
import { getGradeBg, formatDate } from '../../utils/helpers';
import { CLASSES, SECTIONS } from '../../constants/roles';
import { useSettings } from '../../context/SettingsContext';
import { generateReportCard } from '../../utils/pdfGenerator';
import toast from 'react-hot-toast';

function EditResultModal({ result, onClose, onSave }) {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (result && result.subjects) {
      setSubjects(result.subjects.map(s => ({ ...s })));
    }
  }, [result]);

  const handleChange = (index, val) => {
    const newSubjects = [...subjects];
    const clamped = Math.min(Math.max(0, parseInt(val) || 0), newSubjects[index].max_marks);
    newSubjects[index].obtained_marks = clamped;
    setSubjects(newSubjects);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await API.put(`/results/${result.id}`, { subjects });
      toast.success('Result updated successfully');
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update result');
    } finally {
      setLoading(false);
    }
  };

  const f = 'border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 transition-all';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs font-medium text-gray-500">Student</label>
          <div className="text-sm font-medium">{result?.student?.first_name} {result?.student?.last_name}</div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500">Exam</label>
          <div className="text-sm">{result?.exam_name}</div>
        </div>
      </div>
      
      <div className="space-y-2">
        <label className="block text-xs font-medium text-gray-500">Subjects</label>
        {subjects.map((s, i) => (
          <div key={s.id} className="flex items-center gap-3">
            <div className="flex-1 text-sm">{s.subject} (Max: {s.max_marks})</div>
            <input
              type="number"
              value={s.obtained_marks}
              onChange={e => handleChange(i, e.target.value)}
              className={`${f} w-24 text-center`}
              min={0}
              max={s.max_marks}
            />
          </div>
        ))}
      </div>

      <button onClick={handleSave} disabled={loading}
        className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm mt-4">
        {loading ? 'Saving...' : 'Update Marks'}
      </button>
    </div>
  );
}

export default function Marks() {
  const { settings } = useSettings() || {};
  const [cls, setCls]           = useState('Class 8');
  const [section, setSection]   = useState('A');
  const [students, setStudents] = useState([]);
  const [results, setResults]   = useState([]);
  const [selectedResults, setSelectedResults] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingResult, setEditingResult] = useState(null);
  const [saving, setSaving]     = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [classSubjects, setClassSubjects] = useState([]);
  const [selectedExamFilter, setSelectedExamFilter] = useState('');

  const uniqueExams = [...new Set(results.map(r => r.exam_name).filter(Boolean))];
  const filteredResults = selectedExamFilter ? results.filter(r => r.exam_name === selectedExamFilter) : results;

  useEffect(() => {
    API.get(`/students?class=${cls}&section=${section}`)
      .then(r => setStudents(r.data.students || []))
      .catch(() => toast.error('Failed to load students'));
    API.get(`/class-subjects?class=${cls}&section=${section}`)
      .then(r => setClassSubjects(r.data || []))
      .catch(() => setClassSubjects([]));
    API.get(`/results/class?class=${cls}&section=${section}`)
      .then(r => { setResults(r.data || []); setSelectedResults([]); })
      .catch(() => {});
  }, [cls, section]);

  const handleSave = async (data) => {
    setSaving(true);
    try {
      const subjectData = data.subjects[0];
      for (const entry of subjectData.entries) {
        await API.post('/results', {
          student_id: entry.student_id,
          exam_name:  data.exam_name,
          exam_type:  data.exam_type,
          class: cls, section,
          subjects: [{
            subject:         subjectData.subject,
            max_marks:       subjectData.max_marks,
            obtained_marks:  entry.obtained_marks,
          }]
        });
      }
      toast.success('Marks saved successfully!');
      setShowModal(false);
      API.get(`/results/class?class=${cls}&section=${section}`).then(r => setResults(r.data || []));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save marks.');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkPublish = async () => {
    if (selectedResults.length === 0) return toast.error('No results selected');
    setPublishing(true);
    try {
      const res = await API.put('/results/bulk-publish', { result_ids: selectedResults });
      toast.success(res.data.message || 'Results published successfully');
      API.get(`/results/class?class=${cls}&section=${section}`).then(r => { setResults(r.data || []); setSelectedResults([]); });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to publish results');
    } finally {
      setPublishing(false);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const draftIds = results.filter(r => !r.is_published).map(r => r.id);
      setSelectedResults(draftIds);
    } else {
      setSelectedResults([]);
    }
  };

  const handleSelectResult = (id) => {
    setSelectedResults(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const f = 'border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500';

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3 items-center flex-wrap">
        <select value={cls} onChange={e => setCls(e.target.value)} className={f}>
          {CLASSES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={section} onChange={e => setSection(e.target.value)} className={f}>
          {SECTIONS.map(s => <option key={s}>{s}</option>)}
        </select>
        {uniqueExams.length > 0 && (
          <select 
            value={selectedExamFilter} 
            onChange={e => setSelectedExamFilter(e.target.value)} 
            className={f}
          >
            <option value="">All Exams ({results.length})</option>
            {uniqueExams.map(ex => (
              <option key={ex} value={ex}>{ex}</option>
            ))}
          </select>
        )}
        <div className="ml-auto flex gap-2">
          <button onClick={handleBulkPublish} disabled={publishing || selectedResults.length === 0}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${selectedResults.length > 0 ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>
            {publishing ? 'Publishing...' : `Declare Selected (${selectedResults.length})`}
          </button>
          <button onClick={() => setShowModal(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            + Enter Marks
          </button>
        </div>
      </div>

      {/* Results table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Results — {cls} {section}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="py-2.5 px-4 text-left w-10">
                  <input type="checkbox" 
                    checked={results.length > 0 && selectedResults.length === results.filter(r => !r.is_published).length && results.some(r => !r.is_published)}
                    onChange={handleSelectAll} 
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                  />
                </th>
                {['Student', 'Exam', 'Total Marks', 'Obtained', '%', 'Grade', 'Status', 'Date'].map(h => (
                  <th key={h} className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
                <th className="text-right py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.length === 0 ? (
                <tr><td colSpan={10} className="text-center text-gray-400 py-10">No results found for selected criteria.</td></tr>
              ) : filteredResults.map(r => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <input type="checkbox" 
                      disabled={r.is_published}
                      checked={selectedResults.includes(r.id)}
                      onChange={() => handleSelectResult(r.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                    />
                  </td>
                  <td className="py-3 px-4 font-medium">{r.student?.first_name} {r.student?.last_name}</td>
                  <td className="py-3 px-4 text-gray-600">{r.exam_name}</td>
                  <td className="py-3 px-4 text-gray-500">{r.total_marks}</td>
                  <td className="py-3 px-4 font-semibold">{r.total_obtained}</td>
                  <td className="py-3 px-4">{r.percentage}%</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${getGradeBg(r.grade)}`}>{r.grade}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${r.is_published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {r.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-400">{formatDate(r.created_at)}</td>
                  <td className="py-3 px-4 text-right flex items-center justify-end gap-1.5">
                    <button
                      onClick={async () => {
                        try {
                          await generateReportCard(r.student, r, settings);
                          toast.success('Marksheet downloaded!');
                        } catch (e) {
                          toast.error('Failed to generate marksheet');
                        }
                      }}
                      className="text-amber-600 hover:bg-amber-50 p-1.5 rounded-md transition-colors"
                      title="Download Official Marksheet / Report Card"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setEditingResult(r)}
                      disabled={r.is_published}
                      className="text-blue-500 hover:bg-blue-50 p-1.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Edit Result"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={`Enter Marks — ${cls} ${section}`}>
        <MarksForm students={students} onSubmit={handleSave} loading={saving} availableSubjects={classSubjects.map(cs => cs.subject)} />
      </Modal>
      <Modal isOpen={!!editingResult} onClose={() => setEditingResult(null)} title="Edit Result">
        {editingResult && (
          <EditResultModal 
            result={editingResult} 
            onClose={() => setEditingResult(null)} 
            onSave={() => {
              setEditingResult(null);
              API.get(`/results/class?class=${cls}&section=${section}`).then(r => setResults(r.data || []));
            }}
          />
        )}
      </Modal>
    </div>
  );
}