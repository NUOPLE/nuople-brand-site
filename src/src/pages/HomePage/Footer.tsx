const Footer = () => {

  return (
    <footer className="py-10 md:py-12 bg-black text-white">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-lg font-bold tracking-tight">
                诺普品牌
              </span>
              <span className="text-[10px] tracking-[0.2em] text-white/50 font-light">
                Design & Art
              </span>
            </div>
            <p className="text-xs text-white/40">
              © 2024 诺普品牌. All rights reserved.
            </p>
          </div>

          <div className="flex justify-center md:justify-end">
            <div className="w-24 h-24 border border-dashed border-white/20 rounded flex items-center justify-center text-[10px] text-white/40 tracking-wider">
              二维码
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
