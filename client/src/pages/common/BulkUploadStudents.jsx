import { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

export default function BulkUploadStudents() {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const fileRef = useRef(null);

  // Download template CSV
  const downloadTemplate = () => {
    const csvContent = 
      "First Name,Last Name,Class,Section,Roll Number,Gender,Date of Birth,Parent Name,Parent Phone,Parent Email,Parent Address,Email,Password\n" +
      "Aarav,Sharma,5th,A,12,Male,2015-05-15,Rakesh Sharma,9876543210,rakesh@example.com,Kishtwar Jammu,aarav5a@school.com,studentA\n" +
      "Diya,Patel,6th,B,5,Female,2014-08-20,Suresh Patel,9123456789,suresh@example.com,Kishtwar Jammu,,";
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "student_bulk_upload_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parse Excel/CSV locally for preview
  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const fileExt = selectedFile.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(fileExt)) {
      toast.error('Invalid file type. Please upload an Excel (.xlsx/.xls) or CSV file.');
      return;
    }

    setFile(selectedFile);
    setResults(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (json.length === 0) {
          toast.error('The uploaded file is empty.');
          resetUpload();
          return;
        }

        // Extract headers from first row keys
        const firstRow = json[0];
        setHeaders(Object.keys(firstRow));
        setPreviewData(json.slice(0, 5)); // show first 5 rows in preview
      } catch (err) {
        toast.error('Failed to parse file preview.');
        resetUpload();
      }
    };
    reader.readAsBinaryString(selectedFile);
  };

  const resetUpload = () => {
    setFile(null);
    setPreviewData([]);
    setHeaders([]);
    if (fileRef.current) fileRef.current.value = '';
  };

  // Upload to Backend
  const handleUploadSubmit = async () => {
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await API.post('/students/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success(data.message || 'Bulk upload completed successfully!');
      setResults(data);
      resetUpload();
    } catch (err) {
      const errorResponse = err.response?.data;
      if (errorResponse?.errors && errorResponse.errors.length > 0) {
        toast.error(errorResponse.message || 'Bulk upload encountered errors.');
        setResults(errorResponse);
        resetUpload();
      } else {
        toast.error(errorResponse?.message || 'Bulk upload failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Export generated credentials to CSV
  const exportCredentials = () => {
    if (!results || !results.credentials || results.credentials.length === 0) return;

    let csvContent = "Student ID,Name,Login Username/Email,Temporary Password,Status\n";
    results.credentials.forEach(row => {
      csvContent += `"${row.student_id}","${row.name}","${row.email}","${row.password}","${row.status}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "student_login_credentials.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isApproved = ['admin', 'admin2'].includes(user?.role);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-card relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Bulk Student Admission</h2>
          <p className="text-slate-400 text-xs mt-1 font-semibold">
            Upload student records in bulk using Excel or CSV templates. 
            {isApproved 
              ? ' Uploaded students will be automatically created with active login accounts and fee sheets.' 
              : ' Uploaded students will be registered as pending admission requests awaiting admin approval.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Selector & Help */}
        <div className="space-y-6 lg:col-span-1">
          {/* File Picker Card */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-card flex flex-col items-center text-center">
            <h3 className="text-sm font-extrabold text-slate-700 w-full text-left mb-4">Select Spreadsheet</h3>
            
            <div 
              onClick={() => fileRef.current?.click()}
              className="w-full py-8 border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-2xl cursor-pointer bg-slate-50/50 hover:bg-blue-50/10 transition-all flex flex-col items-center justify-center gap-2 group"
            >
              <div className="w-12 h-12 bg-white rounded-xl shadow-md border border-slate-100 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform duration-300">
                
              </div>
              <p className="text-xs font-bold text-slate-600 mt-1">
                {file ? file.name : "Drag & Drop or click to browse"}
              </p>
              <p className="text-[10px] text-slate-400 font-semibold">Supports .xlsx, .xls, .csv</p>
            </div>
            
            <input 
              ref={fileRef}
              type="file" 
              accept=".xlsx,.xls,.csv" 
              className="hidden" 
              onChange={handleFileChange}
            />

            {file && (
              <div className="w-full flex gap-2 mt-4">
                <button
                  onClick={resetUpload}
                  className="flex-1 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-500 border border-slate-200 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadSubmit}
                  disabled={loading}
                  className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white py-2.5 shadow-lg shadow-blue-500/10 active:scale-95 disabled:opacity-60 transition-all"
                >
                  {loading ? 'Processing...' : 'Upload & Process'}
                </button>
              </div>
            )}
          </div>

          {/* Template Download Card */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-card">
            <h3 className="text-sm font-extrabold text-slate-700 mb-3 flex items-center gap-2">
              <span></span> Excel Template Guide
            </h3>
            <p className="text-[11px] font-semibold text-slate-500 leading-relaxed mb-4">
              To ensure data maps correctly, download our pre-formatted CSV template. Required fields are: Name (or First Name), Class, Parent Name, and Parent Phone.
            </p>
            <button
              onClick={downloadTemplate}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50/50 hover:bg-blue-50 text-xs font-bold text-blue-600 py-3 transition-colors"
            >
               Download Excel/CSV Template
            </button>
          </div>
        </div>

        {/* Right Column: Previews & Success Dashboard */}
        <div className="lg:col-span-2 space-y-6">
          {/* Loader */}
          {loading && (
            <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-card flex flex-col items-center justify-center gap-3 min-h-[300px]">
              <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Parsing & Registering Students...</p>
              <p className="text-[10px] text-slate-400 font-semibold">Creating accounts, generating IDs, and syncing billing details.</p>
            </div>
          )}

          {/* Step 1: Pre-Upload Preview */}
          {!loading && file && previewData.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-card space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <h3 className="text-sm font-extrabold text-slate-800">Preview: Excel Rows Detected</h3>
                <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-100">
                  Showing first {previewData.length} entries
                </span>
              </div>
              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {headers.slice(0, 6).map((h) => (
                        <th key={h} className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-4 py-3">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors text-xs font-bold text-slate-600">
                        {headers.slice(0, 6).map((h) => (
                          <td key={h} className="px-4 py-3 truncate max-w-[150px]">
                            {row[h] !== undefined ? String(row[h]) : '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-[11px] font-semibold text-amber-800 flex gap-2">
                <span>ℹ️</span>
                <p>
                  Review the headers above. The system automatically reconciles synonyms like "Student Name" vs "First Name", "fathername" vs "Parent Name", and auto-assigns active academic sessions.
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Processing Results Summary Dashboard */}
          {!loading && results && (
            <div className="space-y-6">
              {/* Summary Stats Banner */}
              <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-card grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Uploaded</p>
                  <p className="text-xl font-extrabold text-slate-800 mt-1">{results.successCount || 0}</p>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Errors/Skipped</p>
                  <p className={`text-xl font-extrabold mt-1 ${results.failedCount ? 'text-red-500' : 'text-slate-800'}`}>
                    {results.failedCount || 0}
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center col-span-2 md:col-span-1">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Status</p>
                  <p className="text-xs font-extrabold text-emerald-600 mt-2 flex items-center justify-center gap-1">
                    <span></span> {isApproved ? 'Accounts Active' : 'Staged (Pending)'}
                  </p>
                </div>
              </div>

              {/* Validation Failures details */}
              {results.errors && results.errors.length > 0 && (
                <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-card">
                  <h3 className="text-sm font-extrabold text-red-600 mb-3 flex items-center gap-2">
                    <span>⚠️</span> Validation Issues Detected (Rows Skipped)
                  </h3>
                  <div className="max-h-40 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                    {results.errors.map((err, idx) => (
                      <div key={idx} className="bg-red-50/50 border border-red-100 rounded-xl p-3 text-[11px] font-semibold text-red-800 flex justify-between">
                        <span>Row {err.row}: {err.message}</span>
                        <span className="text-[9px] font-extrabold uppercase bg-red-100 px-2 py-0.5 rounded text-red-700 self-center">Failed</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Login Credentials Table */}
              {results.credentials && results.credentials.length > 0 && (
                <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-card space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-800">Generated Student Credentials</h3>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Please export and save these details immediately.</p>
                    </div>
                    <button
                      onClick={exportCredentials}
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white px-4 py-2.5 shadow-lg shadow-emerald-500/10 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                    >
                       Download Credentials (CSV)
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-100">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-4 py-3">Student ID</th>
                          <th className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-4 py-3">Name</th>
                          <th className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-4 py-3">Username/Email</th>
                          <th className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-4 py-3">Temporary Password</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {results.credentials.map((cred, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 transition-colors text-xs font-bold text-slate-600">
                            <td className="px-4 py-3 font-mono text-slate-700">{cred.student_id}</td>
                            <td className="px-4 py-3">{cred.name}</td>
                            <td className="px-4 py-3 text-blue-600">{cred.email}</td>
                            <td className="px-4 py-3 font-mono bg-slate-50/30 text-slate-800 font-bold">{cred.password}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 0: Blank State / Instructions */}
          {!loading && !file && !results && (
            <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-card flex flex-col items-center justify-center text-center gap-4 min-h-[350px]">
              <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center text-3xl">
                
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-800">No Spreadsheet Selected</h3>
                <p className="text-slate-400 text-xs font-semibold mt-1.5 max-w-sm mx-auto">
                  Drag in your class list spreadsheet or use our Excel picker. We will scan your headers and populate student profiles, login tokens, and billing rules.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
