import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Globe, Cloud, GraduationCap } from 'lucide-react';

const services = [
  {
    icon: Globe,
    title: 'Desarrollo Web',
    desc: 'Aplicaciones web modernas, rápidas y escalables con las últimas tecnologías del mercado.',
  },
  {
    icon: Cloud,
    title: 'Plataformas SaaS',
    desc: 'Desarrollo de software como servicio con modelos de negocio escalables y sostenibles.',
  },
  {
    icon: GraduationCap,
    title: 'Consultoría EdTech',
    desc: 'Asesoría en tecnología educativa para instituciones que buscan transformar sus procesos.',
  },
];

export default function Services() {
  const ref = useScrollAnimation();

  return (
    <section id="servicios" className="section-padding" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <div className="animate-scroll-in mb-16 text-center">
          <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">Servicios</p>
          <h2 className="text-4xl md:text-5xl font-bold font-['Space_Grotesk']">
            Cómo puedo <span className="gradient-text">ayudarte</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {services.map((s, i) => (
            <div key={s.title}
              className={`animate-scroll-in glass-hover p-8 text-center group ${i === 1 ? 'animation-delay-200' : i === 2 ? 'animation-delay-400' : ''}`}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-transform duration-500 group-hover:scale-110"
                style={{ background: 'linear-gradient(135deg, hsla(190, 90%, 50%, 0.2), hsla(270, 60%, 60%, 0.2))' }}>
                <s.icon className="text-primary" size={28} />
              </div>
              <h3 className="text-xl font-bold font-['Space_Grotesk'] text-foreground mb-3">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
