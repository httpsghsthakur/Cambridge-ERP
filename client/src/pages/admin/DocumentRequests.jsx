import { useState, useEffect } from 'react';
import API from '../../utils/api';
import toast from 'react-hot-toast';
import Modal from '../../components/common/Modal';
import DocumentRequestForm from '../../components/forms/DocumentRequestForm';

export default function DocumentRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Submissions modal state
  const [viewRequest, setViewRequest] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

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

  const handleSubmit = async (data) => {
    setSaving(true);
    try {
      await API.post('/documents/requests', data);
      toast.success('Document request created successfully!');
      setShowModal(false);
      loadRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create request');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this request? Submissions will also be deleted.')) return;
    try {
      await API.delete(`/documents/requests/${id}`);
      toast.success('Deleted successfully');
      loadRequests();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const handleCloseRequest = async (request) => {
    try {
      const newStatus = request.status === 'active' ? 'closed' : 'active';
      await API.put(`/documents/requests/${request.id}`, { status: newStatus });
      toast.success(`Request marked as ${newStatus}`);
      loadRequests();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const openSubmissions = async (request) => {
    setViewRequest(request);
    try {
      setLoadingSubmissions(true);
      const res = await API.get(`/documents/requests/${request.id}/submissions`);
      setSubmissions(res.data.submissions || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load submissions');
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const updateSubmissionStatus = async (subId, status, feedback) => {
    try {
      await API.put(`/documents/submissions/${subId}`, { status, feedback });
      toast.success('Status updated');
      // Update local state
      setSubmissions(prev => prev.map(s => s.id === subId ? { ...s, status, feedback } : s));
    } catch (err) {
      toast.error('Failed to update submission');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Document Requests</h1>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm shadow-blue-500/20"
        >
          + New Request
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">Loading requests...</div>
        ) : requests.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-100">
            No document requests found. Create one to get started.
          </div>
        ) : (
          requests.map(req => (
            <div key={req.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col">
              <div className={`absolute top-0 left-0 w-full h-1 ${req.status === 'active' ? 'bg-green-500' : 'bg-slate-300'}`}></div>
              
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-slate-800 text-lg line-clamp-1">{req.title}</h3>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase ${req.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                  {req.status}
                </span>
              </div>
              
              <p className="text-slate-500 text-sm mb-4 line-clamp-2 flex-1">{req.description}</p>
              
              <div className="space-y-2 text-xs text-slate-600 font-medium mb-5 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="flex justify-between">
                  <span>To:</span>
                  <span className="capitalize">{req.recipient_type.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Format:</span>
                  <span className="uppercase">{req.document_type}</span>
                </div>
                {req.deadline && (
                  <div className="flex justify-between">
                    <span>Deadline:</span>
                    <span className="text-red-500">{new Date(req.deadline).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Custom Fields:</span>
                  <span>{req.custom_fields?.length || 0}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100 mt-auto">
                <button 
                  onClick={() => openSubmissions(req)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  View Submissions
                </button>
                <button 
                  onClick={() => handleCloseRequest(req)}
                  title={req.status === 'active' ? 'Close Request' : 'Reopen Request'}
                  className="px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                >
                  {req.status === 'active' ? '🛑' : '✅'}
                </button>
                <button 
                  onClick={() => handleDelete(req.id)}
                  title="Delete Request"
                  className="px-3 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Request Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Document Request">
        <DocumentRequestForm onSubmit={handleSubmit} loading={saving} />
      </Modal>

      {/* View Submissions Modal */}
      {viewRequest && (
        <Modal isOpen={!!viewRequest} onClose={() => setViewRequest(null)} title={`Submissions: ${viewRequest.title}`} size="xl">
          <div className="max-h-[70vh] overflow-y-auto -mx-6 px-6">
            {loadingSubmissions ? (
              <div className="py-8 text-center text-slate-500">Loading...</div>
            ) : submissions.length === 0 ? (
              <div className="py-8 text-center text-slate-500">No submissions yet.</div>
            ) : (
              <div className="space-y-4 pb-4">
                {submissions.map(sub => {
                  let customDataObj = {};
                  if (sub.custom_data) {
                    if (typeof sub.custom_data === 'string') {
                      try {
                        customDataObj = JSON.parse(sub.custom_data);
                      } catch (e) {
                        customDataObj = {};
                      }
                    } else if (typeof sub.custom_data === 'object') {
                      customDataObj = sub.custom_data;
                    }
                  }

                  return (
                    <div key={sub.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
                        <div>
                          <div className="font-bold text-slate-800">{sub.user?.name}</div>
                          <div className="text-xs text-slate-500 capitalize">{sub.user?.role} • {sub.user?.email || sub.user?.username}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase ${
                            sub.status === 'approved' ? 'bg-green-100 text-green-700' :
                            sub.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {sub.status}
                          </span>
                          <a 
                            href={sub.file_url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1.5 rounded-md text-xs font-bold transition-colors"
                          >
                            View File
                          </a>
                        </div>
                      </div>
                      
                      {/* Custom Data Answers */}
                      {Object.keys(customDataObj || {}).length > 0 && (
                        <div className="bg-white border border-slate-100 rounded-lg p-3 mb-4">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Form Data</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                            {Object.entries(customDataObj).map(([key, val]) => (
                              <div key={key}>
                                <span className="text-xs font-semibold text-slate-700 block">{key}:</span>
                                <span className="text-sm text-slate-600">{val || '-'}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Action Panel */}
                    <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200">
                      <button 
                        onClick={() => updateSubmissionStatus(sub.id, 'approved', sub.feedback)}
                        disabled={sub.status === 'approved'}
                        className="px-3 py-1.5 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-xs font-bold rounded-md transition-colors"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => {
                          const fb = window.prompt('Enter rejection reason/feedback:', sub.feedback || '');
                          if (fb !== null) {
                            updateSubmissionStatus(sub.id, 'rejected', fb);
                          }
                        }}
                        className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-md transition-colors"
                      >
                        Reject...
                      </button>
                      {sub.feedback && (
                        <p className="text-xs text-red-500 my-auto ml-2 flex-1 line-clamp-1" title={sub.feedback}>
                          Feedback: {sub.feedback}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
