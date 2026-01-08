'use client';

import { useState, useEffect, useRef } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import GlassCard, { InnerCard } from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import TabNav from '@/components/ui/TabNav';
import { Input, Textarea, Select } from '@/components/ui/FormElements';
import {
    BookOpen,
    Plus,
    Search,
    FileText,
    MessageSquare,
    Wrench,
    Book,
    Bookmark,
    Tag,
    Calendar,
    Sparkles,
    Upload,
    Loader2,
    X,
} from 'lucide-react';

interface KnowledgeItem {
    id: string;
    category: 'DOCUMENT' | 'PROMPT' | 'TOOL' | 'PLAYBOOK' | 'REFERENCE';
    title: string;
    content: string;
    tags: string[];
    updatedAt: string;
}

const categoryIcons = {
    DOCUMENT: FileText,
    PROMPT: MessageSquare,
    TOOL: Wrench,
    PLAYBOOK: Book,
    REFERENCE: Bookmark,
};

const tabs = [
    { id: 'all', label: 'All' },
    { id: 'DOCUMENT', label: 'Documents', icon: FileText },
    { id: 'PROMPT', label: 'Prompts', icon: MessageSquare },
    { id: 'TOOL', label: 'Tools', icon: Wrench },
    { id: 'PLAYBOOK', label: 'Playbooks', icon: Book },
    { id: 'REFERENCE', label: 'References', icon: Bookmark },
];

