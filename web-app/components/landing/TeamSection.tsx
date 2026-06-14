import Image from "next/image";

const TEAM = [
  {
    name: "Carl Aldouz D. Bicol",
    role: "Project Manager & Backend Developer",
    image: "/team-profile/bicol.jpg",
  },
  {
    name: "Johnrey M. Lualhati",
    role: "Backend Developer",
    image: "/team-profile/lualhati.jpg",
  },
  {
    name: "William Ed M. Perez",
    role: "Backend Developer",
    image: "/team-profile/perez.jpg",
  },
  {
    name: "Jhon Luis D. Valderama",
    role: "Project Manager & Frontend Developer",
    image: "/team-profile/valderama.png",
  },
  {
    name: "Tristan Jay G. Mirano",
    role: "Frontend Developer",
    image: "/team-profile/mirano.png",
  },
  {
    name: "Michael Dave B. Arellano",
    role: "Frontend Developer",
    image: "/team-profile/arellano.png",
  },
];

export default function TeamSection() {
  return (
    <section id="team" className="py-32 bg-white px-6 animate-fadein">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16 pb-10 border-b border-slate-100">
          <div>
            <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4">
              Our Team
            </p>
            <h2 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-none">
              The minds
              <br />
              behind <span className="text-primary">SK-Ledge.</span>
            </h2>
          </div>
          <p className="text-slate-400 max-w-xs text-base leading-relaxed md:text-right">
            Passionate developers bringing modern technology to local
            governance.
          </p>
        </div>

        {/* Team grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TEAM.map((member, idx) => (
            <div
              key={idx}
              className="group flex items-center gap-5 p-5 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer bg-white"
            >
              {/* Avatar */}
              <div className="w-15 h-15 shrink-0 rounded-xl overflow-hidden border border-slate-100">
                <Image
                  src={member.image}
                  alt={`${member.name} Profile`}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 scale-105 group-hover:scale-100"
                  width={60}
                  height={60}
                />
              </div>

              {/* Text */}
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-900 leading-tight truncate">
                  {member.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-snug line-clamp-2">
                  {member.role}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
