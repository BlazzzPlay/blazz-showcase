import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Github, Mail, MapPin, Send } from 'lucide-react';
import { useState } from 'react';

export default function Contact() {
  const ref = useScrollAnimation();
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mailtoLink = `mailto:contacto@blazz.cl?subject=Contacto desde Portfolio - ${form.name}&body=${encodeURIComponent(form.message)}%0A%0ADe: ${form.name} (${form.email})`;
    window.open(mailtoLink);
  };

  return (
    <section id="contacto" className="section-padding" ref={ref}>
      <div className="max-w-5xl mx-auto">
        <div className="animate-scroll-in mb-16 text-center">
          <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">Contacto</p>
          <h2 className="text-4xl md:text-5xl font-bold font-['Space_Grotesk']">
            Hablemos de tu <span className="gradient-text">proyecto</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Info */}
          <div className="animate-scroll-in space-y-6">
            <p className="text-muted-foreground leading-relaxed">
              ¿Tienes un proyecto en mente? Me encantaría escuchar sobre tu idea
              y explorar cómo puedo ayudarte a hacerla realidad.
            </p>

            <div className="space-y-4">
              <a href="https://github.com/BlazzzPlay" target="_blank" rel="noopener noreferrer"
                className="glass-hover flex items-center gap-4 p-4">
                <Github className="text-primary" size={20} />
                <div>
                  <p className="text-sm font-medium text-foreground">GitHub</p>
                  <p className="text-xs text-muted-foreground">@BlazzzPlay</p>
                </div>
              </a>

              <div className="glass-hover flex items-center gap-4 p-4">
                <MapPin className="text-primary" size={20} />
                <div>
                  <p className="text-sm font-medium text-foreground">Ubicación</p>
                  <p className="text-xs text-muted-foreground">Chile</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="animate-scroll-in animation-delay-200 space-y-4">
            <div>
              <input type="text" placeholder="Tu nombre" required
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full glass px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground bg-transparent focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <input type="email" placeholder="Tu email" required
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full glass px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground bg-transparent focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <textarea placeholder="Tu mensaje" required rows={5}
                value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full glass px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground bg-transparent focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
            </div>
            <button type="submit"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300"
              style={{ background: 'linear-gradient(135deg, hsl(190, 90%, 50%), hsl(270, 60%, 60%))' }}>
              <span className="text-background">Enviar Mensaje</span>
              <Send size={16} className="text-background" />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
