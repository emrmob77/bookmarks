import Layout from '@/components/Layout';

export default function TermsPage() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-5">
          <h1 className="text-xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          
          <div className="prose prose-blue max-w-none">
            <p className="text-gray-600 mb-4 text-sm">
              Last updated: {new Date().toLocaleDateString('en-US')}
            </p>

            <div className="space-y-4 text-sm">
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Acceptance of Terms</h2>
                <p className="text-gray-600">
                  By using this website, you agree to these terms of service. 
                  If you do not agree to these terms, please do not use the site.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Service Usage</h2>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>You must provide accurate and current information when creating an account</li>
                  <li>You are responsible for your account security</li>
                  <li>You may not use the service for illegal purposes</li>
                  <li>You must respect other users' rights</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">3. Content Policy</h2>
                <p className="text-gray-600">
                  User-shared content must not include:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1 mt-2">
                  <li>Illegal or harmful content</li>
                  <li>Copyright infringement</li>
                  <li>Hate speech or discrimination</li>
                  <li>Spam or misleading content</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Intellectual Property</h2>
                <p className="text-gray-600">
                  All rights reserved by Bookmarks. The platform's content, logo, 
                  design, and software are the property of Bookmarks.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Disclaimer</h2>
                <p className="text-gray-600">
                  The service is provided "as is". Bookmarks does not guarantee that 
                  the service will be uninterrupted or error-free.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Account Termination</h2>
                <p className="text-gray-600">
                  We reserve the right to terminate or suspend accounts that violate these terms 
                  or for any other reason at our discretion.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">7. Changes to Terms</h2>
                <p className="text-gray-600">
                  We may modify these terms at any time. Continued use of the service after 
                  changes constitutes acceptance of the new terms.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">8. Governing Law</h2>
                <p className="text-gray-600">
                  These terms are governed by applicable laws. Any disputes will be 
                  resolved in the appropriate courts.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">9. Contact</h2>
                <p className="text-gray-600">
                  For questions about these terms, please use our{' '}
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