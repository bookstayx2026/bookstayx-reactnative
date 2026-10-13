import React from 'react';
import { Modal } from '../common/Modal';
import { Download, CheckCircle, Smartphone, Monitor, Share2, PlusSquare, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  isInstallable: boolean;
  isInstalled: boolean;
  platform: 'ios' | 'android' | 'desktop';
  onInstall: () => Promise<'accepted' | 'dismissed' | 'manual_required'>;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  isInstallable,
  isInstalled,
  platform,
  onInstall,
}) => {
  const { showToast } = useCRM();

  const handleInstallClick = async () => {
    const outcome = await onInstall();
    if (outcome === 'accepted') {
      showToast('App Installed', 'OneRepair CRM App Installed Successfully!', 'success');
      onClose();
    } else if (outcome === 'dismissed') {
      showToast('Notice', 'Installation prompt was dismissed', 'info');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Install OneRepair CRM App" maxWidth="md">
      <div className="space-y-5">
        {/* App Icon & Branding Header */}
        <div className="flex flex-col items-center text-center p-4 rounded-2xl glass-card border border-black/5 dark:border-white/10">
          <div className="relative mb-3">
            <img
              src="/pwa-icon.png"
              alt="OneRepair PWA Icon"
              className="w-20 h-20 rounded-2xl shadow-xl border-2 border-[#DAFC08]/40 object-cover"
            />
            {isInstalled && (
              <span className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-emerald-500 text-white shadow-md">
                <CheckCircle className="w-3.5 h-3.5" />
              </span>
            )}
          </div>

          <h3 className="text-base font-black text-[#0D0C0B] dark:text-white">
            OneRepair CRM
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
            Internal Operations &amp; Workshop POS Application
          </p>

          <div className="flex items-center gap-2 mt-3">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#F5ED31]/30 text-black dark:bg-[#DAFC08]/20 dark:text-[#DAFC08] border border-amber-500/20 dark:border-[#DAFC08]/40">
              PWA Standalone App
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400">
              v1.0.0 Pimpri Hub
            </span>
          </div>
        </div>

        {/* Status / Direct Action */}
        {isInstalled ? (
          <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 font-black text-xs">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>App Already Installed &amp; Active</span>
            </div>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
              You are running OneRepair in native standalone app mode.
            </p>
          </div>
        ) : isInstallable ? (
          <div className="space-y-3">
            <button
              onClick={handleInstallClick}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#F5ED31] hover:bg-[#E5DC24] dark:bg-[#DAFC08] dark:hover:bg-[#C4E407] text-black font-extrabold text-sm shadow-glow-lime transition active:scale-98"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>Install OneRepair App Now</span>
            </button>
            <p className="text-[11px] text-center text-gray-500 dark:text-gray-400">
              Instant 1-click install into your desktop or tablet app launcher.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl glass-card space-y-2 border border-black/5 dark:border-white/10">
              <div className="flex items-center gap-2 text-xs font-black text-[#0D0C0B] dark:text-white">
                {platform === 'ios' ? (
                  <>
                    <Smartphone className="w-4 h-4 text-[#547BDE]" />
                    <span>How to Install on iPad / iPhone (Safari)</span>
                  </>
                ) : platform === 'android' ? (
                  <>
                    <Smartphone className="w-4 h-4 text-emerald-500" />
                    <span>How to Install on Android / Tablet</span>
                  </>
                ) : (
                  <>
                    <Monitor className="w-4 h-4 text-[#547BDE] dark:text-[#DAFC08]" />
                    <span>How to Install on Desktop / Laptop</span>
                  </>
                )}
              </div>

              {platform === 'ios' ? (
                <ol className="text-xs text-gray-700 dark:text-gray-300 space-y-1.5 pl-1">
                  <li className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold flex items-center justify-center">1</span>
                    <span>Tap the <Share2 className="w-3.5 h-3.5 inline text-blue-500 mx-0.5" /> <strong>Share</strong> button in Safari toolbar.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold flex items-center justify-center">2</span>
                    <span>Scroll down and tap <PlusSquare className="w-3.5 h-3.5 inline text-blue-500 mx-0.5" /> <strong>Add to Home Screen</strong>.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold flex items-center justify-center">3</span>
                    <span>Confirm by tapping <strong>Add</strong> at top right.</span>
                  </li>
                </ol>
              ) : platform === 'android' ? (
                <ol className="text-xs text-gray-700 dark:text-gray-300 space-y-1.5 pl-1">
                  <li className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold flex items-center justify-center">1</span>
                    <span>Tap the <strong>three dots (⋮)</strong> menu in Chrome.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold flex items-center justify-center">2</span>
                    <span>Select <strong>Install app</strong> or <strong>Add to Home screen</strong>.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold flex items-center justify-center">3</span>
                    <span>Tap <strong>Install</strong> to add icon to your app drawer.</span>
                  </li>
                </ol>
              ) : (
                <ol className="text-xs text-gray-700 dark:text-gray-300 space-y-1.5 pl-1">
                  <li className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold flex items-center justify-center">1</span>
                    <span>Look for the <Download className="w-3.5 h-3.5 inline text-amber-500 mx-0.5" /> <strong>Install App</strong> icon on your browser address bar.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold flex items-center justify-center">2</span>
                    <span>Or click browser menu (⋮) &rarr; <strong>Cast, save, and share</strong> &rarr; <strong>Install OneRepair...</strong></span>
                  </li>
                </ol>
              )}
            </div>
          </div>
        )}

        {/* Benefits Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-xl glass-card flex items-start gap-2">
            <Zap className="w-4 h-4 text-[#DAFC08] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[#0D0C0B] dark:text-white text-[11px]">Instant Launch</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">Opens in a distraction-free window without browser tabs</p>
            </div>
          </div>
          <div className="p-2.5 rounded-xl glass-card flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[#0D0C0B] dark:text-white text-[11px]">Workshop Offline Ready</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">Assets cached locally for ultra-fast response on bench</p>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold glass-input text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
