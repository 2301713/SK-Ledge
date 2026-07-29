import Image from "next/image";

export default function LogoLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      <div className="text-center animate-bounce">
        <div className="mx-auto mb-4 h-24 w-24 overflow-hidden rounded-3xl bg-white/90 shadow-2xl shadow-slate-200">
          <Image
            src="/skledge-logo.png"
            alt="Loading"
            width={96}
            height={96}
            className="object-contain"
            priority
          />
        </div>
        <p className="text-primary text-sm">Loading...</p>
      </div>
    </div>
  );
}
