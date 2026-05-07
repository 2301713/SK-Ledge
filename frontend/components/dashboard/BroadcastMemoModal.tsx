"use client";

import React, { useState } from "react";
import { Priority, Audience, BroadcastMemoModalProps } from "./types";
import { Send, X, ShieldAlert } from "lucide-react";

export default function BroadcastMemoModal({
  isOpen,
  onClose,
  onSubmitSuccess,
}: BroadcastMemoModalProps) {
  const [form, setForm] = useState({
    title: "",
    content: "",
    priority: "standard" as Priority,
    audience: "all" as Audience,
    requireAck: false,
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const submitBroadcast = () => {
    if (!form.title || !form.content) return;

    // Logic for handling the broadcast data would go here
    // (e.g., Supabase insert)

    onSubmitSuccess();
    setForm({
      title: "",
      content: "",
      priority: "standard",
      audience: "all",
      requireAck: false,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-md bg-slate-900/60">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col duration-200">
        {/* MODAL HEADER */}
        <div className="bg-slate-900 px-8 py-6 flex justify-between items-center border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-tertiary/20 rounded-lg flex items-center justify-center text-tertiary">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-tight">
                CommHub <span className="text-tertiary">Dispatch</span>
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Authorize Official Federation Memo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="px-8 py-8 space-y-8 overflow-y-auto max-h-[70vh]">
          {/* Metadata Grid */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                Route To
              </label>
              <select
                name="audience"
                value={form.audience}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="all">All Federation Officials</option>
                <option value="chairpersons">SK Chairpersons Only</option>
              </select>
            </div>
            <div className="space-y-2.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                Classification
              </label>
              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="standard">Standard Memo</option>
                <option value="event">Event Protocol</option>
                <option value="urgent">Urgent / Red Alert</option>
              </select>
            </div>
          </div>

          {/* Input Area */}
          <div className="space-y-6">
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Subject Heading"
              className="w-full px-5 py-4 bg-white border-2 border-slate-100 rounded-xl text-lg font-black text-slate-900 outline-none focus:border-indigo-500 transition-all"
            />
            <textarea
              name="content"
              value={form.content}
              onChange={handleChange}
              placeholder="Message Payload"
              className="w-full px-5 py-5 bg-white border-2 border-slate-100 rounded-xl text-sm font-medium text-slate-800 min-h-40 outline-none focus:border-indigo-500 transition-all resize-none"
            />
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="px-8 py-6 bg-slate-50 border-t border-slate-200 flex items-center gap-4">
          <button
            onClick={onClose}
            className="px-6 py-4 font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Abort
          </button>
          <button
            onClick={submitBroadcast}
            disabled={!form.title || !form.content}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-600/20"
          >
            <Send size={16} /> Authorize & Broadcast
          </button>
        </div>
      </div>
    </div>
  );
}
