
import React, { useEffect, useState } from 'react';
import { Button } from '../components/Button';
import { verifyPaymentSession } from '../services/mockBackend';

interface PaymentSuccessProps {
  onNavigate: (path: string) => void;
}

export const PaymentSuccess: React.FC<PaymentSuccessProps> = ({ onNavigate }) => {
  const [verifying, setVerifying] = useState(true);
  const [status, setStatus] = useState<'loading' | 'confirmed' | 'pending-webhook'>('loading');

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    const adId = params.get('adId');

    if (!adId) {
      onNavigate('/');
      return;
    }

    const checkStatus = async () => {
      const result = await verifyPaymentSession(adId);
      if (result.success) {
        setStatus('confirmed');
        setVerifying(false);
      } else {
        // Wait and retry once (webhooks can be slightly delayed)
        setTimeout(async () => {
           const retry = await verifyPaymentSession(adId);
           if (retry.success) setStatus('confirmed');
           else setStatus('pending-webhook');
           setVerifying(false);
        }, 3000);
      }
    };

    checkStatus();
  }, [onNavigate]);

  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center animate-fade-in">
      {status === 'loading' ? (
        <div className="space-y-6">
           <div className="mx-auto h-20 w-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
           <h2 className="text-2xl font-bold text-gray-900">Verificăm plata...</h2>
           <p className="text-gray-500">Te rugăm să nu închizi această pagină.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-xl p-10 border border-gray-100">
          <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-100 mb-8">
            <svg className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Plată Confirmată!</h2>
          
          <div className="bg-indigo-50 rounded-2xl p-6 mb-8 text-left">
            <h3 className="text-indigo-900 font-bold mb-2 flex items-center">
               <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
               Verifică Emailul (Brevo)
            </h3>
            <p className="text-sm text-indigo-700 leading-relaxed">
              Am trimis un email de confirmare către adresa ta. Acesta conține <strong>link-ul secret de gestionare</strong> pe care îl vei folosi pentru a edita sau șterge anunțul pe viitor.
            </p>
          </div>

          <div className="space-y-4">
             <Button className="w-full h-14 rounded-2xl text-lg shadow-lg shadow-indigo-100" onClick={() => onNavigate('/')}>
                Înapoi la Marketplace
             </Button>
             <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Powered by Stripe & Brevo Automation</p>
          </div>
        </div>
      )}
    </div>
  );
};
