export interface CommentUser {
  login: string
  avatar_url: string
  email?: string
  name?: string
}

export interface Comment {
  id: number
  body: string
  user: CommentUser
  created_at: string
  html_url: string
  metadata?: {
    name: string
    email: string
  }
  isApproved: boolean // Hinzugefügt
}

export interface GitHubComment {
  id: number
  body: string
  user: {
    login: string
    avatar_url: string
  }
  created_at: string
  html_url: string
}

export interface CommentFormData {
  name: string
  email: string
  comment: string
}
