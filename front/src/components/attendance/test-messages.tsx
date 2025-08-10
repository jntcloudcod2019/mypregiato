import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { attendanceService } from '@/services/attendance-service';

export const TestMessages: React.FC = () => {
  const [phone, setPhone] = useState('11999999999');
  const [message, setMessage] = useState('Olá, preciso de ajuda!');

  const handleSimulateMessage = () => {
    if (phone && message) {
      attendanceService.simulateIncomingMessage(phone, message);
      setMessage('');
    }
  };

  const handleQuickTest = () => {
    const testMessages = [
      { phone: '11999999999', message: 'Olá, preciso de ajuda!' },
      { phone: '11988888888', message: 'Bom dia, gostaria de informações sobre produtos' },
      { phone: '11977777777', message: 'Preciso falar com um atendente urgente' },
      { phone: '11966666666', message: 'Quero fazer uma compra' },
      { phone: '11955555555', message: 'Tem desconto hoje?' }
    ];

    testMessages.forEach((test, index) => {
      setTimeout(() => {
        attendanceService.simulateIncomingMessage(test.phone, test.message);
      }, index * 1000);
    });
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-lg">Teste de Mensagens</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="11999999999"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="message">Mensagem</Label>
          <Input
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Digite uma mensagem..."
          />
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleSimulateMessage} className="flex-1">
            Simular Mensagem
          </Button>
          <Button onClick={handleQuickTest} variant="outline">
            Teste Rápido
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}; 