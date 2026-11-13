import React, { useState, useEffect, useMemo } from 'react';
import API from '../../utils/api';
import { CLASSES, SECTIONS, SUBJECTS } from '../../constants/roles';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/common/Modal';
import {
  DAYS,
  DEFAULT_SCHEDULE_CONFIG,
  getScheduleForDay,
  calculateDayTimeline,
  getMaxPeriods,
  formatMinutesToTime
} from '../../utils/timetableHelper';
import { generateTimetablePDF } from '../../utils/pdfGenerator';

const subjectColors = {
  Mathematics: 'bg-green-100 text-green-700 border-green-200',
  Science: 'bg-purple-100 text-purple-700 border-purple-200',
  English: 'bg-blue-100 text-blue-700 border-blue-200',
  Hindi: 'bg-pink-100 text-pink-700 border-pink-200',
  'Social Science': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Computer: 'bg-teal-100 text-teal-700 border-teal-200',
  'Physical Education': 'bg-orange-100 text-orange-700 border-orange-200',
  Art: 'bg-red-100 text-red-700 border-red-200',
  Free: 'bg-gray-100 text-gray-400 border-gray-200',
};

const customColorPalette = [
  'bg-emerald-100 text-emerald-700 border-emerald-200',
  'bg-indigo-100 text-indigo-700 border-indigo-200',
  'bg-rose-100 text-rose-700 border-rose-200',
  'bg-amber-100 text-amber-700 border-amber-200',
  'bg-cyan-100 text-cyan-700 border-cyan-200',
  'bg-violet-100 text-violet-700 border-violet-200',
  'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
  'bg-lime-100 text-lime-700 border-lime-200',
  'bg-sky-100 text-sky-700 border-sky-200',
];

const getSubjectColor = (subj) => {
  if (!subj || subj === 'Free') return 'bg-gray-100 text-gray-400 border-gray-200';
  if (subjectColors[subj]) return subjectColors[subj];
  let hash = 0;
  for (let i = 0; i < subj.length; i++) {
    hash = (hash * 31 + subj.charCodeAt(i)) >>> 0;
  }
  return customColorPalette[hash % customColorPalette.length];
};

