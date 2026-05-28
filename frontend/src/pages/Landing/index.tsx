import Hero from './components/Hero';
import About from './components/About';
import Volunteers from './components/Volunteers';
import Science from './components/Science';
import Footer from './components/Footer';

export default function Landing() {
    return (
        <div className="flex flex-col w-full selection:bg-blue-100 selection:text-blue-900 bg-white">
            <Hero />
            <About />
            <Volunteers />
            <Science />
            <Footer />
        </div>
    );
}
