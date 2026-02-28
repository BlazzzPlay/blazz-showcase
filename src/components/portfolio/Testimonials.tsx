import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { MessageSquareQuote } from 'lucide-react';

const testimonials = [
  {
    quote: 'Su visión tecnológica transformó completamente nuestra gestión educativa. Un profesional excepcional.',
    name: 'Próximamente',
    role: 'Testimonio disponible pronto',
  },
  {
    quote: 'La plataforma que desarrolló simplificó nuestro trabajo diario de manera increíble.',
    name: 'Próximamente',
    role: 'Testimonio disponible pronto',
  },
];

export default function Testimonials() {
  const ref = useScrollAnimation();

  return (
    <section className="section-padding" ref={ref}>
      <div className="max-w-5xl mx-auto">
        <div className="animate-scroll-in mb-16 text-center">
          <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">Testimonios</p>
          <h2 className="text-4xl md:text-5xl font-bold font-['Space_Grotesk']">
            Lo que <span className="gradient-text">dicen</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {testimonials.map((t, i) => (
            <div key={i}
              className={`animate-scroll-in glass-hover p-8 ${i === 1 ? 'animation-delay-200' : ''}`}>
              <MessageSquareQuote className="text-primary mb-4 opacity-50" size={32} />
              <p className="text-foreground italic leading-relaxed mb-6">"{t.quote}"</p>
              <div>
                <p className="font-semibold font-['Space_Grotesk'] text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