export default function Timetable() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'admin2';
  const [inchargeList, setInchargeList] = useState([]);

  const [cls, setCls] = useState(CLASSES.includes('8th') ? '8th' : CLASSES[0]);
  const [section, setSection] = useState('A');
  const [academicTerm, setAcademicTerm] = useState('2024 - 2025 (Term 1)');
  const [effectiveDate, setEffectiveDate] = useState('2024-05-27');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);

  // Check if current user is active Class Incharge for this class & section
  const isClassIncharge = useMemo(() => {
    if (isAdmin) return true;
    return inchargeList.some(ic => ic.class === cls && ic.section === section);
  }, [isAdmin, inchargeList, cls, section]);

  const canEdit = isAdmin || isClassIncharge;

  const [teachers, setTeachers] = useState([]);
  const [teacherSchedules, setTeacherSchedules] = useState({});
  const [timetableStatus, setTimetableStatus] = useState('draft');
  const [settings, setSettings] = useState({});

  const [grid, setGrid] = useState({});
  const [showSubjectTeacher, setShowSubjectTeacher] = useState(true);
  const [draggedSubject, setDraggedSubject] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);

  // Dynamic schedule configuration
  const [scheduleConfig, setScheduleConfig] = useState(DEFAULT_SCHEDULE_CONFIG);
  const [selectedDayTab, setSelectedDayTab] = useState(DAYS[0]);

  // Assigned subjects for the right panel
  const [assignedSubjects, setAssignedSubjects] = useState([]);

  // Modals
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [isCustomSubject, setIsCustomSubject] = useState(false);
  const [addSubjectForm, setAddSubjectForm] = useState({ subject: '', teacher_id: '' });

  // Custom / teacher subjects outside predefined SUBJECTS
  const customTeacherSubjects = useMemo(() => {
    const set = new Set();
    teachers.forEach(t => {
      if (t.subject) {
        t.subject.split(',').forEach(s => {
          const trimmed = s.trim();
          if (trimmed && !SUBJECTS.includes(trimmed)) {
            set.add(trimmed);
          }
        });
      }
    });
    assignedSubjects.forEach(a => {
      if (a.subject && !SUBJECTS.includes(a.subject)) {
        set.add(a.subject.trim());
      }
    });
    return Array.from(set).sort();
  }, [teachers, assignedSubjects]);
  const [showPreview, setShowPreview] = useState(false);
  const [showCustomDurations, setShowCustomDurations] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copying, setCopying] = useState(false);
  const [copySource, setCopySource] = useState({
    class: CLASSES.find(c => c !== '8th') || CLASSES[0],
    section: 'B'
  });
  const [copyOptions, setCopyOptions] = useState({
    copySchedule: true,
    copyAssignments: true
  });

  const [breakModal, setBreakModal] = useState({
    isOpen: false,
    isEditing: false,
    editIndex: -1,
    name: 'Break',
    afterPeriod: 3,
    duration: 30
  });

  // Current active schedule for editing (either base or selected day if custom)
  const isCustomMode = scheduleConfig.scheduleMode === 'custom';
  const currentSchedule = useMemo(() => {
    return getScheduleForDay(isCustomMode ? selectedDayTab : DAYS[0], scheduleConfig);
  }, [scheduleConfig, isCustomMode, selectedDayTab]);

  // Helper to update current schedule (updates either global or day-specific)
  const updateCurrentSchedule = (updater) => {
    setScheduleConfig(prev => {
      const nextSchedule = typeof updater === 'function' ? updater(currentSchedule) : updater;
      if (prev.scheduleMode === 'custom') {
        return {
          ...prev,
          daySchedules: {
            ...prev.daySchedules,
            [selectedDayTab]: nextSchedule
          }
        };
      }
      return {
        ...prev,
        ...nextSchedule
      };
    });
    setTimetableStatus('draft');
  };

  // Timelines for all days
  const dayTimelines = useMemo(() => {
    const map = {};
    DAYS.forEach(day => {
      const daySched = getScheduleForDay(day, scheduleConfig);
      map[day] = calculateDayTimeline(daySched, scheduleConfig.schoolEndTime);
    });
    return map;
  }, [scheduleConfig]);

  // Unified columns for the weekly grid view
  const maxPeriods = useMemo(() => {
    return getMaxPeriods(scheduleConfig);
  }, [scheduleConfig]);

  // Primary timeline (for header when uniform)
  const primaryTimeline = useMemo(() => {
    return calculateDayTimeline(currentSchedule, scheduleConfig.schoolEndTime);
  }, [currentSchedule, scheduleConfig.schoolEndTime]);

  useEffect(() => {
    Promise.all([
      API.get('/teachers?status=active').catch(() => ({ data: [] })),
      API.get('/timetable/teacher-schedules').catch(() => ({ data: {} })),
      API.get('/settings').catch(() => ({ data: {} })),
      API.get('/class-incharge/my-incharge').catch(() => ({ data: { incharges: [] } }))
    ]).then(([teachersRes, schedulesRes, settingsRes, inchargeRes]) => {
      setTeachers(teachersRes.data || []);
      setTeacherSchedules(schedulesRes.data || {});
      setSettings(settingsRes.data || {});
      const incharges = inchargeRes.data?.incharges || [];
      setInchargeList(incharges);
      // If user is a teacher and has incharge classes, prioritize selecting their incharge class!
      if (!isAdmin && incharges.length > 0) {
        setCls(incharges[0].class);
        setSection(incharges[0].section);
      }
    }).catch(err => console.error(err));
  }, [isAdmin]);

  useEffect(() => {
    loadTimetable();
    loadAssignedSubjects();
  }, [cls, section]);

  const loadAssignedSubjects = async () => {
    try {
      const res = await API.get(`/class-subjects?class=${cls}&section=${section}`);
      setAssignedSubjects(res.data || []);
    } catch (err) {
      toast.error('Failed to load assigned subjects');
    }
  };

  const loadTimetable = async () => {
    setLoading(true);
    try {
      const [slotsRes, configRes] = await Promise.all([
        API.get(`/timetable?class=${cls}&section=${section}`),
        API.get(`/timetable/config?class=${cls}&section=${section}`).catch(() => ({ data: null }))
      ]);

      const data = slotsRes.data || [];
      const newGrid = {};
      DAYS.forEach(d => { newGrid[d] = {}; });

      let status = 'draft';
      let maxLoadedPeriod = 7;

      data.forEach(slot => {
        if (slot.day && newGrid[slot.day]) {
          newGrid[slot.day][slot.period_number] = {
            subject: slot.subject,
            teacher_id: slot.teacher_id,
            teacher_name: slot.teacher?.name || '',
            start_time: slot.start_time,
            end_time: slot.end_time
          };
          if (slot.period_number > maxLoadedPeriod) {
            maxLoadedPeriod = slot.period_number;
          }
          if (slot.status === 'published') status = 'published';
        }
      });

      setGrid(newGrid);
      setTimetableStatus(status);

      if (configRes && configRes.data) {
        setScheduleConfig(configRes.data);
      } else {
        // Fallback: adapt default config so no loaded slots are hidden
        setScheduleConfig(prev => ({
          ...DEFAULT_SCHEDULE_CONFIG,
          numPeriods: Math.max(DEFAULT_SCHEDULE_CONFIG.numPeriods, maxLoadedPeriod)
        }));
      }
    } catch (err) {
      toast.error('Failed to load timetable');
    } finally {
      setLoading(false);
    }
  };

  const hasConflict = (teacherId, day, periodNum) => {
    if (!teacherId) return false;
    const schedule = teacherSchedules[teacherId];
    if (!schedule) return false;
    const periodsOnDay = schedule[day] || [];
    return periodsOnDay.includes(periodNum);
  };

  const handleDragStart = (e, subject, teacher) => {
    if (!canEdit) return;
    setDraggedSubject({ subject, teacher });
    e.dataTransfer.setData('text/plain', subject);
  };

  const handleDrop = (e, day, periodNum) => {
    e.preventDefault();
    if (!canEdit) {
      toast.error('Only the assigned Class Incharge or Admin can edit this timetable.');
      return;
    }
    if (!draggedSubject) return;

    const daySchedule = getScheduleForDay(day, scheduleConfig);
    if (periodNum > daySchedule.numPeriods) {
      return toast.error(`Cannot assign: ${day} only has ${daySchedule.numPeriods} periods scheduled.`);
    }

    if (hasConflict(draggedSubject.teacher?.id, day, periodNum)) {
      return toast.error(`${draggedSubject.teacher?.name || 'Teacher'} is busy on ${day} P${periodNum}.`);
    }

    setGrid(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [periodNum]: {
          subject: draggedSubject.subject,
          teacher_id: draggedSubject.teacher?.id,
          teacher_name: draggedSubject.teacher?.name
        }
      }
    }));
    setTimetableStatus('draft');
  };

  const handleCellClick = (day, periodNum) => {
    if (!canEdit) return;
    setGrid(prev => {
      const newDay = { ...prev[day] };
      delete newDay[periodNum];
      return { ...prev, [day]: newDay };
    });
    setTimetableStatus('draft');
  };

  const assignSubjectToCell = (assignment) => {
    if (!canEdit || !selectedCell) return;
    setGrid(prev => ({
      ...prev,
      [selectedCell.day]: {
        ...prev[selectedCell.day],
        [selectedCell.num]: {
          subject: assignment.subject,
          teacher_id: assignment.teacher?.id,
          teacher_name: assignment.teacher?.name
        }
      }
    }));
    setTimetableStatus('draft');
    setSelectedCell(null);
  };

  // Add / Remove Period with Data Preservation Check
  const handleAddPeriod = () => {
    if (!canEdit) return;
    const newCount = currentSchedule.numPeriods + 1;
    if (newCount > 12) {
      return toast.error('Maximum limit of 12 periods reached.');
    }
    updateCurrentSchedule(prev => ({
      ...prev,
      numPeriods: newCount
    }));
    toast.success(`Period ${newCount} added.`);
  };

  const handleRemovePeriod = () => {
    if (!canEdit) return;
    const periodToRemove = currentSchedule.numPeriods;
    if (periodToRemove <= 1) {
      return toast.error('A schedule must have at least 1 period.');
    }

    // Check if any day has assignments in the period about to be removed
    const affected = [];
    const checkDays = isCustomMode ? [selectedDayTab] : DAYS;
    checkDays.forEach(day => {
      if (grid[day] && grid[day][periodToRemove]?.subject) {
        affected.push(`${day}: ${grid[day][periodToRemove].subject}`);
      }
    });

    if (affected.length > 0) {
      const confirmed = window.confirm(
        `Warning: Period ${periodToRemove} contains assigned subjects:\n\n` +
        affected.map(a => `• ${a}`).join('\n') +
        `\n\nRemoving Period ${periodToRemove} will clear these assignments. Do you want to proceed?`
      );
      if (!confirmed) return;

      // Remove affected slots from grid
      setGrid(prev => {
        const updated = { ...prev };
        checkDays.forEach(day => {
          if (updated[day] && updated[day][periodToRemove]) {
            const nextDay = { ...updated[day] };
            delete nextDay[periodToRemove];
            updated[day] = nextDay;
          }
        });
        return updated;
      });
    }

    updateCurrentSchedule(prev => ({
      ...prev,
      numPeriods: periodToRemove - 1,
      // Adjust any break that was after this period
      breaks: (prev.breaks || []).map(b =>
        b.afterPeriod >= periodToRemove ? { ...b, afterPeriod: Math.max(1, periodToRemove - 1) } : b
      )
    }));

    toast.success(`Period ${periodToRemove} removed.`);
  };

  // Break Management
  const openAddBreak = () => {
    if (!canEdit) return;
    setBreakModal({
      isOpen: true,
      isEditing: false,
      editIndex: -1,
      name: `Break ${(currentSchedule.breaks || []).length + 1}`,
      afterPeriod: Math.min(3, Math.max(1, currentSchedule.numPeriods - 1)),
      duration: 30
    });
  };

  const openEditBreak = (b, index) => {
    if (!canEdit) return;
    setBreakModal({
      isOpen: true,
      isEditing: true,
      editIndex: index,
      name: b.name || 'Break',
      afterPeriod: b.afterPeriod ?? 3,
      duration: b.duration ?? 30
    });
  };

  const handleSaveBreak = (e) => {
    e.preventDefault();
    if (!canEdit) return;
    const afterP = parseInt(breakModal.afterPeriod, 10);
    const dur = parseInt(breakModal.duration, 10);

    if (isNaN(dur) || dur < 5 || dur > 120) {
      return toast.error('Break duration must be between 5 and 120 minutes.');
    }

    if (afterP < 0 || afterP > currentSchedule.numPeriods) {
      return toast.error(`Break position must be after a period between 0 and ${currentSchedule.numPeriods}.`);
    }

    const newBreak = {
      id: breakModal.isEditing ? currentSchedule.breaks[breakModal.editIndex].id : `break-${Date.now()}`,
      name: breakModal.name.trim() || 'Break',
      afterPeriod: afterP,
      duration: dur
    };

    updateCurrentSchedule(prev => {
      let breaksList = [...(prev.breaks || [])];
      if (breakModal.isEditing && breakModal.editIndex >= 0) {
        breaksList[breakModal.editIndex] = newBreak;
      } else {
        breaksList.push(newBreak);
      }
      // Sort breaks by afterPeriod
      breaksList.sort((a, b) => a.afterPeriod - b.afterPeriod);
      return { ...prev, breaks: breaksList };
    });

    setBreakModal(prev => ({ ...prev, isOpen: false }));
    toast.success(breakModal.isEditing ? 'Break updated' : 'Break added');
  };

  const handleRemoveBreak = (breakId) => {
    if (!canEdit) return;
    updateCurrentSchedule(prev => ({
      ...prev,
      breaks: (prev.breaks || []).filter(b => b.id !== breakId)
    }));
    toast.success('Break removed');
  };

  // Period Duration Change
  const handlePeriodDurationChange = (val) => {
    if (!canEdit) return;
    const mins = parseInt(val, 10);
    updateCurrentSchedule(prev => ({
      ...prev,
      periodDuration: mins
    }));
  };

  // Schedule Mode Toggle (All Days Same vs Custom by Day)
  const handleScheduleModeChange = (mode) => {
    if (!canEdit) return;
    setScheduleConfig(prev => {
      if (mode === 'custom' && (!prev.daySchedules || Object.keys(prev.daySchedules).length === 0)) {
        // Initialize day schedules with a clone of current base schedule
        const initDays = {};
        DAYS.forEach(d => {
          initDays[d] = {
            startTime: prev.startTime || '08:00',
            numPeriods: prev.numPeriods || 7,
            periodDuration: prev.periodDuration || 45,
            customPeriodDurations: { ...(prev.customPeriodDurations || {}) },
            breaks: JSON.parse(JSON.stringify(prev.breaks || []))
          };
        });
        return {
          ...prev,
          scheduleMode: 'custom',
          daySchedules: initDays
        };
      }
      return {
        ...prev,
        scheduleMode: mode
      };
    });
    setTimetableStatus('draft');
  };

  // Copy schedule from one day to all weekdays
  const copyScheduleToWeekdays = (sourceDay) => {
    if (!canEdit) return;
    if (!window.confirm(`Copy ${sourceDay}'s schedule configuration to all Monday–Friday days?`)) return;
    const source = getScheduleForDay(sourceDay, scheduleConfig);
    setScheduleConfig(prev => {
      const updatedDays = { ...(prev.daySchedules || {}) };
      ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].forEach(d => {
        updatedDays[d] = JSON.parse(JSON.stringify(source));
      });
      return {
        ...prev,
        daySchedules: updatedDays
      };
    });
    toast.success(`Copied ${sourceDay} schedule to Monday–Friday.`);
  };

  // Copy Timetable from Another Class / Section
  const handleCopyTimetableSubmit = async (e) => {
    e.preventDefault();
    if (!canEdit) {
      return toast.error('Only the assigned Class Incharge or Admin can edit this timetable.');
    }
    if (copySource.class === cls && copySource.section === section) {
      return toast.error('Source and destination class/section cannot be the same.');
    }

    if (!copyOptions.copySchedule && !copyOptions.copyAssignments) {
      return toast.error('Please select at least one option to copy (Schedule or Assignments).');
    }

    setCopying(true);
    try {
      const [sourceSlotsRes, sourceConfigRes] = await Promise.all([
        API.get(`/timetable?class=${copySource.class}&section=${copySource.section}`),
        API.get(`/timetable/config?class=${copySource.class}&section=${copySource.section}`).catch(() => ({ data: null }))
      ]);

      const sourceSlots = sourceSlotsRes.data || [];
      const sourceConfig = sourceConfigRes.data;

      if (sourceSlots.length === 0 && !sourceConfig) {
        setCopying(false);
        return toast.error(`No timetable data found for Class ${copySource.class} (${copySource.section}).`);
      }

      // Check if current timetable has data
      const hasCurrentAssignments = Object.values(grid).some(dayObj => Object.keys(dayObj || {}).length > 0);
      if (hasCurrentAssignments) {
        const confirmed = window.confirm(
          `Class ${cls} (${section}) already has timetable data. Copying from Class ${copySource.class} (${copySource.section}) will overwrite your current draft. Proceed?`
        );
        if (!confirmed) {
          setCopying(false);
          return;
        }
      }

      // 1. Copy Schedule Configuration
      if (copyOptions.copySchedule && sourceConfig) {
        setScheduleConfig(sourceConfig);
      }

      // 2. Copy Assignments
      if (copyOptions.copyAssignments) {
        const newGrid = {};
        DAYS.forEach(d => { newGrid[d] = {}; });

        const conflicts = [];
        sourceSlots.forEach(slot => {
          if (slot.day && newGrid[slot.day]) {
            newGrid[slot.day][slot.period_number] = {
              subject: slot.subject,
              teacher_id: slot.teacher_id,
              teacher_name: slot.teacher?.name || slot.teacher_name || ''
            };

            // Detect any teacher schedule conflicts
            if (hasConflict(slot.teacher_id, slot.day, slot.period_number)) {
              conflicts.push(`${slot.day} P${slot.period_number}: ${slot.teacher?.name || 'Teacher'}`);
            }
          }
        });

        setGrid(newGrid);

        if (conflicts.length > 0) {
          toast(
            `Copied with ${conflicts.length} teacher conflict(s):\n${conflicts.slice(0, 3).join(', ')}${conflicts.length > 3 ? '...' : ''}`,
            { icon: '⚠️', duration: 5000 }
          );
        }
      }

      setTimetableStatus('draft');
      setShowCopyModal(false);
      toast.success(`Timetable copied from Class ${copySource.class} (${copySource.section})! Remember to Save.`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to copy timetable');
    } finally {
      setCopying(false);
    }
  };

  // PDF Download Handler
  const handleDownloadPDF = async () => {
    setPdfGenerating(true);
    try {
      await generateTimetablePDF({
        cls,
        section,
        academicTerm,
        effectiveDate,
        scheduleConfig,
        grid,
        settings
      });
      toast.success('Timetable PDF generated & downloaded!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF');
    } finally {
      setPdfGenerating(false);
    }
  };

  const handleAddSubjectSubmit = async (e) => {
    e.preventDefault();
    if (!canEdit) {
      return toast.error('Only the assigned Class Incharge or Admin can assign subjects.');
    }
    if (!addSubjectForm.subject || !addSubjectForm.teacher_id) {
      return toast.error('Please select both a subject and a teacher.');
    }
    setSaving(true);
    try {
      await API.post('/class-subjects', {
        class: cls,
        section,
        subject: addSubjectForm.subject,
        teacher_id: parseInt(addSubjectForm.teacher_id, 10)
      });
      toast.success('Subject assigned successfully!');
      setShowAddSubject(false);
      setIsCustomSubject(false);
      setAddSubjectForm({ subject: '', teacher_id: '' });
      loadAssignedSubjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign subject');
    } finally {
      setSaving(false);
    }
  };

  const removeAssignedSubject = async (id) => {
    if (!canEdit) {
      return toast.error('Only the assigned Class Incharge or Admin can remove subjects.');
    }
    if (!window.confirm('Remove this subject assignment?')) return;
    try {
      await API.delete(`/class-subjects/${id}`);
      toast.success('Subject removed');
      loadAssignedSubjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove subject');
    }
  };

  const autoGenerate = () => {
    if (!canEdit) {
      return toast.error('Only the assigned Class Incharge or Admin can auto-generate timetables.');
    }
    if (assignedSubjects.length === 0) {
      return toast.error('No subjects assigned. Please assign subjects first.');
    }

    const newGrid = {};
    DAYS.forEach(d => { newGrid[d] = {}; });

    let subIndex = 0;
    DAYS.forEach(day => {
      const daySchedule = getScheduleForDay(day, scheduleConfig);
      for (let pNum = 1; pNum <= daySchedule.numPeriods; pNum++) {
        let assigned = false;
        let attempts = 0;
        while (!assigned && attempts < assignedSubjects.length) {
          const assignment = assignedSubjects[subIndex % assignedSubjects.length];
          if (!hasConflict(assignment.teacher_id, day, pNum)) {
            newGrid[day][pNum] = {
              subject: assignment.subject,
              teacher_id: assignment.teacher_id,
              teacher_name: assignment.teacher?.name
            };
            assigned = true;
          }
          subIndex++;
          attempts++;
        }
      }
    });

    setGrid(newGrid);
    setTimetableStatus('draft');
    toast.success('Auto-generated (Draft)');
  };

  const saveTimetable = async (publish = false) => {
    if (!canEdit) {
      return toast.error('Only the assigned Class Incharge or Admin can save this timetable.');
    }
    const slots = [];
    DAYS.forEach(day => {
      if (!grid[day]) return;
      const daySched = getScheduleForDay(day, scheduleConfig);
      const timelineData = calculateDayTimeline(daySched, scheduleConfig.schoolEndTime);
      const periodTimes = {};
      timelineData.timeline.forEach(t => {
        if (!t.isBreak) {
          periodTimes[t.num] = {
            start_time: t.startTime24,
            end_time: t.endTime24
          };
        }
      });

      Object.entries(grid[day]).forEach(([periodNum, data]) => {
        const pNum = parseInt(periodNum, 10);
        if (data && data.subject && pNum <= daySched.numPeriods) {
          const tSlot = periodTimes[pNum] || {};
          slots.push({
            day,
            period_number: pNum,
            subject: data.subject,
            teacher_id: data.teacher_id,
            start_time: tSlot.start_time || null,
            end_time: tSlot.end_time || null
          });
        }
      });
    });

    setSaving(true);
    try {
      const finalStatus = publish ? 'published' : 'draft';
      await API.put('/timetable/bulk-save', {
        class: cls,
        section,
        slots,
        status: finalStatus,
        config: scheduleConfig
      });
      toast.success(publish ? 'Timetable Published!' : 'Draft Saved!');
      setTimetableStatus(finalStatus);
    } catch (err) {
      toast.error('Failed to save timetable');
    } finally {
      setSaving(false);
    }
  };

  const clearTimetable = () => {
    if (!canEdit) {
      return toast.error('Only the assigned Class Incharge or Admin can reset this timetable.');
    }
    if (!window.confirm('Reset timetable? All assigned slots will be cleared.')) return;
    const newGrid = {};
    DAYS.forEach(d => { newGrid[d] = {}; });
    setGrid(newGrid);
    setTimetableStatus('draft');
    toast.success('Timetable reset to blank');
  };

  const f = 'border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-blue-500 bg-white shadow-sm';

  return (
    <div className="space-y-6">
      {/* Top Bar with Class, Section, Term, Date, and Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Class</label>
            <select value={cls} onChange={e => setCls(e.target.value)} className={f}>
              {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Section</label>
            <select value={section} onChange={e => setSection(e.target.value)} className={f}>
              {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Academic Term</label>
            <select value={academicTerm} onChange={e => setAcademicTerm(e.target.value)} className={f}>
              <option>2024 - 2025 (Term 1)</option>
              <option>2024 - 2025 (Term 2)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Effective From</label>
            <input
              type="date"
              className={f}
              value={effectiveDate}
              onChange={e => setEffectiveDate(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 mt-5">
            {timetableStatus === 'published' ? (
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-200">
                ● Published
              </span>
            ) : (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full border border-yellow-200">
                ● Draft Mode
              </span>
            )}

            {canEdit ? (
              !isAdmin && (
                <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full border border-purple-200 flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                  Class Incharge (Edit Mode)
                </span>
              )
            ) : (
              <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full border border-amber-300 flex items-center gap-1.5 shadow-sm">
                <svg className="w-3.5 h-3.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                View Only
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-4 lg:mt-0 items-end">
          {/* Copy Timetable Button */}
          {canEdit && (
            <button
              onClick={() => setShowCopyModal(true)}
              className="px-4 py-2.5 rounded-xl border border-purple-200 text-purple-700 font-bold text-sm hover:bg-purple-50 transition-colors flex items-center gap-2 bg-white shadow-sm"
              title="Copy timetable from another class or section"
            >
              <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Timetable
            </button>
          )}

          {/* Export PDF Button */}
          <button
            onClick={handleDownloadPDF}
            disabled={pdfGenerating}
            className="px-4 py-2.5 rounded-xl border border-rose-200 text-rose-700 font-bold text-sm hover:bg-rose-50 transition-colors flex items-center gap-2 bg-white shadow-sm disabled:opacity-50"
            title="Export timetable as PDF"
          >
            <svg className="w-4 h-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {pdfGenerating ? 'Generating...' : 'Export PDF'}
          </button>

          {/* Preview Button */}
          <button
            onClick={() => setShowPreview(true)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 bg-white shadow-sm"
            title="Preview full timetable schedule"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Preview
          </button>

          {canEdit && (
            <>
              <button
                onClick={autoGenerate}
                className="px-4 py-2.5 rounded-xl border border-blue-200 text-blue-600 font-bold text-sm hover:bg-blue-50 transition-colors flex items-center gap-2 bg-white"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                Auto Generate
              </button>

              <button
                onClick={() => saveTimetable(false)}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-[#6E1A33] text-white font-bold text-sm shadow-md hover:bg-[#5a1529] disabled:opacity-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                {saving ? 'Saving...' : 'Save Timetable'}
              </button>

              <button
                onClick={() => saveTimetable(false)}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-gray-800 text-white font-bold text-sm shadow-md hover:bg-gray-900 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Draft'}
              </button>

              <button
                onClick={() => { if (window.confirm('Publish to students and teachers?')) saveTimetable(true); }}
                className="px-5 py-2.5 rounded-xl bg-green-600 text-white font-bold text-sm shadow-md shadow-green-600/20 hover:bg-green-700"
              >
                Publish Timetable
              </button>
            </>
          )}
        </div>
      </div>

      {/* Informational Banner when in View-Only Mode */}
      {!canEdit && !loading && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-800 shadow-sm">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-xl text-amber-700 flex-shrink-0 mt-0.5 sm:mt-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold">Timetable View-Only Mode</p>
              <p className="text-xs text-amber-700 mt-0.5">
                You are viewing the schedule for <strong>Class {cls} ({section})</strong>. Only the assigned <strong>Class Incharge</strong> or an <strong>Administrator</strong> can edit this timetable.
              </p>
            </div>
          </div>
          {inchargeList.length > 0 && (
            <button
              onClick={() => {
                setCls(inchargeList[0].class);
                setSection(inchargeList[0].section);
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors whitespace-nowrap shadow-sm self-start sm:self-auto"
            >
              Go to My Class ({inchargeList[0].class} - {inchargeList[0].section}) →
            </button>
          )}
        </div>
      )}

      {/* Validation Warning Alert if Schedule Exceeds Closing Time */}
      {primaryTimeline.isExceedingClosingTime && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4 text-amber-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-xl text-amber-700">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold">Schedule Exceeds School Closing Time</p>
              <p className="text-xs text-amber-700 mt-0.5">
                The current schedule concludes at <strong>{primaryTimeline.endTimeFormatted}</strong>, which exceeds the school closing time of <strong>{primaryTimeline.closingTimeFormatted}</strong> by {primaryTimeline.exceedMinutes} minutes.
              </p>
            </div>
          </div>
          <button
            onClick={() => handlePeriodDurationChange(Math.max(30, currentSchedule.periodDuration - 5))}
            className="text-xs bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
          >
            Auto-compress (-5 mins)
          </button>
        </div>
      )}

      {/* Main Content Area: Grid on Left, Assigned Subjects + Settings on Right */}
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Left Column: Timetable Grid */}
        <div className="flex-1 bg-white p-3 rounded-2xl shadow-sm border border-gray-100 h-fit">
          {/* Grid Quick Header Controls */}
          <div className="flex items-center justify-between pb-3 px-2 border-b border-gray-100 mb-2">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-gray-700">
                {isCustomMode ? 'Weekly View (Custom Schedules)' : `Standard Schedule (${currentSchedule.numPeriods} Periods)`}
              </span>
              <span className="text-[11px] text-gray-400 font-medium">
                {primaryTimeline.startTimeFormatted} – {primaryTimeline.endTimeFormatted}
              </span>
            </div>

            {/* Quick Add / Remove Period buttons on the grid */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500">Periods:</span>
              <button
                type="button"
                onClick={handleRemovePeriod}
                disabled={currentSchedule.numPeriods <= 1}
                className="w-7 h-7 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-30 flex items-center justify-center font-bold text-sm transition-colors"
                title="Remove last period"
              >
                -
              </button>
              <span className="text-xs font-bold text-gray-800 w-5 text-center">
                {currentSchedule.numPeriods}
              </span>
              <button
                type="button"
                onClick={handleAddPeriod}
                disabled={currentSchedule.numPeriods >= 12}
                className="w-7 h-7 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-30 flex items-center justify-center font-bold text-sm transition-colors"
                title="Add period column"
              >
                +
              </button>

              <button
                type="button"
                onClick={openAddBreak}
                className="ml-2 text-xs font-bold text-blue-600 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-200 transition-colors flex items-center gap-1"
                title="Add a break column"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Break
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr>
                  <th className="p-3 border-b border-r border-gray-100 w-28 align-top bg-gray-50/30">
                    <div className="flex justify-between items-center text-[10px] font-bold text-gray-800">
                      <span>Periods →</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-gray-800 mt-2">
                      <span>Days ↓</span>
                    </div>
                  </th>

                  {/* Render Columns based on Primary Timeline */}
                  {primaryTimeline.timeline.map((slot, i) => (
                    <th key={i} className="p-3 border-b border-gray-100 min-w-[110px]">
                      {slot.isBreak ? (
                        <div className="flex flex-col items-center group relative">
                          <span className="text-xs font-bold text-gray-800">{slot.name || 'Break'}</span>
                          <svg className="w-4 h-4 text-gray-400 mt-1 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-[10px] text-gray-500 font-medium whitespace-nowrap">
                            {slot.time.split(' - ')[0]}<br />{slot.time.split(' - ')[1]}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          <span className="text-sm font-extrabold text-gray-800">{slot.num}</span>
                          <span className="text-[10px] text-gray-500 font-medium mt-1">{slot.time.split(' - ')[0]}</span>
                          <span className="text-[10px] text-gray-500 font-medium">{slot.time.split(' - ')[1]}</span>
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS.map(day => {
                  const daySched = getScheduleForDay(day, scheduleConfig);
                  const dayTimeline = dayTimelines[day]?.timeline || primaryTimeline.timeline;

                  return (
                    <tr key={day} className="group h-[80px]">
                      <td className="p-3 border-r border-b border-gray-100 font-bold text-gray-800 text-xs bg-white text-left align-middle">
                        <div>
                          <div>{day}</div>
                          {isCustomMode && (
                            <div className="text-[10px] font-normal text-gray-400 mt-0.5">
                              {daySched.numPeriods} periods
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Map columns matching the primary timeline slots */}
                      {primaryTimeline.timeline.map((colSlot, i) => {
                        // If this column is a break
                        if (colSlot.isBreak) {
                          return (
                            <td key={i} className="border-b border-gray-100 bg-gray-50/40 p-2 align-middle">
                              <div className="h-full w-full flex items-center justify-center text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
                                {colSlot.name ? colSlot.name.toUpperCase() : 'BREAK'}
                              </div>
                            </td>
                          );
                        }

                        // If period is beyond this day's configured periods (e.g. Saturday with fewer periods)
                        if (colSlot.num > daySched.numPeriods) {
                          return (
                            <td key={i} className="border-b border-r border-gray-100 bg-gray-50/60 p-2 align-middle select-none">
                              <div className="h-full min-h-[60px] w-full flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 text-gray-400 text-xs font-medium">
                                <span className="text-gray-300 font-bold">—</span>
                                <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">Dismissed</span>
                              </div>
                            </td>
                          );
                        }

                        // Regular period slot
                        const slot = grid[day]?.[colSlot.num];
                        const subj = slot?.subject;
                        const teacherName = slot?.teacher_name;
                        const colorClass = subj ? getSubjectColor(subj) : 'bg-gray-50 text-gray-400 border-dashed border-gray-200';

                        // Lookup specific time for this day & period if custom
                        const dayPeriodSlot = dayTimeline.find(t => !t.isBreak && t.num === colSlot.num);
                        const hoverTime = dayPeriodSlot ? dayPeriodSlot.time : colSlot.time;

                        return (
                          <td
                            key={i}
                            onDragOver={canEdit ? (e => e.preventDefault()) : undefined}
                            onDrop={canEdit ? ((e) => handleDrop(e, day, colSlot.num)) : undefined}
                            onClick={() => {
                              if (!canEdit) return;
                              if (subj) {
                                handleCellClick(day, colSlot.num);
                              } else {
                                setSelectedCell({ day, num: colSlot.num });
                              }
                            }}
                            className={`border-b border-r border-gray-100 p-2 transition-all ${
                              canEdit ? 'cursor-pointer hover:bg-gray-50/50 ' + (!subj ? 'hover:bg-blue-50/30' : '') : 'cursor-default'
                            }`}
                            title={`${day} Period ${colSlot.num} (${hoverTime})`}
                          >
                            <div className={`h-full min-h-[60px] w-full flex flex-col items-center justify-center rounded-lg border p-1 transition-all ${subj ? colorClass + ' shadow-sm' : 'bg-transparent border-dashed border-gray-200'}`}>
                              {subj ? (
                                <>
                                  <span className="font-bold text-[11px] text-center leading-tight">{subj}</span>
                                  {showSubjectTeacher && teacherName && (
                                    <span className="text-[10px] font-medium opacity-80 mt-1 text-center truncate w-full px-1">
                                      {teacherName}
                                    </span>
                                  )}
                                </>
                              ) : (
                                canEdit ? (
                                  <span className="text-gray-200 font-bold text-lg group-hover:text-blue-300">+</span>
                                ) : (
                                  <span className="text-gray-300 font-medium text-xs">—</span>
                                )
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-blue-50/50 rounded-xl mt-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-white rounded-full text-blue-600 shadow-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <p className="text-xs text-blue-800 font-medium">
                {canEdit
                  ? 'Tip: Drag & drop assigned subjects into cells, click on a cell to assign/remove, or use "Copy Timetable" to duplicate from another section.'
                  : `Viewing Class ${cls} (${section}) Timetable. Click "Preview" for a full printable layout or "Export PDF" to download.`
                }
              </p>
            </div>
            <button
              onClick={() => setShowPreview(true)}
              className="text-xs text-blue-700 font-bold hover:underline whitespace-nowrap"
            >
              Full Schedule View →
            </button>
          </div>
        </div>

        {/* Right Sidebar: Assigned Subjects & Settings */}
        <div className="xl:w-[320px] space-y-6">
          {/* Card 1: Assigned Subjects */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800">Assigned Subjects</h3>
              {canEdit && (
                <button
                  onClick={() => setShowAddSubject(true)}
                  className="text-blue-600 text-xs font-semibold flex items-center gap-1 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Subject
                </button>
              )}
            </div>
            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
              {assignedSubjects.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No subjects assigned yet.</p>
              ) : (
                assignedSubjects.map(assignment => (
                  <div
                    key={assignment.id}
                    draggable={canEdit}
                    onDragStart={canEdit ? ((e) => handleDragStart(e, assignment.subject, assignment.teacher)) : undefined}
                    className={`flex items-center justify-between p-3 py-2.5 rounded-xl border border-gray-100 transition-transform ${
                      canEdit ? 'cursor-move hover:-translate-y-0.5 hover:bg-gray-50' : 'cursor-default bg-gray-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getSubjectColor(assignment.subject).split(' ')[0]}`}></div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-700">{assignment.subject}</span>
                        <span className="text-[10px] text-gray-400 font-medium">
                          {assignment.teacher?.name ? assignment.teacher.name.split(' ')[0] : 'Unknown'}
                        </span>
                      </div>
                    </div>
                    {canEdit && (
                      <button
                        onClick={() => removeAssignedSubject(assignment.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors"
                        title="Remove assignment"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Card 2: Settings */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
                {!canEdit && (
                  <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Read Only
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className="text-xs text-blue-600 font-semibold hover:underline"
              >
                Preview
              </button>
            </h3>

            <div className={`space-y-4 ${!canEdit ? 'opacity-70 pointer-events-none select-none' : ''}`}>
              {/* Daily Schedule Mode Selector */}
              <div className="pb-3 border-b border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-700">Daily Schedule</span>
                  <div className="flex bg-gray-100 p-0.5 rounded-lg text-[10px] font-semibold">
                    <button
                      type="button"
                      onClick={() => handleScheduleModeChange('all')}
                      className={`px-2 py-0.5 rounded-md transition-all ${
                        !isCustomMode ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      All Days
                    </button>
                    <button
                      type="button"
                      onClick={() => handleScheduleModeChange('custom')}
                      className={`px-2 py-0.5 rounded-md transition-all ${
                        isCustomMode ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      By Day
                    </button>
                  </div>
                </div>

                {isCustomMode && (
                  <div className="mt-2 space-y-2">
                    <div className="flex gap-1 overflow-x-auto pb-1">
                      {DAYS.map(d => {
                        const isSelected = selectedDayTab === d;
                        return (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setSelectedDayTab(d)}
                            className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                              isSelected
                                ? 'bg-[#6E1A33] text-white shadow-sm'
                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                            }`}
                          >
                            {d.slice(0, 3)}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-gray-500 bg-gray-50 p-1.5 rounded-lg border border-gray-100">
                      <span>Configuring: <strong>{selectedDayTab}</strong></span>
                      <button
                        type="button"
                        onClick={() => copyScheduleToWeekdays(selectedDayTab)}
                        className="text-blue-600 hover:underline font-semibold"
                        title="Copy this day's settings to Monday–Friday"
                      >
                        Copy to Mon–Fri
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Number of Periods Control */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <span className="text-xs font-semibold text-gray-700 block">Total Periods</span>
                  <span className="text-[10px] text-gray-400">Columns in schedule</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleRemovePeriod}
                    disabled={currentSchedule.numPeriods <= 1}
                    className="w-7 h-7 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-30 flex items-center justify-center font-bold text-sm"
                    title="Remove period"
                  >
                    -
                  </button>
                  <span className="w-6 text-center text-xs font-bold text-gray-800">
                    {currentSchedule.numPeriods}
                  </span>
                  <button
                    type="button"
                    onClick={handleAddPeriod}
                    disabled={currentSchedule.numPeriods >= 12}
                    className="w-7 h-7 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-30 flex items-center justify-center font-bold text-sm"
                    title="Add period"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Period Duration Dropdown + Custom Durations link */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <span className="text-xs font-semibold text-gray-700 block">Period Duration</span>
                  <button
                    type="button"
                    onClick={() => setShowCustomDurations(true)}
                    className="text-[10px] text-blue-600 font-semibold hover:underline block"
                  >
                    Custom per period
                  </button>
                </div>
                <select
                  value={currentSchedule.periodDuration}
                  onChange={(e) => handlePeriodDurationChange(e.target.value)}
                  className="text-xs border-gray-200 rounded-lg py-1 px-2 bg-white outline-none font-medium text-gray-600"
                >
                  <option value={30}>30 Minutes</option>
                  <option value={35}>35 Minutes</option>
                  <option value={40}>40 Minutes</option>
                  <option value={45}>45 Minutes</option>
                  <option value={50}>50 Minutes</option>
                  <option value={55}>55 Minutes</option>
                  <option value={60}>60 Minutes</option>
                  <option value={75}>75 Minutes</option>
                </select>
              </div>

              {/* Multiple Breaks Manager */}
              <div className="pb-3 border-b border-gray-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700">
                    Breaks ({(currentSchedule.breaks || []).length})
                  </span>
                  <button
                    type="button"
                    onClick={openAddBreak}
                    className="text-xs text-blue-600 font-bold hover:text-blue-700 flex items-center gap-1"
                  >
                    + Add Break
                  </button>
                </div>

                {(currentSchedule.breaks || []).length === 0 ? (
                  <p className="text-[11px] text-gray-400 py-1 italic">No breaks scheduled for this day.</p>
                ) : (
                  <div className="space-y-1.5">
                    {currentSchedule.breaks.map((b, idx) => (
                      <div
                        key={b.id || idx}
                        className="p-2 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between text-xs"
                      >
                        <div className="flex-1 truncate mr-2">
                          <span className="font-semibold text-gray-800">{b.name || `Break ${idx + 1}`}</span>
                          <span className="text-[10px] text-gray-500 block">
                            After Period {b.afterPeriod} • {b.duration} mins
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditBreak(b, idx)}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Edit break"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveBreak(b.id)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            title="Delete break"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* School Start Time & Closing Validation */}
              <div className="grid grid-cols-2 gap-2 pb-3 border-b border-gray-100">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={currentSchedule.startTime || '08:00'}
                    onChange={e => updateCurrentSchedule(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full text-xs border border-gray-200 rounded-lg py-1 px-2 bg-white font-medium text-gray-700 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 mb-1">School Closes</label>
                  <input
                    type="time"
                    value={scheduleConfig.schoolEndTime || '15:30'}
                    onChange={e => setScheduleConfig(prev => ({ ...prev, schoolEndTime: e.target.value }))}
                    className="w-full text-xs border border-gray-200 rounded-lg py-1 px-2 bg-white font-medium text-gray-700 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Show Subject Teacher Toggle - Interactive in both view and edit modes */}
            <div className="flex items-center justify-between pt-4 mt-3 border-t border-gray-100">
              <span className="text-xs font-semibold text-gray-700">Show Subject Teacher</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={showSubjectTeacher}
                  onChange={(e) => setShowSubjectTeacher(e.target.checked)}
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#6E1A33]"></div>
              </label>
            </div>

            {/* Reset Timetable Button - Only when user can edit */}
            {canEdit && (
              <button
                onClick={clearTimetable}
                className="w-full mt-6 py-2.5 rounded-xl border border-red-200 text-red-500 font-bold text-xs hover:bg-red-50 flex items-center justify-center gap-2 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Reset Timetable
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal 1: Assign Teacher to Subject (Existing) */}
      <Modal
        isOpen={showAddSubject}
        onClose={() => {
          setShowAddSubject(false);
          setIsCustomSubject(false);
        }}
        title="Assign Teacher to Subject"
      >
        <form onSubmit={handleAddSubjectSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-gray-500">Select Subject</label>
              <button
                type="button"
                onClick={() => {
                  setIsCustomSubject(p => !p);
                  setAddSubjectForm(p => ({ ...p, subject: '' }));
                }}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold hover:underline"
              >
                {isCustomSubject ? '← Choose from list' : '+ Enter custom subject'}
              </button>
            </div>
            {isCustomSubject ? (
              <input
                type="text"
                value={addSubjectForm.subject}
                onChange={e => setAddSubjectForm(p => ({ ...p, subject: e.target.value }))}
                placeholder="e.g. Robotics, French, Sanskrit..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 bg-white"
                required
                autoFocus
              />
            ) : (
              <select
                value={addSubjectForm.subject}
                onChange={e => {
                  if (e.target.value === '__custom__') {
                    setIsCustomSubject(true);
                    setAddSubjectForm(p => ({ ...p, subject: '' }));
                  } else {
                    setAddSubjectForm(p => ({ ...p, subject: e.target.value }));
                  }
                }}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 bg-white"
                required
              >
                <option value="">Choose a subject...</option>
                <optgroup label="Standard Subjects">
                  {SUBJECTS.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </optgroup>
                {customTeacherSubjects.length > 0 && (
                  <optgroup label="Custom / Teacher Subjects">
                    {customTeacherSubjects.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </optgroup>
                )}
                <option value="__custom__">+ Enter custom subject...</option>
              </select>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Assign Teacher</label>
            <select
              value={addSubjectForm.teacher_id}
              onChange={e => {
                const teacherId = e.target.value;
                setAddSubjectForm(p => {
                  const updated = { ...p, teacher_id: teacherId };
                  if (!updated.subject && teacherId) {
                    const selTeacher = teachers.find(t => String(t.id) === String(teacherId));
                    if (selTeacher?.subject) {
                      const firstSubj = selTeacher.subject.split(',')[0].trim();
                      if (firstSubj) updated.subject = firstSubj;
                    }
                  }
                  return updated;
                });
              }}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 bg-white"
              required
            >
              <option value="">Choose a teacher...</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} (Subjects: {t.subject || 'None'})
                </option>
              ))}
            </select>
          </div>
          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 px-5 py-2.5 text-sm font-extrabold text-white rounded-xl shadow-lg shadow-blue-600/15 transition-all disabled:opacity-60"
            >
              {saving ? 'Assigning...' : 'Assign Teacher'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Cell Subject Selection (Existing) */}
      {selectedCell && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden transform transition-all border border-gray-100">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="font-bold text-gray-800">Select Subject</h3>
                <p className="text-xs text-gray-500 font-medium mt-0.5">{selectedCell.day} - Period {selectedCell.num}</p>
              </div>
              <button
                onClick={() => setSelectedCell(null)}
                className="text-gray-400 hover:text-gray-700 bg-white shadow-sm p-1.5 rounded-lg border border-gray-100"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-2 max-h-[60vh] overflow-y-auto">
              {assignedSubjects.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-sm text-gray-500 font-medium">No subjects assigned yet.</p>
                  <p className="text-xs text-gray-400 mt-1">Please assign subjects to this class first.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {assignedSubjects.map(assignment => (
                    <button
                      key={assignment.id}
                      onClick={() => assignSubjectToCell(assignment)}
                      className="w-full text-left flex items-center justify-between p-3 rounded-xl hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${getSubjectColor(assignment.subject).split(' ')[0]}`}></div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-700">{assignment.subject}</span>
                          <span className="text-xs text-gray-500 font-medium mt-0.5">
                            {assignment.teacher?.name || 'Unknown Teacher'}
                          </span>
                        </div>
                      </div>
                      <div className="text-blue-500 bg-white p-1 rounded-full shadow-sm">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Add / Edit Break */}
      <Modal
        isOpen={breakModal.isOpen}
        onClose={() => setBreakModal(p => ({ ...p, isOpen: false }))}
        title={breakModal.isEditing ? 'Edit Break' : 'Add Break'}
      >
        <form onSubmit={handleSaveBreak} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Break Title</label>
            <input
              type="text"
              value={breakModal.name}
              onChange={e => setBreakModal(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Lunch Break, Recess, Morning Tea"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Place Break After</label>
            <select
              value={breakModal.afterPeriod}
              onChange={e => setBreakModal(p => ({ ...p, afterPeriod: parseInt(e.target.value, 10) }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 bg-white"
            >
              {Array.from({ length: currentSchedule.numPeriods }, (_, i) => i + 1).map(p => (
                <option key={p} value={p}>After Period {p}</option>
              ))}
            </select>
            <p className="text-[11px] text-gray-400 mt-1">
              The break will be inserted as a column right after the selected period.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Break Duration</label>
            <select
              value={breakModal.duration}
              onChange={e => setBreakModal(p => ({ ...p, duration: parseInt(e.target.value, 10) }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 bg-white"
            >
              <option value={10}>10 Minutes</option>
              <option value={15}>15 Minutes</option>
              <option value={20}>20 Minutes</option>
              <option value={25}>25 Minutes</option>
              <option value={30}>30 Minutes</option>
              <option value={40}>40 Minutes</option>
              <option value={45}>45 Minutes</option>
              <option value={60}>60 Minutes</option>
            </select>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={() => setBreakModal(p => ({ ...p, isOpen: false }))}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-xl text-sm shadow-md transition-all"
            >
              {breakModal.isEditing ? 'Save Changes' : 'Add Break'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 4: Custom Period Durations */}
      <Modal
        isOpen={showCustomDurations}
        onClose={() => setShowCustomDurations(false)}
        title="Customize Individual Period Durations"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-500">
            Specify unique durations for specific periods (e.g. for assembly, practical labs, or homeroom). Any period not customized will use the default duration of <strong>{currentSchedule.periodDuration} minutes</strong>.
          </p>

          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
            {Array.from({ length: currentSchedule.numPeriods }, (_, i) => i + 1).map(pNum => {
              const customDur = currentSchedule.customPeriodDurations?.[pNum];
              const effectiveDur = customDur || currentSchedule.periodDuration;

              return (
                <div
                  key={pNum}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100"
                >
                  <div>
                    <span className="text-xs font-bold text-gray-800">Period {pNum}</span>
                    <span className="text-[10px] text-gray-400 block">
                      {customDur ? `Custom (${customDur}m)` : `Default (${currentSchedule.periodDuration}m)`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={effectiveDur}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        updateCurrentSchedule(prev => ({
                          ...prev,
                          customPeriodDurations: {
                            ...(prev.customPeriodDurations || {}),
                            [pNum]: val
                          }
                        }));
                      }}
                      className="text-xs border border-gray-200 rounded-lg py-1.5 px-2 bg-white font-medium text-gray-700 outline-none"
                    >
                      <option value={20}>20 Minutes</option>
                      <option value={30}>30 Minutes</option>
                      <option value={35}>35 Minutes</option>
                      <option value={40}>40 Minutes</option>
                      <option value={45}>45 Minutes</option>
                      <option value={50}>50 Minutes</option>
                      <option value={55}>55 Minutes</option>
                      <option value={60}>60 Minutes</option>
                      <option value={75}>75 Minutes</option>
                      <option value={90}>90 Minutes</option>
                    </select>

                    {customDur && (
                      <button
                        type="button"
                        onClick={() => {
                          updateCurrentSchedule(prev => {
                            const next = { ...(prev.customPeriodDurations || {}) };
                            delete next[pNum];
                            return { ...prev, customPeriodDurations: next };
                          });
                        }}
                        className="text-[11px] text-red-500 hover:underline px-2 py-1"
                        title="Reset to default duration"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                updateCurrentSchedule(prev => ({ ...prev, customPeriodDurations: {} }));
                toast.success('All periods reset to default duration');
              }}
              className="text-xs text-gray-500 hover:text-red-600 font-semibold"
            >
              Reset All to Default
            </button>
            <button
              type="button"
              onClick={() => setShowCustomDurations(false)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-md"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal 5: Full Timetable Preview */}
      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title={`Timetable Preview — Class ${cls} (${section})`}
        size="xl"
      >
        <div className="space-y-4">
          {/* Header Summary Card */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div>
              <span className="text-gray-400 font-semibold block text-[10px] uppercase">Class & Section</span>
              <span className="text-gray-800 font-extrabold text-sm">{cls} — Section {section}</span>
            </div>
            <div>
              <span className="text-gray-400 font-semibold block text-[10px] uppercase">Academic Term</span>
              <span className="text-gray-800 font-bold">{academicTerm}</span>
            </div>
            <div>
              <span className="text-gray-400 font-semibold block text-[10px] uppercase">Effective Date</span>
              <span className="text-gray-800 font-bold">{effectiveDate}</span>
            </div>
            <div>
              <span className="text-gray-400 font-semibold block text-[10px] uppercase">Timetable Status</span>
              <span className={`font-bold ${timetableStatus === 'published' ? 'text-green-600' : 'text-amber-600'}`}>
                ● {timetableStatus.toUpperCase()}
              </span>
            </div>
            <div>
              <span className="text-gray-400 font-semibold block text-[10px] uppercase">Timing</span>
              <span className="text-gray-800 font-bold">
                {primaryTimeline.startTimeFormatted} – {primaryTimeline.endTimeFormatted}
              </span>
            </div>
          </div>

          {/* Printable Timetable Grid */}
          <div className="overflow-x-auto border border-gray-200 rounded-xl">
            <table className="w-full text-center border-collapse text-xs">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2.5 border-b border-r border-gray-200 font-bold text-gray-700 w-24">Day</th>
                  {primaryTimeline.timeline.map((slot, i) => (
                    <th key={i} className="p-2.5 border-b border-r border-gray-200 min-w-[90px]">
                      {slot.isBreak ? (
                        <div className="text-gray-600 font-bold">
                          {slot.name}
                          <span className="block text-[9px] font-normal text-gray-500 mt-0.5">{slot.time}</span>
                        </div>
                      ) : (
                        <div className="text-gray-800 font-bold">
                          Period {slot.num}
                          <span className="block text-[9px] font-normal text-gray-500 mt-0.5">{slot.time}</span>
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS.map(day => {
                  const daySched = getScheduleForDay(day, scheduleConfig);

                  return (
                    <tr key={day} className="border-b border-gray-200">
                      <td className="p-2.5 border-r border-gray-200 font-bold text-gray-800 bg-gray-50 text-left">
                        {day}
                      </td>
                      {primaryTimeline.timeline.map((colSlot, i) => {
                        if (colSlot.isBreak) {
                          return (
                            <td key={i} className="border-r border-gray-200 bg-gray-50 p-2 text-gray-400 text-[10px] font-bold">
                              {colSlot.name.toUpperCase()}
                            </td>
                          );
                        }

                        if (colSlot.num > daySched.numPeriods) {
                          return (
                            <td key={i} className="border-r border-gray-200 bg-gray-50/70 p-2 text-gray-400 text-[10px]">
                              —
                            </td>
                          );
                        }

                        const slot = grid[day]?.[colSlot.num];
                        return (
                          <td key={i} className="border-r border-gray-200 p-2">
                            {slot?.subject ? (
                              <div>
                                <div className="font-bold text-gray-800">{slot.subject}</div>
                                {slot.teacher_name && (
                                  <div className="text-[10px] text-gray-500">{slot.teacher_name}</div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-300 italic text-[11px]">Free</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={pdfGenerating}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {pdfGenerating ? 'Generating...' : 'Download PDF'}
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Schedule
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowPreview(false)}
              className="bg-gray-800 hover:bg-gray-900 text-white text-xs font-bold px-5 py-2 rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal 6: Copy Timetable from Another Class / Section */}
      <Modal
        isOpen={showCopyModal}
        onClose={() => setShowCopyModal(false)}
        title="Copy Timetable from Another Class / Section"
      >
        <form onSubmit={handleCopyTimetableSubmit} className="space-y-4">
          <div className="bg-purple-50 p-3.5 rounded-xl border border-purple-100 text-purple-900 text-xs">
            <span className="font-bold block">Destination:</span>
            <span>Class {cls} — Section {section}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Source Class</label>
              <select
                value={copySource.class}
                onChange={e => setCopySource(p => ({ ...p, class: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-500 bg-white font-medium"
              >
                {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Source Section</label>
              <select
                value={copySource.section}
                onChange={e => setCopySource(p => ({ ...p, section: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-500 bg-white font-medium"
              >
                {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-2.5">
            <span className="text-xs font-bold text-gray-700 block">Select What to Copy:</span>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700">
              <input
                type="checkbox"
                checked={copyOptions.copySchedule}
                onChange={e => setCopyOptions(p => ({ ...p, copySchedule: e.target.checked }))}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span>Copy Schedule Structure (Periods, breaks, daily timing)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700">
              <input
                type="checkbox"
                checked={copyOptions.copyAssignments}
                onChange={e => setCopyOptions(p => ({ ...p, copyAssignments: e.target.checked }))}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span>Copy Subject & Teacher Assignments</span>
            </label>
          </div>

          <p className="text-[11px] text-gray-500">
            Note: Copying will apply the source timetable to your current draft. You will still have the opportunity to review and customize it before saving or publishing.
          </p>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={() => setShowCopyModal(false)}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={copying}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {copying ? 'Copying...' : 'Copy Timetable'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
