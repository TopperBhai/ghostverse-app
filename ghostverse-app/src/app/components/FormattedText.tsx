"use client";

import React, { useState } from "react";
import { UserProfileCard } from "./UserProfileCard";

interface FormattedTextProps {
  content: string;
  onInspect?: (user: { userId: string; username: string; displayName: string; avatar: string | null }) => void;
}

export function FormattedText({ content, onInspect }: FormattedTextProps) {
  const [inspectUser, setInspectUser] = useState<{ userId: string; username: string; displayName: string; avatar: string | null } | null>(null);

  const handleMentionClick = async (e: React.MouseEvent, username: string) => {
    e.stopPropagation();
    e.preventDefault();
    
    // If we have a custom onInspect (like in World Chat where it handles it at the page level)
    // we still need the user ID. It's better to fetch the user briefly or use the card's internal fetch.
    // UserProfileCard only needs username technically, but it expects userId too.
    // Actually, UserProfileCard fetches based on `username` prop! The `userId` is used for "isOwnProfile" check.
    // Let's just open our own UserProfileCard if onInspect is not provided.
    
    // Let's quickly fetch user basic info to populate the card
    try {
      const res = await fetch(`/api/users/${username}`);
      const data = await res.json();
      if (data.success && data.data) {
        const userInfo = {
          userId: data.data.id,
          username: data.data.username,
          displayName: data.data.displayName,
          avatar: data.data.avatar,
        };
        
        if (onInspect) {
          onInspect(userInfo);
        } else {
          setInspectUser(userInfo);
        }
      }
    } catch (err) {
      console.error("Failed to fetch mentioned user", err);
    }
  };

  // Parse mentions: @username
  const mentionRegex = /(@[a-zA-Z0-9_]+)/g;
  const parts = content.split(mentionRegex);

  return (
    <>
      <span className="whitespace-pre-wrap break-words">
        {parts.map((part, i) => {
          if (part.startsWith("@") && part.length > 1) {
            const username = part.substring(1);
            return (
              <span
                key={i}
                onClick={(e) => handleMentionClick(e, username)}
                className="text-phantom-400 font-bold hover:underline cursor-pointer transition-colors px-0.5 rounded hover:bg-phantom-500/10"
                title={`View @${username}'s profile`}
              >
                {part}
              </span>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </span>

      {inspectUser && !onInspect && (
        <UserProfileCard
          {...inspectUser}
          onClose={() => setInspectUser(null)}
        />
      )}
    </>
  );
}
