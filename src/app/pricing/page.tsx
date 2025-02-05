import Layout from '@/components/Layout';

export default function PricingPage() {
  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Pricing Plans</h1>
          <p className="mt-2 text-base text-gray-600">
            Choose the perfect plan for your needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Free Plan */}
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900">Free</h2>
              <p className="mt-1 text-sm text-gray-600">Start with basic features</p>
              <div className="mt-2">
                <span className="text-3xl font-bold text-gray-900">$0</span>
                <span className="text-gray-600">/mo</span>
              </div>
            </div>
            <ul className="mt-4 space-y-2">
              <li className="flex items-start text-sm">
                <svg className="h-4 w-4 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="ml-2 text-gray-600">10 bookmarks</span>
              </li>
              <li className="flex items-start text-sm">
                <svg className="h-4 w-4 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="ml-2 text-gray-600">Basic tagging</span>
              </li>
              <li className="flex items-start text-sm">
                <svg className="h-4 w-4 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="ml-2 text-gray-600">Community support</span>
              </li>
            </ul>
            <button className="mt-4 w-full py-1.5 px-3 border border-blue-600 rounded-md text-sm text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Get Started Free
            </button>
          </div>

          {/* Pro Plan */}
          <div className="bg-white rounded-lg shadow-lg p-4 border-2 border-blue-600 relative">
            <div className="absolute top-0 right-0 bg-blue-600 text-white px-2 py-0.5 rounded-bl-lg rounded-tr-lg text-xs font-medium">
              Popular
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900">Pro</h2>
              <p className="mt-1 text-sm text-gray-600">Perfect for professionals</p>
              <div className="mt-2">
                <span className="text-3xl font-bold text-gray-900">$9</span>
                <span className="text-gray-600">/mo</span>
              </div>
            </div>
            <ul className="mt-4 space-y-2">
              <li className="flex items-start text-sm">
                <svg className="h-4 w-4 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="ml-2 text-gray-600">100 bookmarks</span>
              </li>
              <li className="flex items-start text-sm">
                <svg className="h-4 w-4 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="ml-2 text-gray-600">Advanced tagging</span>
              </li>
              <li className="flex items-start text-sm">
                <svg className="h-4 w-4 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="ml-2 text-gray-600">Priority support</span>
              </li>
              <li className="flex items-start text-sm">
                <svg className="h-4 w-4 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="ml-2 text-gray-600">Ad-free experience</span>
              </li>
              <li className="flex items-start text-sm">
                <svg className="h-4 w-4 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="ml-2 text-gray-600">API access</span>
              </li>
            </ul>
            <button className="mt-4 w-full py-1.5 px-3 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Upgrade to Pro
            </button>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900">Enterprise</h2>
              <p className="mt-1 text-sm text-gray-600">For large teams</p>
              <div className="mt-2">
                <span className="text-3xl font-bold text-gray-900">$49</span>
                <span className="text-gray-600">/mo</span>
              </div>
            </div>
            <ul className="mt-4 space-y-2">
              <li className="flex items-start text-sm">
                <svg className="h-4 w-4 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="ml-2 text-gray-600">Unlimited bookmarks</span>
              </li>
              <li className="flex items-start text-sm">
                <svg className="h-4 w-4 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="ml-2 text-gray-600">Custom tagging system</span>
              </li>
              <li className="flex items-start text-sm">
                <svg className="h-4 w-4 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="ml-2 text-gray-600">24/7 dedicated support</span>
              </li>
              <li className="flex items-start text-sm">
                <svg className="h-4 w-4 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="ml-2 text-gray-600">Advanced analytics</span>
              </li>
              <li className="flex items-start text-sm">
                <svg className="h-4 w-4 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="ml-2 text-gray-600">Custom integrations</span>
              </li>
            </ul>
            <button className="mt-4 w-full py-1.5 px-3 border border-blue-600 rounded-md text-sm text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Contact Sales
            </button>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 text-center mb-6">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-base font-medium text-gray-900">How can I switch between plans?</h3>
              <p className="mt-1 text-sm text-gray-600">
                You can upgrade or downgrade your plan anytime from your account settings. 
                Changes will take effect in the next billing cycle.
              </p>
            </div>
            <div>
              <h3 className="text-base font-medium text-gray-900">What's your refund policy?</h3>
              <p className="mt-1 text-sm text-gray-600">
                We offer a full refund within the first 14 days if you're not satisfied 
                with our service.
              </p>
            </div>
            <div>
              <h3 className="text-base font-medium text-gray-900">Can I add team members?</h3>
              <p className="mt-1 text-sm text-gray-600">
                Pro and Enterprise plans support team members. Each plan has different 
                user limits.
              </p>
            </div>
            <div>
              <h3 className="text-base font-medium text-gray-900">Do you provide technical support?</h3>
              <p className="mt-1 text-sm text-gray-600">
                All plans include technical support, with priority support for Pro and 
                Enterprise plans.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 