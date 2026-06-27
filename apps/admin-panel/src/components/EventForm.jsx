import React, { useState } from 'react';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const EVENT_TYPES = [
  { value: 'MTE', label: '📝 Mid Term Exam', color: '#DC2626' },
  { value: 'ETE', label: '📋 End Term Exam', color: '#7C3AED' },
  { value: 'CA', label: '✏️ Continuous Assessment', color: '#D97706' },
  { value: 'HOLIDAY', label: '🎉 Holiday', color: '#059669' },
  { value: 'WORKSHOP', label: '🔧 Workshop', color: '#0891B2' },
  { value: 'EVENT', label: '🎯 General Event', color: '#DB2777' },
  { value: 'DEADLINE', label: '⚠️ Deadline', color: '#DC2626' },
  { value: 'CUSTOM', label: '⚡ Custom', color: '#6366F1' },
];

const DEFAULT_FORM = {
  title: '',
  type: 'MTE',
  start_time: dayjs().format('YYYY-MM-DDTHH:00'),
  end_time: dayjs().add(2, 'hour').format('YYYY-MM-DDTHH:00'),
  description: '',
  venue: '',
  subject: '',
  branch: 'ALL',
  semester: '',
  color: '#DC2626',
  meta_key_1: '', meta_val_1: '',
  meta_key_2: '', meta_val_2: '',
  meta_key_3: '', meta_val_3: '',
};

