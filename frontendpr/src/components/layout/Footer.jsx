const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 px-6 py-4">
      <div className="flex flex-col sm:flex-row justify-between items-center">
        <div className="flex items-center space-x-6 text-sm text-gray-600">
          <span>© {currentYear} TeamFlow. All rights reserved.</span>
          <a href="#" className="hover:text-gray-900 transition-colors">Privacy</a>
          <a href="#" className="hover:text-gray-900 transition-colors">Terms</a>
          <a href="#" className="hover:text-gray-900 transition-colors">Support</a>
        </div>
        
        <div className="flex items-center space-x-4 mt-2 sm:mt-0">
          <span className="text-sm text-gray-600">Version 1.0.0</span>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
