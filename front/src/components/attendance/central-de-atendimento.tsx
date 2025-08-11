import React from 'react';

import { useAttendanceCenter } from '@/hooks/useAttendanceCenter';
import { QueueList } from './queue-list';


export const CentralDeAtendimento: React.FC = () => {
  const {
    queue,
    attendRequest
  } = useAttendanceCenter();

  const currentOperatorId = 'current-operator'; // TODO: Pegar do contexto de autenticação

  return (
    <div className="container mx-auto p-6 space-y-6">




      <div className="min-h-[400px]">
        <QueueList 
          queue={queue} 
          onAttendRequest={attendRequest}
          currentOperatorId={currentOperatorId}
        />
      </div>
    </div>
  );
}; 