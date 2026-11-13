import Image from "next/image";

const TEAM = [
  {
    name: "Carl Aldouz D. Bicol",
    role: "Project Manager & Blockchain Developer",
    image: "/team-profile/bicol.jpg",
  },
  {
    name: "Johnrey M. Lualhati",
    role: "Blockchain Developer",
    image: "/team-profile/lualhati.jpg",
  },
  {
    name: "William Ed M. Perez",
    role: "Blockchain Developer",
    image: "/team-profile/perez.jpg",
  },
  {
    name: "Jhon Luis D. Valderama",
    role: "Project Manager & Automation Developer",
    image: "/team-profile/valderama.png",
  },
  {
    name: "Tristan Jay G. Mirano",
    role: "Automation Developer",
    image: "/team-profile/mirano.png",
  },
  {
    name: "Michael Dave B. Arellano",
    role: "Automation Developer",
    image: "/team-profile/arellano.png",
  },
];

export default function TeamSection() {
  return (
    <section
      id="team"
      className="bg-white px-6 py-20 scroll-mt-24"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-6 border-b border-slate-100 pb-8 md:flex-row md:items-end md:justify-between">
          <div className="animate-in-left motion-reduce:animate-none">
            <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-3">
              Our Team
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              The minds
              <br />
              behind <span className="text-primary">SK-Ledge.</span>
            </h2>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-slate-400 animate-in-right motion-reduce:animate-none md:text-right">
            Passionate developers bringing modern technology to local
            governance.
          </p>
        </div>

        {/* Team grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TEAM.map((member, idx) => (
            <div
              key={idx}
              style={{ animationDelay: `${idx * 60}ms` }}
              className="group flex cursor-pointer flex-col items-center rounded-3xl border border-slate-100 bg-white p-6 text-center animate-rise transition-all duration-300 motion-reduce:animate-none hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.14)] hover:ring-2 hover:ring-primary/10"
            >
              {/* Avatar */}
              <div className="w-16 h-16 shrink-0 rounded-2xl overflow-hidden border border-slate-100 mb-4 ring-4 ring-slate-50">
                <Image
                  src={member.image}
                  alt={`${member.name} Profile`}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 scale-105 group-hover:scale-100"
                  width={64}
                  height={64}
                />
              </div>

              {/* Text */}
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-900 leading-tight">
                  {member.name}
                </h3>
                <span className="mt-2 inline-block rounded-full bg-primary/5 border border-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
                  {member.role}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
