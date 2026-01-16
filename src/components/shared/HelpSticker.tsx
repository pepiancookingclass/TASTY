'use client';

import { useState } from 'react';
import { MessageCircle, X, ChefHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function HelpSticker() {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleWhatsAppClick = () => {
    const phoneNumber = '50230635323';
    const message = encodeURIComponent('Hola! Necesito ayuda con TASTY 🍰');
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed left-4 bottom-4 z-50">
      {/* Ventana expandida */}
      {isExpanded && (
        <Card className="mb-4 p-4 w-80 bg-white shadow-lg border-2 border-primary/20 animate-in slide-in-from-bottom-2 duration-300">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <ChefHat className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-headline font-semibold text-sm text-gray-900">
                  TASTY Support
                </h3>
                <p className="text-xs text-gray-500">En línea ahora</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
              className="h-6 w-6 p-0 hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="mb-4">
            <p className="text-sm text-gray-700 mb-1">
              <strong>Do you have questions?</strong>
            </p>
            <p className="text-xs text-gray-600">
              Our support team is here to help you with your bookings or any other questions
            </p>
          </div>

          <Button
            onClick={handleWhatsAppClick}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-medium text-sm py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Chat on WhatsApp
          </Button>
        </Card>
      )}

      {/* Sticker principal */}
      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          w-14 h-14 rounded-full shadow-lg transition-all duration-300 hover:scale-110
          ${isExpanded 
            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' 
            : 'bg-primary hover:bg-primary/90 text-white'
          }
        `}
        size="sm"
      >
        {isExpanded ? (
          <X className="w-6 h-6" />
        ) : (
          <div className="relative">
            <MessageCircle className="w-6 h-6" />
            {/* Punto de notificación */}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-pulse" />
          </div>
        )}
      </Button>
    </div>
  );
}



