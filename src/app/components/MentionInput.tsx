"use client";

import React, { useState, useEffect, useRef, KeyboardEvent, ChangeEvent } from "react";
import { getGhostLevel } from "../../lib/levels";

export interface MentionUser {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
  reputationScore?: number;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  className?: string;
  maxLength?: number;
  isTextArea?: boolean;
  rows?: number;
  autoFocus?: boolean;
}

export function MentionInput({
  value,
  onChange,
  onSubmit,
  placeholder,
  className = "",
  maxLength,
  isTextArea = false,
  rows = 3,
  autoFocus = false,
}: MentionInputProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<MentionUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStartIdx, setMentionStartIdx] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Focus on mount
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Handle typing and trigger search
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    const cursorPosition = e.target.selectionStart || 0;
    const textBeforeCursor = newValue.slice(0, cursorPosition);
    
    // Check if we are typing a mention (matches @ followed by word characters up to the cursor)
    const mentionMatch = textBeforeCursor.match(/(^|\s)@([a-zA-Z0-9_]*)$/);

    if (mentionMatch) {
      const query = mentionMatch[2];
      setSearchQuery(query);
      setMentionStartIdx(cursorPosition - query.length - 1);
      setShowDropdown(true);
      fetchUsers(query);
    } else {
      setShowDropdown(false);
      setSearchQuery("");
      setMentionStartIdx(-1);
    }
  };

  const fetchUsers = async (query: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
        setSelectedIndex(0);
      }
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const insertMention = (user: MentionUser) => {
    if (mentionStartIdx === -1 || !inputRef.current) return;
    
    const beforeMention = value.slice(0, mentionStartIdx);
    const afterMention = value.slice(inputRef.current.selectionStart || 0);
    
    const newValue = `${beforeMention}@${user.username} ${afterMention}`;
    onChange(newValue);
    
    setShowDropdown(false);
    setSearchQuery("");
    setMentionStartIdx(-1);
    
    // Focus back on input and move cursor
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const newCursorPos = beforeMention.length + user.username.length + 2; // +2 for @ and space
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (showDropdown && users.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < users.length - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : users.length - 1));
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(users[selectedIndex]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setShowDropdown(false);
      }
    } else if (e.key === "Enter" && !e.shiftKey && onSubmit) {
      e.preventDefault();
      onSubmit();
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative flex-1 w-full flex">
      {isTextArea ? (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={className}
          maxLength={maxLength}
          rows={rows}
        />
      ) : (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={className}
          maxLength={maxLength}
        />
      )}

      {/* Autocomplete Dropdown */}
      {showDropdown && (
        <div 
          ref={dropdownRef}
          className={`absolute z-50 w-full md:w-64 bg-ghost-900 border border-ghost-800 rounded-xl shadow-2xl overflow-hidden animate-fade-in ${isTextArea ? 'bottom-full mb-2' : 'bottom-full mb-2'}`}
        >
          {loading && users.length === 0 ? (
            <div className="p-3 text-xs text-ghost-500 text-center">Searching...</div>
          ) : users.length === 0 ? (
            <div className="p-3 text-xs text-ghost-500 text-center">No users found</div>
          ) : (
            <ul className="max-h-48 overflow-y-auto py-1 custom-scrollbar">
              {users.map((user, idx) => {
                const level = getGhostLevel(user.reputationScore || 0);
                return (
                  <li
                    key={user.id}
                    onClick={() => insertMention(user)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${
                      idx === selectedIndex ? "bg-phantom-500/20" : "hover:bg-ghost-800/50"
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-ghost-800 flex-shrink-0">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.displayName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-ghost-400">
                          {user.displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className={`text-xs font-bold truncate ${level.color}`}>{user.displayName}</span>
                        {level.badge && <span className="scale-75 origin-left">{level.badge}</span>}
                      </div>
                      <span className="text-[10px] text-ghost-500 truncate block">@{user.username}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
