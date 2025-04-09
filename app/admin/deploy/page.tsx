'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const GITHUB_API = 'https://api.github.com'
const REPO_OWNER = process.env.NEXT_PUBLIC_GITHUB_REPO_OWNER!
const REPO_NAME = process.env.NEXT_PUBLIC_GITHUB_REPO_NAME!
const DEPLOY_HOOK =
  'https://api.vercel.com/v1/integrations/deploy/prj_G8a70RbGkJnvtrei1G9oMEeOdPMf/zB4KL6PfzJ'

export default function DeployPage() {
  interface CommitData {
    commit: {
      message: string
      author: {
        name: string
        date: string
      }
    }
    html_url: string
  }

  const [commitData, setCommitData] = useState<CommitData | null>(null)

  useEffect(() => {
    const fetchCommit = async () => {
      try {
        const res = await fetch(`/api/github-commit`)
        const data = await res.json()
        setCommitData(data)
      } catch (err) {
        toast.error('Fehler beim Laden des Commits')
      }
    }
    fetchCommit()
  }, [])

  const triggerDeploy = async () => {
    try {
      const res = await fetch(DEPLOY_HOOK, { method: 'POST' })
      if (!res.ok) throw new Error('Deploy fehlgeschlagen')
      toast.success('🚀 Deploy wurde ausgelöst!')
    } catch (err) {
      toast.error('Deploy konnte nicht ausgelöst werden')
    }
  }

  if (!commitData) return <p>Lade Commit-Daten...</p>

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">🔁 Deploy-Status</h1>

      <div className="rounded border bg-white p-4 shadow">
        <p className="text-sm text-gray-500">
          Letzter Commit auf <code>main</code>:
        </p>
        <p className="text-lg font-semibold">{commitData.commit.message}</p>
        <p className="text-sm text-gray-600">
          von {commitData.commit.author.name} am{' '}
          {new Date(commitData.commit.author.date).toLocaleString()}
        </p>
        <a
          href={commitData.html_url}
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 underline"
        >
          GitHub Link
        </a>
      </div>

      <Button onClick={triggerDeploy}>🚀 Re-Deploy auslösen</Button>
    </div>
  )
}
