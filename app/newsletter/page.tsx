import { allNewsletters } from 'contentlayer/generated'
import { MDXLayoutRenderer } from 'pliny/mdx-components'
import NewsletterLayout from '@/layouts/NewsletterLayout'
import { coreContent } from 'pliny/utils/contentlayer'
import { genPageMetadata } from 'app/seo'

export const metadata = genPageMetadata({ title: 'Newsletter' })

export default function Page() {
  const newsletter = allNewsletters.find((p) => p.slug === 'default')
  const mainContent = newsletter ? coreContent(newsletter) : null

  return (
    <>
      {mainContent && (
        <NewsletterLayout content={mainContent}>
          {newsletter && <MDXLayoutRenderer code={newsletter.body.code} />}
        </NewsletterLayout>
      )}
    </>
  )
}
