import { Github } from "lucide-react";
import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-gray-800 p-4 shadow-lg">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link href={"/"} className="text-xl font-bold">
          Pulkit&apos;s Tools
        </Link>
        <div className="flex items-center space-x-4">
          <Link
            href="https://github.com/Pulkitxm/api-makret-ass."
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition-colors"
          >
            <Github size={20} />
          </Link>
        </div>
      </div>
    </header>
  );
}
