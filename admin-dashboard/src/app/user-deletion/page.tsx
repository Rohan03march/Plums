import React from 'react';
import { Shield, Trash2, History, Database, Clock, Info, Globe, Mail, AlertTriangle } from 'lucide-react';

export default function UserDeletionPage() {
  const lastUpdated = "April 2, 2026";

  const sections = [
    {
      id: "how-to-delete",
      icon: Trash2,
      title: "How to Delete Your Account",
      content: "Users can initiate account deletion directly through the Plums mobile application. Navigate to Settings > Account > Delete Account. You will be asked to confirm your choice. Once confirmed, your account will be scheduled for permanent deletion."
    },
    {
      id: "call-logs",
      icon: History,
      title: "Call Log Deletion",
      content: "Upon account deletion, all your personal call logs and communication history are purged from our active databases. This includes timestamps, duration, and participant IDs associated with your account. This process is irreversible."
    },
    {
      id: "data-retention",
      icon: Clock,
      title: "Data Handling After Deletion",
      content: "While your personal identifiers and logs are removed immediately, some anonymized transaction data may be retained for up to 180 days to comply with financial regulations and prevent fraud. After this period, even this anonymized data is permanently purged."
    },
    {
      id: "irreversibility",
      icon: AlertTriangle,
      title: "Important Notice",
      content: "Deleting your account is a permanent action. You will lose access to any remaining coin balance, premium features, and your unique username. Plums cannot recover deleted accounts or lost assets."
    },
    {
      id: "support-deletion",
      icon: Mail,
      title: "Manual Deletion Request",
      content: "If you are unable to access the app, you can request account deletion by emailing our support team at info@plums.com from your registered email address. We will process your request within 48 hours."
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0f18] text-white">
      {/* Background Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-rose-500/10 blur-[120px] pointer-events-none" />
      
      <div className="relative max-w-4xl mx-auto px-6 py-20 lg:py-32">
        {/* Header */}
        <header className="mb-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-full mb-6">
            <Trash2 className="w-4 h-4 text-rose-500" />
            <span className="text-[10px] text-rose-500 font-bold uppercase tracking-widest leading-none">Data Management</span>
          </div>
          <h1 className="text-4xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
            User Deletion & Data
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
            We value your right to be forgotten. This page explains the process and implications of deleting your Plums account and associated data.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4 text-sm text-gray-500 font-medium">
            <span className="flex items-center gap-1.5"><Globe className="w-4 h-4" /> Global Compliance</span>
            <span className="w-1 h-1 bg-gray-700 rounded-full" />
            <span>Updated {lastUpdated}</span>
          </div>
        </header>

        {/* Content Sections */}
        <div className="space-y-8">
          {sections.map((section) => (
            <div 
              key={section.id}
              className="group p-8 lg:p-10 bg-white/5 border border-white/10 rounded-[2.5rem] hover:bg-white/[0.07] hover:border-white/20 transition-all duration-300"
            >
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20 group-hover:scale-105 transition-transform duration-300">
                    <section.icon className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                    {section.title}
                  </h2>
                  <p className="text-gray-400 leading-relaxed text-lg">
                    {section.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-20 pt-20 border-t border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <h3 className="text-2xl font-bold text-white mb-4">Request Data Export</h3>
              <p className="text-gray-400 leading-relaxed mb-6">
                Before deleting your account, you can request a copy of your personal data. Contact us at least 7 days before initiating deletion.
              </p>
              <div className="space-y-4">
                <a 
                  href="mailto:info@plums.com" 
                  className="flex items-center gap-3 group w-fit"
                >
                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-rose-500/10 group-hover:text-rose-500 transition-all">
                    <Mail className="w-5 h-5 text-gray-400 group-hover:text-rose-500" />
                  </div>
                  <span className="text-gray-300 font-medium group-hover:text-white transition-colors">info@plums.com</span>
                </a>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-rose-500/10 to-transparent p-8 rounded-3xl border border-rose-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-rose-500/20">
                  P
                </div>
                <h4 className="text-xl font-bold text-white">Plums</h4>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed italic">
                "We provide clear and simple tools for you to manage your digital footprint on our platform."
              </p>
            </div>
          </div>
          
          <div className="mt-20 text-center text-gray-600 text-sm">
            &copy; 2026 Plums Inc. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  );
}
