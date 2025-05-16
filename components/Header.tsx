'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import siteMetadata from '@/data/siteMetadata'
import headerNavLinks from '@/data/headerNavLinks'
import Image from 'next/image'
import Link from './Link'
import MobileNav from './MobileNav'
import SearchButton from './SearchButton'
import DaysSince from './DaysSince'
import BatteryStatus from './BatteryStatus'

const Header = () => {
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const pathname = usePathname()
  const [showHeader, setShowHeader] = useState(true)

  useEffect(() => {
    setShowHeader(!pathname?.startsWith('/admin'))
  }, [pathname])

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      if (currentScrollY > lastScrollY) {
        setIsVisible(false) // Beim Scrollen nach unten ausblenden
      } else {
        setIsVisible(true) // Beim Scrollen nach oben einblenden
      }
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  const headerClass = `
    px-6 font-thin flex items-center w-full max-w-screen-xl mx-auto 
    dark:bg-gray-950 justify-between py-10 z-50 transition-transform duration-300 
    ${isVisible ? 'translate-y-0' : '-translate-y-full'}
  `

  return (
    showHeader && (
      <header className={headerClass}>
        <Link href="/" className="font-poppins font-thin" aria-label={siteMetadata.headerTitle}>
          <div className="flex items-center justify-between">
            <div className="mr-3">
              <Image
                src="/static/images/kokomo-bildmarke.svg"
                alt="Kokomo Logo"
                width={48}
                height={48}
                priority
              />
            </div>
            {typeof siteMetadata.headerTitle === 'string' ? (
              <div className="hidden sm:block">
                <div className="text-2xl font-semibold">{siteMetadata.headerTitle}</div>
                <div className="flex items-center space-x-2 text-xs font-light text-gray-500">
                  <DaysSince startDate="2022-09-17" />
                  <BatteryStatus />
                </div>
              </div>
            ) : (
              siteMetadata.headerTitle
            )}
          </div>
        </Link>
        <div className="flex items-center space-x-4 leading-5 sm:-mr-6 sm:space-x-6">
          <div className="font-poppins no-scrollbar hidden max-w-40 items-center gap-x-4 overflow-x-auto sm:flex md:max-w-72 lg:max-w-96">
            {headerNavLinks
              .filter((link) => link.href !== '/')
              .map((link) => (
                <Link
                  key={link.title}
                  href={link.href}
                  className="hover:text-primary-500 dark:hover:text-primary-400 m-1 font-medium text-gray-900 dark:text-gray-100"
                >
                  {link.title}
                </Link>
              ))}
          </div>
          <SearchButton />
          <MobileNav />
        </div>
      </header>
    )
  )
}

export default Header
