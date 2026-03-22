import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Code, GraduationCap, Calendar, Rocket } from 'lucide-react';

const stats = [
  { icon: Calendar, value: '+10', label: 'Años de experiencia' },
  { icon: Code, value: 'Web', label: 'Desarrollo & SaaS' },
  { icon: GraduationCap, value: '2015', label: 'Titulado Ing. Informática' },
  { icon: Rocket, value: 'EdTech', label: 'Tecnología Educativa' },
];

export default function About() {
  const ref = useScrollAnimation();

  return (
    <section id="sobre-mi" className="section-padding" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <div className="animate-scroll-in mb-16">
          <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">Sobre mí</p>
          <h2 className="text-4xl md:text-5xl font-bold font-['Space_Grotesk'] mb-6">
            Construyendo el <span className="gradient-text">futuro digital</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-3xl leading-relaxed">
            Soy Fabian Mendoza, Ingeniero en Informática con más de una década de experiencia
            en tecnologías educativas. Actualmente me desempeño como Jefe de Informática en
            Colegio Montessori, donde combino mi pasión por la tecnología con la misión de
            transformar la educación a través de soluciones digitales innovadoras.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <div key={s.label}
              className={`animate-scroll-in glass-hover p-6 text-center ${i === 1 ? 'animation-delay-200' : i === 2 ? 'animation-delay-400' : i === 3 ? 'animation-delay-600' : ''}`}>
              <s.icon className="mx-auto mb-3 text-primary" size={28} />
              <div className="text-2xl font-bold font-['Space_Grotesk'] gradient-text mb-1">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
