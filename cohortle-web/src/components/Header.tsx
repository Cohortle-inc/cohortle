"use client";

import React, { useState } from "react";
import { Transition } from "@headlessui/react";
import { HiOutlineXMark, HiBars3 } from "react-icons/hi2";
import { ArrowRight } from "@phosphor-icons/react";
import { usePathname } from "next/navigation";

import { siteDetails } from "@/data/siteDetails";
import { menuItems } from "@/data/menuItems";
import Link from "next/link";

const Header: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Hide CTA buttons on auth and apply pages
  const hideCta = ['/login', '/signup', '/join', '/reset-password', '/forgot-password', '/verify-email', '/select-role', '/apply'].some(
    (path) => pathname === path || pathname.startsWith(path + '/')
  );

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <header className="bg-transparent fixed top-0 left-0 right-0 md:absolute z-50 mx-auto w-full">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-16">
        <nav className="shadow-md md:shadow-none bg-white md:bg-transparent mx-auto flex justify-between items-center py-3 px-5 md:py-10">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2">
            <span className="text-xl font-semibold text-foreground cursor-pointer">
              {siteDetails.siteName}
            </span>
          </a>

          {/* Desktop Menu */}
          <ul className="hidden md:flex items-center space-x-6">
            {menuItems.map((item) => (
              <li key={item.text}>
                <Link
                  href={item.url}
                  className="text-foreground hover:text-foreground-accent transition-colors text-sm font-medium"
                >
                  {item.text}
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop CTA */}
          {!hideCta && (
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/apply/form"
              className="text-sm font-medium text-[#391D65] hover:text-[#2d1750] transition-colors"
            >
              Book a Free Demo
            </Link>
            <Link
              href="/apply"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#391D65] text-white px-4 py-2 text-sm font-semibold hover:bg-[#2d1750] transition-colors"
            >
              Start a Partnership
              <ArrowRight size={14} weight="bold" />
            </Link>
          </div>
          )}

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              type="button"
              className="bg-[#DABCFF] text-black focus:outline-none rounded-full w-10 h-10 flex items-center justify-center"
              aria-controls="mobile-menu"
              aria-expanded={isOpen}
            >
              {isOpen ? (
                <HiOutlineXMark className="h-6 w-6" aria-hidden="true" />
              ) : (
                <HiBars3 className="h-6 w-6" aria-hidden="true" />
              )}
              <span className="sr-only">Toggle navigation</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile Menu with Transition */}
      <Transition
        show={isOpen}
        enter="transition ease-out duration-200 transform"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="transition ease-in duration-75 transform"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <div id="mobile-menu" className="md:hidden bg-white shadow-lg">
          <ul className="flex flex-col pt-2 pb-4 px-6 space-y-1">
            {menuItems.map((item) => (
              <li key={item.text}>
                <a
                  href={item.url}
                  className="block py-3 text-foreground hover:text-[#391D65] font-medium border-b border-slate-100 last:border-0"
                  onClick={toggleMenu}
                >
                  {item.text}
                </a>
              </li>
            ))}
          </ul>
          <div className="px-6 pb-6 flex flex-col gap-3">
            {!hideCta && (
            <>
            <Link
              href="/apply/form"
              onClick={toggleMenu}
              className="inline-flex items-center justify-center rounded-lg border border-[#391D65] text-[#391D65] px-4 py-3 text-sm font-semibold hover:bg-[#F8F1FF] transition-colors"
            >
              Book a Free Demo
            </Link>
            <Link
              href="/apply"
              onClick={toggleMenu}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#391D65] text-white px-4 py-3 text-sm font-semibold hover:bg-[#2d1750] transition-colors"
            >
              Start a Partnership
              <ArrowRight size={14} weight="bold" />
            </Link>
            </>
            )}
          </div>
        </div>
      </Transition>
    </header>
  );
};

export default Header;
