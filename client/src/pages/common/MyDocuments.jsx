import { useState, useEffect } from 'react';
import API from '../../utils/api';
import toast from 'react-hot-toast';
import Modal from '../../components/common/Modal';

export default function MyDocuments() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Submit modal state
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [file, setFile] = useState(null);
  const [customData, setCustomData] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const res = await API.get('/documents/requests');
      setRequests(res.data.requests || []);
    } catch (err) {
      toast.error('Failed to load document requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRequests(); }, []);

  const handleOpenSubmit = (req) => {
    setSelectedRequest(req);
    setFile(null);
    setCustomData({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      return toast.error('Please select a file to upload');
    }

    // Validate required custom fields
    if (selectedRequest.custom_fields?.length > 0) {
      for (const field of selectedRequest.custom_fields) {
        if (field.required && !customData[field.name]) {
          return toast.error(`Field "${field.name}" is required`);
        }
      }
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('custom_data', JSON.stringify(customData));

      await API.post(`/documents/requests/${selectedRequest.id}/submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success('Document submitted successfully!');
      setSelectedRequest(null);
      loadRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit document');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">My Document Requests</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">Loading requests...</div>
        ) : requests.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-100">
            You have no pending document requests.
          </div>
        ) : (
          requests.map(req => {
            const submission = req.submissions && req.submissions.length > 0 ? req.submissions[0] : null;
            const status = submission ? submission.status : 'missing';
            
            return (
              <div key={req.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col">
                <div className={`absolute top-0 left-0 w-full h-1 ${
                  status === 'approved' ? 'bg-green-500' :
                  status === 'pending' ? 'bg-yellow-500' :
                  status === 'rejected' ? 'bg-red-500' : 'bg-slate-300'
                }`}></div>
                
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-slate-800 text-lg line-clamp-1">{req.title}</h3>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase ${
                    status === 'approved' ? 'bg-green-100 text-green-700' :
                    status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {status}
                  </span>
                </div>
                
                <p className="text-slate-500 text-sm mb-4 line-clamp-2">{req.description}</p>
                
                <div className="space-y-2 text-xs text-slate-600 font-medium mb-5 bg-slate-50 p-3 rounded-lg border border-slate-100 flex-1">
                  <div className="flex justify-between">
                    <span>Format Required:</span>
                    <span className="uppercase text-slate-800 font-bold">{req.document_type}</span>
                  </div>
                  {req.deadline && (
                    <div className="flex justify-between">
                      <span>Deadline:</span>
                      <span className="text-red-500 font-bold">{new Date(req.deadline).toLocaleDateString()}</span>
                    </div>
                  )}
                  {submission?.feedback && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded text-red-600">
                      <strong>Admin Feedback:</strong> {submission.feedback}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-3 border-t border-slate-100 mt-auto">
                  {status === 'approved' ? (
                    <a 
                      href={submission.file_url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex-1 text-center bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg text-sm font-semibold transition-colors"
                    >
                      View Submitted Document
                    </a>
                  ) : (
                    <button 
                      onClick={() => handleOpenSubmit(req)}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors text-white ${
                        status === 'rejected' ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {status === 'rejected' ? 'Re-upload Document' : status === 'pending' ? 'Update Submission' : 'Upload Document'}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Submit Modal */}
      {selectedRequest && (
        <Modal isOpen={!!selectedRequest} onClose={() => setSelectedRequest(null)} title={`Submit: ${selectedRequest.title}`}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <p className="text-sm text-slate-500 mb-4">{selectedRequest.description}</p>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Upload File <span className="text-xs text-slate-400 font-normal ml-1">({(selectedRequest.document_type || 'any').toUpperCase()})</span>
              </label>
              <input 
                type="file" 
                accept={(selectedRequest.document_type || 'any') === 'pdf' ? '.pdf' : (selectedRequest.document_type || 'any') === 'image' ? 'image/*' : '*/*'}
                onChange={(e) => setFile(e.target.files[0])}
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                required
              />
            </div>

            {(() => {
              let fields = [];
              if (selectedRequest.custom_fields) {
                if (typeof selectedRequest.custom_fields === 'string') {
                  try { fields = JSON.parse(selectedRequest.custom_fields); } catch(e) {}
                } else if (Array.isArray(selectedRequest.custom_fields)) {
                  fields = selectedRequest.custom_fields;
                }
              }
              if (!fields || fields.length === 0) return null;
              
              return (
                <div className="space-y-4 pt-4 border-t border-slate-100 mt-4">
                  <h4 className="font-bold text-slate-700 text-sm">Additional Details</h4>
                  {fields.map((field, i) => (
                    <div key={i}>
                      <label className="block text-sm font-semibold text-slate-600 mb-1">
                        {field.name} {field.required && <span className="text-red-500">*</span>}
                      </label>
                      <input 
                        type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                        value={customData[field.name] || ''}
                        onChange={(e) => setCustomData({ ...customData, [field.name]: e.target.value })}
                        required={field.required}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  ))}
                </div>
              );
            })()}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 mt-6">
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-semibold text-sm rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-colors flex items-center gap-2"
              >
                {submitting ? 'Uploading...' : 'Submit Document'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
