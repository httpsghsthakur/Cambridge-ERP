import { useState, useEffect, useCallback } from 'react';
import API from '../utils/api';
import toast from 'react-hot-toast';

export const useFees = (filters = {}) => {
  const [fees, setFees]       = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
      const res = await API.get(`/fees?${params}`);
      const data = res.data || [];
      setFees(data);

      const total     = data.reduce((a, f) => a + parseFloat(f.total_amount || 0), 0);
      const collected = data.reduce((a, f) => a + parseFloat(f.paid_amount  || 0), 0);
      setSummary({
        total, collected,
        pending:      total - collected,
        paid_count:   data.filter(f => f.status === 'paid').length,
        unpaid_count: data.filter(f => f.status === 'unpaid').length,
        partial_count:data.filter(f => f.status === 'partial').length,
        rate:         total > 0 ? Math.round((collected / total) * 100) : 0,
      });
    } catch {
      toast.error('Failed to load fees.');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => { fetch(); }, [fetch]);

  const collectFee = async (feeId, amount, paymentMode, remarks) => {
    const res = await API.post('/fees/collect', { fee_id: feeId, amount, payment_mode: paymentMode, remarks });
    await fetch();
    return res.data;
  };

  const generateFees = async (month, year, feeStructure, sessionId) => {
    const res = await API.post('/fees/generate', { month, year, fee_structure: feeStructure, session_id: sessionId });
    await fetch();
    return res.data;
  };

  return { fees, summary, loading, refetch: fetch, collectFee, generateFees };
};