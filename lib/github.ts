const GITHUB_API_URL = 'https://api.github.com'
const REPO_OWNER = 'MichiMauch'
const REPO_NAME = 'kokomo'

export async function getIssueComments(issueNumber: number) {
  const token = process.env.GITHUB_ACCESS_TOKEN
  if (!token) {
    throw new Error('GITHUB_ACCESS_TOKEN is not set')
  }

  const response = await fetch(
    `${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/issues/${issueNumber}/comments`,
    {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'kokomo-blog',
      },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to fetch comments')
  }

  return response.json()
}

export async function createIssueComment(
  issueNumber: number,
  commentData: { name: string; email: string; comment: string; parentId?: number }
) {
  const token = process.env.GITHUB_ACCESS_TOKEN
  if (!token) {
    throw new Error('GITHUB_ACCESS_TOKEN is not set')
  }

  // Füge parent_id zum Kommentar hinzu, wenn es eine Antwort ist
  const parentInfo = commentData.parentId ? `\n\nparent_id: ${commentData.parentId}` : ''
  const commentBody = `[PENDING]\n\n**${commentData.name}** (${commentData.email})\n\n${commentData.comment}${parentInfo}`

  const response = await fetch(
    `${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/issues/${issueNumber}/comments`,
    {
      method: 'POST',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'kokomo-blog',
      },
      body: JSON.stringify({ body: commentBody }),
    }
  )

  if (!response.ok) {
    throw new Error('Failed to create comment')
  }

  return response.json()
}

export async function getOrCreateIssue(slug: string) {
  const token = process.env.GITHUB_ACCESS_TOKEN
  if (!token) {
    throw new Error('GITHUB_ACCESS_TOKEN is not set')
  }

  // Suche nach existierendem Issue
  const searchResponse = await fetch(
    `${GITHUB_API_URL}/search/issues?q=repo:${REPO_OWNER}/${REPO_NAME}+${encodeURIComponent(slug)}+in:title`,
    {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'kokomo-blog',
      },
    }
  )

  if (!searchResponse.ok) {
    throw new Error('Failed to search issues')
  }

  const searchData = await searchResponse.json()

  if (searchData.items && searchData.items.length > 0) {
    return searchData.items[0]
  }

  // Erstelle neues Issue
  const createResponse = await fetch(`${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/issues`, {
    method: 'POST',
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'kokomo-blog',
    },
    body: JSON.stringify({
      title: `Comments for: ${slug}`,
      body: `This issue tracks comments for the blog post: ${slug}`,
      labels: ['blog-comments'],
    }),
  })

  if (!createResponse.ok) {
    throw new Error('Failed to create issue')
  }

  return createResponse.json()
}
