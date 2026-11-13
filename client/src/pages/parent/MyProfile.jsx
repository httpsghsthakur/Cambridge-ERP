import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function MyProfile() {
  const { user } = useAuth();
  
  const student = user?.linkedStudent;
  const studentName = student 
    ? `${student.first_name || ''} ${student.last_name || ''}`.trim() 
    : 'Student';

  // Custom states to handle mock edits if needed
  const [isEditing, setIsEditing] = useState(false);
  const [personalDetails, setPersonalDetails] = useState({
    email: user?.email || '',
    phone: user?.phone || '',
    address: student?.address || ''
  });

  return (
    <div className="space-y-6">
      
      {/* 1. Main Profile Banner Card */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-card relative overflow-hidden">
        
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row gap-8 items-start relative z-10">
          
          {/* Student Photo & Edit Action */}
          <div className="flex flex-col items-center flex-shrink-0 self-center lg:self-start">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden shadow-premium border-4 border-slate-50 relative group">
              <img
                src={student?.profile_photo || "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=200&auto=format&fit=crop&q=80"}
                alt={`${studentName} Profile`}
                className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
              />
              <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-all duration-300">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Student Core Details Panel */}
          <div className="flex-1 w-full space-y-6">
            
            {/* Header Text & Edit Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">{studentName}</h2>
                  <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-100 tracking-wider uppercase">Active</span>
                </div>
                <p className="text-xs font-semibold text-slate-400 mt-1.5 flex flex-wrap gap-x-2 gap-y-1 items-center">
                  <span>Class {student?.class || '—'}-{student?.section || '—'}</span>
                  <span className="text-slate-200">•</span>
                  <span>Roll No. {student?.roll_number || '—'}</span>
                  <span className="text-slate-200">•</span>
                  <span>Student ID: {student?.id || '—'}</span>
                </p>
              </div>
              
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white px-4 py-2.5 shadow-lg shadow-blue-500/10 active:scale-95 transition-all self-start sm:self-auto"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {isEditing ? 'Cancel Edit' : 'Edit Profile'}
              </button>
            </div>

            {/* Core Info Fields Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 pt-4 border-t border-slate-100">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date of Birth</p>
                <p className="text-xs font-extrabold text-slate-700 mt-1.5 flex items-center gap-1.5">
                  <span className="text-blue-500"></span> {student?.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString('en-GB') : '—'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Blood Group</p>
                <p className="text-xs font-extrabold text-slate-700 mt-1.5 flex items-center gap-1.5">
                  <span className="text-red-500"></span> {student?.blood_group || '—'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gender</p>
                <p className="text-xs font-extrabold text-slate-700 mt-1.5 flex items-center gap-1.5">
                  <span className="text-indigo-500"></span> {student?.gender || '—'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nationality</p>
                <p className="text-xs font-extrabold text-slate-700 mt-1.5 flex items-center gap-1.5">
                  <span className="text-amber-500"></span> Indian
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Religion</p>
                <p className="text-xs font-extrabold text-slate-700 mt-1.5 flex items-center gap-1.5">
                  <span className="text-indigo-500">☸️</span> Hindu
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</p>
                <p className="text-xs font-extrabold text-slate-700 mt-1.5 flex items-center gap-1.5">
                  <span className="text-emerald-500"></span> General
                </p>
              </div>
            </div>

            {/* Address & Contact Info Box */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-y-3 gap-x-6 pt-4 border-t border-slate-100">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</p>
                {isEditing ? (
                  <input
                    type="email"
                    value={personalDetails.email}
                    onChange={(e) => setPersonalDetails({ ...personalDetails, email: e.target.value })}
                    className="w-full text-xs font-bold text-slate-700 mt-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-blue-500"
                  />
                ) : (
                  <p className="text-xs font-extrabold text-blue-600 mt-1.5 truncate">
                     {personalDetails.email}
                  </p>
                )}
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone Number</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={personalDetails.phone}
                    onChange={(e) => setPersonalDetails({ ...personalDetails, phone: e.target.value })}
                    className="w-full text-xs font-bold text-slate-700 mt-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-blue-500"
                  />
                ) : (
                  <p className="text-xs font-extrabold text-slate-700 mt-1.5 whitespace-nowrap">
                     {personalDetails.phone}
                  </p>
                )}
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Residential Address</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={personalDetails.address}
                    onChange={(e) => setPersonalDetails({ ...personalDetails, address: e.target.value })}
                    className="w-full text-xs font-bold text-slate-700 mt-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-blue-500"
                  />
                ) : (
                  <p className="text-xs font-extrabold text-slate-700 mt-1.5 leading-relaxed">
                     {personalDetails.address}
                  </p>
                )}
              </div>
            </div>

          </div>

          {/* Banner Right Side: Quote & Stats cards */}
          <div className="w-full lg:w-72 flex flex-col gap-4 self-stretch justify-between">
            {/* Elegant Quote block */}
            <div className="bg-[#f0f4ff]/80 border border-blue-500/5 rounded-2xl p-4 sm:p-5 relative overflow-hidden flex-1 flex flex-col justify-center">
              <span className="absolute -left-1.5 -top-3 text-[100px] text-blue-500/5 font-extrabold leading-none pointer-events-none select-none">“</span>
              <p className="text-xs font-bold text-slate-600 leading-relaxed relative z-10 italic">
                "The beautiful thing about learning is that no one can take it away from you."
              </p>
              <p className="text-[10px] font-extrabold text-blue-600 mt-2.5 self-end tracking-wider">— B.B. King</p>
            </div>

            {/* Profile statistics capsules */}
            <div className="grid grid-cols-2 gap-2 flex-shrink-0">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Age</p>
                <p className="text-xs font-extrabold text-slate-700 mt-1">
                  {student?.date_of_birth ? Math.floor((new Date() - new Date(student.date_of_birth)) / 31557600000) + ' Years' : '—'}
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">House</p>
                <p className="text-xs font-extrabold text-red-600 mt-1">Red House</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-center">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Admission No.</p>
                <p className="text-[10px] font-extrabold text-slate-700 mt-1">{student?.id || '—'}</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-center">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Joined On</p>
                <p className="text-[10px] font-extrabold text-slate-700 mt-1">{student?.createdAt ? new Date(student.createdAt).toLocaleDateString('en-GB') : '—'}</p>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* 2. Grid Cards section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Parent / Guardian Details Card */}
        <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-card flex flex-col">
          <div className="pb-4 border-b border-slate-100 flex items-center gap-2.5 mb-5">
            <span className="text-xl"></span>
            <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">Parent / Guardian Details</h3>
          </div>
          
          <div className="space-y-5 flex-1">
            <div className="flex items-start gap-3.5 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg flex-shrink-0">
                
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-slate-800">{user?.name || student?.parent_name || 'Parent'} <span className="text-[10px] font-bold text-blue-500 ml-1.5">(Parent)</span></p>
                <p className="text-[11px] font-semibold text-slate-400 mt-1"> {user?.phone || student?.parent_phone || '—'}</p>
                <p className="text-[11px] font-semibold text-slate-400 mt-0.5 truncate"> {user?.email || '—'}</p>
              </div>
            </div>


          </div>
        </div>

        {/* Academic Information Card */}
        <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-card">
          <div className="pb-4 border-b border-slate-100 flex items-center gap-2.5 mb-5">
            <span className="text-xl"></span>
            <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">Academic Information</h3>
          </div>

          <div className="divide-y divide-slate-100">
            <div className="py-2.5 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Class</span>
              <span className="font-extrabold text-slate-700">{student?.class || '—'}</span>
            </div>
            <div className="py-2.5 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Section</span>
              <span className="font-extrabold text-slate-700">{student?.section || '—'}</span>
            </div>
            <div className="py-2.5 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Roll Number</span>
              <span className="font-extrabold text-slate-700">{student?.roll_number || '—'}</span>
            </div>
            <div className="py-2.5 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Student ID</span>
              <span className="font-extrabold text-slate-700">{student?.id || '—'}</span>
            </div>
            <div className="py-2.5 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Academic Session</span>
              <span className="font-extrabold text-slate-700">2024-25</span>
            </div>
            <div className="py-2.5 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Admission Date</span>
              <span className="font-extrabold text-slate-700">{student?.createdAt ? new Date(student.createdAt).toLocaleDateString('en-GB') : '—'}</span>
            </div>
          </div>
        </div>

        {/* Subjects & Teachers Card */}
        <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-card overflow-hidden">
          <div className="pb-4 border-b border-slate-100 flex items-center gap-2.5 mb-4">
            <span className="text-xl"></span>
            <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">Active Subjects</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[9px] tracking-wider">
                  <th className="py-2.5 font-bold">Subject</th>
                  <th className="py-2.5 font-bold text-right">Teacher</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                <tr className="hover:bg-slate-50/50">
                  <td className="py-2.5 font-extrabold">English</td>
                  <td className="py-2.5 text-right text-slate-500">Ms. Neha Sharma</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="py-2.5 font-extrabold">Mathematics</td>
                  <td className="py-2.5 text-right text-slate-500">Mr. Rajesh Verma</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="py-2.5 font-extrabold">Science</td>
                  <td className="py-2.5 text-right text-slate-500">Ms. Pooja Singh</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="py-2.5 font-extrabold">Social Studies</td>
                  <td className="py-2.5 text-right text-slate-500">Mr. Amit Patel</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="py-2.5 font-extrabold">Hindi</td>
                  <td className="py-2.5 text-right text-slate-500">Ms. Kavita Joshi</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="py-2.5 font-extrabold">Computer</td>
                  <td className="py-2.5 text-right text-slate-500">Mr. Suresh Kapoor</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="py-2.5 font-extrabold">Sanskrit</td>
                  <td className="py-2.5 text-right text-slate-500">Ms. Anjali Lakra</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* 3. Transport, Co-Curricular & Additional Info Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Transport Details Card */}
        <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-card">
          <div className="pb-4 border-b border-slate-100 flex items-center gap-2.5 mb-5">
            <span className="text-xl"></span>
            <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">Transport Details</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bus Number</span>
              <span className="text-xs font-extrabold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg">DL 01 AB 1234</span>
            </div>
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Route / Stop</span>
              <span className="text-xs font-extrabold text-slate-700 text-right leading-tight max-w-[150px]">Green Park ➔ School</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pickup Time</span>
              <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100/60">07:25 AM</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Drop Time</span>
              <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100/60">02:25 PM</span>
            </div>
          </div>
        </div>

        {/* Co-Curricular Activities Card */}
        <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-card">
          <div className="pb-4 border-b border-slate-100 flex items-center gap-2.5 mb-5">
            <span className="text-xl"></span>
            <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">Co-Curricular Activities</h3>
          </div>

          <div className="space-y-3.5">
            <div className="flex items-center justify-between bg-slate-50/50 p-2 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700">
                <span className="text-lg"></span> Football
              </div>
              <span className="text-[10px] bg-blue-50 border border-blue-100 text-blue-600 font-bold px-2 py-0.5 rounded-md uppercase">Team Player</span>
            </div>
            <div className="flex items-center justify-between bg-slate-50/50 p-2 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700">
                <span className="text-lg"></span> Drawing
              </div>
              <span className="text-[10px] bg-purple-50 border border-purple-100 text-purple-600 font-bold px-2 py-0.5 rounded-md uppercase">Member</span>
            </div>
            <div className="flex items-center justify-between bg-slate-50/50 p-2 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700">
                <span className="text-lg"></span> Music
              </div>
              <span className="text-[10px] bg-amber-50 border border-amber-100 text-amber-600 font-bold px-2 py-0.5 rounded-md uppercase">Learner</span>
            </div>
            <div className="flex items-center justify-between bg-slate-50/50 p-2 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700">
                <span className="text-lg"></span> Quiz Club
              </div>
              <span className="text-[10px] bg-emerald-50 border border-emerald-100 text-emerald-600 font-bold px-2 py-0.5 rounded-md uppercase">Member</span>
            </div>
          </div>
        </div>

        {/* Additional Information Card */}
        <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-card">
          <div className="pb-4 border-b border-slate-100 flex items-center gap-2.5 mb-5">
            <span className="text-xl"></span>
            <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">Additional Information</h3>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Height</p>
              <p className="font-extrabold text-slate-700 mt-1">135 cm</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Weight</p>
              <p className="font-extrabold text-slate-700 mt-1">32 kg</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vision</p>
              <p className="font-extrabold text-slate-700 mt-1">Normal</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Allergies</p>
              <p className="font-extrabold text-slate-500 mt-1">None</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Medical Conditions</p>
              <p className="font-extrabold text-slate-500 mt-1">None</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Remarks</p>
              <p className="font-extrabold text-slate-700 mt-1">Active & Participative</p>
            </div>
          </div>
        </div>

      </div>

      {/* 4. Documents Section */}
      <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-card">
        <div className="pb-4 border-b border-slate-100 flex items-center gap-2.5 mb-5">
          <span className="text-xl"></span>
          <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">Documents</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-blue-200 hover:bg-blue-50/10 transition-all cursor-pointer">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-xl flex-shrink-0"></span>
              <p className="text-xs font-extrabold text-slate-700 truncate">Birth Certificate</p>
            </div>
            <button className="p-2 bg-white text-slate-500 group-hover:text-blue-600 rounded-xl shadow-sm border border-slate-100">
              
            </button>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-blue-200 hover:bg-blue-50/10 transition-all cursor-pointer">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-xl flex-shrink-0"></span>
              <p className="text-xs font-extrabold text-slate-700 truncate">Aadhaar Card</p>
            </div>
            <button className="p-2 bg-white text-slate-500 group-hover:text-blue-600 rounded-xl shadow-sm border border-slate-100">
              
            </button>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-blue-200 hover:bg-blue-50/10 transition-all cursor-pointer">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-xl flex-shrink-0"></span>
              <p className="text-xs font-extrabold text-slate-700 truncate">Previous Report Card</p>
            </div>
            <button className="p-2 bg-white text-slate-500 group-hover:text-blue-600 rounded-xl shadow-sm border border-slate-100">
              
            </button>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-blue-200 hover:bg-blue-50/10 transition-all cursor-pointer">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-xl flex-shrink-0"></span>
              <p className="text-xs font-extrabold text-slate-700 truncate">Passport Size Photo</p>
            </div>
            <button className="p-2 bg-white text-slate-500 group-hover:text-blue-600 rounded-xl shadow-sm border border-slate-100">
              
            </button>
          </div>
        </div>
      </div>

      {/* 5. About Me & Goals Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-card">
          <div className="pb-4 border-b border-slate-100 flex items-center gap-2.5 mb-4">
            <span className="text-xl"></span>
            <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">About Me</h3>
          </div>
          <p className="text-xs font-bold text-slate-500 leading-relaxed">
            I love solving math puzzles and reading adventure books. I also enjoy playing football with my friends on weekends and participating in science clubs.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-card">
          <div className="pb-4 border-b border-slate-100 flex items-center gap-2.5 mb-4">
            <span className="text-xl"></span>
            <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">My Goals</h3>
          </div>
          <p className="text-xs font-bold text-slate-500 leading-relaxed">
            I want to improve my school science projects, learn basic coding blocks, and actively participate in the inter-school quiz competition this semester.
          </p>
        </div>
      </div>

    </div>
  );
}
