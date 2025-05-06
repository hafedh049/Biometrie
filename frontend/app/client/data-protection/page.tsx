"use client"

import { motion } from "framer-motion"
import { Shield, Lock, Eye, FileCheck, Server, UserCheck } from "lucide-react"
import { useLanguage } from "@/components/language-provider"

export default function DataProtectionPage() {
  const { t } = useLanguage()

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  }

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  }

  const sections = [
    {
      title: "Data Encryption",
      icon: Lock,
      description:
        "All your personal data and files are encrypted using industry-standard AES-256 encryption. Your fingerprint data is stored using secure hashing algorithms that cannot be reversed.",
      color: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      title: "Transparency",
      icon: Eye,
      description:
        "We are fully transparent about what data we collect and how it's used. You can request a full export of your personal data at any time through the settings page.",
      color: "bg-green-100 dark:bg-green-900/20",
    },
    {
      title: "Data Minimization",
      icon: FileCheck,
      description:
        "We only collect the data that is absolutely necessary for the functioning of our services. Your fingerprint data never leaves your device in its raw form.",
      color: "bg-purple-100 dark:bg-purple-900/20",
    },
    {
      title: "EU Server Locations",
      icon: Server,
      description:
        "All our servers are located within the European Union, ensuring that your data is processed according to strict EU data protection standards.",
      color: "bg-amber-100 dark:bg-amber-900/20",
    },
    {
      title: "Right to be Forgotten",
      icon: UserCheck,
      description:
        "You have the right to request deletion of all your personal data. This can be done easily through your account settings or by contacting our Data Protection Officer.",
      color: "bg-rose-100 dark:bg-rose-900/20",
    },
  ]

  return (
    <div className="container max-w-4xl py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-12"
      >
        <div className="flex justify-center mb-4">
          <Shield className="h-16 w-16 text-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-4">GDPR Compliance & Data Protection</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          At FingerScanner, we take your privacy and data protection seriously. Here's how we comply with the General
          Data Protection Regulation.
        </p>
      </motion.div>

      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid gap-6 md:grid-cols-2">
        {sections.map((section, index) => (
          <motion.div
            key={index}
            variants={fadeIn}
            whileHover={{
              scale: 1.03,
              boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
              transition: { duration: 0.2 },
            }}
            className={`rounded-lg p-6 shadow-lg ${section.color} backdrop-blur-sm border border-transparent hover:border-primary/20 transition-all duration-300 cursor-pointer`}
          >
            <div className="flex items-start gap-4">
              <motion.div
                className="rounded-full bg-background p-3 shadow-md"
                whileHover={{ rotate: 5 }}
                animate={{ scale: [1, 1.1, 1], rotate: [0, -5, 0] }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse", repeatDelay: 1 }}
              >
                <section.icon className="h-6 w-6 text-primary" />
              </motion.div>
              <div>
                <motion.h3 className="text-xl font-semibold mb-2" whileHover={{ color: "var(--primary)" }}>
                  {section.title}
                </motion.h3>
                <p className="text-muted-foreground group-hover:text-foreground transition-colors duration-200">
                  {section.description}
                </p>
              </div>
            </div>
            <motion.div
              className="w-0 h-0.5 bg-primary mt-4"
              whileHover={{ width: "100%" }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 1.2,
          duration: 0.8,
          type: "spring",
          stiffness: 100,
        }}
        whileHover={{
          boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
          scale: 1.01,
          transition: { duration: 0.3 },
        }}
        className="mt-12 p-8 border border-primary/20 rounded-lg bg-card/50 backdrop-blur-sm relative overflow-hidden"
      >
        <motion.div
          className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
          }}
        />

        <motion.h2
          className="text-2xl font-bold mb-6 relative"
          initial={{ x: -20 }}
          animate={{ x: 0 }}
          transition={{ delay: 1.4, duration: 0.5 }}
        >
          <motion.span className="inline-block" whileHover={{ scale: 1.05, color: "var(--primary)" }}>
            Your Rights Under GDPR
          </motion.span>
          <motion.div
            className="h-1 w-20 bg-primary mt-2"
            initial={{ width: 0 }}
            animate={{ width: 80 }}
            transition={{ delay: 1.6, duration: 0.8 }}
          />
        </motion.h2>

        <motion.ul
          className="space-y-3 relative z-10"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.1 },
            },
          }}
          initial="hidden"
          animate="visible"
        >
          {[
            "Right to access your personal data",
            "Right to rectify inaccurate personal data",
            'Right to erasure ("right to be forgotten")',
            "Right to restrict processing of your data",
            "Right to data portability",
            "Right to object to processing of your data",
            "Rights related to automated decision making and profiling",
          ].map((right, index) => (
            <motion.li
              key={index}
              className="flex items-center gap-3 pl-2"
              variants={{
                hidden: { opacity: 0, x: -20 },
                visible: { opacity: 1, x: 0 },
              }}
              whileHover={{
                x: 5,
                transition: { duration: 0.2 },
              }}
            >
              <motion.div className="h-2 w-2 rounded-full bg-primary shrink-0" whileHover={{ scale: 1.5 }} />
              <span className="text-muted-foreground hover:text-foreground transition-colors">{right}</span>
            </motion.li>
          ))}
        </motion.ul>

        <motion.div
          className="mt-8 p-5 bg-primary/10 rounded-md border border-primary/20 relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2, duration: 0.5 }}
          whileHover={{
            backgroundColor: "var(--primary-20)",
            transition: { duration: 0.3 },
          }}
        >
          <motion.div
            className="absolute -right-10 -bottom-10 w-40 h-40 bg-primary/10 rounded-full blur-2xl"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 5,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
            }}
          />

          <p className="font-medium relative z-10">
            For any questions regarding your data or to exercise your rights, please contact our Data Protection Officer
            at:
            <motion.span
              className="block mt-3 font-bold text-primary"
              whileHover={{
                scale: 1.02,
                color: "var(--primary-darker)",
                transition: { duration: 0.2 },
              }}
            >
              techsupport@gmail.com
            </motion.span>
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
