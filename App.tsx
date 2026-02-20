import React from 'react';
import { AskSirYuleinis } from './components/AskSirReginald';

const Hero = () => (
  <header className="bg-amber-50 text-center py-16 px-4">
    <div className="max-w-4xl mx-auto">
      <img 
        src="/hero-dog.jpg"
        alt="A majestic portrait of Sir Yuleinis Yefrison de la Virgen de Homunculicio"
        className="w-48 h-48 md:w-64 md:h-64 rounded-full mx-auto object-cover border-8 border-amber-200 shadow-2xl mb-6"
      />
      <h1 className="text-4xl md:text-5xl font-bold text-amber-900">Yuleinis Yefrison de la Virgen de Homunculicio</h1>
      <p className="text-xl md:text-2xl text-amber-700 mt-2">Esquire, Bon Vivant, Good Boy</p>
    </div>
  </header>
);

const About = () => (
  <section id="about" className="py-20 px-4 bg-white">
    <div className="max-w-3xl mx-auto text-center">
      <h2 className="text-4xl font-bold text-gray-800 mb-6">His Majesty's Biography</h2>
      <p className="text-lg text-gray-600 leading-relaxed">
        Born into a lineage of distinguished lap-warmers and elite snack connoisseurs, Sir Yuleinis Yefrison de la Virgen de Homunculicio quickly established himself as a prominent figure in the world of professional napping. His groundbreaking work in the field of 'Following Humans into the Kitchen with Optimism' has earned him numerous accolades, including the prestigious Golden Biscuit award. When not attending to his duties, he enjoys barking at squirrels, demanding belly rubs, and contemplating the profound mysteries of the squeaky toy.
      </p>
    </div>
  </section>
);

const Gallery = () => {
  const photos = [
    { id: 1, src: "/balcony.jpg", alt: "Sir Yuleinis surveying his kingdom." },
    { id: 2, src: "/library.jpg", alt: "A candid shot during a moment of deep thought." },
    { id: 3, src: "/garden.jpg", alt: "Enjoying the great outdoors." },
    { id: 4, src: "/throne.jpg", alt: "His official royal portrait." },
  ];

  return (
    <section id="gallery" className="py-20 px-4 bg-amber-50">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">A Royal Gallery</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {photos.map(photo => (
            <div key={photo.id} className="group relative overflow-hidden rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300">
              <img 
                src={photo.src}
                alt={photo.alt}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-end p-4">
                  <p className="text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">{photo.alt}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};


const Footer = () => (
    <footer className="bg-gray-800 text-white text-center p-6">
        <p>&copy; {new Date().getFullYear()} The Estate of Sir Yuleinis Yefrison de la Virgen de Homunculicio. All Paws Reserved.</p>
        <p className="text-sm text-gray-400 mt-1">This website runs on treats and affection.</p>
    </footer>
);


const App = () => {
  return (
    <div className="bg-gray-100 min-h-screen">
      <main>
        <Hero />
        <About />
        <Gallery />
        <AskSirYuleinis />
        <Footer />
      </main>
    </div>
  );
};

export default App;