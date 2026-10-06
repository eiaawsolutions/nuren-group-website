import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, MessageCircle } from 'lucide-react';
import { EnquiryForm } from './EnquiryForm';
import { useEnquiryForm } from './enquiryClient';

const WHATSAPP_URL = 'https://wa.me/60124238768';

/**
 * The site-wide "Contact Us" window. It sends the same enquiry as the chat's
 * "Talk to our team" form, so every lead reaches the sales team in one format.
 */
export const ContactModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const form = useEnquiryForm();
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const close = () => {
    onClose();
    // Show the form again next time, once the window has faded out.
    setTimeout(() => setSent(false), 300);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={close}
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="contact-modal-title"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg max-h-[calc(100vh-2rem)] overflow-y-auto bg-white rounded-3xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 sm:p-8">
            <div className="flex justify-between items-start gap-4 mb-5">
              <div>
                <h2 id="contact-modal-title" className="text-2xl font-bold text-slate-900">
                  {sent ? 'Thank you' : 'Contact Us'}
                </h2>
                {!sent && (
                  <p className="mt-1 text-sm text-slate-600">
                    Tell us what you need and we'll direct your message to the right team.
                  </p>
                )}
              </div>
              <button
                onClick={close}
                aria-label="Close contact form"
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {sent ? (
              <div className="py-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-nuren-pink to-nuren-purple text-white">
                  <CheckCircle2 size={32} />
                </div>
                <p className="text-slate-700">
                  We've received your enquiry. Our team will review it and get back to you within 1 to 2 business days.
                </p>
                <button
                  onClick={close}
                  className="mt-6 w-full rounded-full bg-slate-900 py-3 font-semibold text-white hover:bg-slate-800 transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <EnquiryForm form={form} source="contact-form" onSent={() => setSent(true)} />
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-slate-600 hover:text-nuren-pink transition-colors"
                >
                  <MessageCircle size={16} aria-hidden="true" />
                  Prefer WhatsApp? Message us instead
                </a>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
