const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 px-6 py-4">
      <div className="flex flex-col sm:flex-row justify-between items-center">
        <div className="flex items-center text-sm text-gray-600">
          <span>© {currentYear} TeamFlow. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