export default function KnowledgePage() {
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [items, setItems] = useState<KnowledgeItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isAIQueryOpen, setIsAIQueryOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        category: 'DOCUMENT',
        content: '',
        tags: '',
    });
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    // AI Query state
    const [aiQuery, setAIQuery] = useState('');
    const [aiAnswer, setAIAnswer] = useState('');
    const [aiSources, setAISources] = useState<string[]>([]);
    const [aiLoading, setAILoading] = useState(false);

    // Drag and drop
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            const res = await fetch('/api/knowledge');
            if (res.ok) {
                const data = await res.json();
                setItems(data);
            }
        } catch (error) {
            console.error('Failed to fetch knowledge items:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredItems = items.filter((item) => {
        const matchesTab = activeTab === 'all' || item.category === activeTab;
        const matchesSearch =
            !searchQuery ||
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesTab && matchesSearch;
    });

    const handleSubmit = async () => {
        if (uploadFile) {
            await handleFileUpload();
        } else {
            if (!formData.title.trim()) return;

            try {
                const res = await fetch('/api/knowledge', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...formData,
                        tags: formData.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean),
                    }),
                });

                if (res.ok) {
                    fetchItems();
                }
            } catch (error) {
                console.error('Failed to create item:', error);
            }
        }

        resetForm();
    };

    const handleFileUpload = async () => {
        if (!uploadFile) return;

        setUploading(true);
        try {
            const formDataObj = new FormData();
            formDataObj.append('file', uploadFile);
            formDataObj.append('title', formData.title || uploadFile.name);
            formDataObj.append('category', formData.category);
            formDataObj.append('tags', formData.tags);

            const res = await fetch('/api/knowledge/upload', {
                method: 'POST',
                body: formDataObj,
            });

            if (res.ok) {
                fetchItems();
            }
        } catch (error) {
            console.error('Failed to upload file:', error);
        } finally {
            setUploading(false);
        }
    };

    const resetForm = () => {
        setFormData({ title: '', category: 'DOCUMENT', content: '', tags: '' });
        setUploadFile(null);
        setIsFormOpen(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) {
            setUploadFile(file);
            if (!formData.title) {
                setFormData({ ...formData, title: file.name });
            }
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploadFile(file);
            if (!formData.title) {
                setFormData({ ...formData, title: file.name });
            }
        }
    };

    const handleAskAI = async () => {
        if (!aiQuery.trim()) return;

        setAILoading(true);
        setAIAnswer('');
        setAISources([]);

        try {
            const res = await fetch('/api/knowledge/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: aiQuery }),
            });

            if (res.ok) {
                const data = await res.json();
                setAIAnswer(data.answer);
                setAISources(data.sources || []);
            }
        } catch (error) {
            console.error('Failed to query AI:', error);
            setAIAnswer('Failed to get a response. Please try again.');
        } finally {
            setAILoading(false);
        }
    };

    if (loading) {
        return (
            <>
                <PageHeader
                    title="Knowledge Base"
                    description="Your personal repository of documents, prompts, and references"
                    icon={BookOpen}
                />
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-[#139187] animate-spin" />
                </div>
            </>
        );
    }

    return (
        <>
            <PageHeader
                title="Knowledge Base"
                description="Your personal repository of documents, prompts, and references"
                icon={BookOpen}
            >
                <Button variant="accent" icon={Sparkles} onClick={() => setIsAIQueryOpen(true)}>
                    Ask AI
                </Button>
                <Button icon={Plus} onClick={() => setIsFormOpen(true)}>
                    Add Item
                </Button>
            </PageHeader>

            {/* Search */}
            <GlassCard padding="sm" className="mb-8">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search knowledge base..."
                        className="w-full bg-black/20 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-gray-500 outline-none focus:border-[#139187]"
                    />
                </div>
            </GlassCard>

            {/* Categories & Content */}
            <TabNav
                tabs={tabs.map((t) => ({
                    ...t,
                    count:
                        t.id === 'all'
                            ? items.length
                            : items.filter((k) => k.category === t.id).length,
                }))}
                activeTab={activeTab}
                onTabChange={setActiveTab}
            >
                {filteredItems.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-400">No items found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredItems.map((item) => {
                            const Icon = categoryIcons[item.category];
                            return (
                                <InnerCard
                                    key={item.id}
                                    className="cursor-pointer hover:bg-black/30 transition-colors"
                                    padding="none"
                                >
                                    <div
                                        className="p-4"
                                        onClick={() => setSelectedItem(item)}
                                    >
                                        <div className="flex items-start gap-3 mb-2">
                                            <div className="p-2 rounded-lg bg-[#139187]/20">
                                                <Icon className="w-5 h-5 text-[#139187]" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-white truncate">
                                                    {item.title}
                                                </h4>
                                                <span className="text-xs text-gray-500">
                                                    {item.category}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                                            {item.content}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <div className="flex gap-1">
                                                {item.tags.slice(0, 2).map((tag) => (
                                                    <span
                                                        key={tag}
                                                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/5 rounded text-xs text-gray-400"
                                                    >
                                                        <Tag className="w-3 h-3" />
                                                        {tag}
                                                    </span>
                                                ))}
                                                {item.tags.length > 2 && (
                                                    <span className="text-xs text-gray-500">
                                                        +{item.tags.length - 2}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(item.updatedAt).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                </InnerCard>
                            );
                        })}
                    </div>
                )}
            </TabNav>

            {/* Add Item Modal */}
            <Modal
                isOpen={isFormOpen}
                onClose={resetForm}
                title="Add to Knowledge Base"
                footer={
                    <>
                        <Button variant="secondary" onClick={resetForm}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={uploading || (!formData.title.trim() && !uploadFile)}>
                            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    {/* File Upload Zone */}
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${isDragging
                            ? 'border-[#139187] bg-[#139187]/10'
                            : 'border-white/20 hover:border-white/40'
                            }`}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        {uploadFile ? (
                            <div className="flex items-center justify-center gap-3">
                                <FileText className="w-8 h-8 text-[#139187]" />
                                <div className="text-left">
                                    <p className="text-white font-medium">{uploadFile.name}</p>
                                    <p className="text-xs text-gray-500">
                                        {(uploadFile.size / 1024).toFixed(1)} KB
                                    </p>
                                </div>
                                <button
                                    onClick={() => setUploadFile(null)}
                                    className="p-1 text-gray-500 hover:text-white"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <>
                                <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                                <p className="text-gray-400 text-sm">
                                    Drag and drop a file here, or{' '}
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="text-[#139187] hover:underline"
                                    >
                                        click to browse
                                    </button>
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Supports text files, PDFs, and documents
                                </p>
                            </>
                        )}
                    </div>

                    <div className="text-center text-xs text-gray-500">or enter manually</div>

                    <Input
                        label="Title"
                        placeholder="e.g., Sales Process Guide"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                    <Select
                        label="Category"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        options={[
                            { value: 'DOCUMENT', label: 'Document' },
                            { value: 'PROMPT', label: 'Prompt' },
                            { value: 'TOOL', label: 'Tool' },
                            { value: 'PLAYBOOK', label: 'Playbook' },
                            { value: 'REFERENCE', label: 'Reference' },
                        ]}
                    />
                    {!uploadFile && (
                        <Textarea
                            label="Content"
                            placeholder="Enter content..."
                            rows={6}
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        />
                    )}
                    <Input
                        label="Tags"
                        placeholder="Comma-separated tags"
                        value={formData.tags}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    />
                </div>
            </Modal>

            {/* AI Query Modal */}
            <Modal
                isOpen={isAIQueryOpen}
                onClose={() => {
                    setIsAIQueryOpen(false);
                    setAIAnswer('');
                    setAISources([]);
                    setAIQuery('');
                }}
                title="Ask AI About Your Knowledge"
                description="AI will search and summarize relevant information from your knowledge base."
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsAIQueryOpen(false)}>
                            Close
                        </Button>
                        <Button icon={Sparkles} onClick={handleAskAI} disabled={aiLoading || !aiQuery.trim()}>
                            {aiLoading ? 'Thinking...' : 'Ask'}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <Textarea
                        value={aiQuery}
                        onChange={(e) => setAIQuery(e.target.value)}
                        placeholder="e.g., What's our client onboarding process?"
                        rows={3}
                    />

                    {aiLoading && (
                        <div className="flex items-center gap-2 text-gray-400">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Searching knowledge base...
                        </div>
                    )}

                    {aiAnswer && (
                        <div className="p-4 bg-black/20 rounded-lg">
                            <p className="text-gray-300 whitespace-pre-wrap">{aiAnswer}</p>
                            {aiSources.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-white/10">
                                    <p className="text-xs text-gray-500 mb-1">Sources:</p>
                                    <div className="flex flex-wrap gap-1">
                                        {aiSources.map((source, i) => (
                                            <span key={i} className="text-xs text-[#139187]">
                                                {source}{i < aiSources.length - 1 && ', '}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Modal>

            {/* Item Detail Modal */}
            <Modal
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
                title={selectedItem?.title || ''}
            >
                {selectedItem && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-[#139187]/20 text-[#139187] rounded text-xs">
                                {selectedItem.category}
                            </span>
                            <span className="text-xs text-gray-500">
                                Updated {new Date(selectedItem.updatedAt).toLocaleDateString()}
                            </span>
                        </div>
                        <p className="text-gray-300 whitespace-pre-wrap">
                            {selectedItem.content}
                        </p>
                        <div className="flex gap-2">
                            {selectedItem.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/5 rounded text-xs text-gray-400"
                                >
                                    <Tag className="w-3 h-3" />
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
}
