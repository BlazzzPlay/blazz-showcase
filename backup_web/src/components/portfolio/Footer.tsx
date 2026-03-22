import { Github } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border/50 py-8 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} <span className="gradient-text font-semibold">blazz.cl</span> — Fabian Mendoza
        </div>
        <div className="flex items-center gap-4">
          <a href="https://github.com/BlazzzPlay" target="_blank" rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary transition-colors">
            <Github size={18} />
          </a>
        </div>
      </div>
    </footer>
  );
}
