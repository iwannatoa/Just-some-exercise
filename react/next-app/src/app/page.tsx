import Link from 'next/link';

export default function HomePage() {
  const features = [
    { title: 'Random Countries', desc: 'Unique names and terrain', icon: '🌍' },
    { title: 'Interactive Map', desc: 'Click to explore details', icon: '🗺️' },
    { title: 'Realistic Data', desc: 'Population and area stats', icon: '📊' },
  ];

  return (
    <div className='container mx-auto px-4 py-8'>
      {/* Hero Section */}
      <section className='text-center mb-12'>
        <div className='max-w-2xl mx-auto'>
          <h1 className='text-4xl font-bold text-gray-900 mb-4'>
            World Map Generator
          </h1>
          <p className='text-lg text-gray-600 mb-8'>
            Create beautiful fantasy world maps with randomly generated
            countries and terrain
          </p>
          <Link
            href='/map'
            className='bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors'
          >
            Generate Your World
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className='mb-12'>
        <h2 className='text-2xl font-bold text-center mb-8'>Features</h2>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          {features.map((feature, index) => (
            <div
              key={index}
              className='bg-white p-6 rounded-lg shadow-sm border'
            >
              <div className='text-3xl mb-3'>{feature.icon}</div>
              <h3 className='font-semibold text-lg mb-2'>{feature.title}</h3>
              <p className='text-gray-600'>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className='text-center'>
        <div className='bg-blue-50 rounded-lg p-8 max-w-md mx-auto'>
          <h3 className='text-xl font-semibold mb-3'>Ready to explore?</h3>
          <p className='text-gray-600 mb-4'>Create your first world map now</p>
          <Link
            href='/map'
            className='bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors'
          >
            Get Started
          </Link>
        </div>
      </section>
    </div>
  );
}
