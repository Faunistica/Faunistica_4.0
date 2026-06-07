import Hero from './components/Hero';
import About from './components/About';
import Volunteers from './components/Volunteers';
import Science from './components/Science';
import Footer from './components/Footer';

export default function Landing() {
    return (
        <div className="flex w-full flex-col bg-background selection:bg-blue-100 selection:text-blue-900 dark:selection:bg-blue-900 dark:selection:text-blue-100">
            <Hero />
            <About />
            <Volunteers />
            <Science />
            <Footer />
        </div>
    );
}
