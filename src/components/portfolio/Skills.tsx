import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Globe, Database, Layout, Cloud, Smartphone, Settings } from 'lucide-react';

const skills = [
  { icon: Globe, name: 'Desarrollo Web', desc: 'Aplicaciones modernas con React, TypeScript y frameworks actuales' },
  { icon: Cloud, name: 'SaaS', desc: 'Plataformas escalables de software como servicio' },
  { icon: Layout, name: 'Frontend', desc: 'Interfaces responsive con UX/UI moderna y accesible' },
  { icon: Database, name: 'Backend', desc: 'APIs RESTful, bases de datos y arquitectura de servidores' },
  { icon: Smartphone, name: 'Responsive Design', desc: 'Experiencias optimizadas para todos los dispositivos' },
  { icon: Settings, name: 'DevOps', desc: 'CI/CD, despliegue y gestión de infraestructura' },
];

export default function Skills() {
  const ref = useScrollAnimation();

  return (
    <section id="habilidades" className="section-padding" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <div className="animate-scroll-in mb-16 text-center">
          <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">Habilidades</p>
          <h2 className="text-4xl md:text-5xl font-bold font-['Space_Grotesk']">
            Stack <span className="gradient-text">Tecnológico</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {skills.map((s, i) => (
            <div key={s.name}
              className={`animate-scroll-in glass-hover p-8 group ${i % 3 === 1 ? 'animation-delay-200' : i % 3 === 2 ? 'animation-delay-400' : ''}`}>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-5 transition-all duration-500 group-hover:scale-110"
                style={{ background: 'linear-gradient(135deg, hsla(190, 90%, 50%, 0.2), hsla(270, 60%, 60%, 0.2))' }}>
                <s.icon className="text-primary" size={24} />
              </div>
              <h3 className="text-lg font-semibold font-['Space_Grotesk'] mb-2 text-foreground">{s.name}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
