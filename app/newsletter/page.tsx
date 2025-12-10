import { allNewsletters } from 'contentlayer/generated'
import { MDXLayoutRenderer } from 'pliny/mdx-components'
import NewsletterLayout from '@/layouts/NewsletterLayout'
import { coreContent } from 'pliny/utils/contentlayer'
import { genPageMetadata } from 'app/seo'
import AnimatedBackground from '@/components/animated-background'
import mdxComponents from '@/components/MDXComponents'

export const metadata = genPageMetadata({ title: 'Newsletter' })

export default function Page() {
  const newsletter = allNewsletters.find((p) => p.slug === 'default')
  const mainContent = newsletter ? coreContent(newsletter) : null

  return (
    <>
      <AnimatedBackground />
      {mainContent && (
        <div className="rounded-lg bg-white/70 p-6 shadow-md">
          <NewsletterLayout content={mainContent}>
            {newsletter && (
              <MDXLayoutRenderer code={newsletter.body.code} components={mdxComponents} />
            )}
          </NewsletterLayout>
        </div>
      )}
    </>
  )
}
