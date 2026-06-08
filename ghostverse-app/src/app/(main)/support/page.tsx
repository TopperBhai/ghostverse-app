"use client";

import { useState } from "react";
import { MessageSquare, AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";

export default function SupportPage() {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, description }),
      });
      const data = await res.json();
      
      if (data.success) {
        setStatus("success");
        setSubject("");
        setDescription("");
      } else {
        setStatus("error");
        setErrorMsg(data.error || "Failed to submit ticket");
      }
    } catch (err) {
      setStatus("error");
      setErrorMsg("Something went wrong");
    }
  };

  return (
    <div className="flex-1 overflow-y-auto w-full p-4 md:p-8">
      <div className="max-w-3xl mx-auto mt-8 md:mt-16 animate-fade-in">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-phantom-500/20 mb-4 ring-1 ring-phantom-500/50 shadow-[0_0_30px_rgba(139,92,246,0.3)]">
            <ShieldAlert className="w-8 h-8 text-phantom-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Support & Reports</h1>
          <p className="text-ghost-400">Report a bug, request a feature, or report an abusive user.</p>
        </div>

        <div className="glass-panel p-6 md:p-8 rounded-2xl border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-phantom-600 via-phantom-400 to-neon-cyan"></div>
          
          {status === "success" ? (
            <div className="text-center py-12 animate-slide-up">
              <CheckCircle2 className="w-16 h-16 text-neon-cyan mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Ticket Submitted!</h2>
              <p className="text-ghost-400 mb-6">Our admins will review your report shortly. Thank you for helping keep GhostVerse safe.</p>
              <button onClick={() => setStatus("idle")} className="btn-secondary px-6 py-2">Submit Another</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {status === "error" && (
                <div className="p-4 bg-error/10 border border-error/30 rounded-xl text-neon-red text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-ghost-300 mb-2">Subject</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="glass-input focus-ring w-full py-3"
                  required
                >
                  <option value="" disabled className="bg-ghost-900">Select a topic...</option>
                  <option value="Report User" className="bg-ghost-900">Report Abusive User</option>
                  <option value="Bug Report" className="bg-ghost-900">Report a Bug/Glitch</option>
                  <option value="Feature Request" className="bg-ghost-900">Feature Request</option>
                  <option value="Other" className="bg-ghost-900">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-ghost-300 mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="glass-input focus-ring w-full h-32 py-3 resize-none"
                  placeholder="Please provide details. If reporting a user, include their @username."
                  required
                />
              </div>

              <button
                type="submit"
                disabled={status === "loading" || !subject || !description}
                className="btn-primary w-full py-3 text-lg font-bold flex items-center justify-center gap-2"
              >
                {status === "loading" ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <MessageSquare className="w-5 h-5" /> Submit Ticket
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
