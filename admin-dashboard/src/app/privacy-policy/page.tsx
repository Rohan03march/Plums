import React from 'react';
import { Shield, Camera, Mic, Lock, Database, Info, Globe, Mail } from 'lucide-react';

export default function PrivacyPolicyPage() {
  const lastUpdated = "April 2, 2026";

  const sections = [
    {
      id: "camera",
      icon: Camera,
      title: "Camera Permission",
      content: "CallApp requires camera access to enable video calling features. Your camera is only activated when you explicitly initiate or accept a video call. Video data is processed in real-time for transmission to the other participant and is not stored on our servers."
    },
    {
      id: "audio",
      icon: Mic,
      title: "Microphone Permission",
      content: "Audio access is fundamental for both voice and video calls. Your microphone is used solely to capture your voice during active communication sessions. Similar to video data, audio streams are transmitted directly to the other party and are not recorded or archived by us."
    },
    {
      id: "data-usage",
      icon: Database,
      title: "Data Usage & Processing",
      content: "We collect minimal metadata about calls (duration, participants, and status) to ensure service quality and manage billing. Your personal information, such as email and profile details, is used only for account management and is never shared with third parties for marketing purposes."
    },
    {
      id: "security",
      icon: Shield,
      title: "Security Measures",
      content: "All communication streams are encrypted to prevent unauthorized interception. We employ industry-standard protocols to protect your data both in transit and at rest within our secure cloud infrastructure."
    },
    {
      id: "compliance",
      icon: Lock,
      title: "Privacy Compliance",
      content: "We adhere to global privacy standards and give you full control over your data. You can request data deletion or review your account information at any time through the support channels."
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0f18] text-white">
      {/* Background Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-pink-500/10 blur-[120px] pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-6 py-20 lg:py-32">
        {/* Header */}
        <header className="mb-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-pink-500/10 border border-pink-500/20 rounded-full mb-6">
            <Shield className="w-4 h-4 text-pink-500" />
            <span className="text-[10px] text-pink-500 font-bold uppercase tracking-widest leading-none">Security Center</span>
          </div>
          <h1 className="text-4xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
            Privacy Policy
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Your trust is our foundation. This policy details how Plums handles your sensitive data and permissions to provide a secure communication experience.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4 text-sm text-gray-500 font-medium">
            <span className="flex items-center gap-1.5"><Globe className="w-4 h-4" /> Global Coverage</span>
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
                  <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/20 group-hover:scale-105 transition-transform duration-300">
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

        {/* Contact/Support Footer */}
        <footer className="mt-20 pt-20 border-t border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <h3 className="text-2xl font-bold text-white mb-4">Have Questions?</h3>
              <p className="text-gray-400 leading-relaxed mb-6">
                Our privacy team is available to help clarify any points regarding your data safety and usage.
              </p>
              <div className="space-y-4">
                <a
                  href="mailto:info@plums.com"
                  className="flex items-center gap-3 group w-fit"
                >
                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-pink-500/10 group-hover:text-pink-500 transition-all">
                    <Mail className="w-5 h-5 text-gray-400 group-hover:text-pink-500" />
                  </div>
                  <span className="text-gray-300 font-medium group-hover:text-white transition-colors">support@callapp.com</span>
                </a>
              </div>
            </div>

            <div className="bg-gradient-to-br from-pink-500/10 to-transparent p-8 rounded-3xl border border-pink-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-pink-500 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-pink-500/20">
                  C
                </div>
                <h4 className="text-xl font-bold text-white">Plums</h4>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed italic">
                "We believe that privacy is not just a feature, but a fundamental human right. Our systems are built from the ground up to respect that."
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
