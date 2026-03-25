export interface XAccount {
  id: string;
  orgId: string;
  xUserId: string;
  handle: string;
  name: string;
  avatarUrl?: string | null;
  verified: boolean;
  category?: string | null;
  status: "active" | "paused";
  tokenExpiresAt: Date;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  lastPostAt?: Date | null;
  createdAt: Date;
  unreadCount?: number;
}

export interface Post {
  id: string;
  orgId: string;
  status:
    | "draft"
    | "pending"
    | "approved"
    | "rejected"
    | "scheduled"
    | "published"
    | "failed";
  scheduledAt?: Date | null;
  publishedAt?: Date | null;
  authorId: string;
  approverId?: string | null;
  rejectReason?: string | null;
  campaignId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  variants?: PostVariant[];
  author?: { name: string; email: string };
}

export interface PostVariant {
  id: string;
  postId: string;
  xAccountId: string;
  text: string;
  mediaUrls: string[];
  xTweetId?: string | null;
  xAccount?: { handle: string; name: string };
}

export interface InboxItem {
  id: string;
  xAccountId: string;
  type: "mention" | "reply" | "quote" | "dm";
  fromHandle: string;
  fromUserId?: string | null;
  text: string;
  xTweetId?: string | null;
  status: "unread" | "assigned" | "done";
  assigneeId?: string | null;
  priority: "urgent" | "high" | "normal" | "low";
  receivedAt: Date;
  createdAt: Date;
  xAccount?: { handle: string; name: string };
  assignee?: { name: string } | null;
}

export interface AnalyticsSnapshot {
  id: string;
  xAccountId: string;
  date: Date;
  impressions: bigint;
  engagements: number;
  likes: number;
  retweets: number;
  replies: number;
  clicks: number;
  followers: number;
  following: number;
}

export interface ListeningKeyword {
  id: string;
  orgId: string;
  keyword: string;
  type: "brand" | "hashtag" | "competitor" | "risk" | "industry" | "custom";
  alertThreshold?: number | null;
  enabled: boolean;
  createdAt: Date;
  mentions?: ListeningMention[];
  _count?: { mentions: number };
}

export interface ListeningMention {
  id: string;
  keywordId: string;
  xTweetId: string;
  text: string;
  sentiment: number;
  authorHandle?: string | null;
  createdAt: Date;
}

export interface Guardrail {
  id: string;
  orgId: string;
  name: string;
  type: "content" | "media" | "link" | "schedule" | "legal";
  configJson: Record<string, unknown>;
  enabled: boolean;
  createdAt: Date;
}

export interface Campaign {
  id: string;
  orgId: string;
  name: string;
  status: "planned" | "active" | "completed";
  startDate: Date;
  endDate: Date;
  budget: number;
  createdAt: Date;
  posts?: Post[];
}

export interface AuditLog {
  id: string;
  orgId: string;
  userId?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  detail?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date;
  user?: { name: string; email: string } | null;
}

export interface TeamMember {
  id: string;
  orgId: string;
  email: string;
  name: string;
  role: "admin" | "approver" | "editor" | "viewer";
  avatarUrl?: string | null;
  createdAt: Date;
}
