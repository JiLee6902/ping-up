export enum SocketEvent {
  NEW_MESSAGE = 'newMessage',
  MESSAGE_REQUEST = 'messageRequest',
  MESSAGE_SEEN = 'messageSeen',
  CONNECTION_REQUEST = 'connectionRequest',
  CONNECTION_ACCEPTED = 'connectionAccepted',
  NEW_FOLLOWER = 'newFollower',
  TYPING = 'typing',
  STOP_TYPING = 'stopTyping',
  // Chat Settings
  CHAT_SETTINGS_UPDATED = 'chatSettingsUpdated',
  CHAT_EVENT_CREATED = 'chatEventCreated',
  // Online Status
  USER_ONLINE = 'userOnline',
  USER_OFFLINE = 'userOffline',
  // WebRTC Signaling
  CALL_OFFER = 'callOffer',
  CALL_ANSWER = 'callAnswer',
  ICE_CANDIDATE = 'iceCandidate',
  CALL_END = 'callEnd',
  CALL_REJECTED = 'callRejected',
  // Post Updates
  POST_LIKED = 'postLiked',
  POST_COMMENTED = 'postCommented',
  COMMENT_LIKED = 'commentLiked',
  // Notifications
  NOTIFICATION = 'notification',
  // Group Chat
  GROUP_CREATED = 'groupCreated',
  GROUP_UPDATED = 'groupUpdated',
  GROUP_DELETED = 'groupDeleted',
  GROUP_MESSAGE = 'groupMessage',
  GROUP_MEMBER_ADDED = 'groupMemberAdded',
  GROUP_MEMBER_REMOVED = 'groupMemberRemoved',
  GROUP_MEMBER_ROLE_UPDATED = 'groupMemberRoleUpdated',
}

export interface SocketEventDto {
  newMessage: {
    id: string;
    fromUserId: string;
    fromUser: {
      id: string;
      fullName: string;
      username: string;
      profilePicture?: string;
    };
    text?: string;
    messageType: string;
    mediaUrl?: string;
    createdAt: Date;
  };
  connectionRequest: {
    id: string;
    fromUserId: string;
    fromUser: {
      id: string;
      fullName: string;
      username: string;
      profilePicture?: string;
    };
    createdAt: Date;
  };
  connectionAccepted: {
    id: string;
    userId: string;
    user: {
      id: string;
      fullName: string;
      username: string;
      profilePicture?: string;
    };
  };
  newFollower: {
    userId: string;
    user: {
      id: string;
      fullName: string;
      username: string;
      profilePicture?: string;
    };
  };
  postLiked: {
    postId: string;
    likesCount: number;
    likedBy: {
      id: string;
      fullName: string;
      username: string;
      profilePicture?: string;
    };
  };
  postCommented: {
    postId: string;
    commentsCount: number;
    comment: {
      id: string;
      content: string;
      user: {
        id: string;
        fullName: string;
        username: string;
        profilePicture?: string;
      };
      createdAt: Date;
    };
  };
  commentLiked: {
    commentId: string;
    postId: string;
    likesCount: number;
    likedBy: {
      id: string;
      fullName: string;
      username: string;
      profilePicture?: string;
    };
  };
  notification: {
    id: string;
    type: string;
    message: string;
    isRead: boolean;
    postId?: string;
    commentId?: string;
    actor: {
      id: string;
      fullName: string;
      username: string;
      profilePicture?: string;
    } | null;
    createdAt: Date;
  };
}
