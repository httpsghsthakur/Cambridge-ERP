/**
 * Shared helpers for scoping attendance to academic sessions and building
 * session-wise & class-wise comparison summaries from live rows and promotion snapshots.
 */

const calcAttendanceStats = (rows = []) => {
  const present = rows.filter((r) => r.status === 'present').length;
  const late    = rows.filter((r) => r.status === 'late').length;
  const holiday = rows.filter((r) => r.status === 'holiday').length;
  const total   = rows.filter((r) => r.status !== 'holiday').length;
  return {
    present,
    late,
    holiday,
    absent: Math.max(0, total - present - late),
    total,
    percentage: total ? Math.round(((present + late) / total) * 100) : 0,
  };
};

const resolveRowSessionId = (row, allSessions = []) => {
  if (row.session_id != null) return String(row.session_id);
  const d = String(row.date || '');
  const match = allSessions.find(
    (s) => s.start_date && s.end_date && d >= String(s.start_date) && d <= String(s.end_date)
  );
  return match ? String(match.id) : null;
};

const buildStudentSessionAttendance = ({
  student,
  allSessions = [],
  allRecords = [],
  promotions = [],
}) => {
  const activeSession = allSessions.find((s) => s.is_active) || null;
  const currentSessionId = student?.session_id || activeSession?.id || null;
  const sessionById = new Map(allSessions.map((s) => [String(s.id), s]));

  const rowsBySession = new Map();
  for (const r of allRecords) {
    const sid = resolveRowSessionId(r, allSessions) || 'unassigned';
    if (!rowsBySession.has(sid)) rowsBySession.set(sid, []);
    rowsBySession.get(sid).push(r);
  }

  const comparisonMap = new Map();

  for (const ph of promotions) {
    const sidKey = ph.from_session ? String(ph.from_session) : `promo_${ph.id}`;
    const sessObj = sessionById.get(sidKey);
    const liveRows = rowsBySession.get(sidKey) || [];
    const liveStats = calcAttendanceStats(liveRows);
    const useLive = liveRows.length > 0;

    comparisonMap.set(sidKey, {
      session_id:   sessObj?.id ?? (Number(ph.from_session) || null),
      session_name: ph.from_session_name || sessObj?.name || `Session #${ph.from_session}`,
      start_date:   sessObj?.start_date || null,
      end_date:     sessObj?.end_date || null,
      class_name:   ph.from_class || liveRows[0]?.class || '',
      section:      ph.from_section || liveRows[0]?.section || '',
      present:      useLive ? liveStats.present : Number(ph.attendance_present || 0),
      absent:       useLive ? liveStats.absent  : Number(ph.attendance_absent || 0),
      late:         useLive ? liveStats.late    : Number(ph.attendance_late || 0),
      holiday:      useLive ? liveStats.holiday : Number(ph.attendance_holiday || 0),
      total:        useLive ? liveStats.total   : Number(ph.attendance_working_days || 0),
      percentage:   useLive ? liveStats.percentage : Math.round(Number(ph.attendance_percentage || 0)),
      is_current:   currentSessionId != null && String(sessObj?.id) === String(currentSessionId),
      is_archived:  Boolean(sessObj?.is_archived),
      is_promoted:  true,
    });
  }

  for (const [sidKey, rowsList] of rowsBySession.entries()) {
    if (sidKey === 'unassigned' || comparisonMap.has(sidKey)) continue;
    const sessObj = sessionById.get(sidKey);
    const st = calcAttendanceStats(rowsList);
    comparisonMap.set(sidKey, {
      session_id:   sessObj?.id ?? (Number(sidKey) || null),
      session_name: sessObj?.name || `Session #${sidKey}`,
      start_date:   sessObj?.start_date || null,
      end_date:     sessObj?.end_date || null,
      class_name:   rowsList[0]?.class || student?.class || '',
      section:      rowsList[0]?.section || student?.section || '',
      ...st,
      is_current:   currentSessionId != null && sidKey === String(currentSessionId),
      is_archived:  Boolean(sessObj?.is_archived),
      is_promoted:  false,
    });
  }

  if (currentSessionId != null && !comparisonMap.has(String(currentSessionId))) {
    const currSessObj = sessionById.get(String(currentSessionId));
    comparisonMap.set(String(currentSessionId), {
      session_id:   currSessObj?.id ?? Number(currentSessionId),
      session_name: currSessObj?.name || `Session #${currentSessionId}`,
      start_date:   currSessObj?.start_date || null,
      end_date:     currSessObj?.end_date || null,
      class_name:   student?.class || '',
      section:      student?.section || '',
      present:      0,
      absent:       0,
      late:         0,
      holiday:      0,
      total:        0,
      percentage:   0,
      is_current:   true,
      is_archived:  Boolean(currSessObj?.is_archived),
      is_promoted:  false,
    });
  }

  const sessionComparison = Array.from(comparisonMap.values()).sort((a, b) => {
    if (a.start_date && b.start_date) return String(a.start_date).localeCompare(String(b.start_date));
    return Number(a.session_id || 0) - Number(b.session_id || 0);
  });

  return {
    activeSession,
    currentSessionId,
    rowsBySession,
    sessionComparison,
  };
};

module.exports = {
  calcAttendanceStats,
  resolveRowSessionId,
  buildStudentSessionAttendance,
};

