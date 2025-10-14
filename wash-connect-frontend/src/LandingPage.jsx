import { useState } from "react"
import { useNavigate } from 'react-router-dom';
import { Car, Droplets, Clock, Star, Users, Shield, ArrowRight, Menu, X } from "lucide-react"
// Import from assets
import carFoamImg from "./assets/car-foam.jpg";
import motorcycleWashImg from "./assets/motorcycle-wash.jpg";

function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
    const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-cyan-100">
      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-4xl text-center" style={{ fontFamily: "Brush Script MT, cursive" }}>
              <span className="text-cyan-500">Wash</span> <span className="text-gray-800">Connect</span>
            </h1>
            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <a href="#home" className="text-gray-900 hover:text-cyan-500 px-3 py-2 text-sm font-medium">
                  Home
                </a>
                <a href="#services" className="text-gray-900 hover:text-cyan-500 px-3 py-2 text-sm font-medium">
                  Services
                </a>
                <a href="#about" className="text-gray-900 hover:text-cyan-500 px-3 py-2 text-sm font-medium">
                  About
                </a>
                <a href="#contact" className="text-gray-900 hover:text-cyan-500 px-3 py-2 text-sm font-medium">
                  Contact
                </a>
                <button
                  onClick={() => navigate('/login')}
                  className="bg-cyan-500 text-white px-4 py-2 rounded-lg hover:bg-cyan-600 transition-colors"
                >
                  Login
                </button>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-900 hover:text-cyan-500">
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white">
              <a href="#home" className="text-gray-900 hover:text-cyan-500 block px-3 py-2 text-base font-medium">
                Home
              </a>
              <a href="#services" className="text-gray-900 hover:text-cyan-500 block px-3 py-2 text-base font-medium">
                Services
              </a>
              <a href="#about" className="text-gray-900 hover:text-cyan-500 block px-3 py-2 text-base font-medium">
                About
              </a>
              <a href="#contact" className="text-gray-900 hover:text-cyan-500 block px-3 py-2 text-base font-medium">
                Contact
              </a>
              <button
                onClick={() => navigate('/login')}
                className="w-full text-left bg-cyan-500 text-white px-3 py-2 rounded-lg hover:bg-cyan-600 transition-colors"
              >
                Login
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="home" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                Premium Car Wash
                <span className="text-cyan-500"> Services</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Experience the ultimate car care with our professional washing services. We bring the shine back to your
                vehicle with eco-friendly products and expert techniques.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate('/login')}
                  className="bg-cyan-500 text-white px-8 py-3 rounded-lg hover:bg-cyan-600 transition-colors flex items-center justify-center"
                >
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </button>
                <button className="border border-cyan-500 text-cyan-500 px-8 py-3 rounded-lg hover:bg-cyan-50 transition-colors">
                  Learn More
                </button>
              </div>
            </div>
            <div className="relative">
              {/* Use asset image (fixed responsive size) */}
              <div className="w-full h-64 sm:h-80 md:h-96 lg:h-[28rem] rounded-lg overflow-hidden shadow-2xl">
                <img
                  src={carFoamImg}
                  alt="Premium car wash with foam"
                  className="w-full h-full object-cover"
                  width={1200}
                  height={800}
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Services</h2>
            <p className="text-xl text-gray-600">Professional car care services tailored to your needs</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-8 rounded-xl shadow-lg">
              <Droplets className="h-12 w-12 text-cyan-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Premium Wash</h3>
              <p className="text-gray-600">
                Complete exterior and interior cleaning with premium products and attention to detail.
              </p>
            </div>

            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-8 rounded-xl shadow-lg">
              <Car className="h-12 w-12 text-cyan-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Express Service</h3>
              <p className="text-gray-600">
                Quick and efficient car wash service for busy schedules without compromising quality.
              </p>
            </div>

            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-8 rounded-xl shadow-lg">
              <Shield className="h-12 w-12 text-cyan-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Paint Protection</h3>
              <p className="text-gray-600">
                Advanced wax and ceramic coating services to protect your vehicle's paint.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-sky-50 to-cyan-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Why Choose Wash Connect?</h2>
              <div className="space-y-6">
                <div className="flex items-start">
                  <Clock className="h-6 w-6 text-cyan-500 mt-1 mr-4" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Fast & Convenient</h3>
                    <p className="text-gray-600">Quick service without compromising on quality</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Star className="h-6 w-6 text-cyan-500 mt-1 mr-4" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Premium Quality</h3>
                    <p className="text-gray-600">Professional-grade products and techniques</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Users className="h-6 w-6 text-cyan-500 mt-1 mr-4" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Expert Team</h3>
                    <p className="text-gray-600">Trained professionals who care about your vehicle</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              {/* Use asset image */}
              <img
                src={motorcycleWashImg}
                alt="Motorcycle wash service"
                className="w-full h-auto rounded-lg shadow-2xl object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-gray-300 mb-8">Join thousands of satisfied customers who trust Wash Connect</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-cyan-500 text-white px-8 py-3 rounded-lg hover:bg-cyan-600 transition-colors text-lg font-semibold"
          >
            Book Your Service Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
            <h3 className="text-4xl text-center" style={{ fontFamily: "Brush Script MT, cursive" }}>
              <span className="text-cyan-500">Wash</span> <span className="text-black-800">Connect</span>
            </h3>
              <p className="text-gray-300">Premium car wash services for the modern driver.</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-gray-300">
                <li>Premium Wash</li>
                <li>Express Service</li>
                <li>Paint Protection</li>
                <li>Interior Detailing</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-300">
                <li>About Us</li>
                <li>Careers</li>
                <li>Contact</li>
                <li>Privacy Policy</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact</h4>
              <div className="space-y-2 text-gray-300">
                <p>123 Car Wash Street</p>
                <p>City, State 12345</p>
                <p>Phone: (555) 123-4567</p>
                <p>Email: info@washconnect.com</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-300">
            <p>&copy; 2024 Wash Connect. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage;
