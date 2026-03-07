import React from "react";
import NewsletterForm from "../NewsletterForm";

const Footer = () => {
  return (
    <div>
      <footer className="border-t border-zinc-200 dark:border-zinc-800 mt-20">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="mb-8">
            <NewsletterForm />
          </div>
          <p className="text-sm  text-zinc-400 text-center">
            © {new Date().getFullYear()}{" "}
            <span className="font-bold">Anurag Sawant</span>. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Footer;
