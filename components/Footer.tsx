import Link from './Link'
import siteMetadata from '@/data/siteMetadata'
import SocialIcon from '@/components/social-icons'
import { NewsletterForm } from './NewsletterForm'

export default function Footer() {
  return (
    <footer className="w-full bg-gray-100 dark:bg-gray-800">
      {/* Newsletter Section */}
      <div className="mx-auto max-w-7xl px-6 pt-16">
        <div className="mb-12">
          <NewsletterForm />
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-700" />

        {/* Footer Content */}
        <div className="py-8">
          <div className="flex flex-col items-center">
            <div className="mb-3 flex space-x-4">
              <SocialIcon kind="mail" href={`mailto:${siteMetadata.email}`} size={6} />
              <SocialIcon kind="linkedin" href={siteMetadata.linkedin} size={6} />
              <SocialIcon kind="facebook" href={siteMetadata.facebook} size={6} />
              <SocialIcon kind="instagram" href={siteMetadata.instagram} size={6} />
            </div>
            <div className="mb-2 flex flex-wrap justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <div>{siteMetadata.author}</div>
              <div>{` • `}</div>
              <div>{`© ${new Date().getFullYear()}`}</div>
              <div>{` • `}</div>
              <Link href="/">{siteMetadata.title}</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
