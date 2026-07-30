import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { User } from '../../context/AuthContext';
import { FileText, Plus, ExternalLink, Download, Table, Trash2, X, Copy, Check } from 'lucide-react';

interface FormField {
  field_id: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'phone' | 'dropdown' | 'file';
  required: boolean;
  options?: string[];
}

interface DynamicFormItem {
  id: number;
  title: string;
  purpose_label: string;
  description: string;
  form_schema: FormField[];
  google_sheet_id: string;
  google_sheet_tab_name: string;
  is_active: boolean;
  public_slug: string;
  created_at: string;
  response_count: number;
}

interface FormResponseItem {
  id: number;
  response_data: Record<string, any>;
  sync_status: string;
  submitted_at: string;
}

export const FormsPage: React.FC = () => {
  const [forms, setForms] = useState<DynamicFormItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedFormForResponses, setSelectedFormForResponses] = useState<DynamicFormItem | null>(null);
  const [responsesList, setResponsesList] = useState<FormResponseItem[]>([]);

  // Wizard Form State
  const [title, setTitle] = useState('');
  const [purposeLabel, setPurposeLabel] = useState('Registration Form');
  const [description, setDescription] = useState('');
  const [googleSheetId, setGoogleSheetId] = useState('');
  const [fields, setFields] = useState<FormField[]>([
    { field_id: 'full_name', label: 'Full Name', type: 'text', required: true },
    { field_id: 'email', label: 'Email Address', type: 'email', required: true }
  ]);

  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const fetchForms = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<DynamicFormItem[]>('/forms');
      setForms(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const handleApplyTemplate = (purpose: string) => {
    setPurposeLabel(purpose);
    if (purpose === 'Registration Form') {
      setTitle('Event Student Registration');
      setFields([
        { field_id: 'name', label: 'Full Name', type: 'text', required: true },
        { field_id: 'roll_number', label: 'Roll Number', type: 'text', required: true },
        { field_id: 'course', label: 'Course & Branch', type: 'text', required: true },
        { field_id: 'phone', label: 'Phone Number', type: 'phone', required: true },
      ]);
    } else if (purpose === 'Detailed Student Form') {
      setTitle('Student Background Profile');
      setFields([
        { field_id: 'name', label: 'Full Name', type: 'text', required: true },
        { field_id: 'father_name', label: "Father's Name", type: 'text', required: true },
        { field_id: 'address', label: 'Permanent Address', type: 'text', required: true },
        { field_id: 'gpa', label: 'Current CGPA', type: 'number', required: false },
      ]);
    } else if (purpose === 'Interview Schedule Form') {
      setTitle('Student Core Committee Interview Booking');
      setFields([
        { field_id: 'name', label: 'Full Name', type: 'text', required: true },
        { field_id: 'time_slot', label: 'Preferred Time Slot', type: 'dropdown', required: true, options: ['10:00 AM - 11:00 AM', '02:00 PM - 03:00 PM'] },
        { field_id: 'resume', label: 'Resume / Portfolio Link', type: 'text', required: true },
      ]);
    }
  };

  const handleAddField = () => {
    const idx = fields.length + 1;
    setFields([...fields, { field_id: `field_${idx}`, label: `Field ${idx}`, type: 'text', required: true }]);
  };

  const handleCreateForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/forms', 'POST', {
        title,
        purpose_label: purposeLabel,
        description,
        fields,
        google_sheet_id: googleSheetId || `sheet_${title.toLowerCase().replace(/\s+/g, '_')}`
      });
      setIsWizardOpen(false);
      setTitle('');
      setDescription('');
      fetchForms();
    } catch (err: any) {
      alert(err.message || 'Failed to create dynamic form');
    }
  };

  const handleViewResponses = async (f: DynamicFormItem) => {
    setSelectedFormForResponses(f);
    try {
      const res = await apiRequest<FormResponseItem[]>(`/forms/${f.id}/responses`);
      setResponsesList(res);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyLink = (slug: string) => {
    const url = `${window.location.origin}/forms/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Dynamic Public Registration Forms</h2>
          <p className="text-xs text-slate-400 mt-1">Build public registration forms, auto-sync responses to Google Sheets, and share public link slugs without login.</p>
        </div>
        <button onClick={() => setIsWizardOpen(true)} className="btn-primary shrink-0">
          <Plus className="w-4 h-4" /> Create Dynamic Public Form
        </button>
      </div>

      {/* Forms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 p-8 text-center text-slate-500 glass-panel">Loading dynamic forms...</div>
        ) : forms.length === 0 ? (
          <div className="col-span-2 p-8 text-center text-slate-500 glass-panel">No dynamic forms created yet.</div>
        ) : (
          forms.map(f => (
            <div key={f.id} className="glass-panel p-6 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {f.purpose_label}
                  </span>
                  <span className="text-xs font-mono text-blue-400">
                    {f.response_count} Responses
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-100 mt-3">{f.title}</h3>
                <p className="text-xs text-slate-400 mt-1">{f.description || 'No description provided.'}</p>

                {/* Public Link Box */}
                <div className="mt-4 p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-300 truncate max-w-[220px]">
                    /forms/{f.public_slug}
                  </span>
                  <button
                    onClick={() => handleCopyLink(f.public_slug)}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
                  >
                    {copiedSlug === f.public_slug ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedSlug === f.public_slug ? 'Copied Link!' : 'Copy Link'}
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                <a
                  href={`/forms/${f.public_slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary text-xs py-2 px-3 flex-1 justify-center"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-purple-400" /> Public Form Preview
                </a>
                <button
                  onClick={() => handleViewResponses(f)}
                  className="btn-primary text-xs py-2 px-3 flex-1 justify-center"
                >
                  <Table className="w-3.5 h-3.5" /> View Responses ({f.response_count})
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Form Builder Wizard Modal */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-2xl glass-panel p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" /> Form Purpose Wizard & Template Setup
              </h3>
              <button onClick={() => setIsWizardOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateForm} className="space-y-4">
              {/* Template Buttons */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">Quick Template Choices</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Registration Form', 'Detailed Student Form', 'Interview Schedule Form'].map(purpose => (
                    <button
                      key={purpose}
                      type="button"
                      onClick={() => handleApplyTemplate(purpose)}
                      className={`p-2.5 rounded-xl border text-xs text-left transition-all ${
                        purposeLabel === purpose ? 'bg-blue-600/30 border-blue-500 text-blue-300 font-semibold' : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      {purpose}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Form Title</label>
                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Annual Cultural Fest Registration" className="glass-input" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Purpose Category Label</label>
                  <input required type="text" value={purposeLabel} onChange={e => setPurposeLabel(e.target.value)} className="glass-input" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Google Sheet ID Mirror (Optional)</label>
                  <input type="text" value={googleSheetId} onChange={e => setGoogleSheetId(e.target.value)} placeholder="sheet_123456" className="glass-input font-mono" />
                </div>
              </div>

              {/* Dynamic Field Builder Table */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-200">Custom Form Fields ({fields.length})</label>
                  <button type="button" onClick={handleAddField} className="text-xs text-blue-400 hover:underline font-medium">
                    + Add New Field
                  </button>
                </div>

                <div className="space-y-2">
                  {fields.map((field, idx) => (
                    <div key={idx} className="p-3 bg-slate-900 rounded-xl border border-slate-800 grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-4">
                        <input
                          type="text"
                          value={field.label}
                          onChange={e => {
                            const updated = [...fields];
                            updated[idx].label = e.target.value;
                            updated[idx].field_id = e.target.value.toLowerCase().replace(/\s+/g, '_');
                            setFields(updated);
                          }}
                          placeholder="Field Label"
                          className="glass-input text-xs"
                        />
                      </div>
                      <div className="col-span-4">
                        <select
                          value={field.type}
                          onChange={e => {
                            const updated = [...fields];
                            updated[idx].type = e.target.value as any;
                            setFields(updated);
                          }}
                          className="glass-input text-xs"
                        >
                          <option value="text">Text Input</option>
                          <option value="number">Number</option>
                          <option value="email">Email</option>
                          <option value="phone">Phone</option>
                          <option value="dropdown">Dropdown Options</option>
                        </select>
                      </div>
                      <div className="col-span-3 flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={e => {
                            const updated = [...fields];
                            updated[idx].required = e.target.checked;
                            setFields(updated);
                          }}
                          className="w-4 h-4 accent-blue-600 rounded"
                        />
                        <span className="text-xs text-slate-400">Required</span>
                      </div>
                      <div className="col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => setFields(fields.filter((_, i) => i !== idx))}
                          className="text-slate-500 hover:text-rose-400 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button type="button" onClick={() => setIsWizardOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Generate Public Form</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Response Table Viewer Modal */}
      {selectedFormForResponses && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-4xl glass-panel p-6 shadow-2xl relative max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-100">{selectedFormForResponses.title} — Submission Ledger</h3>
                <p className="text-xs text-slate-400">Google Sheet Mirror: <code className="text-emerald-400 font-mono">{selectedFormForResponses.google_sheet_id}</code></p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`/api/forms/${selectedFormForResponses.id}/responses/export`}
                  className="btn-primary text-xs py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500"
                >
                  <Download className="w-4 h-4" /> Export CSV
                </a>
                <button onClick={() => setSelectedFormForResponses(null)} className="text-slate-400 hover:text-slate-200">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto mt-4">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Submitted At</th>
                    {selectedFormForResponses.form_schema.map(field => (
                      <th key={field.field_id} className="p-3">{field.label}</th>
                    ))}
                    <th className="p-3">Google Sheet Sync</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {responsesList.length === 0 ? (
                    <tr><td colSpan={10} className="p-8 text-center text-slate-500">No submission records logged yet.</td></tr>
                  ) : (
                    responsesList.map((r, idx) => (
                      <tr key={r.id} className="hover:bg-slate-900/40">
                        <td className="p-3">{idx + 1}</td>
                        <td className="p-3 text-slate-400">{new Date(r.submitted_at).toLocaleString()}</td>
                        {selectedFormForResponses.form_schema.map(field => (
                          <td key={field.field_id} className="p-3 font-sans text-slate-200">
                            {r.response_data[field.field_id] || '-'}
                          </td>
                        ))}
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {r.sync_status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
