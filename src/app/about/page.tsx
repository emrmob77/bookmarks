import Layout from '@/components/Layout';

export default function AboutPage() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-5">
          <h1 className="text-xl font-bold text-gray-900 mb-4">About Us</h1>
          
          <div className="space-y-4 text-gray-600 text-sm">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Our Mission</h2>
              <p className="leading-relaxed">
                Bookmarks is a platform that allows you to easily save, organize, and share valuable content from across the internet. 
                Our mission is to help users organize important resources they discover in the digital world and share them with the community.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">What We Do</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>Easy and quick bookmark saving</li>
                <li>Smart tagging system</li>
                <li>Automatic metadata extraction</li>
                <li>Community-based discovery features</li>
                <li>Secure and private storage</li>
                <li>User-friendly interface</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Our Team</h2>
              <p className="leading-relaxed">
                Bookmarks is developed by a passionate team of web technology experts. 
                Our team specializes in user experience, security, and performance, 
                working continuously to provide you with the best service.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Our Vision</h2>
              <p className="leading-relaxed">
                We aim to make accessing information in the digital world easier by helping 
                internet users better organize and share their knowledge resources. 
                We strive to make Bookmarks the leading platform for discovering and 
                sharing the most valuable content on the web.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Stay Connected</h2>
              <p className="leading-relaxed">
                Your feedback and suggestions are valuable to us. We welcome your input to improve 
                our platform and provide a better experience. 
                Visit our <a href="/contact" className="text-blue-600 hover:text-blue-800 hover:underline">contact page</a> to get in touch with us.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 