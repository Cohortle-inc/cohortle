import Link from "next/link";
import React from "react";

import { siteDetails } from "@/data/siteDetails";
// import { footerDetails } from "@/data/footer";
// import { getPlatformIconByName } from "@/utils";

interface FooterProps {
  minimal?: boolean;
}

const Footer: React.FC<FooterProps> = ({ minimal = false }) => {
  const currentYear = new Date().getFullYear();

  if (minimal) {
    return (
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-600">
          <p>
            Copyright &copy; {currentYear} {siteDetails.siteName}. All rights reserved.
          </p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-[#F8F1FF] text-foreground pt-2 mt-auto  pb-2">
      {/* <div className="max-w-7xl w-full mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10">
        <div>
          <Link href="/" className="flex items-center gap-2">
            <h3 className=" text-xl font-semibold cursor-pointer">
              {siteDetails.siteName}
            </h3>
          </Link>
          <p className="mt-3.5 text-foreground-accent">
            {footerDetails.subheading}
          </p>
        </div>
        <div>
          <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
          <ul className="text-foreground-accent">
            {footerDetails.quickLinks.map((link) => (
              <li key={link.text} className="mb-2">
                <Link href={link.url} className="hover:text-foreground">
                  {link.text}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-lg font-semibold mb-4">Contact Us</h4>

          {footerDetails.email && (
            <a
              href={`mailto:${footerDetails.email}`}
              className="block text-foreground-accent hover:text-foreground"
            >
              Email: {footerDetails.email}
            </a>
          )}

          {footerDetails.telephone && (
            <a
              href={`tel:${footerDetails.telephone}`}
              className="block text-foreground-accent hover:text-foreground"
            >
              Phone: {footerDetails.telephone}
            </a>
          )}

          {footerDetails.socials && (
            <div className="mt-5 flex items-center gap-5 flex-wrap">
              {Object.keys(footerDetails.socials).map((platformName) => {
                if (platformName && footerDetails.socials[platformName]) {
                  return (
                    <Link
                      href={footerDetails.socials[platformName]}
                      key={platformName}
                      aria-label={platformName}
                    >
                      {getPlatformIconByName(platformName)}
                    </Link>
                  );
                }
              })}
            </div>
          )}
        </div>
      </div> */}
      <div className="mt-auto text-center text-foreground-accent px-6 py-4">
        <p>
          Copyright &copy; {currentYear} {siteDetails.siteName}.
          All rights reserved.
        </p>
        <div className="mt-2 flex items-center justify-center gap-4 text-sm">
          <Link href="/privacy" className="hover:text-[#391D65] transition-colors">
            Privacy Policy
          </Link>
          <span aria-hidden="true">·</span>
          <Link href="/terms" className="hover:text-[#391D65] transition-colors">
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
