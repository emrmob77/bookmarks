'use client';

import Layout from '@/components/Layout';
import { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "How do I start using Bookmarks?",
    answer: "To start using Bookmarks, you first need to create an account. After registering, you can install our browser extension or start managing your bookmarks directly through our website."
  },
  {
    question: "How can I organize my bookmarks?",
    answer: "You can organize your bookmarks using tags, create folders, and add custom notes. Additionally, our search feature helps you easily find your saved content."
  },
  {
    question: "Can I share my bookmarks with others?",
    answer: "Yes, you can share your bookmarks with others. You can customize sharing settings for each bookmark, making them either public or private."
  },
  {
    question: "Can I use Bookmarks on different devices?",
    answer: "Yes, you can access your bookmarks from all your devices with your Bookmarks account. Your data is automatically synchronized."
  },
  {
    question: "Can I import bookmarks from other browsers?",
    answer: "Yes, you can easily import your bookmarks from Chrome, Firefox, Safari, and other popular browsers. Follow the guide in the settings section for import instructions."
  },
  {
    question: "How much does Bookmarks cost?",
    answer: "Bookmarks' basic features are free. We offer monthly or yearly subscription plans for premium features."
  },
  {
    question: "How is my data secured?",
    answer: "Your data is protected with SSL encryption. We maintain regular backups and security measures to ensure your data is kept secure at all times."
  },
  {
    question: "Where can I get technical support?",
    answer: "You can reach our technical support team through our contact form. We also provide detailed guides and solutions in our help center."
  },
  {
    question: "Can I use Bookmarks for my business?",
    answer: "Yes, Bookmarks offers enterprise solutions. We provide team sharing features, advanced management tools, and dedicated support services."
  },
  {
    question: "How do I delete my account?",
    answer: "You can initiate account deletion from the settings section. All your data will be permanently deleted."
  }
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-5">
          <h1 className="text-xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h1>
          
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-gray-200 rounded-lg">
                <button
                  className="w-full px-3 py-2.5 flex items-center justify-between text-left focus:outline-none"
                  onClick={() => toggleFAQ(index)}
                >
                  <span className="text-sm font-medium text-gray-900">{faq.question}</span>
                  <svg
                    className={`w-4 h-4 text-gray-500 transform transition-transform duration-200 ${
                      openIndex === index ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openIndex === index && (
                  <div className="px-3 pb-2.5 text-sm text-gray-600">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 p-3 bg-gray-50 rounded-lg text-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-1.5">Have More Questions?</h2>
            <p className="text-gray-600 mb-3">
              If you couldn't find the answer to your question here, please get in touch with us.
            </p>
            <a
              href="/contact"
              className="inline-flex items-center text-blue-600 hover:text-blue-800"
            >
              Contact Form
              <svg
                className="w-4 h-4 ml-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
} 