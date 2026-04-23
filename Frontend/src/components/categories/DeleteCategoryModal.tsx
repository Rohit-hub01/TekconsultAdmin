import React from 'react';
import { createPortal } from 'react-dom';
import { X, Trash2, AlertTriangle, AlertCircle } from 'lucide-react';
import { Category } from '@/lib/api';

interface DeleteCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    category: Category;
}

const DeleteCategoryModal: React.FC<DeleteCategoryModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    category,
}) => {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden border border-gray-100 z-10 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
                    <h2 className="text-lg font-semibold text-gray-900">Delete Category</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors bg-white hover:bg-gray-100 p-1.5 rounded-full border border-gray-200 hover:border-gray-300"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-6 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 hover:[&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                    {/* Icon */}
                    <div className="flex justify-center">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center border-[6px] border-red-50 shadow-inner">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                <Trash2 className="w-5 h-5 text-red-600" />
                            </div>
                        </div>
                    </div>

                    {/* Title */}
                    <div className="text-center space-y-2">
                        <h3 className="text-lg font-bold text-gray-900">
                            Delete {category.name}?
                        </h3>
                        <p className="text-sm text-gray-500 max-w-[280px] mx-auto leading-relaxed">
                            This action cannot be undone. The category and all associated data will be permanently removed.
                        </p>
                    </div>

                    {/* Category Card */}
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center flex-shrink-0 border border-gray-200 shadow-sm text-lg font-bold text-gray-700">
                            {category.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 text-sm">{category.name}</h4>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{category.description}</p>
                            <div className="flex gap-2 mt-1.5">
                                <span className="text-[10px] bg-white border border-gray-200 px-1.5 py-0.5 rounded text-gray-600 font-medium">
                                    {category.consultantCount} consultants
                                </span>
                                <span className="text-[10px] bg-white border border-gray-200 px-1.5 py-0.5 rounded text-gray-600 font-medium">
                                    {category.subcategories?.length || 0} subcategories
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Warning Box */}
                    <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm font-bold text-red-900 mb-1.5">
                                    Warning: This will permanently delete:
                                </p>
                                <ul className="space-y-1 text-xs text-red-700 list-disc pl-4">
                                    <li>Category and {category.subcategories?.length || 0} subcategories</li>
                                    <li>{category.consultantCount} consultant associations</li>
                                    <li>All category-related statistics</li>
                                    <li>Historical session data for this category</li>
                                    <li>User preferences for this category</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-800 font-medium leading-relaxed">
                                Consultants in this category will become uncategorized and may need reassignment.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-all shadow-sm hover:shadow"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-4 py-2.5 text-white bg-red-600 rounded-xl font-medium hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
                    >
                        Delete Permanently
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default DeleteCategoryModal;
