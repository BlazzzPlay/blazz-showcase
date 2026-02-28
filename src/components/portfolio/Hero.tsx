import { ArrowDown, Github } from 'lucide-react';

export default function Hero() {
  return (
    <section id="inicio" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full opacity-30"
          style={{ background: 'hsl(190, 90%, 50%)', filter: 'blur(120px)', animation: 'blob 7s infinite' }} />
        <div className="absolute top-2/3 right-1/4 w-96 h-96 rounded-full opacity-20"
          style={{ background: 'hsl(270, 60%, 60%)', filter: 'blur(120px)', animation: 'blob 7s infinite 2s' }} />
        <div className="absolute bottom-1/4 left-1/2 w-64 h-64 rounded-full opacity-20"
          style={{ background: 'hsl(190, 90%, 50%)', filter: 'blur(100px)', animation: 'blob 7s infinite 4s' }} />
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(hsl(210, 40%, 98%) 1px, transparent 1px), linear-gradient(90deg, hsl(210, 40%, 98%) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      <div className="relative z-10 text-center px-6 max-w-4xl">
        <div className="inline-block glass px-4 py-2 mb-8 text-sm text-muted-foreground">
          Ingeniero en Informática • +10 años de experiencia
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold font-['Space_Grotesk'] leading-tight mb-6">
          <span className="text-foreground">Fabian</span>
          <br />
          <span className="gradient-text">Mendoza</span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          Apasionado por las nuevas tecnologías y plataformas de desarrollo.
          Creando soluciones digitales que transforman la educación.
        </p>

        <div className="flex items-center justify-center gap-4">
          <a href="#proyectos"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-sm transition-all duration-300"
            style={{ background: 'linear-gradient(135deg, hsl(190, 90%, 50%), hsl(270, 60%, 60%))' }}>
            <span className="text-background">Ver Proyectos</span>
          </a>
          <a href="https://github.com/BlazzzPlay" target="_blank" rel="noopener noreferrer"
            className="glass-hover inline-flex items-center gap-2 px-6 py-3 text-sm text-foreground">
            <Github size={18} /> GitHub
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <a href="#sobre-mi" className="absolute bottom-10 left-1/2 -translate-x-1/2 text-muted-foreground animate-bounce">
        <ArrowDown size={24} />
      </a>
    </section>
  );
}
