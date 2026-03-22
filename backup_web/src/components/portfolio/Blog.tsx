import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { BookOpen, ArrowRight } from 'lucide-react';

const posts = [
  {
    title: 'El futuro de la tecnología educativa en Chile',
    excerpt: 'Explorando las tendencias y oportunidades que están transformando la educación digital.',
    date: 'Próximamente',
    tag: 'EdTech',
  },
  {
    title: 'Construyendo SaaS escalables con React',
    excerpt: 'Lecciones aprendidas desarrollando plataformas de software como servicio.',
    date: 'Próximamente',
    tag: 'Desarrollo',
  },
  {
    title: 'Transformación digital en colegios',
    excerpt: 'Cómo implementar tecnología de forma efectiva en instituciones educativas.',
    date: 'Próximamente',
    tag: 'Educación',
  },
];

export default function Blog() {
  const ref = useScrollAnimation();

  return (
    <section className="section-padding" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <div className="animate-scroll-in mb-16 text-center">
          <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">Blog</p>
          <h2 className="text-4xl md:text-5xl font-bold font-['Space_Grotesk']">
            Últimos <span className="gradient-text">artículos</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {posts.map((p, i) => (
            <div key={i}
              className={`animate-scroll-in glass-hover p-6 group cursor-pointer ${i === 1 ? 'animation-delay-200' : i === 2 ? 'animation-delay-400' : ''}`}>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen size={16} className="text-primary" />
                <span className="text-xs text-muted-foreground">{p.date}</span>
              </div>
              <span className="inline-block px-2.5 py-0.5 text-xs rounded-full mb-3"
                style={{ background: 'hsla(190, 90%, 50%, 0.15)', color: 'hsl(190, 90%, 50%)' }}>
                {p.tag}
              </span>
              <h3 className="text-lg font-bold font-['Space_Grotesk'] text-foreground mb-2 group-hover:text-primary transition-colors">
                {p.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{p.excerpt}</p>
              <span className="inline-flex items-center gap-1 text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                Leer más <ArrowRight size={14} />
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
