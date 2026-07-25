import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { User } from '../../context/AuthContext';
import { Upload, Search, GraduationCap, FileSpreadsheet, X, Check } from 'lucide-react';

export const StudentPage: React.FC = () => {
  const [students, setStudents] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // CSV Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [csvRawText, setCsvRawText] = useState('');
  const [importing, setImporting] = useState(false);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<User[]>(`/users/students${search ? `?search=${search}` : ''}`);
      setStudents(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [search]);

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setImporting(true);

    try {
      // Parse CSV text (Format: name, email, roll_number, course_branch, year)
      const lines = csvRawText.trim().split('\n');
      const rows = lines.map(line => {
        const parts = line.split(',').map(p => p.trim());
        return {
          name: parts[0] || 'Student',
          email: parts[1] || `student_${Date.now()}@geeta.edu.in`,
          roll_number: parts[2] || `GU${Math.floor(100000 + Math.random() * 900000)}`,
          course_branch: parts[3] || 'B.Tech CSE',
          year: parts[4] || '1st Year'
        };
      });

      const res = await apiRequest('/users/students/bulk-import', 'POST', rows);
      alert(res.message || 'Import successful');
      setIsImportModalOpen(false);
      setCsvRawText('');
      fetchStudents();
    } catch (err: any) {
      alert(err.message || 'Bulk import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Student Directory</h2>
          <p className="text-xs text-slate-400 mt-1">Manage registered students or bulk-import student class lists via CSV.</p>
        </div>
        <button
          onClick={() => setIsImportModalOpen(true)}
          className="btn-primary shrink-0"
        >
          <FileSpreadsheet className="w-4 h-4" /> Bulk Import Students (CSV)
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by student name, roll number, or course..."
          className="glass-input pl-9"
        />
      </div>

      {/* Table */}
      <div className="glass-panel overflow-hidden">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-900/90 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-4">Student Name</th>
              <th className="p-4">Roll Number</th>
              <th className="p-4">Course / Branch</th>
              <th className="p-4">Year</th>
              <th className="p-4">Email</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-slate-500">Loading student directory...</td></tr>
            ) : students.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-slate-500">No student accounts found.</td></tr>
            ) : (
              students.map(s => (
                <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center font-bold text-sm">
                        {s.name.charAt(0)}
                      </div>
                      <div className="font-semibold text-slate-100">{s.name}</div>
                    </div>
                  </td>
                  <td className="p-4 font-mono text-xs text-amber-400">{s.roll_number || 'N/A'}</td>
                  <td className="p-4 text-slate-300">{s.course_branch || 'N/A'}</td>
                  <td className="p-4 text-xs text-slate-400">{s.year || 'N/A'}</td>
                  <td className="p-4 text-xs text-slate-300">{s.email}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Bulk Import CSV Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-lg glass-panel p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" /> Bulk Import Students
              </h3>
              <button onClick={() => setIsImportModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBulkImport} className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Paste comma-separated rows below in the format: <br />
                <code className="bg-slate-900 px-2 py-1 rounded text-emerald-400 block mt-1">
                  Full Name, Email, Roll Number, Course/Branch, Year
                </code>
              </p>

              <div>
                <textarea
                  required
                  rows={6}
                  value={csvRawText}
                  onChange={e => setCsvRawText(e.target.value)}
                  placeholder={`Riya Sharma, riya@geeta.edu.in, GU2026001, B.Tech CSE, 3rd Year\nKaran Malhotra, karan@geeta.edu.in, GU2026045, MBA, 1st Year`}
                  className="glass-input font-mono text-xs"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button type="button" onClick={() => setIsImportModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={importing} className="btn-primary">
                  {importing ? 'Importing...' : 'Upload & Import'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
