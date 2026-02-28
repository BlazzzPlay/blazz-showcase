import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { ExternalLink, Github } from 'lucide-react';

export default function Projects() {
  const ref = useScrollAnimation();

  return (
    <section id="proyectos" className="section-padding" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <div className="animate-scroll-in mb-16 text-center">
          <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">Proyectos</p>
          <h2 className="text-4xl md:text-5xl font-bold font-['Space_Grotesk']">
            Trabajo <span className="gradient-text">Destacado</span>
          </h2>
        </div>

        <div className="animate-scroll-in animation-delay-200">
          <div className="glass-hover overflow-hidden group">
            <div className="grid md:grid-cols-2 gap-0">
              {/* Preview */}
              <div className="relative h-64 md:h-auto overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, hsla(190, 90%, 50%, 0.1), hsla(270, 60%, 60%, 0.1))' }}>
                  <div className="glass p-6 text-center">
                    <div className="text-4xl font-bold font-['Space_Grotesk'] gradient-text mb-2">EduCal</div>
                    <div className="text-sm text-muted-foreground">Chile</div>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="p-8 md:p-10">
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 text-xs rounded-full font-medium"
                    style={{ background: 'hsla(190, 90%, 50%, 0.15)', color: 'hsl(190, 90%, 50%)' }}>
                    Producción
                  </span>
                  <span className="px-3 py-1 text-xs rounded-full font-medium"
                    style={{ background: 'hsla(270, 60%, 60%, 0.15)', color: 'hsl(270, 60%, 60%)' }}>
                    EdTech
                  </span>
                </div>

                <h3 className="text-2xl font-bold font-['Space_Grotesk'] text-foreground mb-3">EduCal Chile</h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Plataforma digital que transforma el trabajo docente a través de soluciones
                  intuitivas y efectivas. Simplifica tareas administrativas y de evaluación
                  para el sistema educativo chileno.
                </p>

                <div className="flex flex-wrap gap-2 mb-8">
                  {['React', 'TypeScript', 'Vercel', 'SaaS'].map((t) => (
                    <span key={t} className="px-3 py-1 text-xs rounded-full glass text-muted-foreground">{t}</span>
                  ))}
                </div>

                <div className="flex gap-4">
                  <a href="https://educal-chile.vercel.app/" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300"
                    style={{ background: 'linear-gradient(135deg, hsl(190, 90%, 50%), hsl(270, 60%, 60%))' }}>
                    <span className="text-background">Ver Proyecto</span>
                    <ExternalLink size={16} className="text-background" />
                  </a>
                  <a href="https://github.com/BlazzzPlay" target="_blank" rel="noopener noreferrer"
                    className="glass-hover inline-flex items-center gap-2 px-5 py-2.5 text-sm text-foreground">
                    <Github size={16} /> Código
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
