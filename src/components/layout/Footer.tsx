
import { Facebook, Instagram, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 pt-12 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li><a href="#" className="hover:underline">Help Center</a></li>
              <li><a href="#" className="hover:underline">AirCover</a></li>
              <li><a href="#" className="hover:underline">Anti-discrimination</a></li>
              <li><a href="#" className="hover:underline">Disability support</a></li>
              <li><a href="#" className="hover:underline">Cancellation options</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Hosting</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li><a href="#" className="hover:underline">List your home</a></li>
              <li><a href="#" className="hover:underline">AirCover for Hosts</a></li>
              <li><a href="#" className="hover:underline">Hosting resources</a></li>
              <li><a href="#" className="hover:underline">Community forum</a></li>
              <li><a href="#" className="hover:underline">Hosting responsibly</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">IdealStay</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li><a href="#" className="hover:underline">Newsroom</a></li>
              <li><a href="#" className="hover:underline">New features</a></li>
              <li><a href="#" className="hover:underline">Careers</a></li>
              <li><a href="#" className="hover:underline">Investors</a></li>
              <li><a href="#" className="hover:underline">Gift cards</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">South Africa</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li><a href="#" className="hover:underline">Cape Town</a></li>
              <li><a href="#" className="hover:underline">Johannesburg</a></li>
              <li><a href="#" className="hover:underline">Durban</a></li>
              <li><a href="#" className="hover:underline">Garden Route</a></li>
              <li><a href="#" className="hover:underline">Kruger Park</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <span>© 2024 IdealStay, Inc.</span>
            <span className="hidden md:inline">·</span>
            <a href="#" className="hover:underline">Privacy</a>
            <span className="hidden md:inline">·</span>
            <a href="#" className="hover:underline">Terms</a>
            <span className="hidden md:inline">·</span>
            <a href="#" className="hover:underline">Sitemap</a>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 font-medium text-sm">
              <GlobeIcon className="w-4 h-4" />
              <span>English (ZA)</span>
            </div>
            <div className="flex items-center gap-2 font-medium text-sm">
              <span>ZAR</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="#" className="text-gray-600 hover:text-gray-900"><Facebook className="w-5 h-5" /></a>
              <a href="#" className="text-gray-600 hover:text-gray-900"><Twitter className="w-5 h-5" /></a>
              <a href="#" className="text-gray-600 hover:text-gray-900"><Instagram className="w-5 h-5" /></a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" x2="22" y1="12" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}
