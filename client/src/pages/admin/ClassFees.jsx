import { useEffect, useMemo, useState } from 'react';
import API from '../../utils/api';
import { CLASSES } from '../../constants/roles';
import { formatCurrency } from '../../utils/helpers';
import toast from 'react-hot-toast';

const DEFAULT_ROW = {
  class: CLASSES[0],
  monthly_fee: 0,
  admission_fee: 0,
};

export default function ClassFees() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingClass, setSavingClass] = useState('');
  const [newRow, setNewRow] = useState(DEFAULT_ROW);

  const configuredClasses = useMemo(() => new Set(rows.map((row) => row.class)), [rows]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await API.get('/class-fees');
      setRows(
        (res.data || []).map((row) => ({
          ...row,
          monthly_fee: Number(row.monthly_fee || 0),
          admission_fee: Number(row.admission_fee || 0),
        }))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load class fees.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateRow = (className, key, value) => {
    setRows((prev) =>
      prev.map((row) =>
        row.class === className ? { ...row, [key]: Number(value) || 0 } : row
      )
    );
  };

  const saveExisting = async (row) => {
    setSavingClass(row.class);
    try {
      await API.put(`/class-fees/${encodeURIComponent(row.class)}`, {
        monthly_fee: row.monthly_fee,
        admission_fee: row.admission_fee,
      });
      toast.success(`Class fee updated for ${row.class}.`);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save class fee.');
    } finally {
      setSavingClass('');
    }
  };

  const saveNew = async () => {
    setSavingClass(newRow.class);
    try {
      await API.post('/class-fees', newRow);
      toast.success(`Class fee added for ${newRow.class}.`);
      await load();

      const nextClass = CLASSES.find((className) => !configuredClasses.has(className) && className !== newRow.class) || CLASSES[0];
      setNewRow({ ...DEFAULT_ROW, class: nextClass });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add class fee.');
    } finally {
      setSavingClass('');
    }
  };

  const fieldClass = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 bg-white';
  const availableClasses = CLASSES.filter((className) => !configuredClasses.has(className) || className === newRow.class);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-gray-800">Class Fees</h2>
        <p className="text-gray-400 text-sm mt-0.5">Configure monthly and admission fees for each class.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Configured Classes</h3>
        </div>

        {loading ? (
          <p className="text-center py-10 text-gray-400 text-sm">Loading class fees...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: '720px' }}>
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Class', 'Monthly Fee', 'Admission Fee', 'Preview', 'Action'].map((heading) => (
                    <th key={heading} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-gray-400 text-sm">
                      No class fees configured yet.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.class} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-medium text-gray-800 whitespace-nowrap">{row.class}</td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          min={0}
                          value={row.monthly_fee}
                          onChange={(e) => updateRow(row.class, 'monthly_fee', e.target.value)}
                          className={fieldClass}
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          min={0}
                          value={row.admission_fee}
                          onChange={(e) => updateRow(row.class, 'admission_fee', e.target.value)}
                          className={fieldClass}
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1 text-xs text-gray-500">
                          <p>Monthly: {formatCurrency(row.monthly_fee)}</p>
                          <p>Admission: {formatCurrency(row.admission_fee)}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => saveExisting(row)}
                          disabled={savingClass === row.class}
                          className="bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
                        >
                          {savingClass === row.class ? 'Saving...' : 'Save'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700">Add New Class Fee</h3>
          <p className="text-xs text-gray-400 mt-0.5">Create a new class fee configuration.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Class</label>
            <select
              value={newRow.class}
              onChange={(e) => setNewRow((prev) => ({ ...prev, class: e.target.value }))}
              className={fieldClass}
            >
              {availableClasses.map((className) => (
                <option key={className} value={className}>
                  {className}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Monthly Fee</label>
            <input
              type="number"
              min={0}
              value={newRow.monthly_fee}
              onChange={(e) => setNewRow((prev) => ({ ...prev, monthly_fee: Number(e.target.value) || 0 }))}
              className={fieldClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Admission Fee</label>
            <input
              type="number"
              min={0}
              value={newRow.admission_fee}
              onChange={(e) => setNewRow((prev) => ({ ...prev, admission_fee: Number(e.target.value) || 0 }))}
              className={fieldClass}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={saveNew}
              disabled={savingClass === newRow.class || availableClasses.length === 0}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
            >
              {savingClass === newRow.class ? 'Saving...' : 'Add Class'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
