import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2, Eye } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FileTablePreviewProps {
  data?: any[];
  headers?: string[];
  onClear?: () => void;
}

const FileTablePreview: React.FC<FileTablePreviewProps> = ({
  data = [],
  headers = [],
  onClear
}) => {
  const [isVisible, setIsVisible] = useState(false);
  
  if (data.length === 0 && headers.length === 0) {
    return null;
  }
  
  return (
    <div className="mt-4">
      {!isVisible ? (
        <Button variant="outline" size="sm" onClick={() => setIsVisible(true)}>
          <Eye className="h-4 w-4 mr-2" />
          Ver prévia
        </Button>
      ) : (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium">Prévia do arquivo</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsVisible(false)}>
                Fechar
              </Button>
              {onClear && (
                <Button variant="destructive" size="sm" onClick={onClear}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpar
                </Button>
              )}
            </div>
          </div>
          
          <div className="border rounded-md">
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    {headers.map((header, i) => (
                      <TableHead key={i}>{header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.slice(0, 20).map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {headers.map((header, colIndex) => (
                        <TableCell key={colIndex}>
                          {row[header] || ''}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
          
          {data.length > 20 && (
            <p className="text-xs text-muted-foreground">
              Mostrando 20 de {data.length} linhas
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default FileTablePreview;