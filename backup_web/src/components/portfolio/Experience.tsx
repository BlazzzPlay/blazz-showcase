import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Briefcase, GraduationCap } from 'lucide-react';

const timeline = [
  {
    year: '2015 - Presente',
    title: 'Jefe de Informática',
    org: 'Colegio Montessori',
    desc: 'Liderando la transformación digital educativa, implementando soluciones tecnológicas innovadoras para mejorar la enseñanza y administración escolar.',
    icon: Briefcase,
  },
  {
    year: '2015',
    title: 'Ingeniero en Informática',
    org: 'Titulación Universitaria',
    desc: 'Graduado como Ingeniero en Informática, con enfoque en desarrollo de software y sistemas de información.',
    icon: GraduationCap,
  },
  {
    year: '2020 - Presente',
    title: 'Desarrollador SaaS',
    org: 'EduCal Chile',
    desc: 'Creación y desarrollo de plataforma SaaS para la gestión educativa docente en Chile.',
    icon: Briefcase,
  },
];

export default function Experience() {
  const ref = useScrollAnimation();

  return (
    <section id="experiencia" className="section-padding" ref={ref}>
      <div className="max-w-4xl mx-auto">
        <div className="animate-scroll-in mb-16 text-center">
          <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">Experiencia</p>
          <h2 className="text-4xl md:text-5xl font-bold font-['Space_Grotesk']">
            Mi <span className="gradient-text">Trayectoria</span>
          </h2>
        </div>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px"
            style={{ background: 'linear-gradient(to bottom, hsl(190, 90%, 50%), hsl(270, 60%, 60%))' }} />

          {timeline.map((item, i) => (
            <div key={i}
              className={`animate-scroll-in relative flex items-start gap-6 mb-12 ${i === 1 ? 'animation-delay-200' : i === 2 ? 'animation-delay-400' : ''} ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
              {/* Dot */}
              <div className="absolute left-6 md:left-1/2 -translate-x-1/2 w-3 h-3 rounded-full z-10 mt-2"
                style={{ background: 'linear-gradient(135deg, hsl(190, 90%, 50%), hsl(270, 60%, 60%))', boxShadow: '0 0 20px hsla(190, 90%, 50%, 0.4)' }} />

              {/* Content */}
              <div className={`ml-14 md:ml-0 md:w-[calc(50%-2rem)] ${i % 2 === 0 ? 'md:pr-8 md:text-right' : 'md:pl-8'}`}>
                <div className="glass-hover p-6">
                  <span className="text-xs text-primary font-semibold">{item.year}</span>
                  <h3 className="text-lg font-bold font-['Space_Grotesk'] text-foreground mt-1">{item.title}</h3>
                  <p className="text-sm text-accent font-medium mb-2">{item.org}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
