'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { Instagram, Mail, Globe } from 'lucide-react'

export default function AuthorProfile() {
  return (
    <div className="relative h-[500px] md:h-[400px]">
      {/* Hintergrund-Elemente */}
      <motion.div
        className="absolute top-[10%] left-[5%] z-0 h-[70%] w-[70%] rounded-[30%_70%_70%_30%/30%_30%_70%_70%] bg-[#00B2FF]/20"
        animate={{
          borderRadius: [
            '30% 70% 70% 30% / 30% 30% 70% 70%',
            '70% 30% 30% 70% / 70% 70% 30% 30%',
            '30% 70% 70% 30% / 30% 30% 70% 70%',
          ],
        }}
        transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
      />

      <motion.div
        className="absolute right-[10%] bottom-[5%] z-0 h-[60%] w-[60%] rounded-[70%_30%_30%_70%/70%_70%_30%_30%] bg-[#00FF7F]/20"
        animate={{
          borderRadius: [
            '70% 30% 30% 70% / 70% 70% 30% 30%',
            '30% 70% 70% 30% / 30% 30% 70% 70%',
            '70% 30% 30% 70% / 70% 70% 30% 30%',
          ],
        }}
        transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
      />

      {/* Autor-Bild */}
      <motion.div
        className="absolute top-[20%] left-[15%] z-20 h-[180px] w-[180px] md:top-[15%] md:left-[25%] md:h-[220px] md:w-[220px]"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="relative h-full w-full">
          <div className="absolute inset-0 overflow-hidden rounded-full border-4 border-white shadow-lg">
            <Image
              src="https://pub-29ede69a4da644b9b81fa3dd5f8e9d6a.r2.dev/TinyHouse_170722_21.webp?height=600&width=600"
              alt="Autoren des Tiny House Blogs KOKOMO.house"
              fill
              className="object-cover"
            />
          </div>
          <motion.div
            className="absolute -inset-2 rounded-full border-2 border-dashed border-[#00B2FF]"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
          />
        </div>
      </motion.div>

      {/* Autor-Name */}
      <motion.div
        className="absolute top-[5%] right-[10%] z-30 md:top-[10%] md:right-[25%]"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <h2 className="text-3xl font-bold text-white drop-shadow-lg md:text-4xl">
          Herzlich willkommen
        </h2>
        <h2 className="text-3xl font-bold text-white drop-shadow-lg md:text-4xl">
          auf kokomo.house
        </h2>
        <div className="mt-2 h-1 w-24 rounded-full bg-[#E6C288]" />
      </motion.div>

      {/* Autor-Bio */}
      <motion.div
        className="absolute top-[50%] right-[5%] z-30 max-w-[400px] rotate-2 transform rounded-lg bg-white/90 p-4 shadow-lg backdrop-blur-sm md:top-[40%] md:right-[15%]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <p className="text-sm text-gray-700 md:text-base">
          <strong>
            Brauchen wir wirklich 100 Quadratmeter, um zufrieden und glücklich zu sein?
          </strong>
        </p>
        <p>
          Seit September 2022 leben wir in unserem Tiny House KOKOMO. Erfahre auf unserem Blog alles
          über das Leben in einem Tiny House auf 36m2.
        </p>
      </motion.div>

      {/* Social Media */}
      <div className="absolute bottom-[-5%] left-[20%] z-30 mt-6 flex flex-col gap-4 md:bottom-[10%] md:mt-0">
        <motion.a
          href="#"
          className="flex -rotate-3 transform items-center gap-2 rounded-full bg-[#00B2FF] px-3 py-2 text-sm text-white shadow-lg"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.8 }}
          whileHover={{ scale: 1.05, rotate: 0 }}
        >
          <Instagram size={16} />
          <span>@kokomo-house</span>
        </motion.a>
        <motion.a
          href="#"
          className="flex rotate-2 transform items-center gap-2 rounded-full bg-[#00FF7F] px-3 py-2 text-sm text-white shadow-lg"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 1 }}
          whileHover={{ scale: 1.05, rotate: 0 }}
        >
          <Mail size={16} />
          <span>michi@kokomo.house</span>
        </motion.a>
        <motion.a
          href="#"
          className="flex -rotate-1 transform items-center gap-2 rounded-full bg-[#E6C288] px-3 py-2 text-sm text-white shadow-lg"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 1.2 }}
          whileHover={{ scale: 1.05, rotate: 0 }}
        >
          <Globe size={16} />
          <span>www.kokomo.house</span>
        </motion.a>
      </div>
    </div>
  )
}
