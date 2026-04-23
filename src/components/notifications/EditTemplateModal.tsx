import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { NotificationTemplate } from '@/lib/api';

interface EditTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    template: NotificationTemplate | null;
    onSave: (id: string | number, data: Partial<NotificationTemplate>) => void;
}

const EditTemplateModal: React.FC<EditTemplateModalProps> = ({ isOpen, onClose, template, onSave }) => {
    const [templateName, setTemplateName] = useState('');
    const [templateType, setTemplateType] = useState<NotificationTemplate['type'] | string>('system');
    const [emailSubject, setEmailSubject] = useState('');
    const [emailContent, setEmailContent] = useState('');

    useEffect(() => {
        if (isOpen && template) {
            setTemplateName(template.name || '');
            setTemplateType(template.type || 'system');
            setEmailSubject(template.subject || '');
            setEmailContent(template.content || '');
        }
    }, [isOpen, template]);

    if (!isOpen || !template) return null;

    const handleSave = () => {
        onSave(template.id, {
            name: templateName,
            type: templateType as NotificationTemplate['type'],
            subject: emailSubject,
            content: emailContent,
        });
    };

    return createPortal(
        <div className="fixed inset-0 z-[70] flex items-center justify-center animate-in fade-in duration-200 p-4">
            {/* Backdrop click to close */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 max-h-[95vh] border border-border">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 flex-shrink-0 bg-white">
                    <div className="text-left">
                        <h2 className="text-xl font-bold text-[#1e293b]">Edit Template</h2>
                        <p className="text-sm text-slate-500 font-medium">Update template details for {template.name}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    >
                        <X size={24} strokeWidth={1.5} />
                    </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto scrollbar-thin flex-grow text-left">
                    {/* Top Row: Name and Type */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Template Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={templateName}
                                onChange={(e) => setTemplateName(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none transition-all focus:border-[#009688] focus:ring-4 focus:ring-[#009688]/10 bg-white text-slate-900"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Template Type <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    value={templateType}
                                    onChange={(e) => setTemplateType(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none transition-all focus:border-[#009688] focus:ring-4 focus:ring-[#009688]/10 bg-white appearance-none text-slate-900"
                                >
                                    <option value="email">Email</option>
                                    <option value="sms">SMS</option>
                                    <option value="system">System</option>
                                    <option value="promotional">Promotional</option>
                                    <option value="transactional">Transactional</option>
                                </select>
                                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Email Subject */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Email Subject <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={emailSubject}
                            onChange={(e) => setEmailSubject(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none transition-all focus:border-[#009688] focus:ring-4 focus:ring-[#009688]/10 bg-white text-slate-900"
                        />
                    </div>

                    {/* Email Content */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Email Content <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={emailContent}
                            onChange={(e) => setEmailContent(e.target.value)}
                            className="w-full min-h-[220px] rounded-xl border border-slate-200 p-4 text-sm font-medium outline-none transition-all focus:border-[#009688] focus:ring-4 focus:ring-[#009688]/10 resize-none scrollbar-thin bg-white text-slate-900"
                        />
                        <div className="rounded-lg bg-blue-50 p-3 flex gap-2 items-center">
                            <span className="text-[10px] font-bold text-blue-800 uppercase tracking-tight flex-shrink-0">Variables:</span>
                            <div className="flex flex-wrap gap-1.5">
                                {['{{name}}', '{{email}}', '{{phone}}', '{{date}}'].map(v => (
                                    <code key={v} className="px-1.5 py-0.5 bg-white border border-blue-100 rounded text-[10px] text-blue-600 font-mono font-bold">{v}</code>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Statistics Card */}
                    <div className="grid grid-cols-2 gap-px divide-x divide-slate-100 rounded-2xl border border-slate-100 bg-slate-50 overflow-hidden shadow-inner text-left">
                        <div className="p-5 bg-slate-50/50">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Last Used</p>
                            <p className="mt-1 text-base font-bold text-slate-700">{template.lastUsed}</p>
                        </div>
                        <div className="p-5 bg-slate-50/50">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Sends</p>
                            <p className="mt-1 text-base font-bold text-slate-700">{template.totalSends?.toLocaleString() || 0}</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-5 flex-shrink-0 bg-slate-50/30">
                    <button
                        onClick={onClose}
                        className="rounded-xl border border-slate-200 bg-white px-7 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all shadow-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="rounded-xl bg-[#009688] px-10 py-2.5 text-sm font-bold text-white hover:bg-[#00796b] transition-all shadow-md active:scale-95"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default EditTemplateModal;
