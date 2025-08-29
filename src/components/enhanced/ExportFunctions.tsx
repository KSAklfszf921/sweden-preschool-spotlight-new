import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMapStore } from '@/stores/mapStore';
import { Download, FileSpreadsheet, FileText, Share2, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface ExportFunctionsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportFunctions: React.FC<ExportFunctionsProps> = ({ isOpen, onClose }) => {
  const { filteredPreschools, searchFilters } = useMapStore();
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'pdf' | 'json'>('csv');
  const [includeFilters, setIncludeFilters] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const generateCSV = (data: any[]) => {
    const headers = [
      'Namn', 'Kommun', 'Adress', 'Huvudman', 
      'Antal barn', 'Antal barngrupper', 'Personaltäthet',
      'Andel med förskollärarexamen', 'Google betyg', 'Google recensioner'
    ];

    const csvContent = [
      headers.join(','),
      ...data.map(p => [
        `"${p.namn}"`,
        `"${p.kommun}"`, 
        `"${p.adress}"`,
        `"${p.huvudman}"`,
        p.antal_barn || '',
        p.antal_barngrupper || '',
        p.personaltäthet || '',
        p.andel_med_förskollärarexamen || '',
        p.google_rating || '',
        p.google_reviews_count || ''
      ].join(','))
    ].join('\n');

    return csvContent;
  };

  const generateJSON = (data: any[]) => {
    const exportData = {
      exportDate: new Date().toISOString(),
      totalCount: data.length,
      filters: includeFilters ? searchFilters : undefined,
      preschools: data.map(p => ({
        id: p.id,
        namn: p.namn,
        kommun: p.kommun,
        adress: p.adress,
        huvudman: p.huvudman,
        antal_barn: p.antal_barn,
        antal_barngrupper: p.antal_barngrupper,
        personaltäthet: p.personaltäthet,
        andel_med_förskollärarexamen: p.andel_med_förskollärarexamen,
        google_rating: p.google_rating,
        google_reviews_count: p.google_reviews_count,
        coordinates: {
          lat: p.latitud,
          lng: p.longitud
        }
      }))
    };

    return JSON.stringify(exportData, null, 2);
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const baseFilename = `forskolor_${timestamp}`;
      
      let content: string;
      let filename: string;
      let mimeType: string;

      switch (exportFormat) {
        case 'csv':
          content = generateCSV(filteredPreschools);
          filename = `${baseFilename}.csv`;
          mimeType = 'text/csv;charset=utf-8;';
          break;
        
        case 'json':
          content = generateJSON(filteredPreschools);
          filename = `${baseFilename}.json`;
          mimeType = 'application/json;charset=utf-8;';
          break;
        
        case 'excel':
          // For Excel, we'll generate CSV with Excel-compatible formatting
          content = '\ufeff' + generateCSV(filteredPreschools); // BOM for Excel
          filename = `${baseFilename}.csv`;
          mimeType = 'text/csv;charset=utf-8;';
          break;
        
        case 'pdf':
          // For PDF, we'll generate a simple text format
          content = `Förskolor Export - ${new Date().toLocaleDateString()}\n\n`;
          content += `Totalt antal förskolor: ${filteredPreschools.length}\n\n`;
          
          if (includeFilters && Object.keys(searchFilters).length > 0) {
            content += 'Aktiva filter:\n';
            Object.entries(searchFilters).forEach(([key, value]) => {
              if (value) content += `- ${key}: ${Array.isArray(value) ? value.join(', ') : value}\n`;
            });
            content += '\n';
          }
          
          filteredPreschools.forEach((p, index) => {
            content += `${index + 1}. ${p.namn}\n`;
            content += `   Kommun: ${p.kommun}\n`;
            content += `   Adress: ${p.adress}\n`;
            content += `   Huvudman: ${p.huvudman}\n`;
            if (p.antal_barn) content += `   Antal barn: ${p.antal_barn}\n`;
            if (p.google_rating) content += `   Google betyg: ${p.google_rating}\n`;
            content += '\n';
          });
          
          filename = `${baseFilename}.txt`;
          mimeType = 'text/plain;charset=utf-8;';
          break;
        
        default:
          throw new Error('Ogiltigt exportformat');
      }

      downloadFile(content, filename, mimeType);
      toast.success(`Export slutförd: ${filename}`);
      
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export misslyckades');
    } finally {
      setIsExporting(false);
    }
  };

  const shareData = async () => {
    if (!navigator.share) {
      toast.error('Delning stöds inte i denna webbläsare');
      return;
    }

    try {
      const summary = `Förskolor (${filteredPreschools.length} st)\n\n` +
        filteredPreschools.slice(0, 5).map(p => 
          `${p.namn} - ${p.kommun}${p.google_rating ? ` (⭐ ${p.google_rating})` : ''}`
        ).join('\n') +
        (filteredPreschools.length > 5 ? '\n...och fler' : '');

      await navigator.share({
        title: 'Förskolor från Sveriges Förskolor',
        text: summary,
        url: window.location.href
      });
      
      toast.success('Delning initierad');
    } catch (error) {
      console.error('Share error:', error);
      toast.error('Delning avbröts');
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="bg-card border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Download className="w-5 h-5" />
              Exportera data
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          </div>

          {/* Export summary */}
          <div className="mb-6 p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Antal förskolor:</span>
              <Badge variant="secondary">{filteredPreschools.length}</Badge>
            </div>
            
            {Object.keys(searchFilters).length > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Aktiva filter:</span>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Filter className="w-3 h-3" />
                  {Object.keys(searchFilters).length}
                </Badge>
              </div>
            )}
          </div>

          {/* Export format selection */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="text-sm font-medium mb-2 block">Exportformat</label>
              <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4" />
                      CSV (Excel kompatibel)
                    </div>
                  </SelectItem>
                  <SelectItem value="json">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      JSON (Utvecklarvänlig)
                    </div>
                  </SelectItem>
                  <SelectItem value="excel">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4" />
                      Excel (UTF-8)
                    </div>
                  </SelectItem>
                  <SelectItem value="pdf">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Text (PDF-vänlig)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Inkludera filterinformation</label>
              <input
                type="checkbox"
                checked={includeFilters}
                onChange={(e) => setIncludeFilters(e.target.checked)}
                className="rounded"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleExport}
              disabled={isExporting || filteredPreschools.length === 0}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? 'Exporterar...' : 'Exportera'}
            </Button>

            {navigator.share && (
              <Button
                onClick={shareData}
                variant="outline"
                className="w-full"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Dela
              </Button>
            )}

            <Button variant="ghost" onClick={onClose} className="w-full">
              Avbryt
            </Button>
          </div>

          {filteredPreschools.length === 0 && (
            <p className="text-sm text-muted-foreground text-center mt-4">
              Inga förskolor att exportera. Justera dina filter för att se resultat.
            </p>
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
};