"use client";

import { useAuth } from "../../../custom-hooks/use-auth";
import { useState, useEffect } from "react";
import { User, Lock, Save, AlertCircle, CheckCircle2 } from "lucide-react";
import { PushNotificationManager } from "../../components/PushNotificationManager";

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  
  // Username State
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [usernameMsg, setUsernameMsg] = useState("");

  // Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [passwordMsg, setPasswordMsg] = useState("");

  useEffect(() => {
    if (user) setUsername(user.username);
  }, [user]);

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || username === user?.username) return;

    setUsernameStatus("loading");
    try {
      const res = await fetch("/api/settings/username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newUsername: username.trim() }),
      });
      const data = await res.json();
      
      if (data.success) {
        setUsernameStatus("success");
        setUsernameMsg("Username updated successfully!");
        await refreshUser();
        // Clear success message after 3 seconds
        setTimeout(() => setUsernameStatus("idle"), 3000);
      } else {
        setUsernameStatus("error");
        setUsernameMsg(data.error || "Failed to update username");
      }
    } catch (err) {
      setUsernameStatus("error");
      setUsernameMsg("Something went wrong");
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) return;
    
    if (newPassword !== confirmPassword) {
      setPasswordStatus("error");
      setPasswordMsg("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordStatus("error");
      setPasswordMsg("Password must be at least 6 characters long");
      return;
    }

    setPasswordStatus("loading");
    try {
      const res = await fetch("/api/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      
      if (data.success) {
        setPasswordStatus("success");
        setPasswordMsg("Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        // Clear success message after 3 seconds
        setTimeout(() => setPasswordStatus("idle"), 3000);
      } else {
        setPasswordStatus("error");
        setPasswordMsg(data.error || "Failed to update password");
      }
    } catch (err) {
      setPasswordStatus("error");
      setPasswordMsg("Something went wrong");
    }
  };

  if (!user) return null;

  return (
    <div className="flex-1 overflow-y-auto w-full p-4 md:p-8">
      <div className="max-w-3xl mx-auto mt-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Account Settings</h1>
        <p className="text-ghost-400 mb-8">Manage your account security and preferences.</p>

        <PushNotificationManager />

        {/* Change Username Section */}
        <div className="glass-panel p-6 md:p-8 rounded-2xl border border-white/5 relative overflow-hidden mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-phantom-500/20 rounded-lg">
              <User className="w-5 h-5 text-phantom-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Change Username</h2>
          </div>

          <form onSubmit={handleUsernameSubmit} className="space-y-4">
            {usernameStatus === "error" && (
              <div className="p-4 bg-error/10 border border-error/30 rounded-xl text-neon-red text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {usernameMsg}
              </div>
            )}
            {usernameStatus === "success" && (
              <div className="p-4 bg-success/10 border border-success/30 rounded-xl text-success text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> {usernameMsg}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-ghost-300 mb-2">Username</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ghost-500 font-bold">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (usernameStatus !== "idle") setUsernameStatus("idle");
                  }}
                  className="glass-input focus-ring w-full py-3 pl-8"
                  placeholder="new_username"
                  maxLength={20}
                  required
                />
              </div>
              <p className="text-xs text-ghost-500 mt-2">Only letters, numbers, and underscores. 3-20 characters.</p>
            </div>

            <button
              type="submit"
              disabled={usernameStatus === "loading" || !username.trim() || username === user.username}
              className="btn-primary py-2.5 px-6 font-bold flex items-center gap-2 mt-2"
            >
              {usernameStatus === "loading" ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Username
            </button>
          </form>
        </div>

        {/* Change Password Section */}
        <div className="glass-panel p-6 md:p-8 rounded-2xl border border-white/5 relative overflow-hidden">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-phantom-500/20 rounded-lg">
              <Lock className="w-5 h-5 text-phantom-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Change Password</h2>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {passwordStatus === "error" && (
              <div className="p-4 bg-error/10 border border-error/30 rounded-xl text-neon-red text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {passwordMsg}
              </div>
            )}
            {passwordStatus === "success" && (
              <div className="p-4 bg-success/10 border border-success/30 rounded-xl text-success text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> {passwordMsg}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-ghost-300 mb-2">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="glass-input focus-ring w-full py-3"
                placeholder="Enter current password"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ghost-300 mb-2">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="glass-input focus-ring w-full py-3"
                placeholder="Enter new password (min 6 characters)"
                minLength={6}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ghost-300 mb-2">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="glass-input focus-ring w-full py-3"
                placeholder="Confirm new password"
                minLength={6}
                required
              />
            </div>

            <button
              type="submit"
              disabled={passwordStatus === "loading" || !currentPassword || !newPassword || !confirmPassword}
              className="btn-primary py-2.5 px-6 font-bold flex items-center gap-2 mt-4"
            >
              {passwordStatus === "loading" ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Update Password
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
