
import { Facebook, Instagram, Twitter } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 pt-16 pb-12 relative z-40">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div>
            <h3 className="font-bold text-gray-900 mb-6">Support</h3>
            <ul className="space-y-4 text-sm text-gray-600">
              <li><a href="#" className="hover:text-gray-900 transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-gray-900 transition-colors">AirCover</a></li>
              <li><a href="#" className="hover:text-gray-900 transition-colors">Anti-discrimination</a></li>
              <li><a href="#" className="hover:text-gray-900 transition-colors">Disability support</a></li>
              <li><a href="#" className="hover:text-gray-900 transition-colors">Cancellation options</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 mb-6">Hosting</h3>
            <ul className="space-y-4 text-sm text-gray-600">
              <li><a href="#" className="hover:text-gray-900 transition-colors">List your home</a></li>
              <li><a href="#" className="hover:text-gray-900 transition-colors">AirCover for Hosts</a></li>
              <li><a href="#" className="hover:text-gray-900 transition-colors">Hosting resources</a></li>
              <li><a href="#" className="hover:text-gray-900 transition-colors">Community forum</a></li>
              <li><a href="#" className="hover:text-gray-900 transition-colors">Hosting responsibly</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 mb-6">IdealStay</h3>
            <ul className="space-y-4 text-sm text-gray-600">
              <li><a href="#" className="hover:text-gray-900 transition-colors">Newsroom</a></li>
              <li><a href="#" className="hover:text-gray-900 transition-colors">New features</a></li>
              <li><a href="#" className="hover:text-gray-900 transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-gray-900 transition-colors">Investors</a></li>
              <li><a href="#" className="hover:text-gray-900 transition-colors">Gift cards</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 mb-6">South Africa</h3>
            <ul className="space-y-4 text-sm text-gray-600">
              <li><a href="#" className="hover:text-gray-900 transition-colors">Cape Town</a></li>
              <li><a href="#" className="hover:text-gray-900 transition-colors">Johannesburg</a></li>
              <li><a href="#" className="hover:text-gray-900 transition-colors">Durban</a></li>
              <li><a href="#" className="hover:text-gray-900 transition-colors">Garden Route</a></li>
              <li><a href="#" className="hover:text-gray-900 transition-colors">Kruger Park</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <span>© 2024 IdealStay, Inc.</span>
            <span className="hidden md:inline text-gray-300">·</span>
            <Link to="/privacy" className="hover:text-gray-900 transition-colors">Privacy</Link>
            <span className="hidden md:inline text-gray-300">·</span>
            <Link to="/terms-of-service" className="hover:text-gray-900 transition-colors">Terms</Link>
            <span className="hidden md:inline text-gray-300">·</span>
            <Link to="/host-agreement" className="hover:text-gray-900 transition-colors">Host Agreement</Link>
            <span className="hidden md:inline text-gray-300">·</span>
            <Link to="/guest-agreement" className="hover:text-gray-900 transition-colors">Guest Agreement</Link>
            <span className="hidden md:inline text-gray-300">·</span>
            <Link to="/liability-waiver" className="hover:text-gray-900 transition-colors">Liability Waiver</Link>
            <span className="hidden md:inline text-gray-300">·</span>
            <Link to="/cancellation-policy" className="hover:text-gray-900 transition-colors">Cancellation Policy</Link>
            <span className="hidden md:inline text-gray-300">·</span>
            <a href="#" className="hover:text-gray-900 transition-colors">Sitemap</a>
          </div>

          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 font-semibold text-sm text-gray-700 hover:text-gray-900 cursor-pointer">
              <GlobeIcon className="w-4 h-4" />
              <span>English (ZA)</span>
            </div>
            <div className="flex items-center gap-2 font-semibold text-sm text-gray-700 hover:text-gray-900 cursor-pointer">
              <span>ZAR</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="#" className="text-gray-500 hover:text-gray-900 transition-colors"><Facebook className="w-5 h-5" /></a>
              <a href="#" className="text-gray-500 hover:text-gray-900 transition-colors"><Twitter className="w-5 h-5" /></a>
              <a href="#" className="text-gray-500 hover:text-gray-900 transition-colors"><Instagram className="w-5 h-5" /></a>
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
