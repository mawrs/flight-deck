"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { dateOnly } from "@/lib/format";
import { openEmailPdf } from "@/lib/export/email-pdf";
import { sampleDocumentHref } from "@/lib/documents";
import { displayCaseNumber } from "@/lib/ops-logic";
import { useOps } from "@/lib/ops-store";
import type { CaseDocument, FeedPost, ServicingCase } from "@/lib/ops-types";

export function CaseDocuments({ caseId }: { caseId: string }) {
  const ops = useOps();
  const item = ops.cases.find((entry) => entry.id === caseId);
  const caseNumber = item ? displayCaseNumber(item) : "";
  const documents = [...(ops.documents ?? [])]
    .filter((item) => item.caseId === caseId)
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));

  return (
    <div className="flex flex-col bg-white">
      <div className="uw-card-header">
        <h2 className="text-lg text-black">Documents</h2>
      </div>
      {documents.length === 0 ? (
        <p className="px-xl py-lg text-sm text-gray-medium">No documents have been uploaded for this case.</p>
      ) : (
        <table className="uw-case-docs">
          <thead>
            <tr>
              <th>Document</th>
              <th>Uploaded by</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((item) => (
              <tr key={item.id}>
                    <td>
                      {item.emailBody ? (
                        <button type="button" className="text-primary underline" onClick={() => openEmailPdf({
                          to: item.emailTo ?? "",
                          cc: item.emailCc,
                          bcc: item.emailBcc,
                          subject: item.subject ?? item.name,
                          body: item.emailBody ?? "",
                          sentAt: dateOnly(item.uploadedAt),
                          caseNumber,
                        })}>
                          {item.name}
                        </button>
                      ) : (
                        <a href={sampleDocumentHref(item.fileName)} target="_blank" rel="noreferrer">
                          {item.name}
                        </a>
                      )}
                    </td>
                <td>{item.uploadedBy}</td>
                <td>{dateOnly(item.uploadedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export function CaseFeed({ caseId, author }: { caseId: string; author: string }) {
  const ops = useOps();
  const [draft, setDraft] = useState("");
  const [comments, setComments] = useState<Record<string, string>>({});
  const item = ops.cases.find((entry) => entry.id === caseId);
  const caseNumber = item ? displayCaseNumber(item) : "";
  const posts = postsForCase(ops.feed ?? [], item);

  return (
    <aside className="flex h-full min-h-0 w-full flex-col overflow-hidden border-r border-gray-light bg-white">
      <div className="uw-card-header shrink-0">
        <h2 className="text-lg text-black">Feed</h2>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-lg overflow-auto px-xl py-lg">
        <form
          className="flex flex-col gap-sm"
          onSubmit={(event) => {
            event.preventDefault();
            ops.addFeedPost(caseId, author, draft);
            setDraft("");
          }}
        >
          <label className="flex flex-col gap-xs text-xs text-gray-medium">
            Leave a note as {author}
            <textarea
              className="uw-input w-full"
              rows={3}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="What should the other bankers know about this case?"
            />
          </label>
          <div className="flex justify-end">
            <Button size="small" type="submit" disabled={!draft.trim()}>
              Post
            </Button>
          </div>
        </form>
        {posts.map((post) => {
          const comment = comments[post.id] ?? "";
          return (
            <article key={post.id} className="flex flex-col gap-sm border-t border-gray-light pt-lg">
              <div className="flex items-center gap-sm">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-lightest text-xs text-gray-dark">
                  {initials(post.author)}
                </span>
                <div className="min-w-0">
                  <p className="flex min-w-0 items-baseline gap-xs">
                    <span className="truncate text-sm text-black">{post.author}</span>
                    <span className="shrink-0 text-sm text-gray-medium">{postStatus(post)}</span>
                  </p>
                  <p className="text-xs text-gray-medium">{postedAgo(post.createdAt)}</p>
                </div>
              </div>
              {post.body ? <p className="text-sm whitespace-pre-line text-black">{feedBody(post, ops.documents ?? [], caseNumber)}</p> : null}
              <div className="flex items-center gap-md text-sm">
                <Button variant="link" size="small" icon={<ThumbIcon filled={post.liked} />} aria-pressed={post.liked} onClick={() => ops.toggleFeedLike(post.id)}>
                  Like{post.likes > 0 ? ` · ${post.likes}` : ""}
                </Button>
                <Button
                  variant="link"
                  size="small"
                  icon={<CommentIcon />}
                  onClick={() => document.getElementById(`feed-comment-${post.id}`)?.focus()}
                >
                  Comment
                </Button>
              </div>
              {post.comments.length > 0 ? (
                <ul className="flex flex-col gap-sm">
                  {post.comments.map((entry) => (
                    <li key={entry.id} className="rounded-xs bg-gray-lightest px-sm py-xs">
                      <p className="text-sm text-black">{entry.author}</p>
                      <p className="text-sm text-gray-dark">{entry.body}</p>
                    </li>
                  ))}
                </ul>
              ) : null}
              <form
                className="uw-comment-field"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!comment.trim()) return;
                  ops.addFeedComment(post.id, author, comment);
                  setComments((current) => ({ ...current, [post.id]: "" }));
                }}
              >
                <input
                  id={`feed-comment-${post.id}`}
                  className="uw-input"
                  value={comment}
                  onChange={(event) => setComments((current) => ({ ...current, [post.id]: event.target.value }))}
                  placeholder="Write a comment..."
                  aria-label={`Comment on ${post.author}'s note`}
                />
                <button type="submit" className="uw-comment-send" disabled={!comment.trim()} aria-label="Send comment">
                  <SendIcon />
                </button>
              </form>
            </article>
          );
        })}
      </div>
    </aside>
  );
}

function feedBody(post: FeedPost, documents: CaseDocument[], caseNumber = "") {
  if (post.kind !== "email") return post.body;
  const linked = documents.find((item) => item.id === post.id.replace(/^feed-/, "doc-"));
  const to = post.emailTo || linked?.emailTo || "";
  const cc = post.emailCc || linked?.emailCc || "";
  const bcc = post.emailBcc || linked?.emailBcc || "";
  const subject = post.subject || linked?.subject || "";
  const header = [
    caseNumber ? `Case: ${caseNumber}` : "",
    to ? `To: ${to}` : "",
    cc ? `Cc: ${cc}` : "",
    bcc ? `Bcc: ${bcc}` : "",
    subject ? `Subject: ${subject}` : "",
  ].filter(Boolean);
  return header.length ? `${header.join("\n")}\n\n${post.body}` : post.body;
}

function postsForCase(feed: FeedPost[], item: ServicingCase | undefined) {
  if (!item) return [];
  const posts = feed.filter((post) => post.caseId === item.id);
  const createdId = `created-${item.id}`;
  if (!posts.some((post) => post.id === createdId || post.kind === "created")) {
    posts.push({
      id: createdId,
      caseId: item.id,
      author: item.openedBy,
      body: item.details || item.subject,
      createdAt: item.openedAt,
      likes: 0,
      liked: false,
      comments: [],
      kind: "created",
    });
  }
  return posts.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function postStatus(post: FeedPost) {
  if (post.kind === "created") return "created this case";
  if (post.kind === "email") return `emailed ${post.audience || "the school"}`;
  return `to ${post.audience || "Southeast Bank Only"}`;
}

function ThumbIcon({ filled }: { filled?: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill={filled ? "currentColor" : "none"} aria-hidden>
      <path
        d="M5.2 7.2V13H3.4A1.4 1.4 0 0 1 2 11.6V8.6A1.4 1.4 0 0 1 3.4 7.2H5.2Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="M5.2 7.5 7.1 3.3A1.5 1.5 0 0 1 8.5 2.5c.5 0 .9.4.9.9V6h3.1a1.4 1.4 0 0 1 1.4 1.6l-.7 4.2a1.4 1.4 0 0 1-1.4 1.2H5.2"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M14.1 1.7a.8.8 0 0 0-.9-.1L1.5 6.6a.8.8 0 0 0 .1 1.5l4.7 1.4 1.4 4.7a.8.8 0 0 0 1.5.1l5.1-11.6a.8.8 0 0 0-.2-.9ZM7.4 8.6l5.4-5.4-3.8 7.6-.5-1.6a.8.8 0 0 0-.5-.5L7.4 8.6Z" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M3 3.5h10a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H7.2L4 14.2V11.5H3a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function postedAgo(value: string) {
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "";
  const minutes = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 14) return `${days}d ago`;
  return dateOnly(value);
}
