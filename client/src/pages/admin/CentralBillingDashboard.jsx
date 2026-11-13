import React, { useState, useEffect } from 'react';
import API from '../../utils/api';
import toast from 'react-hot-toast';

export default function CentralBillingDashboard() {
  const [activeTab, setActiveTab] = useState('subscriptions'); // subscriptions, register, analytics, audit
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterPlan, setFilterPlan] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modals state
  const [chargeModal, setChargeModal] = useState({ open: false, school: null, form: {} });
  const [suspendModal, setSuspendModal] = useState({ open: false, school: null, reason: '', loading: false });
  const [reactivateModal, setReactivateModal] = useState({ open: false, school: null, reason: '', loading: false });
  const [extendModal, setExtendModal] = useState({ open: false, school: null, days: 30, loading: false });
  const [paymentModal, setPaymentModal] = useState({
    open: false,
    school_id: '',
    billing_id: '',
    amount: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    payment_method: 'bank_transfer',
    transaction_ref: '',
    notes: '',
    loading: false,
  });
  const [correctionModal, setCorrectionModal] = useState({
    open: false,
    payment: null,
    amount: '',
    reason: '',
    loading: false,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dashRes, subsRes, logsRes] = await Promise.all([
        API.get('/central-billing/dashboard', {
          params: {
            month: filterMonth,
            year: filterYear,
            school_id: selectedSchool || undefined,
            plan: filterPlan || undefined,
            status: filterStatus || undefined,
          },
        }),
        API.get('/central-billing/subscriptions'),
        API.get('/central-billing/audit-logs'),
      ]);

      if (dashRes.data.success) setDashboardData(dashRes.data);
      if (subsRes.data.success) setSubscriptions(subsRes.data.subscriptions);
      if (logsRes.data.success) setAuditLogs(logsRes.data.logs);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load Central Billing data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterMonth, filterYear, selectedSchool, filterPlan, filterStatus]);

  // Handle Edit Charges submit
  const handleSaveCharges = async (e) => {
    e.preventDefault();
    try {
      const { school, form } = chargeModal;
      const res = await API.put(`/central-billing/subscriptions/${school.school_id}/charges`, form);
      if (res.data.success) {
        toast.success('Subscription charges and terms updated successfully!');
        setChargeModal({ open: false, school: null, form: {} });
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update charges');
    }
  };

  // Handle Remote Suspension
  const handleExecuteSuspension = async () => {
    if (!suspendModal.reason.trim()) {
      toast.error('Suspension reason is required');
      return;
    }
    try {
      setSuspendModal(prev => ({ ...prev, loading: true }));
      const res = await API.post(`/central-billing/subscriptions/${suspendModal.school.school_id}/suspend`, {
        reason: suspendModal.reason.trim(),
      });
      if (res.data.success) {
        toast.success(`School ${suspendModal.school.school_id} suspended. Remote command acknowledged!`);
        setSuspendModal({ open: false, school: null, reason: '', loading: false });
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to suspend school');
      setSuspendModal(prev => ({ ...prev, loading: false }));
    }
  };

  // Handle Remote Reactivation
  const handleExecuteReactivation = async () => {
    try {
      setReactivateModal(prev => ({ ...prev, loading: true }));
      const res = await API.post(`/central-billing/subscriptions/${reactivateModal.school.school_id}/reactivate`, {
        reason: reactivateModal.reason.trim() || 'Payment received and confirmed',
      });
      if (res.data.success) {
        toast.success(`School ${reactivateModal.school.school_id} reactivated. ERP access restored!`);
        setReactivateModal({ open: false, school: null, reason: '', loading: false });
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reactivate school');
      setReactivateModal(prev => ({ ...prev, loading: false }));
    }
  };

  // Handle Extend Validity
  const handleExecuteExtend = async () => {
    try {
      setExtendModal(prev => ({ ...prev, loading: true }));
      const res = await API.post(`/central-billing/subscriptions/${extendModal.school.school_id}/extend`, {
        days: extendModal.days,
      });
      if (res.data.success) {
        toast.success(`Subscription extended by ${extendModal.days} days!`);
        setExtendModal({ open: false, school: null, days: 30, loading: false });
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to extend subscription');
      setExtendModal(prev => ({ ...prev, loading: false }));
    }
  };

  // Handle Record Payment
  const handleSavePayment = async (e) => {
    e.preventDefault();
    try {
      setPaymentModal(prev => ({ ...prev, loading: true }));
      // Ensure invoice exists first
      let billingId = paymentModal.billing_id;
      if (!billingId) {
        const invRes = await API.post(`/central-billing/subscriptions/${paymentModal.school_id}/generate-invoice`, {
          month: paymentModal.month,
          year: paymentModal.year,
        });
        billingId = invRes.data.invoice.billing_id;
      }

      const res = await API.post('/central-billing/payments', {
        school_id: paymentModal.school_id,
        billing_id: billingId,
        amount: paymentModal.amount,
        payment_method: paymentModal.payment_method,
        transaction_ref: paymentModal.transaction_ref,
        notes: paymentModal.notes,
      });

      if (res.data.success) {
        toast.success(`Payment recorded! Remaining balance: $${res.data.balance_remaining}`);
        setPaymentModal({
          open: false,
          school_id: '',
          billing_id: '',
          amount: '',
          month: filterMonth,
          year: filterYear,
          payment_method: 'bank_transfer',
          transaction_ref: '',
          notes: '',
          loading: false,
        });
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to record payment');
      setPaymentModal(prev => ({ ...prev, loading: false }));
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!dashboardData?.school_summaries) return;
    const headers = ['School ID,School Name,Plan,Monthly Charge,Status,Next Due Date,Total Outstanding,Last Payment Date'];
    const rows = dashboardData.school_summaries.map(s =>
      `"${s.school_id}","${s.school_name}","${s.plan}","${s.monthly_charge}","${s.status}","${s.next_due_date || ''}","${s.total_outstanding}","${s.last_payment_date || ''}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Subscription_Billing_Report_${filterYear}_${filterMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Billing report downloaded as CSV');
  };

  const summary = dashboardData?.summary || {};

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Business Billing & ERP Subscriptions</h1>
          <p className="text-sm text-gray-600 mt-1">
            Centralized platform revenue management: track school subscription plans, monthly charges, payment registers, and remote access.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition shadow-sm"
          >
            Export CSV
          </button>
          <button
            onClick={() => setPaymentModal(prev => ({ ...prev, open: true }))}
            className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition shadow-sm"
          >
            + Record Payment
          </button>
        </div>
      </div>

      {/* Distinction & Privacy Assurance Notice */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 flex items-start gap-3">
        <span className="text-amber-600 text-lg flex-shrink-0">💼</span>
        <div className="text-xs text-amber-950 leading-relaxed">
          <strong>Business Subscription Revenue Isolation:</strong> This module manages the software licensing fees that schools pay to us for using our ERP. It operates completely independently of the school's internal finances and <strong>NEVER</strong> collects, stores, or accesses student fees, fee receipts, school bank accounts, or payroll.
        </div>
      </div>

      {/* Period Selectors & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase block">Billing Month</label>
            <select
              value={filterMonth}
              onChange={e => setFilterMonth(parseInt(e.target.value, 10))}
              className="mt-1 text-sm border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {[
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
              ].map((name, idx) => (
                <option key={idx + 1} value={idx + 1}>{name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase block">Billing Year</label>
            <select
              value={filterYear}
              onChange={e => setFilterYear(parseInt(e.target.value, 10))}
              className="mt-1 text-sm border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {[2024, 2025, 2026, 2027, 2028].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase block">Plan Tier</label>
            <select
              value={filterPlan}
              onChange={e => setFilterPlan(e.target.value)}
              className="mt-1 text-sm border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Plans</option>
              <option value="standard">Standard</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase block">Status</label>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="mt-1 text-sm border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="past_due">Past Due</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        <button
          onClick={fetchData}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline"
        >
          Reset Filters
        </button>
      </div>

      {/* Business Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <span className="text-xs font-semibold text-gray-500 uppercase">Total Subscriptions</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-gray-900">{summary.total_connected_schools || 0}</span>
            <span className="text-xs text-emerald-600 font-semibold">{summary.active_subscriptions || 0} Active</span>
          </div>
          <span className="text-xs text-rose-600 font-medium">{summary.suspended_subscriptions || 0} Suspended</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <span className="text-xs font-semibold text-gray-500 uppercase">Monthly Charges Billed</span>
          <div className="mt-2 text-2xl font-bold text-gray-900">
            ${summary.total_charges_selected_month?.toLocaleString() || '0.00'}
          </div>
          <span className="text-xs text-gray-500">For {filterMonth}/{filterYear}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <span className="text-xs font-semibold text-gray-500 uppercase">Payments Received</span>
          <div className="mt-2 text-2xl font-bold text-emerald-600">
            ${summary.total_received_selected_month?.toLocaleString() || '0.00'}
          </div>
          <span className="text-xs text-emerald-700 font-medium">
            {summary.schools_paid_this_month || 0} schools settled
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <span className="text-xs font-semibold text-gray-500 uppercase">Total Outstanding Balance</span>
          <div className="mt-2 text-2xl font-bold text-rose-600">
            ${summary.total_overall_outstanding?.toLocaleString() || '0.00'}
          </div>
          <span className="text-xs text-rose-700 font-medium">
            {summary.schools_overdue_this_month || 0} overdue accounts
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-6 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`pb-3 border-b-2 transition ${
              activeTab === 'subscriptions'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            School Subscriptions & Pricing
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`pb-3 border-b-2 transition ${
              activeTab === 'register'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Monthly Payment Register
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`pb-3 border-b-2 transition ${
              activeTab === 'analytics'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Revenue Analytics & History
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-3 border-b-2 transition ${
              activeTab === 'audit'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Audit Trail
          </button>
        </nav>
      </div>

      {/* TAB 1: School Subscriptions & Pricing */}
      {activeTab === 'subscriptions' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">Connected Schools & Subscription Charges</h3>
            <span className="text-xs text-gray-500">{subscriptions.length} School Subscriptions</span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs font-semibold uppercase">
                <tr>
                  <th className="px-6 py-3 text-left">School ID & Name</th>
                  <th className="px-6 py-3 text-left">Plan Tier</th>
                  <th className="px-6 py-3 text-left">Monthly Charge</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Outstanding</th>
                  <th className="px-6 py-3 text-left">Next Due Date</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {subscriptions.length > 0 ? (
                  subscriptions.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{s.school_name}</div>
                        <div className="text-xs font-mono text-indigo-600">{s.school_id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 capitalize">
                          {s.plan}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">
                          ${s.custom_charge !== null ? s.custom_charge : s.monthly_charge}
                          <span className="text-xs text-gray-400 font-normal"> /mo</span>
                        </div>
                        {s.custom_charge !== null && (
                          <span className="text-[10px] text-amber-600 font-semibold uppercase">Custom Rate</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs rounded-full font-semibold capitalize ${
                          s.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : s.status === 'suspended'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">
                        ${s.summary?.total_outstanding?.toLocaleString() || '0.00'}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-600">
                        {s.next_due_date ? new Date(s.next_due_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setChargeModal({
                              open: true,
                              school: s,
                              form: {
                                plan: s.plan,
                                monthly_charge: s.monthly_charge,
                                custom_charge: s.custom_charge || '',
                                grace_period_days: s.grace_period_days,
                                expiry_date: s.expiry_date || '',
                              },
                            });
                          }}
                          className="px-2.5 py-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition"
                        >
                          Edit Pricing
                        </button>
                        <button
                          onClick={() => setExtendModal({ open: true, school: s, days: 30, loading: false })}
                          className="px-2.5 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition"
                        >
                          Extend
                        </button>
                        {s.status === 'suspended' ? (
                          <button
                            onClick={() => setReactivateModal({ open: true, school: s, reason: '', loading: false })}
                            className="px-3 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition"
                          >
                            Reactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => setSuspendModal({ open: true, school: s, reason: '', loading: false })}
                            className="px-3 py-1 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-md transition"
                          >
                            Suspend
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-400">
                      No school subscriptions configured yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Monthly Payment Register */}
      {activeTab === 'register' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h3 className="text-base font-bold text-gray-900">Record Subscription Payment</h3>
            <p className="text-xs text-gray-500">
              Log payments received for ERP subscription services. Reconciles invoice balance and updates audit log.
            </p>

            <form onSubmit={handleSavePayment} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="lg:col-span-2">
                <label className="text-xs font-semibold text-gray-700 block">Select School</label>
                <select
                  required
                  value={paymentModal.school_id}
                  onChange={e => setPaymentModal(prev => ({ ...prev, school_id: e.target.value }))}
                  className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Choose School...</option>
                  {subscriptions.map(s => (
                    <option key={s.school_id} value={s.school_id}>
                      {s.school_name} ({s.school_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block">Billing Month</label>
                <select
                  value={paymentModal.month}
                  onChange={e => setPaymentModal(prev => ({ ...prev, month: parseInt(e.target.value, 10) }))}
                  className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                    <option key={m} value={m}>Month {m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={paymentModal.amount}
                  onChange={e => setPaymentModal(prev => ({ ...prev, amount: e.target.value }))}
                  className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block">Method</label>
                <select
                  value={paymentModal.payment_method}
                  onChange={e => setPaymentModal(prev => ({ ...prev, payment_method: e.target.value }))}
                  className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="upi">UPI</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="cheque">Cheque</option>
                  <option value="cash">Cash</option>
                  <option value="gateway">Gateway</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block">Transaction Ref</label>
                <input
                  type="text"
                  placeholder="UTR / Ref #"
                  value={paymentModal.transaction_ref}
                  onChange={e => setPaymentModal(prev => ({ ...prev, transaction_ref: e.target.value }))}
                  className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="lg:col-span-6 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={paymentModal.loading}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition shadow-sm disabled:opacity-50"
                >
                  {paymentModal.loading ? 'Recording...' : 'Save Payment Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: Analytics & Revenue History */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-base font-bold text-gray-900 mb-4">6-Month Revenue & Outstanding Trend</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 text-gray-600 text-xs font-semibold uppercase">
                  <tr>
                    <th className="px-6 py-3 text-left">Period</th>
                    <th className="px-6 py-3 text-left">Charges Billed</th>
                    <th className="px-6 py-3 text-left">Payments Collected</th>
                    <th className="px-6 py-3 text-left">Unpaid Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {dashboardData?.month_history?.map((m, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-semibold text-gray-900">{m.label}</td>
                      <td className="px-6 py-3 text-gray-700">${m.charges.toLocaleString()}</td>
                      <td className="px-6 py-3 text-emerald-600 font-bold">${m.received.toLocaleString()}</td>
                      <td className="px-6 py-3 text-rose-600 font-bold">${m.outstanding.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Audit Trail */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">Subscription & Billing Audit Trail</h3>
            <span className="text-xs text-gray-500">{auditLogs.length} Events Logged</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs font-semibold uppercase">
                <tr>
                  <th className="px-6 py-3 text-left">Timestamp</th>
                  <th className="px-6 py-3 text-left">Action</th>
                  <th className="px-6 py-3 text-left">School ID</th>
                  <th className="px-6 py-3 text-left">Reason / Note</th>
                  <th className="px-6 py-3 text-left">Performed By</th>
                  <th className="px-6 py-3 text-left">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-mono text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-3 font-bold text-xs capitalize text-indigo-700">
                      {log.action.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-3 font-mono text-xs text-gray-700">{log.school_id}</td>
                    <td className="px-6 py-3 text-gray-600 text-xs">{log.reason || '-'}</td>
                    <td className="px-6 py-3 text-gray-500 text-xs">{log.performed_by}</td>
                    <td className="px-6 py-3 text-gray-400 font-mono text-xs truncate max-w-xs" title={log.changes}>
                      {log.changes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: Edit Charges & Pricing */}
      {chargeModal.open && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900">
              Edit Subscription Charges: {chargeModal.school.school_name}
            </h3>
            <p className="text-xs text-gray-500">
              Update monthly charges, plan tier, or custom rates. Future billing changes will not alter historical invoices.
            </p>

            <form onSubmit={handleSaveCharges} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block">Subscription Plan</label>
                <select
                  value={chargeModal.form.plan || 'standard'}
                  onChange={e => setChargeModal(prev => ({
                    ...prev,
                    form: { ...prev.form, plan: e.target.value }
                  }))}
                  className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="standard">Standard</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block">Standard Charge ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={chargeModal.form.monthly_charge || ''}
                    onChange={e => setChargeModal(prev => ({
                      ...prev,
                      form: { ...prev.form, monthly_charge: e.target.value }
                    }))}
                    className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 block">Custom / Special Charge ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Leave empty for standard"
                    value={chargeModal.form.custom_charge || ''}
                    onChange={e => setChargeModal(prev => ({
                      ...prev,
                      form: { ...prev.form, custom_charge: e.target.value }
                    }))}
                    className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block">Reason for Pricing Change</label>
                <input
                  type="text"
                  placeholder="e.g. Special promotional rate approved"
                  value={chargeModal.form.reason || ''}
                  onChange={e => setChargeModal(prev => ({
                    ...prev,
                    form: { ...prev.form, reason: e.target.value }
                  }))}
                  className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setChargeModal({ open: false, school: null, form: {} })}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                >
                  Save Charges
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Remote Suspension Confirmation (Section E) */}
      {suspendModal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border-t-4 border-rose-600">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                ⚠️
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Suspend ERP Subscription</h3>
                <span className="text-xs font-mono text-gray-500">{suspendModal.school.school_id}</span>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">School:</span>
                <span className="font-bold text-gray-900">{suspendModal.school.school_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Outstanding Balance:</span>
                <span className="font-bold text-rose-700">${suspendModal.school.summary?.total_outstanding || 0}</span>
              </div>
              <p className="text-rose-800 pt-1 font-medium">
                Sending this command will instantly pause the school's normal ERP access and display the red suspension page. All school data remains 100% intact.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block">
                Suspension Reason <span className="text-rose-600">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="State the official reason (e.g. Overdue subscription payments for Oct-Nov 2026)"
                value={suspendModal.reason}
                onChange={e => setSuspendModal(prev => ({ ...prev, reason: e.target.value }))}
                className="mt-1 w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                disabled={suspendModal.loading}
                onClick={() => setSuspendModal({ open: false, school: null, reason: '', loading: false })}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={suspendModal.loading}
                onClick={handleExecuteSuspension}
                className="px-5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm disabled:opacity-50"
              >
                {suspendModal.loading ? 'Issuing Command...' : 'Confirm Remote Suspension'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Remote Reactivation Confirmation (Section G) */}
      {reactivateModal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border-t-4 border-emerald-600">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                ✓
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Reactivate School ERP</h3>
                <span className="text-xs font-mono text-gray-500">{reactivateModal.school.school_id}</span>
              </div>
            </div>

            <p className="text-xs text-gray-600">
              This will send an authenticated remote reactivation command to <strong>{reactivateModal.school.school_name}</strong> and immediately restore normal user access.
            </p>

            <div>
              <label className="text-xs font-semibold text-gray-700 block">Reactivation Note / Reason</label>
              <input
                type="text"
                placeholder="e.g. Outstanding payments settled via bank transfer"
                value={reactivateModal.reason}
                onChange={e => setReactivateModal(prev => ({ ...prev, reason: e.target.value }))}
                className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                disabled={reactivateModal.loading}
                onClick={() => setReactivateModal({ open: false, school: null, reason: '', loading: false })}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={reactivateModal.loading}
                onClick={handleExecuteReactivation}
                className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm disabled:opacity-50"
              >
                {reactivateModal.loading ? 'Issuing Reactivation...' : 'Confirm Reactivation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Extend Validity */}
      {extendModal.open && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Extend Subscription Validity</h3>
            <div>
              <label className="text-xs font-semibold text-gray-700 block">Additional Days</label>
              <input
                type="number"
                min="1"
                value={extendModal.days}
                onChange={e => setExtendModal(prev => ({ ...prev, days: parseInt(e.target.value, 10) }))}
                className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setExtendModal({ open: false, school: null, days: 30, loading: false })}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={extendModal.loading}
                onClick={handleExecuteExtend}
                className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {extendModal.loading ? 'Extending...' : 'Extend Validity'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
