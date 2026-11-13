import { useState } from 'react';

export default function DocumentRequestForm({ onSubmit, loading }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    document_type: 'any',
    recipient_type: 'everyone',
    recipients: [],
    custom_fields: []
  });

  // Basic custom field manager
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');
  const [newFieldRequired, setNewFieldRequired] = useState(true);

  const addCustomField = () => {
    if (!newFieldName.trim()) return;
    const newField = {
      name: newFieldName.trim(),
      type: newFieldType,
      required: newFieldRequired
    };
    setFormData(prev => ({
      ...prev,
      custom_fields: [...prev.custom_fields, newField]
    }));
    setNewFieldName('');
  };

  const removeCustomField = (index) => {
    setFormData(prev => ({
      ...prev,
      custom_fields: prev.custom_fields.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">Request Title</label>
        <input
          type="text"
          value={formData.title}
          onChange={e => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          required
          placeholder="e.g. Aadhaar Card Upload"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
        <textarea
          value={formData.description}
          onChange={e => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          rows="3"
          placeholder="Detailed instructions for the user..."
        ></textarea>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Document Format</label>
          <select
            value={formData.document_type}
            onChange={e => setFormData({ ...formData, document_type: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="any">Any (Image/PDF/Doc)</option>
            <option value="pdf">PDF Only</option>
            <option value="image">Image Only (JPG/PNG)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Send To</label>
          <select
            value={formData.recipient_type}
            onChange={e => setFormData({ ...formData, recipient_type: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="everyone">Everyone</option>
            <option value="all_students">All Students</option>
            <option value="all_teachers">All Teachers</option>
          </select>
        </div>
      </div>

      {/* Custom Fields Builder */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <h4 className="text-sm font-bold text-slate-700 mb-3">Custom Form Fields (Optional)</h4>
        
        {formData.custom_fields.length > 0 && (
          <div className="space-y-2 mb-4">
            {formData.custom_fields.map((f, i) => (
              <div key={i} className="flex items-center justify-between bg-white border border-slate-200 px-3 py-2 rounded-lg text-sm">
                <div>
                  <span className="font-semibold">{f.name}</span> 
                  <span className="text-xs text-slate-500 ml-2 uppercase">({f.type})</span>
                  {f.required && <span className="text-xs text-red-500 ml-2 font-bold">*Required</span>}
                </div>
                <button type="button" onClick={() => removeCustomField(i)} className="text-red-500 hover:text-red-700 text-xs font-bold">Remove</button>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          <input 
            type="text" 
            placeholder="Field Name (e.g. ID Number)"
            value={newFieldName}
            onChange={e => setNewFieldName(e.target.value)}
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
          <select 
            value={newFieldType}
            onChange={e => setNewFieldType(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          >
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="date">Date</option>
          </select>
          <label className="flex items-center gap-1 text-sm font-semibold text-slate-600">
            <input 
              type="checkbox" 
              checked={newFieldRequired}
              onChange={e => setNewFieldRequired(e.target.checked)}
              className="rounded"
            />
            Required
          </label>
          <button 
            type="button" 
            onClick={addCustomField}
            className="bg-slate-800 text-white px-3 py-2 rounded-lg text-sm font-bold ml-auto"
          >
            Add Field
          </button>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-200">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? 'Creating...' : 'Create Request'}
        </button>
      </div>
    </form>
  );
}
