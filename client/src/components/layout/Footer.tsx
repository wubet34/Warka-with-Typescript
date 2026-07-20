import { NavLink } from "react-router-dom";
import {
  Flame,
  Home,
  Sparkles,
  Mail,
  Heart,
  ArrowUp,
  Globe,
} from "lucide-react";
import {
  FaXTwitter,
  FaInstagram,
  FaGithub,
  FaLinkedinIn,
  FaFacebookF,
  FaYoutube,
  FaDiscord,
} from "react-icons/fa6";

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <h2 className="text-2xl font-bold text-[#1A4329] mb-3">Warka</h2>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              Discover and share amazing content with the Warka community. Join
              thousands of creators and enthusiasts.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="#"
                className="p-2 bg-gray-100 rounded-full hover:bg-black hover:text-white transition-all text-gray-600"
                aria-label="X (Twitter)"
              >
                <FaXTwitter size={16} />
              </a>
              <a
                href="#"
                className="p-2 bg-gray-100 rounded-full hover:bg-linear-to-tr hover:from-purple-600 hover:via-pink-500 hover:to-orange-400 hover:text-white transition-all text-gray-600"
                aria-label="Instagram"
              >
                <FaInstagram size={16} />
              </a>
              <a
                href="#"
                className="p-2 bg-gray-100 rounded-full hover:bg-gray-800 hover:text-white transition-all text-gray-600"
                aria-label="GitHub"
              >
                <FaGithub size={16} />
              </a>
              <a
                href="#"
                className="p-2 bg-gray-100 rounded-full hover:bg-blue-700 hover:text-white transition-all text-gray-600"
                aria-label="LinkedIn"
              >
                <FaLinkedinIn size={16} />
              </a>
              <a
                href="#"
                className="p-2 bg-gray-100 rounded-full hover:bg-blue-600 hover:text-white transition-all text-gray-600"
                aria-label="Facebook"
              >
                <FaFacebookF size={16} />
              </a>
              <a
                href="#"
                className="p-2 bg-gray-100 rounded-full hover:bg-red-600 hover:text-white transition-all text-gray-600"
                aria-label="YouTube"
              >
                <FaYoutube size={16} />
              </a>
              <a
                href="#"
                className="p-2 bg-gray-100 rounded-full hover:bg-indigo-500 hover:text-white transition-all text-gray-600"
                aria-label="Discord"
              >
                <FaDiscord size={16} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <NavLink
                  to="/home"
                  className="text-sm text-gray-600 hover:text-[#1A4329] transition-colors flex items-center gap-2"
                >
                  <Home size={14} />
                  Home
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/popular"
                  className="text-sm text-gray-600 hover:text-[#1A4329] transition-colors flex items-center gap-2"
                >
                  <Flame size={14} />
                  Popular
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/new"
                  className="text-sm text-gray-600 hover:text-[#1A4329] transition-colors flex items-center gap-2"
                >
                  <Sparkles size={14} />
                  New
                </NavLink>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-gray-600 hover:text-[#1A4329] transition-colors flex items-center gap-2"
                >
                  <Globe size={14} />
                  Explore
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Resources
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="text-sm text-gray-600 hover:text-[#1A4329] transition-colors"
                >
                  Help Center
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-gray-600 hover:text-[#1A4329] transition-colors"
                >
                  Community Guidelines
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-gray-600 hover:text-[#1A4329] transition-colors"
                >
                  Content Policy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-gray-600 hover:text-[#1A4329] transition-colors"
                >
                  Safety Tips
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-gray-600 hover:text-[#1A4329] transition-colors"
                >
                  Blog
                </a>
              </li>
            </ul>
          </div>

          {/* Contact & Newsletter */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Stay Connected
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Subscribe to our newsletter for the latest updates.
            </p>
            <form className="flex gap-2 mb-4">
              <div className="flex-1 flex items-center bg-gray-100 rounded-full px-4 py-2">
                <Mail size={16} className="text-gray-400 mr-2" />
                <input
                  type="email"
                  placeholder="Your email"
                  className="bg-transparent outline-none text-sm w-full"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-[#1A4329] text-white rounded-full text-sm font-semibold hover:bg-opacity-90 transition-all"
              >
                Subscribe
              </button>
            </form>
            <a
              href="mailto:hello@warka.com"
              className="text-sm text-gray-600 hover:text-[#1A4329] transition-colors flex items-center gap-2"
            >
              <Mail size={14} />
              hello@warka.com
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100 mt-8 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <p className="text-sm text-gray-500 flex items-center gap-1">
              © {currentYear} Warka. Made with
              <Heart size={14} className="text-red-500 fill-red-500" />
              by the Warka team
            </p>

            {/* Legal Links */}
            <div className="flex items-center gap-4">
              <a
                href="#"
                className="text-sm text-gray-500 hover:text-[#1A4329] transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-sm text-gray-500 hover:text-[#1A4329] transition-colors"
              >
                Terms of Service
              </a>
              <a
                href="#"
                className="text-sm text-gray-500 hover:text-[#1A4329] transition-colors"
              >
                Cookie Policy
              </a>
            </div>

            {/* Scroll to Top */}
            <button
              onClick={scrollToTop}
              className="p-2 bg-gray-100 rounded-full hover:bg-[#1A4329] hover:text-white transition-all text-gray-600"
              aria-label="Scroll to top"
            >
              <ArrowUp size={18} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
