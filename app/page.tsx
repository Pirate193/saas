import Link from "next/link";
import { FolderOpen, FileText, Brain, MessageSquare, Upload, Sparkles, BookOpen, CheckCircle2, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen bg-black text-white overflow-hidden">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-black/80 border-b border-white/10 animate-in fade-in slide-in-from-top duration-700">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2 group cursor-pointer">
              <FolderOpen className="h-8 w-8 text-white group-hover:scale-110 transition-transform duration-300" />
              <span className="text-2xl font-bold text-white group-hover:tracking-wider transition-all duration-300">
                Folders
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Link 
                href='/sign-in' 
                className="px-5 py-2 text-sm font-medium text-gray-400 hover:text-white transition-all duration-300 hover:scale-105"
              >
                Sign In
              </Link>
              <Link 
                href='/sign-in' 
                className="px-5 py-2 text-sm font-medium bg-white text-black rounded-lg hover:bg-gray-200 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-white/20"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 px-6 animate-in fade-in slide-in-from-bottom duration-1000">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-medium mb-8 animate-in fade-in zoom-in duration-700 delay-200">
              <Sparkles className="h-4 w-4 animate-pulse" />
              AI-Powered Study Organization
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-6 text-white animate-in fade-in slide-in-from-bottom duration-1000 delay-300">
              Organize Your Studies,
              <br />
              <span className="bg-gradient-to-r from-white via-gray-300 to-gray-500 bg-clip-text text-transparent">
                Amplify Your Success
              </span>
            </h1>
            <p className="text-xl text-gray-400 mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom duration-1000 delay-500">
              The ultimate platform for students to organize materials, create notes, generate flashcards with AI, 
              and chat with an intelligent assistant that understands your content.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom duration-1000 delay-700">
              <Link 
                href='/auth/sign-up'
                className="group px-8 py-4 bg-white text-black rounded-lg hover:bg-gray-200 transition-all duration-300 font-semibold text-lg hover:scale-105 hover:shadow-2xl hover:shadow-white/20 flex items-center gap-2"
              >
                Start Free Today
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
              <Link 
                href='#features'
                className="px-8 py-4 bg-transparent text-white rounded-lg hover:bg-white/10 transition-all duration-300 font-semibold text-lg border border-white/20 hover:border-white/40 hover:scale-105"
              >
                Explore Features
              </Link>
            </div>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-1/2 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl -z-10 animate-pulse" />
        <div className="absolute top-1/3 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-gradient-to-b from-black to-zinc-950 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom duration-700">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4 text-white">
              Everything You Need to Excel
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Powerful features designed to help students stay organized and study smarter
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/30 hover:bg-white/10 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-white/10 animate-in fade-in slide-in-from-bottom duration-700 delay-100">
              <div className="h-12 w-12 rounded-lg bg-white flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <FolderOpen className="h-6 w-6 text-black" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Smart Folders</h3>
              <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                Organize all your study materials in intuitive folders. Keep everything structured and easily accessible.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/30 hover:bg-white/10 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-white/10 animate-in fade-in slide-in-from-bottom duration-700 delay-200">
              <div className="h-12 w-12 rounded-lg bg-white flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <FileText className="h-6 w-6 text-black" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Rich Note Taking</h3>
              <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                Create beautiful, formatted notes with our powerful editor. Capture ideas and organize thoughts effortlessly.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/30 hover:bg-white/10 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-white/10 animate-in fade-in slide-in-from-bottom duration-700 delay-300">
              <div className="h-12 w-12 rounded-lg bg-white flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <BookOpen className="h-6 w-6 text-black" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Flashcards</h3>
              <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                Create custom flashcards for effective memorization. Perfect for exam preparation and quick reviews.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/30 hover:bg-white/10 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-white/10 animate-in fade-in slide-in-from-bottom duration-700 delay-400">
              <div className="h-12 w-12 rounded-lg bg-white flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <Brain className="h-6 w-6 text-black" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">AI Flashcard Generator</h3>
              <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                Let AI automatically generate flashcards from your notes. Save time and study smarter with intelligent suggestions.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/30 hover:bg-white/10 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-white/10 animate-in fade-in slide-in-from-bottom duration-700 delay-500">
              <div className="h-12 w-12 rounded-lg bg-white flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <MessageSquare className="h-6 w-6 text-black" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">AI Chat Assistant</h3>
              <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                Chat with an AI that understands your folders and content. Get instant answers and study guidance.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/30 hover:bg-white/10 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-white/10 animate-in fade-in slide-in-from-bottom duration-700 delay-600">
              <div className="h-12 w-12 rounded-lg bg-white flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <Upload className="h-6 w-6 text-black" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">File Upload & Viewing</h3>
              <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                Upload PDFs, documents, and images. View and organize all your study materials in one place.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-6 bg-black border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom duration-700">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4 text-white">
              Simple, Yet Powerful
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Get started in minutes and transform your study workflow
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center group animate-in fade-in zoom-in duration-700 delay-100">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white text-black text-2xl font-bold mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                1
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Create Folders</h3>
              <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                Organize your subjects and topics into folders. Structure your materials the way that works for you.
              </p>
            </div>

            <div className="text-center group animate-in fade-in zoom-in duration-700 delay-300">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white text-black text-2xl font-bold mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                2
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Add Content</h3>
              <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                Upload files, create notes, and build flashcards. Let AI help generate study materials automatically.
              </p>
            </div>

            <div className="text-center group animate-in fade-in zoom-in duration-700 delay-500">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white text-black text-2xl font-bold mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                3
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Study Smarter</h3>
              <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                Use AI chat for questions, review flashcards, and access everything from anywhere. Excel in your studies.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-zinc-950 to-black border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-in fade-in slide-in-from-left duration-1000">
              <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-white">
                Why Students Love Folders
              </h2>
              <p className="text-xl text-gray-400 mb-8">
                Join thousands of students who have transformed their study habits and improved their grades.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3 group animate-in fade-in slide-in-from-left duration-700 delay-100">
                  <CheckCircle2 className="h-6 w-6 text-white flex-shrink-0 mt-1 group-hover:scale-110 transition-transform duration-300" />
                  <div>
                    <h4 className="font-semibold text-lg mb-1 text-white">Save Time</h4>
                    <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">AI-powered tools help you create study materials in seconds</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 group animate-in fade-in slide-in-from-left duration-700 delay-200">
                  <CheckCircle2 className="h-6 w-6 text-white flex-shrink-0 mt-1 group-hover:scale-110 transition-transform duration-300" />
                  <div>
                    <h4 className="font-semibold text-lg mb-1 text-white">Stay Organized</h4>
                    <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">Never lose track of important materials or notes again</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 group animate-in fade-in slide-in-from-left duration-700 delay-300">
                  <CheckCircle2 className="h-6 w-6 text-white flex-shrink-0 mt-1 group-hover:scale-110 transition-transform duration-300" />
                  <div>
                    <h4 className="font-semibold text-lg mb-1 text-white">Study Effectively</h4>
                    <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">Proven techniques like flashcards and spaced repetition</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 group animate-in fade-in slide-in-from-left duration-700 delay-400">
                  <CheckCircle2 className="h-6 w-6 text-white flex-shrink-0 mt-1 group-hover:scale-110 transition-transform duration-300" />
                  <div>
                    <h4 className="font-semibold text-lg mb-1 text-white">Access Anywhere</h4>
                    <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">Cloud-based platform works on all your devices</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative animate-in fade-in slide-in-from-right duration-1000">
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:border-white/30 hover:bg-white/10 transition-all duration-500 group">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-white">
                    <span className="text-2xl">⭐⭐⭐⭐⭐</span>
                  </div>
                  <p className="text-lg italic text-gray-300 group-hover:text-white transition-colors duration-300">
                    &quot;Folders completely changed how I study. The AI flashcard generator is a game-changer, 
                    and having everything organized in one place saves me so much time!&quot;
                  </p>
                  <div className="flex items-center gap-3 pt-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white to-gray-400 group-hover:scale-110 transition-transform duration-300" />
                    <div>
                      <div className="font-semibold text-white">Sarah Chen</div>
                      <div className="text-sm text-gray-400">Computer Science Student</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-black border-t border-white/10">
        <div className="max-w-4xl mx-auto text-center animate-in fade-in zoom-in duration-1000">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-white">
            Ready to Transform Your Studies?
          </h2>
          <p className="text-xl text-gray-400 mb-10">
            Join students who are already studying smarter with Folders. Get started for free today.
          </p>
          <Link 
            href='/auth/sign-up'
            className="inline-flex items-center gap-2 px-10 py-5 bg-white text-black rounded-lg hover:bg-gray-200 transition-all font-semibold text-xl hover:scale-105 hover:shadow-2xl hover:shadow-white/20 group"
          >
            Get Started Free
            <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 group cursor-pointer">
              <FolderOpen className="h-6 w-6 text-white group-hover:scale-110 transition-transform duration-300" />
              <span className="text-xl font-bold text-white">Folders</span>
            </div>
            <p className="text-gray-400 text-sm">
              © 2025 Folders. Empowering students to study smarter.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}