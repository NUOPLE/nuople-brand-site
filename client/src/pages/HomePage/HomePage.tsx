import PublicNavbar from './PublicNavbar';
import HeroCarousel from './HeroCarousel';
import WorkSection from './WorkSection';
import AboutSection from './AboutSection';
import ServicesSection from './ServicesSection';
import ProcessSection from './ProcessSection';
import ContactSection from './ContactSection';
import Footer from './Footer';
import ChatWidget from './ChatWidget';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-white text-black">
      <PublicNavbar />
      <main>
        <HeroCarousel />
        <WorkSection />
        <AboutSection />
        <ServicesSection />
        <ProcessSection />
        <ContactSection />
      </main>
      <Footer />
      <ChatWidget />
    </div>
  );
};

export default HomePage;
