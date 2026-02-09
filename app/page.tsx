import { Navigation } from "./components/Navigation";
import { Hero } from "./components/Hero";
import { About } from "./components/About";
import { Skills } from "./components/Skills";
import { Projects } from "./components/Projects";
import { Resume } from "./components/Resume";
import { Contact } from "./components/Contact";
import { Footer } from "./components/Footer";
import { features } from "./config/features";

export default function Home() {
  return (
    <div className="size-full">
      <Navigation />
      <Hero />
      <About />
      <Skills />
      {features.showProjects ? <Projects /> : <Resume />}
      <Contact />
      <Footer />
    </div>
  );
}
