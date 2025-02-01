import Layout from '@/components/Layout';

export default function PrivacyPage() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-5">
          <h1 className="text-xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          
          <div className="prose prose-blue max-w-none">
            <p className="text-gray-600 mb-4 text-sm">
              Last updated: {new Date().toLocaleDateString('en-US')}
            </p>

            <div className="space-y-4 text-sm">
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Overview</h2>
                <p className="text-gray-600">
                  This privacy policy explains how your personal data is collected, processed, and protected 
                  when using the Bookmarks service. By using our services, you agree to the practices 
                  described in this policy.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Information We Collect</h2>
                <p className="text-gray-600 mb-2">
                  While using our services, we may collect the following information:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Account information (email, username)</li>
                  <li>Profile information</li>
                  <li>Bookmarks and tags</li>
                  <li>Usage statistics</li>
                  <li>Device and browser information</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">3. Use of Information</h2>
                <p className="text-gray-600 mb-2">
                  We use the collected information for the following purposes:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Providing and improving our services</li>
                  <li>Managing your account</li>
                  <li>Ensuring security</li>
                  <li>Communication</li>
                  <li>Fulfilling legal obligations</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Information Sharing</h2>
                <p className="text-gray-600">
                  We do not share your personal information with third parties, except in the following cases:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1 mt-2">
                  <li>When legally required</li>
                  <li>With your explicit consent</li>
                  <li>With our service providers (data processing, hosting, etc.)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Data Security</h2>
                <p className="text-gray-600">
                  We use industry-standard security measures to protect your data:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1 mt-2">
                  <li>SSL encryption</li>
                  <li>Secure data storage</li>
                  <li>Regular security updates</li>
                  <li>Access control</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Cookies</h2>
                <p className="text-gray-600">
                  We use cookies to improve and personalize our services. 
                  You can manage your cookie preferences through your browser settings.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">7. User Rights</h2>
                <p className="text-gray-600 mb-2">
                  You have the following rights regarding your personal data:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Access to your data</li>
                  <li>Correction of your data</li>
                  <li>Deletion of your data</li>
                  <li>Objection to data processing</li>
                  <li>Data portability</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">8. Children's Privacy</h2>
                <p className="text-gray-600">
                  Our services are not intended for children under 13 years of age. 
                  We do not knowingly collect personal information from children under 13.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">9. Policy Changes</h2>
                <p className="text-gray-600">
                  We may update this privacy policy from time to time. 
                  We will notify you of any significant changes.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">10. Contact</h2>
                <p className="text-gray-600">
                  For questions about our privacy policy, please use our{' '}
                  <a href="/contact" className="text-blue-600 hover:text-blue-800 hover:underline">
                    contact form
                  </a>.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 