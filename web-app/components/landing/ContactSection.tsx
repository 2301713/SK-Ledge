import { Mail, MapPin, Clock, Send } from "lucide-react";

const CONTACT_EMAIL = "hello@skledge.ph";

const CARDS = [
  {
    icon: Mail,
    title: "Email Us",
    lines: ["hello@skledge.ph", "Replies within 24 hours"],
  },
  {
    icon: MapPin,
    title: "Location",
    lines: ["Province of Batangas", "Philippines"],
  },
  {
    icon: Clock,
    title: "Support Hours",
    lines: ["Monday – Friday", "8:00 AM – 5:00 PM (PHT)"],
  },
];

export default function ContactSection() {
  return (
    <section
      id="contact"
      className="border-t border-white/8 bg-slate-950 px-6 py-20 scroll-mt-24"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12 flex flex-col gap-6 border-b border-white/8 pb-8 md:flex-row md:items-end md:justify-between">
          <div className="animate-in-left motion-reduce:animate-none">
            <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-3">
              Contact
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Let&apos;s build better
              <br />
              governance <span className="text-tertiary">together.</span>
            </h2>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-slate-400 animate-in-right motion-reduce:animate-none md:text-right">
            Questions about SK-Ledge? Our team is ready to help your barangay
            get onboarded.
          </p>
        </div>

        {/* Contact cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {CARDS.map((card, idx) => (
            <div
              key={idx}
              style={{ animationDelay: `${idx * 70}ms` }}
              className="group animate-rise rounded-3xl border border-white/8 bg-slate-900 p-6 transition-all duration-300 motion-reduce:animate-none hover:-translate-y-0.5 hover:border-primary/30"
            >
              <div className="w-10 h-10 rounded-xl bg-tertiary/15 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <card.icon className="w-5 h-5 text-tertiary" />
              </div>
              <h3 className="text-sm font-bold text-white mb-2">{card.title}</h3>
              <div className="space-y-0.5">
                {card.lines.map((line, i) => (
                  <p
                    key={i}
                    className={`text-xs ${
                      i === 0 ? "text-slate-300 font-medium" : "text-slate-500"
                    }`}
                  >
                    {line}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex justify-center animate-rise motion-reduce:animate-none">
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-all group shadow-lg shadow-primary/20"
          >
            <Send className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            Send Us a Message
          </a>
        </div>
      </div>
    </section>
  );
}