export default function EventForm({ onSuccess, editingEvent, onCancelEdit }) {
  const [form, setForm] = useState(() => {
    if (editingEvent) {
      return {
        ...DEFAULT_FORM,
        ...editingEvent,
        start_time: dayjs(editingEvent.start_time || editingEvent.start).format('YYYY-MM-DDTHH:mm'),
        end_time: dayjs(editingEvent.end_time || editingEvent.end).format('YYYY-MM-DDTHH:mm'),
      };
    }
    return DEFAULT_FORM;
  });
  const [submitting, setSubmitting] = useState(false);

  const isEditing = !!editingEvent;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'type') {
        const typeConfig = EVENT_TYPES.find(t => t.value === value);
        if (typeConfig) updated.color = typeConfig.color;
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (new Date(form.end_time) <= new Date(form.start_time)) {
      toast.error('End time must be after start time.');
      return;
    }

    setSubmitting(true);

    const metadata = {};
    [1, 2, 3].forEach(i => {
      const key = form[`meta_key_${i}`]?.trim();
      const val = form[`meta_val_${i}`]?.trim();
      if (key && val) metadata[key] = val;
    });

    const payload = {
      title: form.title,
      type: form.type,
      start_time: new Date(form.start_time).toISOString(),
      end_time: new Date(form.end_time).toISOString(),
      description: form.description,
      venue: form.venue,
      subject: form.subject,
      branch: form.branch || 'ALL',
      semester: form.semester ? parseInt(form.semester) : null,
      color: form.color,
      metadata,
    };

    try {
      if (isEditing) {
        await axios.put(`${API_BASE}/api/events/${editingEvent.id}`, payload);
        toast.success('Event updated successfully! ✅');
      } else {
        await axios.post(`${API_BASE}/api/events`, payload);
        toast.success('Event added to calendar! 🎉');
      }
      setForm(DEFAULT_FORM);
      onSuccess?.();
      onCancelEdit?.();
    } catch (err) {
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors.map(e => `${e.path}: ${e.msg}`).join(', ');
        toast.error(`Validation Failed: ${errors}`);
      } else {
        const msg = err.response?.data?.message || err.message || 'Failed to save event';
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      
      <div className="space-y-8">
        {/* ── Section 1: Basic Details ── */}
      <FormSection title="1. Basic Details" description="Core information about the event.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <FormLabel>Event Title <span className="text-red-500">*</span></FormLabel>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              placeholder="e.g. Data Structures — MTE"
              className={inputCls}
            />
          </div>

          <div>
            <FormLabel>Event Type <span className="text-red-500">*</span></FormLabel>
            <select name="type" value={form.type} onChange={handleChange} className={inputCls} required>
              {EVENT_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <FormLabel>Theme Color</FormLabel>
            <div className="flex items-center gap-3">
              <input
                type="color"
                name="color"
                value={form.color}
                onChange={handleChange}
                className="h-11 w-14 rounded-xl border border-gray-200 bg-gray-50 cursor-pointer p-0.5 focus:ring-2 focus:ring-[#8B0000]/20"
              />
              <span className="text-sm text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded border border-gray-100">{form.color}</span>
            </div>
          </div>
        </div>
      </FormSection>

      {/* ── Section 2: Date & Time ── */}
      <FormSection title="2. Date & Time" description="When does this event take place?">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FormLabel>Start Date & Time <span className="text-red-500">*</span></FormLabel>
            <input
              type="datetime-local"
              name="start_time"
              value={form.start_time}
              onChange={handleChange}
              required
              className={inputCls}
            />
          </div>

          <div>
            <FormLabel>End Date & Time <span className="text-red-500">*</span></FormLabel>
            <input
              type="datetime-local"
              name="end_time"
              value={form.end_time}
              onChange={handleChange}
              required
              className={inputCls}
            />
          </div>
        </div>
      </FormSection>
      </div>

      <div className="space-y-8">
        {/* ── Section 3: Location & Target ── */}
        <FormSection title="3. Location & Targeting" description="Where is it, and who is it for?">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FormLabel>Venue / Location</FormLabel>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">📍</span>
              <input
                name="venue"
                value={form.venue}
                onChange={handleChange}
                placeholder="e.g. Block 33, Hall A"
                className={`${inputCls} pl-9`}
              />
            </div>
          </div>

          <div>
            <FormLabel>Subject / Course</FormLabel>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">📚</span>
              <input
                name="subject"
                value={form.subject}
                onChange={handleChange}
                placeholder="e.g. CSE326"
                className={`${inputCls} pl-9`}
              />
            </div>
          </div>

          <div>
            <FormLabel>Target Branch</FormLabel>
            <select name="branch" value={form.branch} onChange={handleChange} className={inputCls}>
              <option value="ALL">All Branches</option>
              <option value="CSE">Computer Science (CSE)</option>
              <option value="ECE">Electronics (ECE)</option>
              <option value="ME">Mechanical (ME)</option>
              <option value="CE">Civil (CE)</option>
              <option value="EEE">Electrical (EEE)</option>
              <option value="IT">Information Tech (IT)</option>
            </select>
          </div>

          <div>
            <FormLabel>Target Semester</FormLabel>
            <select name="semester" value={form.semester} onChange={handleChange} className={inputCls}>
              <option value="">All Semesters</option>
              {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
            </select>
          </div>
        </div>
      </FormSection>

      {/* ── Section 4: Additional Details ── */}
      <FormSection title="4. Additional Details" description="Extra notes and custom metadata for the calendar popup.">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <FormLabel>Description / Notes</FormLabel>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Syllabus coverage, important notes, registration links, etc."
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </div>

          <div>
            <FormLabel>Custom Metadata (Optional)</FormLabel>
            <p className="text-[12px] text-gray-500 mb-3">Add key-value pairs that will display in the event details popup (e.g. "Max Marks: 30").</p>
            <div className="space-y-2.5">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-2 items-center">
                  <span className="text-gray-300 text-xs font-mono w-4">{i}.</span>
                  <input
                    name={`meta_key_${i}`}
                    value={form[`meta_key_${i}`]}
                    onChange={handleChange}
                    placeholder="Key (e.g. max_marks)"
                    className={`${inputCls} flex-1`}
                  />
                  <input
                    name={`meta_val_${i}`}
                    value={form[`meta_val_${i}`]}
                    onChange={handleChange}
                    placeholder="Value (e.g. 30)"
                    className={`${inputCls} flex-1`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </FormSection>
      </div>

      {/* ── Actions ── */}
      <div className="lg:col-span-2 flex gap-3 pt-6 border-t border-gray-100">
        {isEditing && (
          <button
            type="button"
            onClick={() => { onCancelEdit?.(); setForm(DEFAULT_FORM); }}
            className="flex-1 py-3 rounded-xl border border-gray-200 bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300 font-semibold transition-all text-sm shadow-sm"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 bg-gradient-to-r from-[#8B0000] to-[#A31515] hover:from-[#A31515] hover:to-[#8B0000] text-white font-bold py-3 rounded-xl transition-all duration-200 disabled:opacity-50 shadow-lg shadow-[#8B0000]/25 text-sm transform hover:-translate-y-[1px] active:translate-y-0"
        >
          {submitting ? 'Saving...' : isEditing ? '✅ Save Changes' : '➕ Publish to Calendar'}
        </button>
      </div>
    </form>
  );
}

const inputCls = "w-full bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2.5 text-gray-900 text-[14px] placeholder-gray-400 focus:outline-none focus:border-[#8B0000]/50 focus:ring-4 focus:ring-[#8B0000]/10 focus:bg-white transition-all font-sans";

function FormLabel({ children }) {
  return <label className="block text-[12px] font-bold text-gray-700 uppercase tracking-wide mb-1.5">{children}</label>;
}

function FormSection({ title, description, children }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
      <div className="mb-5 pb-4 border-b border-gray-100">
        <h3 className="text-[16px] font-bold text-gray-900">{title}</h3>
        <p className="text-[13px] text-gray-500 mt-1">{description}</p>
      </div>
      {children}
    </div>
  );
}
