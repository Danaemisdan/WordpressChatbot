"use client";

import { useChat } from "@ai-sdk/react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Send } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { ColorOrb } from "@/components/ui/ai-input";

interface FormData {
    name?: string;
    phone?: string;
    email?: string;
    course?: string;
    state?: string;
}

export default function ChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [hasSubmittedForm, setHasSubmittedForm] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        name: "",
        phone: "",
        email: "",
        course: "B.Tech",
        state: "Delhi",
    });
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const processedMessages = useRef<Set<string>>(new Set());

    // Notify WordPress parent to resize the iframe when chat opens/closes
    useEffect(() => {
        if (typeof window !== 'undefined' && window.parent !== window) {
            window.parent.postMessage(
                { type: 'chatbot-widget', isOpen },
                '*'
            );
        }
    }, [isOpen]);

    const { messages, append, isLoading, error } = useChat({
        onError: (err) => {
            console.error("Chat Error:", err);
        }
    });

    // College slug → full URL map (used for direct navigation)
    const COLLEGE_URLS: Record<string, string> = {
        'graphic-era'            : 'https://admissionnow.net/graphic-era/',
        'coer-university'        : 'https://admissionnow.net/coer-university/',
        'uttaranchal-university' : 'https://admissionnow.net/uttaranchal-university/',
        'sandip-university'      : 'https://admissionnow.net/sandipuniversity/',
        'noida-international'    : 'https://admissionnow.net/noida-international-university/',
    };

    // On mount: if user already submitted the form before, skip straight to chat
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const existing = localStorage.getItem('chatbot_student_data');
            if (existing) {
                try {
                    const parsed = JSON.parse(existing);
                    if (parsed.name && parsed.phone) {
                        setFormData(parsed);
                        setHasSubmittedForm(true);
                    }
                } catch (e) {}
            }
        }
    }, []);

    // Handle AI response markers
    const processedNavigations = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (!messages.length) return;
        const lastMsg = messages[messages.length - 1];

        if (lastMsg.role === 'assistant') {
            const navMatch = lastMsg.content.match(/\[\[NAVIGATE_AND_FILL:(.*?)\]\]/);

            if (navMatch && !processedNavigations.current.has(lastMsg.id)) {
                processedNavigations.current.add(lastMsg.id);

                const slug = navMatch[1].trim();
                const url = COLLEGE_URLS[slug];

                if (url && typeof window !== 'undefined') {
                    // Save student data to localStorage so the college page can auto-fill
                    const saved = localStorage.getItem('chatbot_student_data');

                    // Also notify parent via postMessage (belt-and-suspenders)
                    if (window.parent !== window) {
                        window.parent.postMessage({
                            type: 'chatbot-navigate-fill',
                            slug,
                            formData: saved ? JSON.parse(saved) : {},
                        }, '*');
                    }

                    // PRIMARY: Navigate the entire top-level window directly.
                    // Increased delay to 3.5 seconds so the user can actually read the AI's confirmation text
                    setTimeout(() => {
                        try {
                            window.top!.location.href = url;
                        } catch {
                            window.parent.location.href = url;
                        }
                    }, 3500);
                }
            }
        }
    }, [messages]);

    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen]);

    return (
        <div className="fixed bottom-0 right-0 z-50 flex flex-col items-end gap-4 pointer-events-none" style={{ padding: '16px' }}>
            {/* Chat Window */}
            <div className="pointer-events-auto">
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="w-[calc(100vw-32px)] sm:w-96 bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-gray-200 mb-2 relative"
                            style={{ height: "500px", maxWidth: "384px" }}
                        >
                            {/* Header */}
                            <div className="bg-white p-4 flex items-center justify-between border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="bg-gradient-to-tr from-blue-500 to-blue-600 p-2 rounded-2xl shadow-lg shadow-blue-500/30">
                                        <Sparkles size={20} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 text-sm">Admission Assistant</h3>
                                        <p className="text-[10px] text-gray-500 font-medium">Powered by AI</p>
                                    </div>
                                    {/* Test Link for user to manually navigate if AI fails */}
                                    {/* <button onClick={() => router.push('/medical')} className="text-[8px]">Test Nav</button> */}
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            {/* Body: Either Form or Chat */}
                            {!hasSubmittedForm ? (
                                <div className="flex-1 overflow-y-auto p-5 bg-white">
                                    <div className="mb-5">
                                        <h4 className="text-base font-bold text-gray-900">Welcome to Admission Now! 🎓</h4>
                                        <p className="text-xs text-gray-500 mt-1">Please fill this quick form to chat with our AI Counselor.</p>
                                    </div>
                                    <form 
                                        className="space-y-3"
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            // Hardcode email, course, and state as requested
                                            const lead = { 
                                                ...formData, 
                                                email: 'info@admissionnow.net',
                                                course: 'Any',
                                                state: 'Any',
                                                timestamp: Date.now() 
                                            };

                                            // Save to localStorage (for auto-fill on college pages)
                                            if (typeof window !== 'undefined') {
                                                localStorage.setItem('chatbot_student_data', JSON.stringify(lead));
                                            }

                                            // Save to backend DB (fire-and-forget)
                                            fetch('/api/leads', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify(lead),
                                            }).catch(err => console.error('Lead save failed:', err));

                                            setHasSubmittedForm(true);
                                        }}
                                    >
                                        <div>
                                            <label className="block text-[11px] font-semibold text-gray-700 mb-1">Full Name</label>
                                            <input required type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Rahul Sharma" />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-semibold text-gray-700 mb-1">Phone Number (10 Digits)</label>
                                            <input required type="tel" pattern="[6-9][0-9]{9}" title="Please enter a valid 10-digit Indian phone number starting with 6, 7, 8, or 9" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={formData.phone} onChange={e => {
                                                let val = e.target.value.replace(/\D/g, '');
                                                // Prevent starting with 0-5
                                                if (val.length > 0 && !/^[6-9]/.test(val)) {
                                                    val = '';
                                                }
                                                setFormData({...formData, phone: val.slice(0, 10)});
                                            }} placeholder="9876543210" />
                                        </div>
                                        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-medium py-2.5 rounded-lg mt-2 transition-colors">
                                            Start Chatting ✨
                                        </button>
                                    </form>
                                </div>
                            ) : (
                                <>
                                    {/* Messages */}
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
                                        {messages.length === 0 && (
                                            <div className="text-center mt-12">
                                                <p className="text-sm text-gray-500 mb-2">👋 Hi {formData.name?.split(' ')[0]}! I'm ready to help.</p>
                                                <p className="text-xs text-gray-400">Ask me about colleges or tell me where you'd like to apply.</p>
                                            </div>
                                        )}
                                        {messages.map((m) => {
                                            // Cleanly strip anything from '[[' onwards so the user never sees raw tags streaming
                                            let displayContent = m.content.split('[[')[0].trim();

                                            // If the AI forgot to write a pleasantry and only output the tag, provide a fallback message
                                            if (!displayContent && m.content.includes('[[')) {
                                                displayContent = "Redirecting you to the application form now... 🚀";
                                            }

                                            // Skip empty messages completely
                                            if (!displayContent) return null;

                                            return (
                                                <motion.div
                                                    key={m.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                                                >
                                                    <div
                                                        className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${m.role === "user"
                                                            ? "bg-blue-600 text-white rounded-br-sm"
                                                            : "bg-white text-gray-800 border border-gray-100 rounded-bl-sm"
                                                            }`}
                                                    >
                                                        {displayContent}
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                        {isLoading && (
                                            <div className="flex justify-start">
                                                <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-sm border border-gray-100">
                                                    <div className="flex gap-1">
                                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {error && (
                                            <div className="flex justify-center mt-2">
                                                <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded-full">
                                                    Unable to connect. Please try again.
                                                </span>
                                            </div>
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Input Area */}
                                    <div className="p-3 bg-white border-t border-gray-100">
                                        <form
                                            onSubmit={(e) => {
                                                e.preventDefault();
                                                const input = e.currentTarget.elements.namedItem('message') as HTMLInputElement;
                                                if (!input.value.trim()) return;
                                                append({ role: 'user', content: input.value });
                                                input.value = '';
                                            }}
                                            className="relative flex items-center"
                                        >
                                            <input
                                                name="message"
                                                placeholder="Type a message..."
                                                className="w-full bg-gray-50 text-gray-800 text-sm rounded-xl py-3 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-400"
                                                autoComplete="off"
                                            />
                                            <button
                                                type="submit"
                                                className="absolute right-2 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                disabled={isLoading}
                                            >
                                                <Send size={16} />
                                            </button>
                                        </form>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Floating Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="pointer-events-auto relative group outline-none"
            >
                {/* Tooltip */}
                {!isOpen && (
                    <div className="absolute right-full mr-6 top-1/2 -translate-y-1/2 bg-white px-4 py-2 rounded-xl shadow-lg border border-gray-100 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                        <p className="text-sm font-medium text-gray-700">Chat with us</p>
                        <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-r border-b border-gray-100 transform -rotate-45" />
                    </div>
                )}

                {isOpen ? (
                    <div className="w-14 h-14 bg-white rounded-full shadow-xl flex items-center justify-center border border-gray-100">
                        <X size={24} className="text-gray-600" />
                    </div>
                ) : (
                    <ColorOrb
                        dimension="60px"
                        tones={{
                            base: "oklch(60% 0.15 240)",    // Vibrant Blue base
                            accent1: "oklch(70% 0.15 320)", // Pink/Purple
                            accent2: "oklch(80% 0.15 180)", // Cyan
                            accent3: "oklch(75% 0.15 280)"  // Violet
                        }}
                    />
                )}
            </motion.button>
        </div>
    );
}
