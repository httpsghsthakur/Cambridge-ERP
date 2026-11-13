import { useState, useEffect, useCallback } from 'react';
import API from '../utils/api';
import toast from 'react-hot-toast';

export const useStudents = (filters = {}) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [total, setTotal]       = useState(0);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
      const res = await API.get(`/students?${params}`);
      setStudents(res.data.students || []);
      setTotal(res.data.total || 0);
    } catch {
      toast.error('Failed to load students.');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => { fetch(); }, [fetch]);

  const addStudent = async (data) => {
    const res = await API.post('/students', data);
    await fetch();
    return res.data;
  };

  const updateStudent = async (id, data) => {
    const res = await API.put(`/students/${id}`, data);
    await fetch();
    return res.data;
  };

  const deleteStudent = async (id) => {
    await API.delete(`/students/${id}`);
    await fetch();
  };

  return { students, loading, total, refetch: fetch, addStudent, updateStudent, deleteStudent };
};