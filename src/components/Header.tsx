import { Github } from "lucide-react";

export default function Header() {
  return (
    <header className="bg-gray-800 p-4 shadow-lg">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold">Pulkit&apos;s Dev Tools</h1>
        <div className="flex items-center space-x-4">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition-colors"
          >
            <Github size={20} />
          </a>
        </div>
      </div>
    </header>
  );
}
