import { Authors, allAuthors } from 'contentlayer/generated'
import { MDXLayoutRenderer } from 'pliny/mdx-components'
import AuthorLayout from '@/layouts/AuthorLayout'
import { coreContent } from 'pliny/utils/contentlayer'
import { genPageMetadata } from 'app/seo'
import AnimatedBackground from '@/components/animated-background'
import mdxComponents from '@/components/MDXComponents'

export const metadata = genPageMetadata({ title: 'About' })

export default function Page() {
  const author = allAuthors.find((p) => p.slug === 'default') as Authors
  const mainContent = coreContent(author)

  return (
    <>
      <AnimatedBackground />
      <div className="rounded-lg bg-white/70 p-6 shadow-md">
        <AuthorLayout content={mainContent}>
          <MDXLayoutRenderer code={author.body.code} components={mdxComponents} />
        </AuthorLayout>
      </div>
    </>
  )
}
