import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Info, ChevronDown } from 'lucide-react';
import { NotificationTemplate } from '@/lib/api';

interface CreateTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (data: Partial<NotificationTemplate>) => void;
}

const CreateTemplateModal: React.FC<CreateTemplateModalProps> = ({ isOpen, onClose, onCreate }) => {
    const [templateName, setTemplateName] = useState('');
    const [templateType, setTemplateType] = useState<NotificationTemplate['type']>('system');
    const [emailSubject, setEmailSubject] = useState('');
    const [emailContent, setEmailContent] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const types: NotificationTemplate['type'][] = ['system', 'transactional', 'promotional', 'marketing'];

    if (!isOpen) return null;

    const handleCreate = () => {
        if (!templateName || !templateType || !emailSubject || !emailContent) return;
        onCreate({
            name: templateName,
            type: templateType,
            subject: emailSubject,
            content: emailContent,
        });
    };

    const isFormValid = templateName && templateType && emailSubject && emailContent;

    return createPortal(
        <div className="fixed inset-0 z-[70] flex items-center justify-center animate-in fade-in duration-200 p-4">
            {/* Backdrop click to close */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 max-h-[95vh] border border-border">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 flex-shrink-0 bg-white">
                    <div className="text-left">
                        <h2 className="text-xl font-bold text-slate-900">Create Template</h2>
                        <p className="text-sm text-slate-500 font-medium">Create a new notification template for the platform</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto scrollbar-thin flex-grow text-left">
                    {/* Row 1: Name and Type */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Template Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={templateName}
                                onChange={(e) => setTemplateName(e.target.value)}
                                placeholder="e.g., Welcome Email"
                                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none transition-all focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 placeholder:text-slate-300 bg-white text-slate-900"
                            />
                        </div>

                        <div className="relative space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Template Type <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-bold text-slate-700 bg-white hover:border-slate-300 focus:outline-none focus:ring-4 focus:ring-teal-500/10 transition-all flex items-center justify-between"
                                >
                                    <span className="capitalize">{templateType}</span>
                                    <ChevronDown size={18} className={isDropdownOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
                                </button>

                                {isDropdownOpen && (
                                    <div className="absolute left-0 top-full mt-2 z-[80] w-full rounded-xl border border-slate-100 bg-white py-2 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                                        {types.map((type) => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => {
                                                    setTemplateType(type);
                                                    setIsDropdownOpen(false);
                                                }}
                                                className={`w-full px-5 py-2.5 text-left text-sm font-bold transition-colors ${templateType === type
                                                    ? 'bg-teal-600 text-white'
                                                    : 'text-slate-600 hover:bg-slate-50'
                                                    }`}
                                            >
                                                <span className="capitalize">{type}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
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
                            placeholder="e.g., Welcome to TekConsult!"
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none transition-all focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 placeholder:text-slate-300 bg-white text-slate-900"
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
                            placeholder="Write your email content here... Use variables for personalization."
                            className="w-full min-h-[220px] rounded-xl border border-slate-200 p-4 text-sm font-medium outline-none transition-all focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 resize-none scrollbar-thin placeholder:text-slate-300 bg-white text-slate-900"
                        />
                        <div className="rounded-lg bg-blue-50 p-3 flex gap-2 items-center">
                            <span className="text-[10px] font-bold text-blue-800 uppercase tracking-tight flex-shrink-0">Available Variables:</span>
                            <div className="flex flex-wrap gap-1.5">
                                {['{{name}}', '{{email}}', '{{phone}}', '{{date}}'].map(v => (
                                    <code key={v} className="px-1.5 py-0.5 bg-white border border-blue-100 rounded text-[10px] text-blue-600 font-mono font-bold">{v}</code>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Template Tips Box */}
                    <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-6 shadow-sm">
                        <div className="flex items-start gap-4">
                            <div className="bg-blue-100 rounded-full p-1.5 flex-shrink-0">
                                <Info size={18} className="text-blue-600" />
                            </div>
                            <div className="space-y-3">
                                <p className="text-sm font-bold text-blue-800">Best Practices for Templates:</p>
                                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                                    <li className="flex items-center gap-2 text-sm text-blue-700/80 font-medium italic">
                                        <div className="h-1 w-1 rounded-full bg-blue-400" />
                                        Clear and concise subject lines
                                    </li>
                                    <li className="flex items-center gap-2 text-sm text-blue-700/80 font-medium italic">
                                        <div className="h-1 w-1 rounded-full bg-blue-400" />
                                        Personalize with dynamic variables
                                    </li>
                                    <li className="flex items-center gap-2 text-sm text-blue-700/80 font-medium italic">
                                        <div className="h-1 w-1 rounded-full bg-blue-400" />
                                        Strategic placement of info
                                    </li>
                                    <li className="flex items-center gap-2 text-sm text-blue-700/80 font-medium italic">
                                        <div className="h-1 w-1 rounded-full bg-blue-400" />
                                        Define clear Call-to-Actions (CTA)
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex justify-end gap-3 border-t bg-slate-50/30 px-6 py-5 flex-shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-slate-200 bg-white px-7 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all shadow-sm"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled={!isFormValid}
                        onClick={handleCreate}
                        className={`rounded-xl px-10 py-2.5 text-sm font-bold transition-all shadow-md active:scale-95 ${isFormValid
                            ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-teal-500/20'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                            }`}
                    >
                        Create Template
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default CreateTemplateModal;
