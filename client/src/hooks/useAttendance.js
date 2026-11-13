import { useState, useCallback } from 'react';
import API from '../utils/api';
import toast from 'react-hot-toast';

export const useAttendance = () => {
  const [records, setRecords]                     = useState([]);
  const [stats, setStats]                         = useState({});
  const [sessionStats, setSessionStats]           = useState(null);
  const [currentSessionId, setCurrentSessionId]   = useState(null);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [sessionComparison, setSessionComparison] = useState([]);
  const [sessions, setSessions]                   = useState([]);
  const [loading, setLoading]                     = useState(false);

  const fetchStudentAttendance = useCallback(async (studentId, month, year, sessionId) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (month) params.set('month', month);
      if (year) params.set('year', year);
      if (sessionId !== undefined && sessionId !== null && sessionId !== '') {
        params.set('session_id', sessionId);
      }
      const query = params.toString();
      const res = await API.get(`/attendance/student/${studentId}${query ? `?${query}` : ''}`);
      setRecords(res.data.records || []);
      setStats(res.data.stats || {});
      setSessionStats(res.data.sessionStats || res.data.stats || null);
      setCurrentSessionId(res.data.currentSessionId ?? null);
      setSelectedSessionId(res.data.selectedSessionId ?? null);
      setSessionComparison(res.data.sessionComparison || []);
      setSessions(res.data.sessions || []);
      return res.data;
    } catch {
      toast.error('Failed to load attendance.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchClassAttendance = useCallback(async (cls, section, date) => {
    setLoading(true);
    try {
      const res = await API.get(`/attendance/class?class=${cls}&section=${section}&date=${date}`);
      setRecords(res.data || []);
    } catch {
      toast.error('Failed to load class attendance.');
    } finally {
      setLoading(false);
    }
  }, []);

  const saveBulkAttendance = async (cls, section, date, attendanceMap, sessionId) => {
    const payloadRecords = Object.entries(attendanceMap).map(([student_id, status]) => ({
      student_id: parseInt(student_id, 10),
      status,
    }));
    await API.post('/attendance/bulk', {
      class: cls,
      section,
      date,
      records: payloadRecords,
      session_id: sessionId,
    });
  };

  return {
    records,
    stats,
    sessionStats,
    currentSessionId,
    selectedSessionId,
    sessionComparison,
    sessions,
    loading,
    fetchStudentAttendance,
    fetchClassAttendance,
    saveBulkAttendance,
  };
};
