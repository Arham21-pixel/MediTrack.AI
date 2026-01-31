import Link from 'next/link';
import { Activity, Instagram, Twitter, Linkedin } from 'lucide-react';

export function Footer() {
    return (
        <footer className="bg-gray-50 border-t border-gray-100 pt-16 pb-8">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    <div className="col-span-1 md:col-span-1">
                        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-gray-900 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-lime-400 flex items-center justify-center text-lime-950">
                                <Activity size={20} />
                            </div>
                            <span>MediTrack AI</span>
                        </Link>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            Making healthcare understandable and manageable for everyone through advanced AI technology.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold text-gray-900 mb-6">Product</h4>
                        <ul className="space-y-4 text-sm text-gray-600">
                            <li><Link href="#" className="hover:text-lime-600">Features</Link></li>
                            <li><Link href="#" className="hover:text-lime-600">How it Works</Link></li>
                            <li><Link href="#" className="hover:text-lime-600">Pricing</Link></li>
                            <li><Link href="#" className="hover:text-lime-600">FAQ</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-gray-900 mb-6">Company</h4>
                        <ul className="space-y-4 text-sm text-gray-600">
                            <li><Link href="#" className="hover:text-lime-600">About Us</Link></li>
                            <li><Link href="#" className="hover:text-lime-600">Blog</Link></li>
                            <li><Link href="#" className="hover:text-lime-600">Careers</Link></li>
                            <li><Link href="#" className="hover:text-lime-600">Contact</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-gray-900 mb-6">Legal</h4>
                        <ul className="space-y-4 text-sm text-gray-600">
                            <li><Link href="#" className="hover:text-lime-600">Privacy Policy</Link></li>
                            <li><Link href="#" className="hover:text-lime-600">Terms of Service</Link></li>
                            <li><Link href="#" className="hover:text-lime-600">HIPAA Compliance</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-8 border-t border-gray-200">
                    <p className="text-sm text-gray-500">© 2024 MediTrack AI. All rights reserved.</p>
                    <div className="flex gap-4">
                        <Link href="#" className="text-gray-400 hover:text-gray-900"><Twitter size={20} /></Link>
                        <Link href="#" className="text-gray-400 hover:text-gray-900"><Instagram size={20} /></Link>
                        <Link href="#" className="text-gray-400 hover:text-gray-900"><Linkedin size={20} /></Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
